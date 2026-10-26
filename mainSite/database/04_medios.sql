-- ============================================================================
-- MEDIOS · el catálogo de imágenes y archivos (sin los bytes)
--
-- Base sugerida en hPanel: u000000000_medios
-- Se ejecuta en phpMyAdmin con esta base seleccionada (pestaña SQL).
-- Se puede ejecutar varias veces sin romper nada.
--
-- Aquí va lo que se consulta: nombre, tamaño, medidas, álbum, texto
-- alternativo. Los bytes van en las bases de datos medios_datos_NN
-- (05_medios_datos.sql). Así este catálogo pesa poco y es rápido, y
-- cuando una base de datos llena sus 3 GB se crea la siguiente y ya.
-- ============================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Las bases de datos donde viven los bytes. La aplicación escribe siempre
-- en la activa; cuando bytes_usados se acerca a limite_bytes, se crea la
-- base siguiente, se añade aquí y se marca como activa.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS almacen (
  numero        TINYINT UNSIGNED NOT NULL,
  nombre_bd     VARCHAR(64)      NOT NULL,   -- p. ej. u000000000_medios_01
  bytes_usados  BIGINT UNSIGNED  NOT NULL DEFAULT 0,
  -- 2.8 GB: margen respecto a los 3 GB por índices y fragmentación
  limite_bytes  BIGINT UNSIGNED  NOT NULL DEFAULT 3006477107,
  activo        TINYINT(1)       NOT NULL DEFAULT 0,
  creado_en     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (numero),
  UNIQUE KEY uq_almacen_bd (nombre_bd)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cambia el nombre por el real (con el prefijo que te ponga Hostinger)
INSERT IGNORE INTO almacen (numero, nombre_bd, activo) VALUES (1, 'u000000000_medios_01', 1);

CREATE TABLE IF NOT EXISTS album (
  id                INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  slug              VARCHAR(120)    NOT NULL,
  titulo            VARCHAR(200)    NOT NULL,
  descripcion       TEXT            NULL,
  portada_medio_id  BIGINT UNSIGNED NULL,
  publico           TINYINT(1)      NOT NULL DEFAULT 0,
  orden             SMALLINT        NOT NULL DEFAULT 0,
  creado_en         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_album_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Un archivo subido. sha256 evita guardar dos veces la misma imagen: si ya
-- existe, se reutiliza el renglón en vez de duplicar los bytes.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medio (
  id               BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  almacen          TINYINT UNSIGNED NOT NULL,
  sha256           BINARY(32)       NOT NULL,
  nombre_original  VARCHAR(255)     NOT NULL,
  tipo_mime        VARCHAR(100)     NOT NULL,
  bytes            INT UNSIGNED     NOT NULL,
  ancho            SMALLINT UNSIGNED NULL,
  alto             SMALLINT UNSIGNED NULL,
  titulo           VARCHAR(200)     NULL,
  texto_alt        VARCHAR(300)     NULL,
  descripcion      TEXT             NULL,
  album_id         INT UNSIGNED     NULL,
  publico          TINYINT(1)       NOT NULL DEFAULT 1,
  creado_en        DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_medio_sha256 (sha256),
  KEY ix_medio_album (album_id, creado_en),
  KEY ix_medio_fecha (creado_en),
  CONSTRAINT fk_medio_almacen FOREIGN KEY (almacen) REFERENCES almacen (numero),
  CONSTRAINT fk_medio_album FOREIGN KEY (album_id) REFERENCES album (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Versiones reducidas que genera el servidor al subir: la portada del blog
-- no tiene por qué descargar la foto de 6 MB del celular.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medio_variante (
  id         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  medio_id   BIGINT UNSIGNED  NOT NULL,
  variante   ENUM('miniatura','mediana','grande') NOT NULL,
  almacen    TINYINT UNSIGNED NOT NULL,
  tipo_mime  VARCHAR(100)     NOT NULL,
  bytes      INT UNSIGNED     NOT NULL,
  ancho      SMALLINT UNSIGNED NOT NULL,
  alto       SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_variante (medio_id, variante),
  CONSTRAINT fk_variante_medio FOREIGN KEY (medio_id) REFERENCES medio (id) ON DELETE CASCADE,
  CONSTRAINT fk_variante_almacen FOREIGN KEY (almacen) REFERENCES almacen (numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
