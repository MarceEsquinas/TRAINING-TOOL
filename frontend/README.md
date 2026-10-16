# Frontend de Training Tool

Aplicación en React hecha con Vite. Para instalar todo el proyecto, mira el [README principal](../README.md).

## Comandos

```bash
npm install     # instalar dependencias
npm run dev     # arrancar en desarrollo
npm run build   # generar la versión final
npm run lint    # revisar el código
```

## Carpetas (dentro de `src/`)

| Carpeta | Contenido |
|---|---|
| `page/` | Pantallas: login, registro, dashboard, atletas, planificación, historial, feedback, administración y perfil |
| `components/layout/` | Cabecera, menú lateral y campana de notificaciones |
| `layouts/` | Estructura general de la aplicación |
| `services/` | Llamadas a la API (una por pantalla) |
| `utils/` | Funciones de ayuda: formato de fechas y permisos por rol |

## Cosas a tener en cuenta

- La dirección de la API sale de `VITE_API_BASE_URL` (o `VITE_API_URL`). Si no existe, usa `http://localhost:3000`.
- No se usa React Router: `App.jsx` decide qué pantalla mostrar.
- Tras el login, el usuario y el token se guardan en el `localStorage` con la clave `tt_auth_user`.
- Las llamadas a la API pasan por `fetchWithAuth` (en `services/apiBaseUrl.js`), que añade el token.
- `utils/permisos.js` decide qué opciones del menú ve cada rol. Solo afecta a lo que se ve: quien protege los datos es el backend.
