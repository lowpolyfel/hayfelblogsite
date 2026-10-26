-- ============================================================================
-- AGENDA · calendarios, eventos (con repetición), tareas, recordatorios y
-- notas
--
-- Base sugerida en hPanel: u000000000_agenda
-- Se ejecuta en phpMyAdmin con esta base seleccionada (pestaña SQL).
-- Se puede ejecutar varias veces sin romper nada.
--
-- Las fechas se guardan en UTC. La zona horaria de cada evento se guarda
-- aparte para mostrarlo bien y para que un evento semanal no se mueva una
-- hora con los cambios de horario.
-- ============================================================================

SET NAMES utf8mb4;

-- Varios calendarios para separar y colorear: "Streams", "Escuela", "Personal"
CREATE TABLE IF NOT EXISTS calendario (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre   VARCHAR(80)  NOT NULL,
  color    CHAR(7)      NOT NULL DEFAULT '#7c5cff',
  -- Público = sus eventos públicos aparecen en el horario del blog
  publico  TINYINT(1)   NOT NULL DEFAULT 0,
  orden    SMALLINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO calendario (nombre, color, publico, orden)
SELECT * FROM (
  SELECT 'Personal' AS nombre, '#7c5cff' AS color, 0 AS publico, 0 AS orden UNION ALL
  SELECT 'Streams',  '#9146ff', 1, 1
) AS semilla
WHERE NOT EXISTS (SELECT 1 FROM calendario);

-- ---------------------------------------------------------------------------
-- Un evento. Si se repite, regla_repeticion lleva una RRULE estándar
-- (la de Google Calendar / iCal), p. ej. 'FREQ=WEEKLY;BYDAY=MO,WE,FR'.
-- Así se puede exportar a .ics sin traducir nada.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evento (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  calendario_id     INT UNSIGNED    NOT NULL,
  titulo            VARCHAR(200)    NOT NULL,
  descripcion       TEXT            NULL,
  lugar             VARCHAR(255)    NULL,
  url               VARCHAR(500)    NULL,
  inicia_en         DATETIME        NOT NULL,
  termina_en        DATETIME        NOT NULL,
  todo_el_dia       TINYINT(1)      NOT NULL DEFAULT 0,
  zona_horaria      VARCHAR(64)     NOT NULL DEFAULT 'America/Mexico_City',
  regla_repeticion  VARCHAR(255)    NULL,
  repetir_hasta     DATETIME        NULL,
  estado            ENUM('confirmado','tentativo','cancelado') NOT NULL DEFAULT 'confirmado',
  -- Aunque el calendario sea público, un evento puede quedarse privado
  publico           TINYINT(1)      NOT NULL DEFAULT 0,
  -- Post del blog relacionado (blog.post, otra base: sin FOREIGN KEY)
  post_id           BIGINT UNSIGNED NULL,
  creado_en         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_evento_rango (inicia_en, termina_en),
  KEY ix_evento_calendario (calendario_id, inicia_en),
  CONSTRAINT ck_evento_fechas CHECK (termina_en >= inicia_en),
  CONSTRAINT fk_evento_calendario FOREIGN KEY (calendario_id)
    REFERENCES calendario (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Cambios a UNA ocurrencia de un evento que se repite: "este lunes no hay
-- stream" o "este miércoles empieza una hora más tarde".
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evento_excepcion (
  evento_id        BIGINT UNSIGNED NOT NULL,
  ocurrencia_en    DATETIME        NOT NULL,   -- inicio original de esa ocurrencia
  cancelada        TINYINT(1)      NOT NULL DEFAULT 0,
  nuevo_inicio     DATETIME        NULL,
  nuevo_fin        DATETIME        NULL,
  nuevo_titulo     VARCHAR(200)    NULL,
  PRIMARY KEY (evento_id, ocurrencia_en),
  CONSTRAINT fk_excepcion_evento FOREIGN KEY (evento_id)
    REFERENCES evento (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lista_tareas (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre  VARCHAR(80)  NOT NULL,
  color   CHAR(7)      NOT NULL DEFAULT '#3fb950',
  orden   SMALLINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO lista_tareas (nombre)
SELECT 'Pendientes' WHERE NOT EXISTS (SELECT 1 FROM lista_tareas);

-- Tareas con subtareas (padre_id) y fecha límite opcional
CREATE TABLE IF NOT EXISTS tarea (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lista_id        INT UNSIGNED    NOT NULL,
  padre_id        BIGINT UNSIGNED NULL,
  titulo          VARCHAR(255)    NOT NULL,
  notas           TEXT            NULL,
  prioridad       TINYINT UNSIGNED NOT NULL DEFAULT 0,   -- 0 normal · 1 alta · 2 urgente
  vence_en        DATETIME        NULL,
  completada_en   DATETIME        NULL,
  orden           INT             NOT NULL DEFAULT 0,
  creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_tarea_lista (lista_id, completada_en, orden),
  KEY ix_tarea_vence (vence_en),
  CONSTRAINT fk_tarea_lista FOREIGN KEY (lista_id) REFERENCES lista_tareas (id) ON DELETE CASCADE,
  CONSTRAINT fk_tarea_padre FOREIGN KEY (padre_id) REFERENCES tarea (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Avisos. Van colgados de un evento o de una tarea (uno de los dos).
-- enviado_en se llena cuando sale, para no avisar dos veces.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recordatorio (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  evento_id   BIGINT UNSIGNED NULL,
  tarea_id    BIGINT UNSIGNED NULL,
  avisar_en   DATETIME        NOT NULL,
  canal       ENUM('correo','navegador') NOT NULL DEFAULT 'correo',
  enviado_en  DATETIME        NULL,
  PRIMARY KEY (id),
  KEY ix_recordatorio_pendiente (enviado_en, avisar_en),
  CONSTRAINT ck_recordatorio_dueno CHECK ((evento_id IS NULL) <> (tarea_id IS NULL)),
  CONSTRAINT fk_recordatorio_evento FOREIGN KEY (evento_id) REFERENCES evento (id) ON DELETE CASCADE,
  CONSTRAINT fk_recordatorio_tarea FOREIGN KEY (tarea_id) REFERENCES tarea (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Libreta: ideas, borradores sueltos, cosas que no son post ni tarea
CREATE TABLE IF NOT EXISTS nota (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  titulo          VARCHAR(255)    NULL,
  contenido       MEDIUMTEXT      NOT NULL,
  fijada          TINYINT(1)      NOT NULL DEFAULT 0,
  archivada       TINYINT(1)      NOT NULL DEFAULT 0,
  creado_en       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_nota_orden (archivada, fijada, actualizado_en),
  FULLTEXT KEY ft_nota_busqueda (titulo, contenido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
