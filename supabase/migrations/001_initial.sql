-- Skillify — Initial Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- PROFILES
-- =====================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  courses_generated_this_month integer not null default 0,
  total_xp integer not null default 0,
  current_streak integer not null default 0,
  last_active_date date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================
-- COURSES
-- =====================
create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  domain text not null,
  detected_level text not null default 'beginner' check (detected_level in ('beginner', 'intermediate', 'advanced')),
  duration_weeks integer not null default 4,
  minutes_per_day integer not null default 30,
  learning_style text not null default 'balanced' check (learning_style in ('theory', 'practical', 'balanced')),
  status text not null default 'generating' check (status in ('generating', 'active', 'completed', 'paused')),
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;
create policy "Users manage own courses" on public.courses
  for all using (auth.uid() = user_id);

-- =====================
-- DOCUMENTS (PDF uploads)
-- =====================
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete set null,
  file_name text not null,
  storage_path text not null,
  extracted_text text,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;
create policy "Users manage own documents" on public.documents
  for all using (auth.uid() = user_id);

-- =====================
-- MODULES
-- =====================
create table public.modules (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text not null default '',
  order_index integer not null,
  duration_days integer not null default 7,
  created_at timestamptz not null default now()
);

alter table public.modules enable row level security;
create policy "Users view own modules" on public.modules
  for select using (
    exists (select 1 from public.courses c where c.id = course_id and c.user_id = auth.uid())
  );
create policy "Service can insert modules" on public.modules
  for insert with check (
    exists (select 1 from public.courses c where c.id = course_id and c.user_id = auth.uid())
  );

-- =====================
-- LESSONS
-- =====================
create table public.lessons (
  id uuid primary key default uuid_generate_v4(),
  module_id uuid references public.modules(id) on delete cascade not null,
  title text not null,
  content_markdown text not null default '',
  resources_json jsonb not null default '[]',
  order_index integer not null,
  xp_reward integer not null default 50,
  created_at timestamptz not null default now()
);

alter table public.lessons enable row level security;
create policy "Users view own lessons" on public.lessons
  for select using (
    exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id and c.user_id = auth.uid()
    )
  );
create policy "Service can insert lessons" on public.lessons
  for insert with check (
    exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id and c.user_id = auth.uid()
    )
  );

-- =====================
-- QUIZZES
-- =====================
create table public.quizzes (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  type text not null check (type in ('lesson', 'module', 'final')),
  is_boss_battle boolean not null default false,
  xp_reward integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.quizzes enable row level security;
create policy "Users view own quizzes" on public.quizzes
  for select using (
    exists (select 1 from public.courses c where c.id = course_id and c.user_id = auth.uid())
  );

-- =====================
-- QUIZ QUESTIONS
-- =====================
create table public.quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  question text not null,
  options_json jsonb not null default '[]',
  correct_answer text not null,
  explanation text not null default '',
  order_index integer not null
);

alter table public.quiz_questions enable row level security;
create policy "Users view own quiz questions" on public.quiz_questions
  for select using (
    exists (
      select 1 from public.quizzes q
      join public.courses c on c.id = q.course_id
      where q.id = quiz_id and c.user_id = auth.uid()
    )
  );

-- =====================
-- QUIZ ATTEMPTS
-- =====================
create table public.quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  score integer not null,
  answers_json jsonb not null default '{}',
  passed boolean not null default false,
  xp_awarded integer not null default 0,
  attempted_at timestamptz not null default now()
);

alter table public.quiz_attempts enable row level security;
create policy "Users manage own attempts" on public.quiz_attempts
  for all using (auth.uid() = user_id);

-- =====================
-- PROGRESS
-- =====================
create table public.progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  completed_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

alter table public.progress enable row level security;
create policy "Users manage own progress" on public.progress
  for all using (auth.uid() = user_id);

-- =====================
-- SUBSCRIPTIONS
-- =====================
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  plan text not null check (plan in ('free', 'pro', 'team')),
  status text not null,
  current_period_end timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
create policy "Users view own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Service role can manage subscriptions (for Stripe webhooks)
create policy "Service role manages subscriptions" on public.subscriptions
  for all using (auth.role() = 'service_role');

-- =====================
-- STORAGE BUCKET for PDFs
-- =====================
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
  on conflict do nothing;

create policy "Users upload own documents" on storage.objects
  for insert with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users view own documents" on storage.objects
  for select using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users delete own documents" on storage.objects
  for delete using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
