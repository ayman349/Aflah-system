-- Aflax Electrical College — initial schema (PostgreSQL 13+)

create sequence student_code_seq start 1001;

create function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- USERS (students + admins share one table; role decides access)
create table users (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null check (char_length(btrim(full_name)) between 2 and 100),
  email         text not null unique check (email = lower(email) and char_length(email) <= 254),
  password_hash text not null,
  role          text not null default 'student' check (role in ('student','admin')),
  is_active     boolean not null default true,
  student_code  text unique default ('AEC-' || nextval('student_code_seq')),
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index users_role_idx on users(role);
create trigger users_updated before update on users for each row execute function set_updated_at();

-- SESSIONS (server-side; cookie holds a random token, only its SHA-256 is stored)
create table sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index sessions_user_idx on sessions(user_id);
create index sessions_expires_idx on sessions(expires_at);

-- CATEGORIES (one table, separated by kind)
create table categories (
  id         serial primary key,
  kind       text not null check (kind in ('course','document','lesson')),
  name       text not null check (char_length(btrim(name)) between 2 and 80),
  created_at timestamptz not null default now(),
  unique (kind, name)
);

-- FILES (every upload; bytes live on disk under UPLOAD_DIR, never in the public folder)
create table files (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('video','image','pdf','attachment')),
  original_name text not null,
  stored_name   text not null unique,
  mime          text not null,
  size_bytes    bigint not null check (size_bytes > 0),
  uploaded_by   uuid references users(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- COURSES
create table courses (
  id                uuid primary key default gen_random_uuid(),
  title             text not null check (char_length(btrim(title)) between 3 and 150),
  description       text not null default '',
  instructor_name   text not null default '',
  category_id       int references categories(id) on delete set null,
  thumbnail_file_id uuid references files(id) on delete set null,
  level             text not null default 'Beginner' check (level in ('Beginner','Intermediate','Advanced')),
  duration          text not null default '',
  status            text not null default 'draft' check (status in ('draft','published')),
  created_by        uuid references users(id) on delete set null,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index courses_status_idx on courses(status, created_at desc);
create index courses_category_idx on courses(category_id);
create trigger courses_updated before update on courses for each row execute function set_updated_at();

-- COURSE VIDEOS (uploaded file OR external link)
create table course_videos (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references courses(id) on delete cascade,
  title        text not null default 'Video',
  file_id      uuid references files(id) on delete cascade,
  external_url text,
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  check (file_id is not null or external_url is not null)
);
create index course_videos_course_idx on course_videos(course_id, position);

-- DOCUMENTS (books / PDFs)
create table documents (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (char_length(btrim(title)) between 3 and 150),
  description    text not null default '',
  category_id    int references categories(id) on delete set null,
  file_id        uuid not null references files(id) on delete restrict,
  allow_download boolean not null default true,
  status         text not null default 'draft' check (status in ('draft','published')),
  created_by     uuid references users(id) on delete set null,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index documents_status_idx on documents(status, created_at desc);
create index documents_category_idx on documents(category_id);
create trigger documents_updated before update on documents for each row execute function set_updated_at();

-- DAILY LESSONS
create table daily_lessons (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(btrim(title)) between 3 and 150),
  content      text not null,
  category_id  int references categories(id) on delete set null,
  publish_date date not null default current_date,
  status       text not null default 'draft' check (status in ('draft','published')),
  author_id    uuid references users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index daily_lessons_feed_idx on daily_lessons(status, publish_date desc, created_at desc);
create trigger daily_lessons_updated before update on daily_lessons for each row execute function set_updated_at();

create table lesson_attachments (
  lesson_id uuid not null references daily_lessons(id) on delete cascade,
  file_id   uuid not null references files(id) on delete cascade,
  primary key (lesson_id, file_id)
);

-- ENROLLMENTS (kept from the original project: students can enrol in a course)
create table enrollments (
  user_id    uuid not null references users(id) on delete cascade,
  course_id  uuid not null references courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);
create index enrollments_course_idx on enrollments(course_id);

-- Reference data only (no fake courses). Course categories come from the original project.
insert into categories(kind, name) values
 ('course','Basic Electrical Engineering'),('course','Electrical Installation and Wiring'),
 ('course','Power Systems'),('course','Solar Energy Systems'),('course','Industrial Electricity'),
 ('course','Electrical Maintenance'),('course','Electronics'),('course','Electrical Safety'),
 ('course','AutoCAD Electrical'),
 ('document','Textbooks'),('document','Wiring & Installation Guides'),('document','Safety Manuals'),('document','Solar & Renewable Energy'),('document','Electronics'),
 ('lesson','Fundamentals'),('lesson','Installation'),('lesson','Safety'),('lesson','Solar'),('lesson','Electronics');
