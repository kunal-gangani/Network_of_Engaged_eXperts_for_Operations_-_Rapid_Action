-- ─────────────────────────────────────────────
-- NEXORA — Supabase SQL Schema
-- Run this entire file in the Supabase SQL Editor
-- ─────────────────────────────────────────────

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- ─── USERS ───────────────────────────────────
create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  email      text,
  points     integer not null default 0,
  badge      text not null default 'explorer' check (badge in ('explorer', 'guardian', 'hero')),
  created_at timestamptz not null default now()
);

-- Auto-create user profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Points helper function
create or replace function public.increment_user_points(uid uuid, pts integer)
returns void language plpgsql security definer as $$
begin
  update public.users set points = points + pts where id = uid;
  -- Auto-upgrade badge
  update public.users set badge = case
    when points >= 200 then 'hero'
    when points >= 50  then 'guardian'
    else 'explorer'
  end where id = uid;
end;
$$;

-- ─── ISSUES ──────────────────────────────────
create table if not exists public.issues (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade,
  title               text not null,
  description         text not null default '',
  category            text not null default 'other'
                        check (category in ('pothole','water_leakage','streetlight','garbage','stray_animals','other')),
  severity            integer not null default 3 check (severity between 1 and 5),
  decay_score         integer check (decay_score between 0 and 100),
  decay_reason        text,
  status              text not null default 'reported'
                        check (status in ('reported','verified','in_progress','resolved')),
  lat                 double precision not null,
  lng                 double precision not null,
  image_url           text not null,
  ai_summary          text not null default '',
  suggested_authority text not null default 'Municipal Corporation',
  complaint_draft     text,
  embedding           vector(768),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists issues_updated_at on public.issues;
create trigger issues_updated_at
  before update on public.issues
  for each row execute procedure public.set_updated_at();

-- Vector similarity index
create index if not exists issues_embedding_idx
  on public.issues using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ─── VOTES ───────────────────────────────────
create table if not exists public.votes (
  id         uuid primary key default uuid_generate_v4(),
  issue_id   uuid not null references public.issues(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (issue_id, user_id)
);

-- Auto-verify issue when votes hit threshold
create or replace function public.check_verification_threshold()
returns trigger language plpgsql security definer as $$
declare
  vote_count integer;
begin
  select count(*) into vote_count from public.votes where issue_id = new.issue_id;
  if vote_count >= 3 then
    update public.issues
    set status = 'verified'
    where id = new.issue_id and status = 'reported';
  end if;
  -- Award points to voter
  perform public.increment_user_points(new.user_id, 5);
  return new;
end;
$$;

drop trigger if exists on_vote_inserted on public.votes;
create trigger on_vote_inserted
  after insert on public.votes
  for each row execute procedure public.check_verification_threshold();

-- ─── COMMENTS ────────────────────────────────
create table if not exists public.comments (
  id         uuid primary key default uuid_generate_v4(),
  issue_id   uuid not null references public.issues(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

-- Award points on comment
create or replace function public.on_comment_inserted()
returns trigger language plpgsql security definer as $$
begin
  perform public.increment_user_points(new.user_id, 2);
  return new;
end;
$$;

drop trigger if exists on_comment_created on public.comments;
create trigger on_comment_created
  after insert on public.comments
  for each row execute procedure public.on_comment_inserted();

-- ─── ROW LEVEL SECURITY ──────────────────────
alter table public.users    enable row level security;
alter table public.issues   enable row level security;
alter table public.votes    enable row level security;
alter table public.comments enable row level security;

-- Users: read all, write own
create policy "users_read_all"  on public.users for select using (true);
create policy "users_write_own" on public.users for all using (auth.uid() = id);

-- Issues: read all, insert/update own
create policy "issues_read_all"  on public.issues for select using (true);
create policy "issues_insert"    on public.issues for insert with check (auth.uid() = user_id);
create policy "issues_update"    on public.issues for update using (auth.uid() = user_id);

-- Votes: read all, insert authenticated
create policy "votes_read_all" on public.votes for select using (true);
create policy "votes_insert"   on public.votes for insert with check (auth.uid() = user_id);

-- Comments: read all, insert authenticated
create policy "comments_read_all" on public.comments for select using (true);
create policy "comments_insert"   on public.comments for insert with check (auth.uid() = user_id);

-- ─── STORAGE ─────────────────────────────────
-- Run separately in the Supabase Storage UI or via this SQL:
insert into storage.buckets (id, name, public)
values ('issue-photos', 'issue-photos', true)
on conflict (id) do nothing;

create policy "issue_photos_read"
  on storage.objects for select using (bucket_id = 'issue-photos');

create policy "issue_photos_insert"
  on storage.objects for insert
  with check (bucket_id = 'issue-photos' and auth.role() = 'authenticated');

-- ─── REALTIME ────────────────────────────────
-- Enable realtime on comments and votes for live updates
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.issues;
