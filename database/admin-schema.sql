create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  role text not null default 'admin' check (role in ('owner','admin')),
  slot integer,
  active boolean not null default false,
  activation_code_hash text,
  code_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admins_owner_one_idx
on public.admins(role)
where role = 'owner';

create unique index if not exists admins_slot_idx
on public.admins(slot)
where role = 'admin';

alter table public.admins enable row level security;
