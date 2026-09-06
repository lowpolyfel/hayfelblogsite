-- ============================================================================
-- Ruleta de Twitch · esquema inicial
--
-- Un renglón por streamer. Lo importante que vive aquí es el refresh_token:
-- es lo que permite que el servidor pida tokens frescos a Twitch sin que
-- nadie vuelva a iniciar sesión, y por tanto lo que evita volver a tocar OBS.
--
-- Se puede ejecutar varias veces sin romper nada.
-- ============================================================================

create table if not exists public.ruleta_usuario (
  -- Identidad en Twitch. El id no cambia nunca; el login sí, así que el id
  -- es la clave y el login solo sirve para mostrarlo.
  twitch_user_id  text primary key,
  twitch_login    text not null,
  display_name    text,

  -- Credenciales. El refresh_token no caduca por tiempo: Twitch lo invalida
  -- si el usuario retira el permiso o si se rota al refrescar.
  refresh_token   text not null,
  scope           text not null default 'channel:read:redemptions',

  -- Configuración de la ruleta
  reward_id       text,
  premios         jsonb not null default
                    '["Gema cian","Gema verde","Gema amarilla","Gema naranja",
                      "Gema roja","Gema rosa","Gema morada","Gema azul"]'::jsonb,

  -- Ocho gajos: ni uno más ni uno menos, o la ruleta cantaría un premio
  -- que no existe.
  constraint premios_son_ocho check (
    jsonb_typeof(premios) = 'array' and jsonb_array_length(premios) = 8
  ),

  -- Lo único que viaja en la URL que se pega en OBS. No es un token: solo
  -- identifica al widget para que el servidor le sirva su configuración.
  -- Se puede rotar sin tocar la sesión del usuario.
  widget_key      uuid not null unique default gen_random_uuid(),

  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

comment on table  public.ruleta_usuario is
  'Un renglón por streamer: credenciales de Twitch y configuración de su ruleta.';
comment on column public.ruleta_usuario.refresh_token is
  'Secreto. Solo lo lee el backend con la clave service_role.';
comment on column public.ruleta_usuario.widget_key is
  'Identificador público del widget de OBS. No da acceso a la tabla.';

-- ---------------------------------------------------------------------------
-- actualizado_en al día sin tener que acordarse en cada UPDATE
-- ---------------------------------------------------------------------------
create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists trg_ruleta_actualizado_en on public.ruleta_usuario;
create trigger trg_ruleta_actualizado_en
  before update on public.ruleta_usuario
  for each row execute function public.tocar_actualizado_en();

-- ---------------------------------------------------------------------------
-- SEGURIDAD
--
-- Esta tabla guarda refresh tokens. Supabase publica el esquema `public` por
-- HTTP con la clave anónima, que va en el navegador y por tanto la ve
-- cualquiera. Sin esto, cualquier visitante podría leerse los tokens.
--
-- Se activa RLS y NO se crea ninguna política: así ni `anon` ni
-- `authenticated` ven un solo renglón. La clave `service_role`, que solo
-- vive en el servidor, se salta RLS y es la única que puede tocar la tabla.
-- ---------------------------------------------------------------------------
alter table public.ruleta_usuario enable row level security;

-- Por si acaso, además de RLS: se retiran los permisos de las dos claves
-- públicas. RLS ya bastaría, pero esto lo deja explícito.
revoke all on public.ruleta_usuario from anon, authenticated;
