create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select _user_id = auth.uid()
    and exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create table public.admin_emails (
  email text primary key
);
grant all on public.admin_emails to service_role;
alter table public.admin_emails enable row level security;

create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.admin_emails where lower(email) = lower(new.email)) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.handle_new_user_role() from public, anon, authenticated;
grant execute on function public.handle_new_user_role() to service_role;
create trigger on_auth_user_created_role after insert on auth.users
  for each row execute function public.handle_new_user_role();

create table public.novel_stats (
  novel_slug text primary key,
  views bigint not null default 0,
  pdf_reads bigint not null default 0,
  pdf_downloads bigint not null default 0,
  updated_at timestamptz not null default now()
);
grant all on public.novel_stats to service_role;
alter table public.novel_stats enable row level security;

create or replace function public.bump_stat(_slug text, _kind text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if _slug is null or length(_slug) > 200 or _slug !~ '^[a-z0-9-]+$' then
    raise exception 'invalid slug';
  end if;
  insert into public.novel_stats (novel_slug) values (_slug) on conflict do nothing;
  if _kind = 'view' then
    update public.novel_stats set views = views + 1, updated_at = now() where novel_slug = _slug;
  elsif _kind = 'pdf_read' then
    update public.novel_stats set pdf_reads = pdf_reads + 1, updated_at = now() where novel_slug = _slug;
  elsif _kind = 'pdf_download' then
    update public.novel_stats set pdf_downloads = pdf_downloads + 1, updated_at = now() where novel_slug = _slug;
  else
    raise exception 'invalid kind';
  end if;
end;
$$;
revoke all on function public.bump_stat(text, text) from public;
grant execute on function public.bump_stat(text, text) to anon, authenticated;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  novel_slug text not null,
  name text not null check (char_length(name) between 1 and 60),
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1000),
  reply text check (reply is null or char_length(reply) <= 1000),
  replied_at timestamptz,
  created_at timestamptz not null default now()
);
create index reviews_novel_idx on public.reviews (novel_slug, created_at desc);
grant select, insert, delete on public.reviews to authenticated;
grant update (reply, replied_at) on public.reviews to authenticated;
grant insert on public.reviews to anon;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "Admins read reviews" on public.reviews for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Anyone can review" on public.reviews for insert to anon, authenticated
  with check (novel_slug ~ '^[a-z0-9-]+$' and char_length(novel_slug) <= 200);
create policy "Admins delete reviews" on public.reviews for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins reply to reviews" on public.reviews for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  contact text not null default '' check (char_length(contact) <= 120),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);
grant insert on public.feedback to anon, authenticated;
grant select, delete on public.feedback to authenticated;
grant all on public.feedback to service_role;
alter table public.feedback enable row level security;
create policy "Anyone can send valid feedback" on public.feedback for insert to anon, authenticated
  with check (
    char_length(btrim(name)) between 1 and 80
    and char_length(btrim(message)) between 1 and 2000
    and char_length(contact) <= 120
  );
create policy "Admins read feedback" on public.feedback for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete feedback" on public.feedback for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create table public.novel_pdfs (
  novel_slug text primary key,
  file_path text not null,
  file_size bigint,
  uploaded_at timestamptz not null default now()
);
grant select, insert, update, delete on public.novel_pdfs to authenticated;
grant all on public.novel_pdfs to service_role;
alter table public.novel_pdfs enable row level security;
create policy "Admins read pdfs" on public.novel_pdfs for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins add pdfs" on public.novel_pdfs for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update pdfs" on public.novel_pdfs for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete pdfs" on public.novel_pdfs for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create table public.catalog_categories (
  slug text primary key check (slug ~ '^[a-z0-9-]+$' and char_length(slug) <= 80),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.catalog_categories to anon, authenticated;
grant insert, update, delete on public.catalog_categories to authenticated;
grant all on public.catalog_categories to service_role;
alter table public.catalog_categories enable row level security;
create policy "Catalog categories are public" on public.catalog_categories for select to anon, authenticated using (true);
create policy "Admins add catalog categories" on public.catalog_categories for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update catalog categories" on public.catalog_categories for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete catalog categories" on public.catalog_categories for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.catalog_novels (
  slug text primary key check (slug ~ '^[a-z0-9-]+$' and char_length(slug) <= 200),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  urdu text check (urdu is null or char_length(urdu) <= 200),
  subtitle text check (subtitle is null or char_length(subtitle) <= 300),
  author text check (author is null or char_length(author) <= 120),
  cats text[] not null default '{}',
  format text not null default 'series' check (format in ('series', 'complete')),
  playlist text check (playlist is null or playlist ~ '^[A-Za-z0-9_-]{10,64}$'),
  hidden boolean not null default false,
  updated_at timestamptz not null default now()
);
grant select on public.catalog_novels to anon, authenticated;
grant insert, update, delete on public.catalog_novels to authenticated;
grant all on public.catalog_novels to service_role;
alter table public.catalog_novels enable row level security;
create policy "Catalog novels are public" on public.catalog_novels for select to anon, authenticated using (true);
create policy "Admins add catalog novels" on public.catalog_novels for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update catalog novels" on public.catalog_novels for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete catalog novels" on public.catalog_novels for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.catalog_videos (
  video_id text primary key,
  novel_slug text not null check (novel_slug ~ '^[a-z0-9-]+$' and char_length(novel_slug) <= 200),
  title text not null check (char_length(btrim(title)) between 1 and 300),
  ep integer check (ep is null or ep between 0 and 10000),
  season integer check (season is null or season between 0 and 100),
  duration_sec integer not null default 0 check (duration_sec >= 0),
  views bigint not null default 0 check (views >= 0),
  hidden boolean not null default false,
  published_at timestamptz,
  source text not null default 'youtube' check (source in ('youtube', 'terabox')),
  share_url text check (share_url is null or (char_length(share_url) <= 500 and share_url ~ '^https://')),
  thumb_url text check (thumb_url is null or (char_length(thumb_url) <= 500 and thumb_url ~ '^https://')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint catalog_videos_video_id_check check (
    (source = 'youtube' and video_id ~ '^[A-Za-z0-9_-]{11}$')
    or (source = 'terabox' and video_id ~ '^tb-[A-Za-z0-9_-]{4,80}$')
  )
);
create index catalog_videos_novel_idx on public.catalog_videos (novel_slug);
grant select on public.catalog_videos to anon, authenticated;
grant insert, update, delete on public.catalog_videos to authenticated;
grant all on public.catalog_videos to service_role;
alter table public.catalog_videos enable row level security;
create policy "Catalog videos are public" on public.catalog_videos for select to anon, authenticated using (true);
create policy "Admins add catalog videos" on public.catalog_videos for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update catalog videos" on public.catalog_videos for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete catalog videos" on public.catalog_videos for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create function public.get_novel_reviews(_slug text)
returns table (id uuid, name text, rating smallint, comment text, created_at timestamptz, reply text, replied_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.name, r.rating, r.comment, r.created_at, r.reply, r.replied_at
  from public.reviews r
  where _slug is not null and length(_slug) <= 200 and _slug ~ '^[a-z0-9-]+$'
    and r.novel_slug = _slug
  order by r.created_at desc
  limit 50
$$;
create function public.get_latest_reviews()
returns table (id uuid, novel_slug text, name text, rating smallint, comment text, created_at timestamptz, reply text, replied_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.novel_slug, r.name, r.rating, r.comment, r.created_at, r.reply, r.replied_at
  from public.reviews r
  order by r.created_at desc
  limit 6
$$;
create function public.get_novel_rating(_slug text)
returns table (avg_rating numeric, rating_count int)
language sql stable security definer set search_path = public as $$
  select coalesce(round(avg(r.rating)::numeric, 2), 0), count(*)::int
  from public.reviews r
  where _slug is not null and length(_slug) <= 200 and _slug ~ '^[a-z0-9-]+$'
    and r.novel_slug = _slug
$$;
create function public.get_novel_stats(_slug text)
returns table (views bigint, pdf_reads bigint, pdf_downloads bigint)
language sql stable security definer set search_path = public as $$
  select s.views, s.pdf_reads, s.pdf_downloads
  from public.novel_stats s
  where _slug is not null and length(_slug) <= 200 and _slug ~ '^[a-z0-9-]+$'
    and s.novel_slug = _slug
$$;
create function public.list_novel_pdfs()
returns table (novel_slug text, file_size bigint, uploaded_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.novel_slug, p.file_size, p.uploaded_at
  from public.novel_pdfs p
  order by p.uploaded_at desc
  limit 1000
$$;
revoke all on function public.get_novel_reviews(text) from public;
revoke all on function public.get_latest_reviews() from public;
revoke all on function public.get_novel_rating(text) from public;
revoke all on function public.get_novel_stats(text) from public;
revoke all on function public.list_novel_pdfs() from public;
grant execute on function public.get_novel_reviews(text) to anon, authenticated;
grant execute on function public.get_latest_reviews() to anon, authenticated;
grant execute on function public.get_novel_rating(text) to anon, authenticated;
grant execute on function public.get_novel_stats(text) to anon, authenticated;
grant execute on function public.list_novel_pdfs() to anon, authenticated;

create function public.is_registered_pdf(_path text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.novel_pdfs where file_path = _path)
$$;
revoke all on function public.is_registered_pdf(text) from public;
grant execute on function public.is_registered_pdf(text) to anon, authenticated;

create policy "Admins read novel pdfs" on storage.objects for select to authenticated
  using (bucket_id = 'novel-pdfs' and public.has_role(auth.uid(), 'admin'));
create policy "Admins upload novel pdfs" on storage.objects for insert to authenticated
  with check (bucket_id = 'novel-pdfs' and public.has_role(auth.uid(), 'admin'));
create policy "Admins update novel pdfs" on storage.objects for update to authenticated
  using (bucket_id = 'novel-pdfs' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete novel pdfs" on storage.objects for delete to authenticated
  using (bucket_id = 'novel-pdfs' and public.has_role(auth.uid(), 'admin'));
create policy "Visitors read registered novel pdfs" on storage.objects for select to anon, authenticated
  using (bucket_id = 'novel-pdfs' and public.is_registered_pdf(name));

create table public.legacy_user_imports (
  legacy_user_id uuid primary key,
  email text not null unique,
  role public.app_role not null default 'user',
  cloud_user_id uuid unique,
  claimed_at timestamptz
);
grant all on public.legacy_user_imports to service_role;
alter table public.legacy_user_imports enable row level security;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username = lower(username)
    and username ~ '^[a-z0-9][a-z0-9._-]{2,31}$'
  ),
  constraint profiles_username_unique unique (username)
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Users read own profile" on public.profiles for select to authenticated using (auth.uid() = user_id);
create policy "Users create own profile" on public.profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
