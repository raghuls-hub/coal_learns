const { pool } = require("../config/database");

// ─── Helpers ─────────────────────────────────────────────────

const formatCourse = (row) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  description: row.description,
  thumbnail: row.thumbnail,
  coverImage: row.cover_image,
  category: row.category,
  level: row.level,
  courseHandler: row.handler_id
    ? {
        _id: row.handler_id,
        id: row.handler_id,
        email: row.handler_email,
        profile: {
          firstName: row.handler_first_name,
          lastName: row.handler_last_name,
        },
      }
    : row.course_handler_id,
  tutors: row.tutors || [],
  modules: row.modules || [],
  pricing: {
    amount: parseFloat(row.price_amount),
    currency: row.price_currency,
  },
  settings: {
    enrollmentLimit: row.enrollment_limit,
    certificateTemplate: row.certificate_template,
    passingPercentage: parseFloat(row.passing_percentage),
    isPublished: row.is_published,
    isArchived: row.is_archived,
  },
  stats: {
    enrollmentCount: row.enrollment_count,
    completionCount: row.completion_count,
    averageRating: parseFloat(row.average_rating),
  },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const formatModule = (row) => ({
  _id: row.id,
  id: row.id,
  course: row.course_id,
  title: row.title,
  description: row.description,
  order: row.order,
  duration: row.duration,
  content: row.content || [],
  unlockRules: {
    requiredPreviousModules: row.required_modules || [],
    minimumPreviousScore: parseFloat(row.min_previous_score),
    requiredVideoCompletion: row.required_video_completion,
  },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const formatContent = (row) => ({
  _id: row.id,
  id: row.id,
  module: row.module_id,
  type: row.type,
  title: row.title,
  description: row.description,
  order: row.order,
  data: {
    url: row.url,
    duration: row.duration,
    size: row.file_size,
    htmlContent: row.html_content,
    externalUrl: row.external_url,
    version: row.version,
  },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Attach tutors array to course rows (batch)
const attachTutors = async (courseIds) => {
  if (!courseIds.length) return {};
  const { rows } = await pool.query(
    `SELECT ct.course_id, u.id, u.email, u.first_name, u.last_name
     FROM course_tutors ct
     JOIN users u ON u.id = ct.user_id
     WHERE ct.course_id = ANY($1)`,
    [courseIds],
  );
  const map = {};
  for (const r of rows) {
    if (!map[r.course_id]) map[r.course_id] = [];
    map[r.course_id].push({
      _id: r.id,
      id: r.id,
      email: r.email,
      profile: { firstName: r.first_name, lastName: r.last_name },
    });
  }
  return map;
};

// ─── Course CRUD ──────────────────────────────────────────────

exports.createCourse = async (courseData, courseHandlerId) => {
  const {
    title,
    description,
    thumbnail,
    coverImage,
    category,
    level,
    pricing,
    settings,
  } = courseData;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO courses
         (title, description, thumbnail, cover_image, category, level, course_handler_id,
          price_amount, price_currency, enrollment_limit, passing_percentage)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        title,
        description,
        thumbnail || null,
        coverImage || null,
        category,
        level || "beginner",
        courseHandlerId,
        pricing?.amount ?? 0,
        pricing?.currency || "USD",
        settings?.enrollmentLimit || null,
        settings?.passingPercentage ?? 70,
      ],
    );

    // Auto-assign creator as tutor
    await client.query(
      "INSERT INTO course_tutors (course_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [rows[0].id, courseHandlerId],
    );

    await client.query("COMMIT");
    return formatCourse(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.getCourses = async (filters = {}, page = 1, limit = 10) => {
  const conditions = [];
  const params = [];
  let i = 1;

  if (filters.category) {
    conditions.push(`c.category = $${i++}`);
    params.push(filters.category);
  }
  if (filters.level) {
    conditions.push(`c.level = $${i++}`);
    params.push(filters.level);
  }
  if (filters.courseHandler) {
    conditions.push(`c.course_handler_id = $${i++}`);
    params.push(filters.courseHandler);
  }
  if (filters.isPublished !== undefined) {
    conditions.push(`c.is_published = $${i++}`);
    params.push(filters.isPublished);
  }
  if (filters.search) {
    conditions.push(
      `to_tsvector('english', c.title || ' ' || c.description) @@ plainto_tsquery('english', $${i++})`,
    );
    params.push(filters.search);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (page - 1) * limit;

  const [dataRes, countRes] = await Promise.all([
    pool.query(
      `SELECT c.*,
              u.id AS handler_id, u.email AS handler_email,
              u.first_name AS handler_first_name, u.last_name AS handler_last_name,
              COUNT(m.id) AS module_count
       FROM courses c
       LEFT JOIN users u ON u.id = c.course_handler_id
       LEFT JOIN modules m ON m.course_id = c.id
       ${where}
       GROUP BY c.id, u.id
       ORDER BY c.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset],
    ),
    pool.query(`SELECT COUNT(*) FROM courses c ${where}`, params),
  ]);

  const courseIds = dataRes.rows.map((r) => r.id);
  const tutorMap = await attachTutors(courseIds);

  const courses = dataRes.rows.map((r) => ({
    ...formatCourse(r),
    tutors: tutorMap[r.id] || [],
    modules: Array(r.module_count).fill({}),
  }));

  const total = parseInt(countRes.rows[0].count);
  return {
    courses,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

exports.getCourseById = async (courseId) => {
  const { rows } = await pool.query(
    `SELECT c.*,
            u.id AS handler_id, u.email AS handler_email,
            u.first_name AS handler_first_name, u.last_name AS handler_last_name
     FROM courses c
     LEFT JOIN users u ON u.id = c.course_handler_id
     WHERE c.id = $1`,
    [courseId],
  );
  if (!rows.length) throw new Error("Course not found");

  const tutorMap = await attachTutors([courseId]);
  const modules = await exports.getModulesByCourseId(courseId);

  return {
    ...formatCourse(rows[0]),
    tutors: tutorMap[courseId] || [],
    modules,
  };
};

exports.updateCourse = async (courseId, updateData, userId, userRole) => {
  const { rows: existing } = await pool.query(
    "SELECT id, course_handler_id FROM courses WHERE id = $1",
    [courseId],
  );
  if (!existing.length) throw new Error("Course not found");
  if (userRole !== "admin" && existing[0].course_handler_id !== userId) {
    throw new Error("Unauthorized to update this course");
  }

  const fieldMap = {
    title: "title",
    description: "description",
    thumbnail: "thumbnail",
    coverImage: "cover_image",
    category: "category",
    level: "level",
  };
  const fields = [];
  const params = [];
  let i = 1;

  for (const [key, col] of Object.entries(fieldMap)) {
    if (updateData[key] !== undefined) {
      fields.push(`${col} = $${i++}`);
      params.push(updateData[key]);
    }
  }
  if (updateData.pricing?.amount !== undefined) {
    fields.push(`price_amount = $${i++}`);
    params.push(updateData.pricing.amount);
  }
  if (updateData.pricing?.currency) {
    fields.push(`price_currency = $${i++}`);
    params.push(updateData.pricing.currency);
  }
  if (updateData.settings?.isPublished !== undefined) {
    fields.push(`is_published = $${i++}`);
    params.push(updateData.settings.isPublished);
    fields.push(`is_archived = $${i++}`);
    params.push(!updateData.settings.isPublished);
  }
  if (updateData.settings?.passingPercentage !== undefined) {
    fields.push(`passing_percentage = $${i++}`);
    params.push(updateData.settings.passingPercentage);
  }
  if (updateData.settings?.enrollmentLimit !== undefined) {
    fields.push(`enrollment_limit = $${i++}`);
    params.push(updateData.settings.enrollmentLimit);
  }

  if (!fields.length) return exports.getCourseById(courseId);

  fields.push(`updated_at = NOW()`);
  params.push(courseId);

  const { rows } = await pool.query(
    `UPDATE courses SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    params,
  );
  return formatCourse(rows[0]);
};

exports.deleteCourse = async (courseId, userId, userRole) => {
  const { rows } = await pool.query(
    `SELECT c.*, u.first_name AS handler_first_name, u.last_name AS handler_last_name
     FROM courses c LEFT JOIN users u ON u.id = c.course_handler_id
     WHERE c.id = $1`,
    [courseId],
  );
  if (!rows.length) throw new Error("Course not found");
  const course = rows[0];

  if (userRole !== "admin" && course.course_handler_id !== userId) {
    throw new Error("Unauthorized to delete this course");
  }

  const instructorName = course.handler_first_name
    ? `${course.handler_first_name} ${course.handler_last_name}`
    : "Platform Instructor";

  // Snapshot enrollments before deletion
  const { rowCount } = await pool.query(
    `UPDATE enrollments SET
       snap_title = $1, snap_description = $2, snap_thumbnail = $3,
       snap_category = $4, snap_level = $5, snap_instructor_name = $6,
       snap_deleted_at = NOW(), updated_at = NOW()
     WHERE course_id = $7`,
    [
      course.title,
      course.description,
      course.thumbnail,
      course.category,
      course.level,
      instructorName,
      courseId,
    ],
  );

  await pool.query("DELETE FROM courses WHERE id = $1", [courseId]);

  return { message: "Course deleted successfully", snapshotted: rowCount };
};

exports.togglePublishCourse = async (courseId, userId, userRole) => {
  const { rows: existing } = await pool.query(
    "SELECT id, course_handler_id, is_published FROM courses WHERE id = $1",
    [courseId],
  );
  if (!existing.length) throw new Error("Course not found");
  if (userRole !== "admin" && existing[0].course_handler_id !== userId) {
    throw new Error("Unauthorized to publish this course");
  }

  const newPublished = !existing[0].is_published;
  const { rows } = await pool.query(
    `UPDATE courses SET is_published = $1, is_archived = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [newPublished, !newPublished, courseId],
  );
  return formatCourse(rows[0]);
};

exports.addTutor = async (courseId, tutorId, userId, userRole) => {
  const { rows: existing } = await pool.query(
    "SELECT id, course_handler_id FROM courses WHERE id = $1",
    [courseId],
  );
  if (!existing.length) throw new Error("Course not found");
  if (userRole !== "admin" && existing[0].course_handler_id !== userId) {
    throw new Error("Unauthorized to add tutors to this course");
  }

  const { rows: already } = await pool.query(
    "SELECT 1 FROM course_tutors WHERE course_id=$1 AND user_id=$2",
    [courseId, tutorId],
  );
  if (already.length) throw new Error("Tutor already added to this course");

  await pool.query(
    "INSERT INTO course_tutors (course_id, user_id) VALUES ($1,$2)",
    [courseId, tutorId],
  );
  return exports.getCourseById(courseId);
};

exports.removeTutor = async (courseId, tutorId, userId, userRole) => {
  const { rows: existing } = await pool.query(
    "SELECT id, course_handler_id FROM courses WHERE id = $1",
    [courseId],
  );
  if (!existing.length) throw new Error("Course not found");
  if (userRole !== "admin" && existing[0].course_handler_id !== userId) {
    throw new Error("Unauthorized to remove tutors from this course");
  }

  await pool.query(
    "DELETE FROM course_tutors WHERE course_id=$1 AND user_id=$2",
    [courseId, tutorId],
  );
  return exports.getCourseById(courseId);
};

// ─── Modules ─────────────────────────────────────────────────

const getContentForModules = async (moduleIds) => {
  if (!moduleIds.length) return {};
  const { rows } = await pool.query(
    `SELECT * FROM content WHERE module_id = ANY($1) ORDER BY "order" ASC`,
    [moduleIds],
  );
  const map = {};
  for (const r of rows) {
    if (!map[r.module_id]) map[r.module_id] = [];
    map[r.module_id].push(formatContent(r));
  }
  return map;
};

exports.getModulesByCourseId = async (courseId) => {
  const { rows } = await pool.query(
    `SELECT * FROM modules WHERE course_id = $1 ORDER BY "order" ASC`,
    [courseId],
  );
  if (!rows.length) return [];

  const moduleIds = rows.map((r) => r.id);
  const contentMap = await getContentForModules(moduleIds);

  return rows.map((r) => ({
    ...formatModule(r),
    content: contentMap[r.id] || [],
  }));
};

exports.getModuleById = async (moduleId) => {
  const { rows } = await pool.query("SELECT * FROM modules WHERE id = $1", [
    moduleId,
  ]);
  if (!rows.length) throw new Error("Module not found");

  const contentMap = await getContentForModules([moduleId]);
  return { ...formatModule(rows[0]), content: contentMap[moduleId] || [] };
};

exports.createModule = async (courseId, moduleData) => {
  const { rows: course } = await pool.query(
    "SELECT id FROM courses WHERE id = $1",
    [courseId],
  );
  if (!course.length) throw new Error("Course not found");

  const { title, description, order, duration, unlockRules } = moduleData;

  const { rows } = await pool.query(
    `INSERT INTO modules (course_id, title, description, "order", duration, min_previous_score, required_video_completion)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      courseId,
      title,
      description || null,
      order,
      duration || null,
      unlockRules?.minimumPreviousScore ?? 0,
      unlockRules?.requiredVideoCompletion ?? false,
    ],
  );

  return formatModule(rows[0]);
};

exports.updateModule = async (moduleId, updateData) => {
  const { rows: existing } = await pool.query(
    "SELECT id FROM modules WHERE id = $1",
    [moduleId],
  );
  if (!existing.length) throw new Error("Module not found");

  const fieldMap = {
    title: "title",
    description: "description",
    order: '"order"',
    duration: "duration",
  };
  const fields = [];
  const params = [];
  let i = 1;

  for (const [key, col] of Object.entries(fieldMap)) {
    if (updateData[key] !== undefined) {
      fields.push(`${col} = $${i++}`);
      params.push(updateData[key]);
    }
  }
  if (!fields.length) return exports.getModuleById(moduleId);

  fields.push(`updated_at = NOW()`);
  params.push(moduleId);

  const { rows } = await pool.query(
    `UPDATE modules SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    params,
  );
  return formatModule(rows[0]);
};

exports.deleteModule = async (courseId, moduleId) => {
  const { rows } = await pool.query("SELECT id FROM modules WHERE id = $1", [
    moduleId,
  ]);
  if (!rows.length) throw new Error("Module not found");
  // CASCADE handles content deletion
  await pool.query("DELETE FROM modules WHERE id = $1", [moduleId]);
  return { message: "Module deleted successfully" };
};

// ─── Content ─────────────────────────────────────────────────

exports.addContentToModule = async (moduleId, contentData) => {
  const { rows: mod } = await pool.query(
    "SELECT id FROM modules WHERE id = $1",
    [moduleId],
  );
  if (!mod.length) throw new Error("Module not found");

  const { type, title, description, order, data } = contentData;

  const { rows } = await pool.query(
    `INSERT INTO content (module_id, type, title, description, "order", url, duration, file_size, html_content, external_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      moduleId,
      type,
      title,
      description || null,
      order,
      data?.url || null,
      data?.duration || null,
      data?.size || null,
      data?.htmlContent || null,
      data?.externalUrl || null,
    ],
  );

  return formatContent(rows[0]);
};

exports.updateContent = async (contentId, updateData) => {
  const { rows: existing } = await pool.query(
    "SELECT * FROM content WHERE id = $1",
    [contentId],
  );
  if (!existing.length) throw new Error("Content not found");

  const cur = existing[0];
  const fields = [];
  const params = [];
  let i = 1;

  const topMap = {
    title: "title",
    description: "description",
    order: '"order"',
    type: "type",
  };
  for (const [key, col] of Object.entries(topMap)) {
    if (updateData[key] !== undefined) {
      fields.push(`${col} = $${i++}`);
      params.push(updateData[key]);
    }
  }

  if (updateData.data) {
    // Version control: if URL changes, save old URL to history
    if (updateData.data.url && cur.url && updateData.data.url !== cur.url) {
      await pool.query(
        "INSERT INTO content_versions (content_id, url) VALUES ($1,$2)",
        [contentId, cur.url],
      );
      fields.push(`version = $${i++}`);
      params.push((cur.version || 1) + 1);
    }
    const dataMap = {
      url: "url",
      duration: "duration",
      size: "file_size",
      htmlContent: "html_content",
      externalUrl: "external_url",
    };
    for (const [key, col] of Object.entries(dataMap)) {
      if (updateData.data[key] !== undefined) {
        fields.push(`${col} = $${i++}`);
        params.push(updateData.data[key]);
      }
    }
  }

  if (!fields.length) return formatContent(cur);

  fields.push(`updated_at = NOW()`);
  params.push(contentId);

  const { rows } = await pool.query(
    `UPDATE content SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    params,
  );
  return formatContent(rows[0]);
};

exports.deleteContent = async (contentId) => {
  const { rows } = await pool.query(
    "DELETE FROM content WHERE id = $1 RETURNING id",
    [contentId],
  );
  if (!rows.length) throw new Error("Content not found");
  return { message: "Content deleted successfully" };
};
