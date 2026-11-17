-- Run in Supabase SQL editor
create type user_role as enum ('super_admin','admin','instructor','content_manager','student');
create table profiles(id uuid primary key references auth.users on delete cascade, full_name text, role user_role not null default 'student', student_code text unique, active boolean default true, created_at timestamptz default now());
create sequence student_seq start 1001;
create function handle_new_user() returns trigger language plpgsql security definer as $$
begin insert into profiles(id,full_name,student_code) values(new.id,new.raw_user_meta_data->>'full_name','AEC-'||nextval('student_seq')); return new; end $$;
create trigger on_signup after insert on auth.users for each row execute function handle_new_user();
create function is_staff() returns boolean language sql security definer stable as $$ select exists(select 1 from profiles where id=auth.uid() and role in ('super_admin','admin','content_manager','instructor')) $$;
create function is_admin() returns boolean language sql security definer stable as $$ select exists(select 1 from profiles where id=auth.uid() and role in ('super_admin','admin')) $$;
create table categories(id serial primary key, name text unique not null);
insert into categories(name) values('Basic Electrical Engineering'),('Electrical Installation and Wiring'),('Power Systems'),('Solar Energy Systems'),('Industrial Electricity'),('Electrical Maintenance'),('Electronics'),('Electrical Safety'),('AutoCAD Electrical');
create table courses(id uuid primary key default gen_random_uuid(), title text not null, description text, category_id int references categories, instructor_id uuid references profiles, duration text, level text default 'Beginner', price numeric default 0, status text default 'draft' check(status in('draft','published','archived')), created_at timestamptz default now());
create table modules(id uuid primary key default gen_random_uuid(), course_id uuid references courses on delete cascade, title text, position int default 0);
create table lessons(id uuid primary key default gen_random_uuid(), module_id uuid references modules on delete cascade, course_id uuid references courses on delete cascade, title text, body text, position int default 0);
create table enrollments(student_id uuid references profiles on delete cascade, course_id uuid references courses on delete cascade, created_at timestamptz default now(), primary key(student_id,course_id));
create table lesson_progress(student_id uuid references profiles on delete cascade, lesson_id uuid references lessons on delete cascade, done_at timestamptz default now(), primary key(student_id,lesson_id));
create table materials(id uuid primary key default gen_random_uuid(), course_id uuid references courses on delete cascade, lesson_id uuid references lessons on delete set null, title text, kind text, path text not null, access text default 'enrolled' check(access in('public','logged_in','enrolled')), uploaded_by uuid references profiles, created_at timestamptz default now());
create table assignments(id uuid primary key default gen_random_uuid(), course_id uuid references courses on delete cascade, title text, details text, due_at timestamptz);
create table submissions(id uuid primary key default gen_random_uuid(), assignment_id uuid references assignments on delete cascade, student_id uuid references profiles, file_path text, grade numeric, created_at timestamptz default now());
create table announcements(id uuid primary key default gen_random_uuid(), title text, body text, created_at timestamptz default now());
create table activity_logs(id bigserial primary key, user_id uuid, action text, created_at timestamptz default now());
-- RLS
do $$ declare t text; begin foreach t in array array['profiles','categories','courses','modules','lessons','enrollments','lesson_progress','materials','assignments','submissions','announcements','activity_logs'] loop execute format('alter table %I enable row level security',t); end loop; end $$;
create policy p_prof_read on profiles for select using(id=auth.uid() or is_staff());
create policy p_prof_admin on profiles for all using(is_admin());
create policy p_cat on categories for select using(true);
create policy p_cat_w on categories for all using(is_admin());
create policy p_course_read on courses for select using(status='published' or is_staff());
create policy p_course_w on courses for all using(is_admin() or instructor_id=auth.uid());
create policy p_mod_read on modules for select using(true);
create policy p_mod_w on modules for all using(is_staff());
create policy p_les_read on lessons for select using(true);
create policy p_les_w on lessons for all using(is_staff());
create policy p_enr_read on enrollments for select using(student_id=auth.uid() or is_staff());
create policy p_enr_ins on enrollments for insert with check(student_id=auth.uid());
create policy p_prog on lesson_progress for all using(student_id=auth.uid());
create policy p_mat_read on materials for select using(access='public' or (access='logged_in' and auth.uid() is not null) or is_staff() or exists(select 1 from enrollments e where e.course_id=materials.course_id and e.student_id=auth.uid()));
create policy p_mat_w on materials for all using(is_staff());
create policy p_asg_read on assignments for select using(is_staff() or exists(select 1 from enrollments e where e.course_id=assignments.course_id and e.student_id=auth.uid()));
create policy p_asg_w on assignments for all using(is_staff());
create policy p_sub on submissions for all using(student_id=auth.uid() or is_staff());
create policy p_ann_read on announcements for select using(true);
create policy p_ann_w on announcements for all using(is_admin());
create policy p_log on activity_logs for all using(is_admin());
-- Private storage bucket (files are served via signed URLs)
insert into storage.buckets(id,name,public) values('materials','materials',false);
create policy s_read on storage.objects for select using(bucket_id='materials' and auth.uid() is not null);
create policy s_write on storage.objects for insert with check(bucket_id='materials' and is_staff());
create policy s_del on storage.objects for delete using(bucket_id='materials' and is_staff());
-- After registering your own account, make yourself super admin:
-- update profiles set role='super_admin' where id=(select id from auth.users where email='YOU@EMAIL');
