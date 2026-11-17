-- =====================================================================
--  Фруктовая лавка — схема базы данных Supabase
--  Принцип: Privacy by Design. Никаких имён, телефонов, email и адресов.
--  Пользователь = анонимный UUID из Supabase Anonymous Sign-in.
--
--  Как применить: Supabase Dashboard → SQL Editor → вставить файл целиком → Run.
--  (или `supabase db push`, если используете CLI)
-- =====================================================================


-- ---------------------------------------------------------------------
--  PROFILES — анонимный профиль: случайный номер слушателя + цвет аватара
-- ---------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  listener_number integer not null,          -- «Слушатель_1234»
  avatar_color    text    not null,          -- цвет кружка-аватара
  created_at      timestamptz not null default now()
);

-- Профиль создаётся автоматически при анонимном входе.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, listener_number, avatar_color)
  values (
    new.id,
    1000 + floor(random() * 9000)::int,
    (array['#FF623E', '#8D52C7', '#4C9951', '#299ED6',
           '#E44928', '#C2185B', '#00897B', '#5C6BC0'])[1 + floor(random() * 8)::int]
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------
--  DONATIONS — история донатов, привязана только к анонимному ID
--  Пишет ТОЛЬКО сервер (Edge Functions). Клиент может лишь читать свои.
-- ---------------------------------------------------------------------
create table public.donations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (id) on delete cascade,
  amount              integer not null check (amount > 0),   -- в копейках (30000 = 300 ₽)
  currency            text    not null default 'RUB',
  message             text    check (char_length(message) <= 200), -- привет / заказ трека
  status              text    not null default 'pending'
                      check (status in ('pending', 'succeeded', 'canceled', 'failed')),
  provider            text    not null default 'yookassa',
  provider_payment_id text    unique,                         -- id платежа в ЮKassa
  return_url          text,                                   -- куда вернуть пользователя после оплаты
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index donations_user_created_idx on public.donations (user_id, created_at desc);
create index donations_status_created_idx on public.donations (status, created_at desc);


-- ---------------------------------------------------------------------
--  PUSH_TOKENS — Expo push-токены устройств
-- ---------------------------------------------------------------------
create table public.push_tokens (
  token      text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  platform   text,
  updated_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
--  APP_STATE — глобальное состояние приложения (ровно одна строка, id = 1)
--  is_video_live — главный флаг: идёт ли видеотрансляция.
-- ---------------------------------------------------------------------
create table public.app_state (
  id               smallint primary key default 1 check (id = 1),
  is_video_live    boolean not null default false,
  video_url        text,                      -- HLS-ссылка (.m3u8) на видеопоток
  last_announce_at timestamptz,               -- защита от двойной рассылки пушей
  updated_at       timestamptz not null default now()
);
insert into public.app_state (id) values (1);


-- ---------------------------------------------------------------------
--  ADMINS — анонимные ID, которые ввели правильный PIN
-- ---------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Журнал попыток ввода PIN (для защиты от перебора)
create table public.admin_unlock_attempts (
  id         bigserial primary key,
  user_id    uuid,
  success    boolean not null,
  created_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
--  ФУНКЦИИ
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Сохранение push-токена. Если приложение переустановили на том же
-- устройстве, токен «переезжает» к новому анонимному пользователю.
create or replace function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_token !~ '^Expo(nent)?PushToken\[.+\]$' then
    raise exception 'invalid token';
  end if;

  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (p_token, auth.uid(), p_platform, now())
  on conflict (token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        updated_at = now();
end;
$$;


-- ---------------------------------------------------------------------
--  ПРАВА ДОСТУПА: сначала закрываем всё, потом точечно открываем
-- ---------------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.donations             enable row level security;
alter table public.push_tokens           enable row level security;
alter table public.app_state             enable row level security;
alter table public.admins                enable row level security;
alter table public.admin_unlock_attempts enable row level security;

revoke all on public.profiles, public.donations, public.push_tokens,
              public.app_state, public.admins, public.admin_unlock_attempts
  from anon, authenticated;

grant select on public.profiles, public.donations to authenticated;
grant select on public.app_state to anon, authenticated;
grant update (is_video_live, video_url, updated_at) on public.app_state to authenticated;

-- Профиль: свой + админ видит все (чтобы показать «Слушатель_1234» у доната)
create policy "profiles: own"   on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles: admin" on public.profiles for select to authenticated using (public.is_admin());

-- Донаты: свои + админ видит все (чтобы читать приветы и заказы треков)
create policy "donations: own"   on public.donations for select to authenticated using (user_id = auth.uid());
create policy "donations: admin" on public.donations for select to authenticated using (public.is_admin());

-- Состояние эфира: читают все, меняют только админы
create policy "app_state: read"         on public.app_state for select to anon, authenticated using (true);
create policy "app_state: admin update" on public.app_state for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

revoke execute on function public.handle_new_user()               from public, anon, authenticated;
revoke execute on function public.is_admin()                      from public, anon;
revoke execute on function public.register_push_token(text, text) from public, anon;
grant  execute on function public.is_admin()                      to authenticated;
grant  execute on function public.register_push_token(text, text) to authenticated;


-- ---------------------------------------------------------------------
--  REALTIME: клиенты подписываются на изменения app_state
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.app_state;
