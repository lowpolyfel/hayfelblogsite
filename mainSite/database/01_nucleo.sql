-- ============================================================================
-- NÚCLEO · tu cuenta, sesiones y ajustes del sitio
--
-- Base sugerida en hPanel: u000000000_nucleo
-- Se ejecuta en phpMyAdmin con esta base seleccionada (pestaña SQL).
-- Se puede ejecutar varias veces sin romper nada.
-- ============================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- La cuenta. Solo vas a ser tú, pero se deja como tabla normal: cuesta lo
-- mismo y no obliga a rehacer nada si algún día hay un segundo autor.
--
-- La contraseña nunca se guarda: solo su hash (argon2id o bcrypt), que lo
-- genera el servidor. Por eso este script no crea el usuario; lo hará la
-- primera vez que arranque la aplicación.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre_usuario   VARCHAR(40)  NOT NULL,
  correo           VARCHAR(190) NOT NULL,
  hash_contrasena  VARCHAR(255) NOT NULL,
  nombre_mostrar   VARCHAR(80)  NOT NULL,
  bio              TEXT         NULL,
  -- Referencia a medios.medio (otra base: no puede llevar FOREIGN KEY)
  avatar_medio_id  BIGINT UNSIGNED NULL,
  -- Segundo factor opcional con una app tipo Google Authenticator
  totp_secreto     VARCHAR(64)  NULL,
  totp_activo      TINYINT(1)   NOT NULL DEFAULT 0,
  creado_en        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuario_nombre (nombre_usuario),
  UNIQUE KEY uq_usuario_correo (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Sesiones abiertas. En la cookie viaja un token aleatorio; aquí solo su
-- SHA-256, así que quien lea esta tabla no puede hacerse pasar por ti.
-- Cerrar sesión en un dispositivo = borrar su renglón.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesion (
  token_hash        BINARY(32)      NOT NULL,
  usuario_id        BIGINT UNSIGNED NOT NULL,
  creada_en         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_actividad  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_en         DATETIME        NOT NULL,
  ip                VARBINARY(16)   NULL,   -- IPv4 o IPv6 en binario (INET6_ATON)
  agente            VARCHAR(255)    NULL,
  PRIMARY KEY (token_hash),
  KEY ix_sesion_usuario (usuario_id),
  KEY ix_sesion_expira (expira_en),
  CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuario (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Intentos de login, buenos y malos. Con esto el servidor frena a quien
-- pruebe contraseñas a lo bruto (p. ej. 5 fallos en 15 min por IP).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS intento_login (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ip              VARBINARY(16)   NULL,
  nombre_usuario  VARCHAR(190)    NULL,
  exito           TINYINT(1)      NOT NULL,
  creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_intento_ip_fecha (ip, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Ajustes del sitio en clave/valor: título, frase del header, posts por
-- página... Se cambian desde el panel sin tocar código.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ajuste (
  clave           VARCHAR(64) NOT NULL,
  valor           JSON        NOT NULL,
  actualizado_en  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO ajuste (clave, valor) VALUES
  ('sitio.titulo',            '"Entre líneas"'),
  ('sitio.subtitulo',         '"un blog hecho a mano"'),
  ('sitio.zona_horaria',      '"America/Mexico_City"'),
  ('blog.posts_por_pagina',   '10'),
  ('blog.comentarios_abiertos', 'true'),
  ('blog.moderar_comentarios',  'true'),
  ('libro_visitas.abierto',   'true');

-- ---------------------------------------------------------------------------
-- La ruleta y el lector de voz ya no viven aquí: todo lo de Twitch está en
-- su propia base (07_twitch.sql). Si ya habías ejecutado una versión
-- anterior de este script, esto quita la tabla vieja, que estaba vacía.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS ruleta_usuario;
