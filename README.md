# Nataly Suárez — Portafolio

Sitio de una sola página (`index.html`), sin build ni dependencias — HTML + CSS + JS vainilla.

## Desarrollo local

Abre `index.html` directamente en el navegador, o sirve la carpeta con cualquier servidor estático:

```
npx serve .
```

## Estructura

```
index.html       — el sitio completo
images/          — fotografía (hero, acerca, muestras de trabajo)
```

## Deploy

Conectado como sitio estático en Vercel o Netlify: no requiere comando de build ni carpeta de salida — la raíz del repo se sirve tal cual.

## Gestor de Proyectos (`gestor-proyectos/`)

App web aparte, sin backend: `index.html`, `styles.css`, `app.js`. Los datos se guardan en `localStorage` del navegador (un solo usuario, un solo dispositivo). Acceso: usuario `Naty`, contraseña `noviembre2026` (definidos en `app.js`). La exportación a Excel usa SheetJS desde su CDN, así que necesita internet.

- **Abrir en local:** doble clic en `gestor-proyectos/index.html`, o `npx serve gestor-proyectos`.
- **Netlify:** arrastra la carpeta `gestor-proyectos` a https://app.netlify.com/drop, o conecta el repo con *Base directory* = `gestor-proyectos`, sin comando de build y *Publish directory* = `gestor-proyectos`.
