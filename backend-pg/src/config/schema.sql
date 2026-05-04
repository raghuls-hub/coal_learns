-- ============================================================
-- LMS PostgreSQL Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- for ILIKE trigram indexes

-- ─── ENUMS ───────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'mentor', 'candidate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('video', 'pdf', 'text', 'link', 'hands_on_notes', 'video_upload', 'notes_upload');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                 VARCHAR(255) NOT NULL UNIQUE,
  password              VARCHAR(255) NOT NULL,
  role                  user_role NOT NULL,
  first_name            VARCHAR(100) NOT NULL,
  last_name             VARCHAR(100) NOT NULL,
  phone                 VARCHAR(30),
  avatar                TEXT,
  bio                   VARCHAR(500),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified           BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token    VARCHAR(255),
  reset_password_token  VARCHAR(255),
  reset_password_expire TIMESTAMPTZ,
  last_login            TIMESTAMPTZ,
  created_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active   ON users(is_active);
-- Trigram index for fast ILIKE search on name/email
CREATE INDEX IF NOT EXISTS idx_users_first_name_trgm ON users USING gin(first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_last_name_trgm  ON users USING gin(last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm      ON users USING gin(email gin_trgm_ops);

-- ─── COURSES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title               VARCHAR(500) NOT NULL,
  description         TEXT NOT NULL,
  thumbnail           TEXT,
  cover_image         TEXT,
  category            VARCHAR(100) NOT NULL,
  level               course_level NOT NULL DEFAULT 'beginner',
  course_handler_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  price_amount        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price_amount >= 0),
  price_currency      VARCHAR(10) NOT NULL DEFAULT 'USD',
  enrollment_limit    INTEGER CHECK (enrollment_limit >= 0),
  certificate_template TEXT,
  passing_percentage  NUMERIC(5,2) NOT NULL DEFAULT 70 CHECK (passing_percentage BETWEEN 0 AND 100),
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived         BOOLEAN NOT NULL DEFAULT FALSE,
  enrollment_count    INTEGER NOT NULL DEFAULT 0,
  completion_count    INTEGER NOT NULL DEFAULT 0,
  average_rating      NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (average_rating BETWEEN 0 AND 5),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_handler          ON courses(course_handler_id);
CREATE INDEX IF NOT EXISTS idx_courses_published        ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_category         ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_handler_published ON courses(course_handler_id, is_published);
-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_courses_fts ON courses USING gin(to_tsvector('english', title || ' ' || description));

-- ─── COURSE TUTORS (many-to-many) ────────────────────────────
CREATE TABLE IF NOT EXISTS course_tutors (
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  PRIMARY KEY (course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_course_tutors_user ON course_tutors(user_id);

-- ─── MODULES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id                   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title                       VARCHAR(500) NOT NULL,
  description                 TEXT,
  "order"                     INTEGER NOT NULL CHECK ("order" >= 0),
  duration                    INTEGER CHECK (duration >= 0),
  min_previous_score          NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (min_previous_score BETWEEN 0 AND 100),
  required_video_completion   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_course       ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_order ON modules(course_id, "order");

-- ─── MODULE UNLOCK RULES (required previous modules) ─────────
CREATE TABLE IF NOT EXISTS module_unlock_rules (
  module_id          UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  required_module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  PRIMARY KEY (module_id, required_module_id)
);

-- ─── CONTENT ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id        UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  type             content_type NOT NULL,
  title            VARCHAR(500) NOT NULL,
  description      TEXT,
  "order"          INTEGER NOT NULL CHECK ("order" >= 0),
  url              TEXT,
  duration         INTEGER,   -- seconds for video
  file_size        BIGINT,
  html_content     TEXT,
  external_url     TEXT,
  version          INTEGER NOT NULL DEFAULT 1,
  embedding_model  VARCHAR(100),
  embedding_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_module       ON content(module_id);
CREATE INDEX IF NOT EXISTS idx_content_module_order ON content(module_id, "order");

-- ─── CONTENT VERSION HISTORY ─────────────────────────────────
CREATE TABLE IF NOT EXISTS content_versions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id  UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_versions_content ON content_versions(content_id);

-- ─── ENROLLMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id             UUID REFERENCES courses(id) ON DELETE SET NULL,
  payment_status        payment_status NOT NULL DEFAULT 'pending',
  amount_paid           NUMERIC(10,2) NOT NULL,
  currency              VARCHAR(10) NOT NULL DEFAULT 'USD',
  payment_method        VARCHAR(50) NOT NULL DEFAULT 'mock_payment',
  transaction_id        VARCHAR(255),
  enrolled_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  progress              NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_accessed         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status                enrollment_status NOT NULL DEFAULT 'active',
  -- snapshot fields
  snap_title            TEXT,
  snap_description      TEXT,
  snap_thumbnail        TEXT,
  snap_category         VARCHAR(100),
  snap_level            VARCHAR(50),
  snap_instructor_name  TEXT,
  snap_total_modules    INTEGER,
  snap_total_duration   INTEGER,
  snap_deleted_at       TIMESTAMPTZ,
  snap_completed_at     TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user           ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course         ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status    ON enrollments(user_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status  ON enrollments(course_id, payment_status);

-- ─── PROGRESS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id        UUID NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id            UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  course_completed     BOOLEAN NOT NULL DEFAULT FALSE,
  certificate_claimed  BOOLEAN NOT NULL DEFAULT FALSE,
  last_accessed        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_progress_user_course ON progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_progress_enrollment         ON progress(enrollment_id);

-- ─── PROGRESS COMPLETED CONTENT ──────────────────────────────
CREATE TABLE IF NOT EXISTS progress_completed_content (
  progress_id UUID NOT NULL REFERENCES progress(id) ON DELETE CASCADE,
  content_id  UUID NOT NULL REFERENCES content(id)  ON DELETE CASCADE,
  PRIMARY KEY (progress_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_pcc_progress ON progress_completed_content(progress_id);

-- ─── PROGRESS MODULE STATUS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS progress_module_status (
  progress_id  UUID NOT NULL REFERENCES progress(id)  ON DELETE CASCADE,
  module_id    UUID NOT NULL REFERENCES modules(id)   ON DELETE CASCADE,
  is_unlocked  BOOLEAN NOT NULL DEFAULT FALSE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (progress_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_pms_progress ON progress_module_status(progress_id);

-- ─── CERTIFICATES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificates (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_id   UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id        UUID REFERENCES courses(id) ON DELETE SET NULL,
  enrollment_id    UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  instructor_name  TEXT NOT NULL,
  course_name      TEXT NOT NULL,
  score            NUMERIC(5,2) NOT NULL,
  issue_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_url TEXT NOT NULL,
  qr_code_data     TEXT,
  metadata         JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_user        ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_cert_id     ON certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_course ON certificates(user_id, course_id);

-- ─── UPLOADED FILES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploaded_files (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename     VARCHAR(255) NOT NULL UNIQUE,
  original_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  size         BIGINT NOT NULL,
  file_data    BYTEA NOT NULL,
  uploaded_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_filename ON uploaded_files(filename);

-- ─── PROGRESS TRACKING HISTORY ───────────────────────────────
-- Permanent record of content completion events for accurate progress tracking
CREATE TABLE IF NOT EXISTS progress_tracking_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  progress_id     UUID NOT NULL REFERENCES progress(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  content_id      UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  module_id       UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  event_type      VARCHAR(50) NOT NULL DEFAULT 'content_completed',  -- 'content_completed', 'module_started', etc.
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pth_user_course ON progress_tracking_history(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_pth_progress ON progress_tracking_history(progress_id);
CREATE INDEX IF NOT EXISTS idx_pth_user ON progress_tracking_history(user_id);
CREATE INDEX IF NOT EXISTS idx_pth_completed_at ON progress_tracking_history(completed_at);
