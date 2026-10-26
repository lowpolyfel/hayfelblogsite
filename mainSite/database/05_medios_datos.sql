-- ============================================================================
-- MEDIOS · DATOS · los bytes de las imágenes
--
-- Bases sugeridas en hPanel: u000000000_medios_01, u000000000_medios_02, ...
-- Es una plantilla: se ejecuta igual en cada base de bytes nueva, con esa
-- base seleccionada en phpMyAdmin. Después se da de alta en la tabla
-- almacen de la base medios.
-- Se puede ejecutar varias veces sin romper nada.
-- ============================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Cada archivo se parte en trozos de hasta 1 MB. Dos razones:
--   * El hosting limita el tamaño de cada consulta (max_allowed_packet).
--     Con trozos, una foto de 20 MB entra igual.
--   * El servidor puede ir mandando la imagen al navegador trozo a trozo
--     sin cargarla entera en memoria.
--
-- propietario dice de qué tabla de la base medios viene el id:
-- 'medio' → medio.id (el original) · 'variante' → medio_variante.id
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trozo (
  propietario     ENUM('medio','variante') NOT NULL,
  propietario_id  BIGINT UNSIGNED   NOT NULL,
  n               SMALLINT UNSIGNED NOT NULL,   -- 0, 1, 2... en orden
  contenido       MEDIUMBLOB        NOT NULL,
  PRIMARY KEY (propietario, propietario_id, n)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  ROW_FORMAT=DYNAMIC;
