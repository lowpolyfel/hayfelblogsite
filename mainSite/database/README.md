# Bases de datos (MySQL / MariaDB en Hostinger)

Siete bases de datos, cada una para una cosa. Así ninguna se acerca al límite
de 3 GB, y si una se llena o se rompe, las demás siguen funcionando.

| # | Base de datos (sugerida) | Script | Qué guarda |
|---|---|---|---|
| 1 | `u…_nucleo` | `01_nucleo.sql` | Tu cuenta, sesiones, intentos de login, ajustes del sitio |
| 2 | `u…_blog` | `02_blog.sql` | Posts, revisiones, categorías, etiquetas, comentarios, páginas, blogroll, libro de visitas |
| 3 | `u…_agenda` | `03_agenda.sql` | Calendarios, eventos (con repetición), tareas, recordatorios, notas |
| 4 | `u…_medios` | `04_medios.sql` | Catálogo de imágenes: nombre, medidas, álbum, texto alternativo (sin los bytes) |
| 5 | `u…_medios_01` | `05_medios_datos.sql` | Los bytes de las imágenes. Cuando se llene: `u…_medios_02` con el mismo script |
| 6 | `u…_registro` | `06_registro.sql` | Contador de visitas, errores del servidor, bitácora del panel |
| 7 | `u…_twitch` | `07_twitch.sql` | Tu canal conectado, widgets de OBS, alertas, recompensas de puntos (ruleta, voz, sonidos), historial de eventos, metas, comandos de chat, directos |

`u…` es el prefijo que Hostinger le pone a todo (algo como `u123456789_`).

## Cómo crearlas

1. **hPanel → Bases de datos → Administración.** Crea las 7 bases. A cada
   una ponle un usuario y una contraseña, y apúntalos: el servidor los va a
   necesitar.
2. Abre **phpMyAdmin** en la primera, ve a la pestaña **SQL**, pega el
   script que le toca y pulsa **Continuar**. Repite con las demás.
3. En `u…_medios`, cambia el nombre en la tabla `almacen` por el nombre real
   de tu base de bytes:

   ```sql
   UPDATE almacen SET nombre_bd = 'u123456789_medios_01' WHERE numero = 1;
   ```

Todos los scripts se pueden volver a ejecutar sin romper nada.

## Cosas que conviene saber

- **No hay `FOREIGN KEY` entre bases distintas.** MySQL no las permite.
  Columnas como `post.portada_medio_id` o `evento.post_id` apuntan a otra
  base de datos, y es el servidor el que comprueba que el renglón exista.
  Dentro de una misma base, las relaciones sí están protegidas (borrar un
  post borra sus comentarios y etiquetas).
- **Las imágenes van en trozos de 1 MB** (`trozo`). Así no chocan con el
  límite de tamaño por consulta del hosting, y el servidor puede ir
  mandando la imagen al navegador poco a poco.
- **Las fechas se guardan en UTC.** La zona horaria (`America/Mexico_City`
  por defecto) se aplica al mostrarlas.
- **Las contraseñas no se guardan, solo su hash.** El usuario no se crea en
  SQL: lo crea el servidor la primera vez, con la contraseña que le des.
- Probado en MariaDB 11.4 y MySQL 8.4.
