# Hayfel Space

La página principal conserva la identidad visual e interacciones de **Hayfel Space v5**, pero separa sus responsabilidades para que el blog pueda crecer sin volver a un componente monolítico.

## Estructura

- `HayfelSpacePage.jsx`: composición de la portada y estado de la experiencia.
- `components/`: primitivas visuales reutilizables (`Window`, `Slab`, sprite y decoraciones).
- `data/`: contenido editorial y datos decorativos. Puede sustituirse por un CMS o una API sin cambiar los componentes visuales.
- `lib/patterns.js`: generación de fondos SVG sin recursos externos.
- `hayfel-space.css`: sistema visual completo y responsive de v5.

Los módulos existentes de `domain`, `features`, `services` y `shared` siguen disponibles como base para incorporar persistencia, carga de imágenes, comentarios y páginas individuales de entradas.
