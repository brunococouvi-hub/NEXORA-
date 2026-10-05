create table contents (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text,
  type text not null,
  cover_url text,
  file_key text,
  file_url text,
  available boolean not null default true,
  expires_at timestamptz,
  download_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index contents_code_idx on contents(code);
create index contents_expires_idx on contents(expires_at);

alter table contents enable row level security;
