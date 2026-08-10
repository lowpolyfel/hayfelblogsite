# Entre líneas — plataforma de blog

Base frontend de un blog personal moderno, construida con React, TypeScript y Vite. El proyecto prioriza contenido, accesibilidad, rendimiento y crecimiento gradual sin acoplar la interfaz a un proveedor concreto.

## Inicio rápido

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Arquitectura

```text
src/
├── components/layout/   # Estructura global (cabecera y pie)
├── data/                # Datos locales sustituibles por CMS/API
├── domain/              # Tipos y reglas del negocio
├── features/            # Funciones aisladas (posts, newsletter, comentarios…)
├── pages/               # Composición de rutas/páginas
├── services/api/        # Cliente HTTP e integraciones externas
├── shared/config/       # Configuración central del sitio
├── shared/lib/          # Utilidades puras y reutilizables
└── styles/              # Tokens y estilos globales
```

La dependencia fluye desde páginas y funcionalidades hacia `domain` y `shared`; el dominio no conoce React ni proveedores externos. Cada integración futura debe vivir detrás de un adaptador en `services/api` (CMS, almacenamiento de imágenes, comentarios, analítica o redes), evitando importar SDK de terceros desde componentes visuales.

## Variables de entorno

Solo las variables prefijadas con `VITE_` llegan al navegador; **nunca** guardes secretos en ellas. Las claves privadas y la moderación de comentarios deben residir en un backend o función serverless.

## Próximos módulos recomendados

1. Enrutado y páginas de artículo por `slug`.
2. CMS headless con contenido Markdown/MDX y borradores.
3. Carga de imágenes con transformación, tamaños responsivos y CDN.
4. Comentarios con autenticación, rate limiting y moderación.
5. Newsletter con doble confirmación y política de privacidad.
6. Metadatos SEO, sitemap, RSS, Open Graph y datos estructurados.
7. Pruebas unitarias, de accesibilidad y end-to-end en CI.

## Comandos

- `npm run dev`: servidor local.
- `npm run build`: comprobación de tipos y compilación de producción.
- `npm run lint`: análisis estático.
- `npm run preview`: previsualización del build.
