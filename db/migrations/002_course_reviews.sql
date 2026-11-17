-- Public student reviews and ratings for published courses.
create table course_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(btrim(comment)) between 3 and 1500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, user_id)
);
create index course_reviews_course_idx on course_reviews(course_id, created_at desc);
create trigger course_reviews_updated before update on course_reviews
for each row execute function set_updated_at();
