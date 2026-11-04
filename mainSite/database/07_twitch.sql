-- ============================================================================
-- TWITCH · tu cuenta conectada, widgets de OBS, alertas, recompensas de
-- puntos de canal, historial de eventos, metas, comandos y directos
--
-- Base sugerida en hPanel: u000000000_twitch
-- Se ejecuta en phpMyAdmin con esta base seleccionada (pestaña SQL).
-- Se puede ejecutar varias veces sin romper nada.
--
-- Las columnas *_medio_id apuntan a medios.medio (imágenes, GIFs y también
-- sonidos: medio guarda cualquier tipo de archivo). Las de usuario_id, a
-- nucleo.usuario. Al estar en otras bases no llevan FOREIGN KEY.
-- ============================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Tu canal conectado desde el perfil. El refresh_token es lo que permite
-- que el servidor pida tokens nuevos a Twitch sin volver a iniciar sesión:
-- es secreto y solo lo lee el servidor. scopes guarda los permisos que
-- aceptaste, para saber qué alertas se pueden activar y cuáles piden
-- reconectar con más permisos.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cuenta (
  twitch_user_id   VARCHAR(32)     NOT NULL,
  usuario_id       BIGINT UNSIGNED NOT NULL,
  login            VARCHAR(64)     NOT NULL,
  nombre_mostrar   VARCHAR(64)     NOT NULL,
  avatar_url       VARCHAR(500)    NULL,
  refresh_token    VARCHAR(255)    NOT NULL,
  scopes           JSON            NOT NULL,
  conectada_en     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (twitch_user_id),
  UNIQUE KEY uq_cuenta_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Cada fuente de navegador que pegas en OBS. Cada una con su propia clave:
-- si enseñas sin querer la URL de las alertas, la rotas y la ruleta sigue
-- funcionando.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS widget (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  twitch_user_id VARCHAR(32)  NOT NULL,
  clave       CHAR(36)     NOT NULL DEFAULT (UUID()),
  tipo        ENUM('alertas','ruleta','voz','eventos_recientes','meta','chat') NOT NULL,
  nombre      VARCHAR(80)  NOT NULL,
  ajustes     JSON         NOT NULL DEFAULT ('{}'),   -- posición, tamaño, tema...
  activo      TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_widget_clave (clave),
  KEY ix_widget_cuenta (twitch_user_id, tipo),
  CONSTRAINT fk_widget_cuenta FOREIGN KEY (twitch_user_id)
    REFERENCES cuenta (twitch_user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Cómo se ve y suena cada alerta. Puede haber varias del mismo tipo con
-- distinto mínimo: 1 bit → la normal, 1000 bits → la épica. Se usa la de
-- mínimo más alto que no pase de la cantidad recibida.
--
-- La plantilla admite {usuario}, {cantidad}, {meses}, {mensaje}, {nivel}.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerta (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  twitch_user_id    VARCHAR(32)  NOT NULL,
  tipo              ENUM('follow','sub','resub','sub_regalo','bits','raid','canje','hype_train','meta_cumplida') NOT NULL,
  nombre            VARCHAR(80)  NOT NULL,
  minimo            INT UNSIGNED NOT NULL DEFAULT 0,   -- bits, meses, regalos o espectadores del raid
  activa            TINYINT(1)   NOT NULL DEFAULT 1,
  plantilla         VARCHAR(255) NOT NULL,
  duracion_ms       INT UNSIGNED NOT NULL DEFAULT 6000,
  imagen_medio_id   BIGINT UNSIGNED NULL,
  sonido_medio_id   BIGINT UNSIGNED NULL,
  volumen           DECIMAL(3,2) NOT NULL DEFAULT 0.80,
  -- Leer en voz alta el mensaje del sub o de los bits
  leer_mensaje      TINYINT(1)   NOT NULL DEFAULT 0,
  estilo            JSON         NOT NULL DEFAULT ('{}'),   -- animación, colores, fuente, posición
  creado_en         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_alerta_elegir (twitch_user_id, tipo, activa, minimo),
  CONSTRAINT ck_alerta_volumen CHECK (volumen BETWEEN 0 AND 1),
  CONSTRAINT fk_alerta_cuenta FOREIGN KEY (twitch_user_id)
    REFERENCES cuenta (twitch_user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Qué hace cada recompensa de puntos de canal. Sustituye a las columnas
-- sueltas de antes (reward_id, reward_tts_id, premios, tts_ajustes): ahora
-- puede haber las que quieras, cada una con su acción.
--   ruleta → ajustes.premios (exactamente 8)
--   voz    → ajustes de voz y moderación (voz, tono, maxCaracteres...)
--   alerta → lanza la alerta indicada en alerta_id (si la alerta se
--            borra, queda vacío y la recompensa no hace nada)
--   sonido → reproduce sonido_medio_id
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recompensa (
  id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  twitch_user_id   VARCHAR(32)     NOT NULL,
  reward_id        VARCHAR(64)     NOT NULL,   -- id de la recompensa en Twitch
  titulo           VARCHAR(100)    NOT NULL,   -- copia del nombre en Twitch, solo para mostrar
  accion           ENUM('ruleta','voz','alerta','sonido') NOT NULL,
  ajustes          JSON            NOT NULL DEFAULT ('{}'),
  alerta_id        INT UNSIGNED    NULL,
  sonido_medio_id  BIGINT UNSIGNED NULL,
  activa           TINYINT(1)      NOT NULL DEFAULT 1,
  creado_en        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_recompensa_reward (reward_id),
  KEY ix_recompensa_cuenta (twitch_user_id, accion),
  -- Ocho gajos: ni uno más ni uno menos, o la ruleta cantaría un premio que no existe
  CONSTRAINT ck_recompensa_ruleta CHECK (
    accion <> 'ruleta'
    OR (JSON_TYPE(JSON_EXTRACT(ajustes, '$.premios')) = 'ARRAY'
        AND JSON_LENGTH(ajustes, '$.premios') = 8)
  ),
  CONSTRAINT fk_recompensa_cuenta FOREIGN KEY (twitch_user_id)
    REFERENCES cuenta (twitch_user_id) ON DELETE CASCADE,
  CONSTRAINT fk_recompensa_alerta FOREIGN KEY (alerta_id)
    REFERENCES alerta (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Todo lo que pasa en el canal: follows, subs, bits, raids, canjes...
--
-- mensaje_id es el id que Twitch pone a cada notificación. Es único, así
-- que aunque el mismo evento llegue dos veces (dos widgets abiertos, un
-- reintento de Twitch), solo se guarda y se alerta una vez.
--
-- origen 'prueba' son las alertas lanzadas desde el panel con el botón de
-- probar; 'repeticion', las que vuelves a lanzar desde el historial.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evento (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  twitch_user_id   VARCHAR(32)     NOT NULL,
  mensaje_id       VARCHAR(64)     NOT NULL,
  tipo             VARCHAR(60)     NOT NULL,   -- tipo de EventSub: channel.follow, channel.cheer...
  origen           ENUM('twitch','prueba','repeticion') NOT NULL DEFAULT 'twitch',
  quien_id         VARCHAR(32)     NULL,
  quien_login      VARCHAR(64)     NULL,
  quien_nombre     VARCHAR(64)     NULL,
  cantidad         INT UNSIGNED    NULL,       -- bits, meses, regalos, espectadores...
  mensaje          TEXT            NULL,
  datos            JSON            NOT NULL,   -- el evento completo tal como llegó
  alerta_id        INT UNSIGNED    NULL,
  mostrado_en      DATETIME        NULL,       -- cuándo salió en pantalla
  recibido_en      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_evento_mensaje (mensaje_id),
  KEY ix_evento_recientes (twitch_user_id, recibido_en),
  KEY ix_evento_tipo (twitch_user_id, tipo, recibido_en),
  -- La cola de alertas: lo que falta por mostrar, en orden de llegada
  KEY ix_evento_cola (twitch_user_id, mostrado_en, id),
  CONSTRAINT fk_evento_cuenta FOREIGN KEY (twitch_user_id)
    REFERENCES cuenta (twitch_user_id) ON DELETE CASCADE,
  CONSTRAINT fk_evento_alerta FOREIGN KEY (alerta_id)
    REFERENCES alerta (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Metas para la barra en pantalla: "100 seguidores", "20 subs este mes".
-- actual lo va subiendo el servidor con cada evento que cuenta.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  twitch_user_id  VARCHAR(32)  NOT NULL,
  tipo            ENUM('seguidores','subs','bits','personalizada') NOT NULL,
  titulo          VARCHAR(120) NOT NULL,
  objetivo        INT UNSIGNED NOT NULL,
  actual          INT UNSIGNED NOT NULL DEFAULT 0,
  inicia_en       DATETIME     NULL,
  termina_en      DATETIME     NULL,
  activa          TINYINT(1)   NOT NULL DEFAULT 1,
  cumplida_en     DATETIME     NULL,
  creado_en       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_meta_activa (twitch_user_id, activa),
  CONSTRAINT ck_meta_objetivo CHECK (objetivo > 0),
  CONSTRAINT fk_meta_cuenta FOREIGN KEY (twitch_user_id)
    REFERENCES cuenta (twitch_user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Comandos del chat (!redes, !horario...). La respuesta admite {usuario}
-- y {horario}, que sale de la agenda. enfriamiento evita que el chat
-- los spamee.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comando (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  twitch_user_id        VARCHAR(32)  NOT NULL,
  nombre                VARCHAR(40)  NOT NULL,   -- sin el "!"
  respuesta             VARCHAR(500) NOT NULL,
  nivel                 ENUM('todos','subs','vips','mods','yo') NOT NULL DEFAULT 'todos',
  enfriamiento_seg      SMALLINT UNSIGNED NOT NULL DEFAULT 10,
  activo                TINYINT(1)   NOT NULL DEFAULT 1,
  usos                  INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_comando_nombre (twitch_user_id, nombre),
  CONSTRAINT fk_comando_cuenta FOREIGN KEY (twitch_user_id)
    REFERENCES cuenta (twitch_user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Cada directo, de stream.online a stream.offline. Sirve para el
-- historial en el perfil y para enlazarlo con el evento de la agenda
-- (agenda.evento) que lo anunciaba.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS directo (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  twitch_user_id      VARCHAR(32)     NOT NULL,
  stream_id           VARCHAR(32)     NOT NULL,
  titulo              VARCHAR(255)    NULL,
  categoria           VARCHAR(120)    NULL,
  inicio              DATETIME        NOT NULL,
  fin                 DATETIME        NULL,
  pico_espectadores   INT UNSIGNED    NULL,
  agenda_evento_id    BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_directo_stream (stream_id),
  KEY ix_directo_inicio (twitch_user_id, inicio),
  CONSTRAINT fk_directo_cuenta FOREIGN KEY (twitch_user_id)
    REFERENCES cuenta (twitch_user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
