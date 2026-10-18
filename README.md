# Webbys · Panel de administración

Primera etapa de una PWA frontend para la barbería Webbys. Incluye una entrada de demostración, acceso simulado, navegación adaptable y un dashboard alimentado por datos sintéticos.

## Requisitos

- Node.js 20 o posterior
- npm

## Desarrollo

```sh
npm install
npm run dev
```

Abre `http://localhost:4321/` y selecciona **Ver demostración**. También puedes visitar `/login/` directamente y usar **Entrar en modo demo**. El panel estará disponible en `/admin/` mientras exista la sesión local de demostración.

## Validación

```sh
npm test
npm run check
npm run build
```

## Publicación

El repositorio publica el sitio en GitHub Pages mediante `.github/workflows/deploy.yml` al actualizar `main`. La aplicación se sirve desde `https://phyton06.github.io/webbys/` y utiliza el icono incluido en `public/icons/`.

La invitación de instalación ejecuta el diálogo nativo cuando el navegador lo ofrece después de una acción del usuario. En iPhone/iPad muestra los pasos de Safari; no es posible abrir el diálogo automáticamente al cargar la página.

## Límites de la demostración

El acceso, los datos y las interacciones son locales y simulados. No se envían credenciales, no hay backend ni base de datos y no se realizan operaciones comerciales reales. Los montos y registros que se muestran son de demostración.

La sesión guardada en el navegador solo simula la navegación y **no es un control de acceso**. No uses esta puerta de cliente para proteger información privada.

El manifest y los iconos permiten probar la instalación en navegadores compatibles. Esta etapa no incluye service worker ni soporte sin conexión; la instalación y sus requisitos dependen del navegador y del contexto de publicación.
