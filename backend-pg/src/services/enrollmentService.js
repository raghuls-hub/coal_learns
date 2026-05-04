const { pool } = require("../config/database");

const formatEnrollment = (row) => ({
  _id: row.id,
  id: row.id,
  user: row.user_id,
  course: row.course_id
    ? {
        _id: row.course_id,
        id: row.course_id,
        title: row.course_title,
        description: row.course_description,
        thumbnail: row.course_thumbnail,
        coverImage: row.course_cover_image,
        category: row.course_category,
        level: row.course_level,
        pricing:
          row.price_amount != null
            ? {
                amount: parseFloat(row.price_amount),
                currency: row.price_currency,
              }
            : undefined,
        settings:
          row.is_published != null
            ? {
                isPublished: row.is_published,
                enrollmentLimit: row.enrollment_limit,
              }
            : undefined,
        stats:
          row.enrollment_count != null
            ? { enrollmentCount: row.enrollment_count }
            : undefined,
      }
    : null,
  paymentStatus: row.payment_status,
  amountPaid: parseFloat(row.amount_paid),
  currency: row.currency,
  paymentMethod: row.payment_method,
  transactionId: row.transaction_id,
  enrolledAt: row.enrolled_at,
  completedAt: row.completed_at,
  progress: parseFloat(row.progress),
  lastAccessed: row.last_accessed,
  status: row.status,
  courseSnapshot: row.snap_title
    ? {
        title: row.snap_title,
        description: row.snap_description,
        thumbnail: row.snap_thumbnail,
        category: row.snap_category,
        level: row.snap_level,
        instructorName: row.snap_instructor_name,
        totalModules: row.snap_total_modules,
        totalDuration: row.snap_total_duration,
        deletedAt: row.snap_deleted_at,
        completedAt: row.snap_completed_at,
      }
    : undefined,
  createdAt: row.created_at,
});

exports.createEnrollment = async (
  userId,
  courseId,
  courseHandlerName,
  course,
) => {
  const { rows } = await pool.query(
    `INSERT INTO enrollments
       (user_id, course_id, amount_paid, currency, payment_status, transaction_id,
        snap_title, snap_description, snap_thumbnail, snap_category, snap_level,
        snap_instructor_name, snap_total_modules)
     VALUES ($1,$2,$3,$4,'completed',$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      userId,
      courseId,
      course.price_amount,
      course.price_currency,
      `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      course.title,
      course.description,
      course.thumbnail,
      course.category,
      course.level,
      courseHandlerName,
      course.module_count || 0,
    ],
  );

  // Increment enrollment count
  await pool.query(
    "UPDATE courses SET enrollment_count = enrollment_count + 1, updated_at = NOW() WHERE id = $1",
    [courseId],
  );

  return formatEnrollment(rows[0]);
};

exports.getMyEnrollments = async (userId) => {
  const { rows } = await pool.query(
    `SELECT e.*,
            c.title AS course_title, c.description AS course_description,
            c.thumbnail AS course_thumbnail, c.cover_image AS course_cover_image,
            c.category AS course_category, c.level AS course_level, c.price_amount, c.price_currency,
            c.is_published, c.enrollment_limit, c.enrollment_count
     FROM enrollments e
     LEFT JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = $1 AND e.payment_status = 'completed'
     ORDER BY e.enrolled_at DESC`,
    [userId],
  );
  return rows.map(formatEnrollment);
};

exports.getTutorEnrollments = async (tutorId) => {
  const { rows } = await pool.query(
    `SELECT e.*,
            c.title AS course_title, c.price_amount, c.price_currency,
            c.is_published, c.enrollment_limit, c.enrollment_count,
            u.first_name, u.last_name, u.email AS user_email
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id AND c.course_handler_id = $1
     JOIN users u ON u.id = e.user_id
     WHERE e.payment_status = 'completed'
     ORDER BY e.enrolled_at DESC`,
    [tutorId],
  );
  return rows.map((r) => ({
    ...formatEnrollment(r),
    user: {
      _id: r.user_id,
      email: r.user_email,
      profile: { firstName: r.first_name, lastName: r.last_name },
    },
  }));
};

exports.checkEnrollmentStatus = async (userId, courseId) => {
  const { rows } = await pool.query(
    `SELECT * FROM enrollments WHERE user_id=$1 AND course_id=$2 AND payment_status='completed'`,
    [userId, courseId],
  );
  return {
    isEnrolled: rows.length > 0,
    enrollment: rows.length ? formatEnrollment(rows[0]) : null,
  };
};

exports.getEnrollmentById = async (enrollmentId, userId) => {
  const { rows } = await pool.query(
    `SELECT e.* FROM enrollments e WHERE e.id = $1 AND e.user_id = $2`,
    [enrollmentId, userId],
  );
  if (!rows.length) throw new Error("Enrollment not found");

  const enrollment = formatEnrollment(rows[0]);

  // Populate course with modules + content if course exists
  if (rows[0].course_id) {
    const courseService = require("./courseService");
    try {
      enrollment.course = await courseService.getCourseById(rows[0].course_id);
    } catch {
      enrollment.course = null;
    }
  }

  return enrollment;
};

exports.getEnrollmentByIdRaw = async (enrollmentId) => {
  const { rows } = await pool.query("SELECT * FROM enrollments WHERE id = $1", [
    enrollmentId,
  ]);
  if (!rows.length) throw new Error("Enrollment not found");
  return rows[0];
};

exports.findEnrollment = async (userId, courseId) => {
  const { rows } = await pool.query(
    "SELECT * FROM enrollments WHERE user_id=$1 AND course_id=$2",
    [userId, courseId],
  );
  return rows[0] || null;
};
