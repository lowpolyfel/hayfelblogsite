-- ============================================================================
-- BLOG · posts, categorías, etiquetas, comentarios, páginas, blogroll y
-- libro de visitas
--
-- Base sugerida en hPanel: u000000000_blog
-- Se ejecuta en phpMyAdmin con esta base seleccionada (pestaña SQL).
-- Se puede ejecutar varias veces sin romper nada.
--
-- Las columnas *_medio_id apuntan a medios.medio. Como está en otra base,
-- no llevan FOREIGN KEY: la aplicación comprueba que existan.
-- ============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS categoria (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(80)  NOT NULL,
  nombre       VARCHAR(80)  NOT NULL,
  descripcion  VARCHAR(255) NULL,
  orden        SMALLINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categoria_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO categoria (slug, nombre, orden) VALUES ('general', 'General', 0);

CREATE TABLE IF NOT EXISTS etiqueta (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug    VARCHAR(80)  NOT NULL,
  nombre  VARCHAR(80)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_etiqueta_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- La entrada. "programado" + publicado_en en el futuro = sale sola a esa
-- hora. animo y escuchando son el clásico "Mood: / Now playing:" de los
-- blogs de los 2000.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug                 VARCHAR(190)    NOT NULL,
  titulo               VARCHAR(255)    NOT NULL,
  extracto             TEXT            NULL,
  contenido            MEDIUMTEXT      NOT NULL,   -- hasta 16 MB de texto
  formato              ENUM('markdown','html','bbcode') NOT NULL DEFAULT 'markdown',
  estado               ENUM('borrador','programado','publicado','privado','papelera') NOT NULL DEFAULT 'borrador',
  categoria_id         INT UNSIGNED    NULL,
  portada_medio_id     BIGINT UNSIGNED NULL,
  animo                VARCHAR(60)     NULL,
  escuchando           VARCHAR(150)    NULL,
  permite_comentarios  TINYINT(1)      NOT NULL DEFAULT 1,
  fijado               TINYINT(1)      NOT NULL DEFAULT 0,
  visitas              INT UNSIGNED    NOT NULL DEFAULT 0,
  publicado_en         DATETIME        NULL,
  creado_en            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_post_slug (slug),
  -- La portada y el archivo por mes piden siempre "publicados, más nuevos primero"
  KEY ix_post_estado_fecha (estado, publicado_en),
  KEY ix_post_categoria (categoria_id),
  FULLTEXT KEY ft_post_busqueda (titulo, contenido),
  CONSTRAINT fk_post_categoria FOREIGN KEY (categoria_id)
    REFERENCES categoria (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_etiqueta (
  post_id      BIGINT UNSIGNED NOT NULL,
  etiqueta_id  INT UNSIGNED    NOT NULL,
  PRIMARY KEY (post_id, etiqueta_id),
  KEY ix_post_etiqueta_etiqueta (etiqueta_id),
  CONSTRAINT fk_pe_post FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE,
  CONSTRAINT fk_pe_etiqueta FOREIGN KEY (etiqueta_id) REFERENCES etiqueta (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Galería de un post: qué imágenes lleva y en qué orden
CREATE TABLE IF NOT EXISTS post_medio (
  post_id   BIGINT UNSIGNED NOT NULL,
  medio_id  BIGINT UNSIGNED NOT NULL,
  orden     SMALLINT        NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, medio_id),
  CONSTRAINT fk_pm_post FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Cada vez que guardas un post se archiva la versión anterior. Así nunca
-- se pierde un texto por un guardado equivocado.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_revision (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id    BIGINT UNSIGNED NOT NULL,
  titulo     VARCHAR(255)    NOT NULL,
  contenido  MEDIUMTEXT      NOT NULL,
  creado_en  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_revision_post (post_id, creado_en),
  CONSTRAINT fk_revision_post FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Comentarios de visitantes (sin cuenta, como antes). Entran como
-- "pendiente" hasta que los apruebes; es_mio marca tus respuestas.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comentario (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id    BIGINT UNSIGNED NOT NULL,
  padre_id   BIGINT UNSIGNED NULL,
  nombre     VARCHAR(80)     NOT NULL,
  correo     VARCHAR(190)    NULL,
  web        VARCHAR(255)    NULL,
  contenido  TEXT            NOT NULL,
  estado     ENUM('pendiente','aprobado','spam','papelera') NOT NULL DEFAULT 'pendiente',
  es_mio     TINYINT(1)      NOT NULL DEFAULT 0,
  ip         VARBINARY(16)   NULL,
  agente     VARCHAR(255)    NULL,
  creado_en  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_comentario_post (post_id, estado, creado_en),
  KEY ix_comentario_estado (estado, creado_en),
  CONSTRAINT fk_comentario_post FOREIGN KEY (post_id) REFERENCES post (id) ON DELETE CASCADE,
  CONSTRAINT fk_comentario_padre FOREIGN KEY (padre_id) REFERENCES comentario (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Páginas fijas: "Sobre mí", "Contacto", "FAQ"...
CREATE TABLE IF NOT EXISTS pagina (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug            VARCHAR(120) NOT NULL,
  titulo          VARCHAR(255) NOT NULL,
  contenido       MEDIUMTEXT   NOT NULL,
  formato         ENUM('markdown','html','bbcode') NOT NULL DEFAULT 'markdown',
  publicada       TINYINT(1)   NOT NULL DEFAULT 0,
  en_menu         TINYINT(1)   NOT NULL DEFAULT 0,
  orden           SMALLINT     NOT NULL DEFAULT 0,
  creado_en       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pagina_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Blogroll y botones de 88×31 de los amigos
CREATE TABLE IF NOT EXISTS enlace (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(120)    NOT NULL,
  url             VARCHAR(500)    NOT NULL,
  descripcion     VARCHAR(255)    NULL,
  grupo           VARCHAR(60)     NOT NULL DEFAULT 'amigos',
  boton_medio_id  BIGINT UNSIGNED NULL,
  visible         TINYINT(1)      NOT NULL DEFAULT 1,
  orden           SMALLINT        NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_enlace_grupo (grupo, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Libro de visitas. Igual que los comentarios, entra moderado; respuesta
-- es tu contestación debajo del mensaje.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS libro_visitas (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(80)     NOT NULL,
  web         VARCHAR(255)    NULL,
  mensaje     TEXT            NOT NULL,
  respuesta   TEXT            NULL,
  estado      ENUM('pendiente','aprobado','spam','papelera') NOT NULL DEFAULT 'pendiente',
  ip          VARBINARY(16)   NULL,
  creado_en   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_libro_estado (estado, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
