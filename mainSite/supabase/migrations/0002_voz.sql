-- ============================================================================
-- Segunda función de puntos de canal: leer en voz alta lo que escriba quien
-- canjea. Comparte fila, sesión y clave de widget con la ruleta: es el mismo
-- panel, no otra cuenta.
--
-- Se puede ejecutar varias veces sin romper nada.
-- ============================================================================

alter table public.ruleta_usuario
  -- Recompensa distinta de la de la ruleta. Vacía = la voz está apagada.
  add column if not exists reward_tts_id text,

  -- Ajustes de la voz y, sobre todo, de la moderación. El TTS lee literal lo
  -- que escriba cualquiera en directo, así que los topes van con valores
  -- prudentes de fábrica y no en cero.
  add column if not exists tts_ajustes jsonb not null default '{
    "voz": "",
    "velocidad": 1,
    "tono": 1,
    "volumen": 1,
    "maxCaracteres": 200,
    "leerNombre": true,
    "colapsarRepetidos": true,
    "bloqueadas": []
  }'::jsonb;

comment on column public.ruleta_usuario.reward_tts_id is
  'Recompensa que dispara la lectura en voz alta. Nula = apagada.';
comment on column public.ruleta_usuario.tts_ajustes is
  'Voz, velocidad y filtros de moderación del lector.';
