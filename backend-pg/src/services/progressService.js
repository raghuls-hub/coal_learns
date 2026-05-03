const { pool } = require('../config/database');

const formatProgress = (progressRow, completedContent, moduleStatus) => ({
  _id: progressRow.id,
  id: progressRow.id,
  enrollment: progressRow.enrollment_id,
  user: progressRow.user_id,
  course: progressRow.course_id,
  completedContent: completedContent.map((r) => ({ _id: r.content_id, id: r.content_id })),
  moduleProgress: moduleStatus.map((r) => ({
    module: { _id: r.module_id, id: r.module_id, title: r.title, order: r.order },
    isUnlocked: r.is_unlocked,
    isCompleted: r.is_completed,
  })),
  courseCompleted: progressRow.course_completed,
  certificateClaimed: progressRow.certificate_claimed,
  lastAccessed: progressRow.last_accessed,
  createdAt: progressRow.created_at,
});

const loadProgress = async (progressId) => {
  const [progRes, ccRes, msRes] = await Promise.all([
    pool.query('SELECT * FROM progress WHERE id = $1', [progressId]),
    pool.query('SELECT content_id FROM progress_completed_content WHERE progress_id = $1', [progressId]),
    pool.query(
      `SELECT pms.*, m.title, m."order"
       FROM progress_module_status pms
       JOIN modules m ON m.id = pms.module_id
       WHERE pms.progress_id = $1
       ORDER BY m."order" ASC`,
      [progressId]
    ),
  ]);
  return formatProgress(progRes.rows[0], ccRes.rows, msRes.rows);
};

exports.initializeProgress = async (enrollmentId, userId, courseId) => {
  const existing = await pool.query('SELECT id FROM progress WHERE enrollment_id = $1', [enrollmentId]);
  if (existing.rows.length) return loadProgress(existing.rows[0].id);

  const { rows: modules } = await pool.query(
    `SELECT id FROM modules WHERE course_id = $1 ORDER BY "order" ASC`,
    [courseId]
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: prog } = await client.query(
      `INSERT INTO progress (enrollment_id, user_id, course_id)
       VALUES ($1,$2,$3)
       ON CONFLICT (enrollment_id) DO UPDATE SET enrollment_id = EXCLUDED.enrollment_id
       RETURNING *`,
      [enrollmentId, userId, courseId]
    );

    if (modules.length) {
      const values = modules
        .map((m, idx) => `('${prog[0].id}','${m.id}',${idx === 0})`)
        .join(',');
      await client.query(
        `INSERT INTO progress_module_status (progress_id, module_id, is_unlocked)
         VALUES ${values}
         ON CONFLICT DO NOTHING`
      );
    }

    await client.query('COMMIT');
    return loadProgress(prog[0].id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.getProgress = async (enrollmentId, userId) => {
  const { rows } = await pool.query(
    'SELECT * FROM progress WHERE enrollment_id = $1',
    [enrollmentId]
  );

  if (!rows.length) {
    // Auto-fix: initialize if enrollment belongs to user
    const { rows: enr } = await pool.query(
      'SELECT * FROM enrollments WHERE id = $1 AND user_id = $2',
      [enrollmentId, userId]
    );
    if (enr.length) {
      return exports.initializeProgress(enrollmentId, userId, enr[0].course_id);
    }
    return null;
  }

  return loadProgress(rows[0].id);
};

exports.markContentCompleted = async (enrollmentId, userId, contentId) => {
  const { rows: prog } = await pool.query(
    'SELECT * FROM progress WHERE enrollment_id = $1 AND user_id = $2',
    [enrollmentId, userId]
  );
  if (!prog.length) throw new Error('Progress not found');

  const progressId = prog[0].id;

  // Idempotent insert
  await pool.query(
    `INSERT INTO progress_completed_content (progress_id, content_id)
     VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [progressId, contentId]
  );

  await pool.query(
    'UPDATE progress SET last_accessed = NOW(), updated_at = NOW() WHERE id = $1',
    [progressId]
  );

  await exports.checkModuleCompletion(prog[0]);
  return loadProgress(progressId);
};

exports.checkModuleCompletion = async (progressRow) => {
  const progressId = progressRow.id;

  // Single query: for each module in the course, check if all its content is completed
  const { rows: moduleChecks } = await pool.query(
    `SELECT
       m.id AS module_id,
       m."order",
       COUNT(c.id) AS total_content,
       COUNT(pcc.content_id) AS completed_content,
       pms.is_completed
     FROM modules m
     LEFT JOIN content c ON c.module_id = m.id
     LEFT JOIN progress_completed_content pcc
       ON pcc.content_id = c.id AND pcc.progress_id = $1
     LEFT JOIN progress_module_status pms
       ON pms.module_id = m.id AND pms.progress_id = $1
     WHERE m.course_id = $2
     GROUP BY m.id, m."order", pms.is_completed
     ORDER BY m."order" ASC`,
    [progressId, progressRow.course_id]
  );

  let hasChanges = false;

  for (let i = 0; i < moduleChecks.length; i++) {
    const mc = moduleChecks[i];
    const allDone = parseInt(mc.total_content) > 0 &&
                    parseInt(mc.completed_content) === parseInt(mc.total_content);

    if (allDone && !mc.is_completed) {
      await pool.query(
        `UPDATE progress_module_status SET is_completed = TRUE
         WHERE progress_id = $1 AND module_id = $2`,
        [progressId, mc.module_id]
      );
      hasChanges = true;

      // Unlock next module
      if (i + 1 < moduleChecks.length) {
        await pool.query(
          `UPDATE progress_module_status SET is_unlocked = TRUE
           WHERE progress_id = $1 AND module_id = $2`,
          [progressId, moduleChecks[i + 1].module_id]
        );
      }
    }
  }

  if (hasChanges) {
    await exports.checkCourseCompletion(progressRow);
  } else {
    await exports.updateEnrollmentProgress(progressRow);
  }
};

exports.checkCourseCompletion = async (progressRow) => {
  const progressId = progressRow.id;

  const { rows } = await pool.query(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN pms.is_completed THEN 1 ELSE 0 END) AS completed
     FROM modules m
     LEFT JOIN progress_module_status pms
       ON pms.module_id = m.id AND pms.progress_id = $1
     WHERE m.course_id = $2`,
    [progressId, progressRow.course_id]
  );

  const total = parseInt(rows[0].total);
  const completed = parseInt(rows[0].completed);

  if (total > 0 && completed === total && !progressRow.course_completed) {
    await pool.query(
      'UPDATE progress SET course_completed = TRUE, updated_at = NOW() WHERE id = $1',
      [progressId]
    );

    // Get instructor name
    const { rows: courseRows } = await pool.query(
      `SELECT c.*, u.first_name, u.last_name
       FROM courses c LEFT JOIN users u ON u.id = c.course_handler_id
       WHERE c.id = $1`,
      [progressRow.course_id]
    );
    const course = courseRows[0];
    const instructorName = course?.first_name
      ? `${course.first_name} ${course.last_name}`
      : 'Unknown Instructor';

    await pool.query(
      `UPDATE enrollments SET
         status = 'completed', progress = 100,
         completed_at = NOW(),
         snap_completed_at = NOW(),
         snap_title = $1, snap_description = $2, snap_thumbnail = $3,
         snap_category = $4, snap_level = $5, snap_instructor_name = $6,
         updated_at = NOW()
       WHERE id = $7`,
      [
        course.title, course.description, course.thumbnail,
        course.category, course.level, instructorName,
        progressRow.enrollment_id,
      ]
    );
  } else {
    await exports.updateEnrollmentProgress(progressRow);
  }
};

exports.updateEnrollmentProgress = async (progressRow) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(c.id) AS total,
         COUNT(pcc.content_id) AS completed
       FROM modules m
       JOIN content c ON c.module_id = m.id
       LEFT JOIN progress_completed_content pcc
         ON pcc.content_id = c.id AND pcc.progress_id = $1
       WHERE m.course_id = $2`,
      [progressRow.id, progressRow.course_id]
    );

    const total = parseInt(rows[0].total);
    if (!total) return;

    const pct = Math.round((parseInt(rows[0].completed) / total) * 100);

    await pool.query(
      'UPDATE enrollments SET progress = $1, updated_at = NOW() WHERE id = $2',
      [pct, progressRow.enrollment_id]
    );
  } catch (err) {
    console.error('[updateEnrollmentProgress] Error:', err.message);
  }
};
