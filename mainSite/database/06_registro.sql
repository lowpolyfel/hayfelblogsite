-- ============================================================================
-- REGISTRO · contador de visitas, errores y bitácora de lo que haces en el
-- panel
--
-- Base sugerida en hPanel: u000000000_registro
-- Se ejecuta en phpMyAdmin con esta base seleccionada (pestaña SQL).
-- Se puede ejecutar varias veces sin romper nada.
--
-- Aparte del resto porque es lo único que crece solo, renglón por visita.
-- Si algún día se llena, se vacía sin tocar posts ni agenda.
-- ============================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- Una visita. La IP no se guarda: solo un hash con sal diaria, que basta
-- para contar visitantes únicos del día y no identifica a nadie.
-- Se puede borrar lo de más de 90 días; el resumen diario queda abajo.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visita (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ruta       VARCHAR(255)    NOT NULL,
  referente  VARCHAR(500)    NULL,
  visitante  BINARY(32)      NOT NULL,
  agente     VARCHAR(255)    NULL,
  creado_en  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_visita_fecha (creado_en),
  KEY ix_visita_ruta (ruta(100), creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- El contador de toda la vida ("eres el visitante nº 001337"), por día y página
CREATE TABLE IF NOT EXISTS contador_diario (
  fecha    DATE         NOT NULL,
  ruta     VARCHAR(255) NOT NULL,
  visitas  INT UNSIGNED NOT NULL DEFAULT 0,
  unicos   INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (fecha, ruta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Errores del servidor, para verlos desde el panel sin entrar al hosting
CREATE TABLE IF NOT EXISTS error_app (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nivel      ENUM('aviso','error','fatal') NOT NULL DEFAULT 'error',
  mensaje    VARCHAR(1000)   NOT NULL,
  contexto   JSON            NULL,
  creado_en  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_error_fecha (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Bitácora del panel: inicios de sesión, posts publicados o borrados,
-- archivos subidos... Si algo cambia y no fuiste tú, aquí se ve.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  accion      VARCHAR(60)     NOT NULL,   -- 'login', 'post.publicar', 'medio.borrar'...
  entidad     VARCHAR(40)     NULL,
  entidad_id  VARCHAR(64)     NULL,
  detalle     JSON            NULL,
  ip          VARBINARY(16)   NULL,
  creado_en   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_auditoria_fecha (creado_en),
  KEY ix_auditoria_entidad (entidad, entidad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
