-- WARNING: This script will DROP existing tables and data.
-- Run this to reset your database to the Spec v1.0 schema.

-- Drop tables with CASCADE to remove dependent policies and foreign keys automatically.
-- We do not need to drop policies explicitly, which avoids errors if the table doesn't exist.
drop table if exists public.payments cascade;
drop table if exists public.tasks cascade;
drop table if exists public.users cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS Table (Syncs with auth.users)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TASKS Table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  description text,
  code_snippet text not null,
  is_paid boolean default false,
  ai_score integer,
  ai_summary text,
  full_report_json jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PAYMENTS Table
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  stripe_session_id text unique not null,
  status text not null,
  amount_total integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.payments enable row level security;

-- Users Policy
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Tasks Policy
create policy "Users can view own tasks" on public.tasks
  for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on public.tasks
  for update using (auth.uid() = user_id);

-- Payments Policy
create policy "Users can view payments for own tasks" on public.payments
  for select using (
    exists (
      select 1 from public.tasks
      where tasks.id = payments.task_id
      and tasks.user_id = auth.uid()
    )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
