# Training Tool

Aplicación web para que un entrenador gestione los entrenamientos de sus atletas amateurs sin depender de WhatsApp. Toda la información queda en un solo sitio.

## Cómo funciona

El trabajo del entrenador sigue siempre estos pasos:

1. Habla con el atleta y conoce su **objetivo** (por ejemplo, una media maratón).
2. Crea **semanas** de entrenamiento con sus **sesiones**.
3. El atleta registra lo que ha corrido y envía su **feedback** de la semana.
4. El entrenador lee el feedback y adapta la semana siguiente.
5. Al terminar el objetivo se registra la **marca** conseguida y el objetivo pasa al historial.

```
Objetivo
  └── Semana (7 días)
        ├── Sesiones
        └── Feedback semanal
```

Además, este proyecto me sirve para seguir aprendiendo desarrollo web, bases de datos y buenas prácticas.

## Roles

| Rol | Qué hace |
|---|---|
| **Administrador** | Crea entrenadores y asigna atletas a cada entrenador |
| **Entrenador** | Ve a sus atletas, crea objetivos, semanas y sesiones, y lee el feedback |
| **Atleta** | Se registra, consulta su plan, anota sus km, envía feedback y consulta su historial |

Detalle de permisos en [Login y permisos](docs/casos_de_uso/05_login_y_permisos.md).

## Tecnologías

- **Backend:** Node.js y Express
- **Frontend:** React (con Vite)
- **Base de datos:** PostgreSQL
- **Control de versiones:** Git y GitHub

## Estructura del proyecto

```
backend/    Servidor (API)
  src/routes        Direcciones de la API
  src/controllers   Reciben la petición y devuelven la respuesta
  src/services      Reglas del negocio y consultas a la base de datos
  src/middleware    Comprobación del token y del rol
frontend/   Aplicación en React
  src/page          Pantallas
  src/services      Llamadas a la API
bbdd/       Esquema de la base de datos, migraciones y consultas de ejemplo
docs/       Documentación
```

En el backend, `crud/` tiene las operaciones básicas sobre cada tabla y `negocio/` tiene lo que usa cada pantalla.

## Documentación

| Documento | Contenido |
|---|---|
| [Casos de uso](docs/casos_de_uso/) | Qué hace cada pantalla y sus reglas |
| [API](docs/api.md) | Lista de endpoints y permisos |
| [Base de datos](bbdd/DB_DESIGN_V1.md) | Tablas y relaciones |

Casos de uso:
1. [Dashboard](docs/casos_de_uso/01_dashboard.md)
2. [Planificación](docs/casos_de_uso/02_planificacion.md)
3. [Historial](docs/casos_de_uso/03_historial.md)
4. [Administración](docs/casos_de_uso/04_administracion.md)
5. [Login, registro y permisos](docs/casos_de_uso/05_login_y_permisos.md)
6. [Objetivos](docs/casos_de_uso/06_objetivos.md)

## Instalación

### Requisitos
- Node.js
- PostgreSQL 12 o superior
- npm

### 1. Crear la base de datos

```bash
psql -U postgres
CREATE DATABASE training_tool;
\c training_tool
\i bbdd/schema_v1.sql
```

`schema_v1.sql` crea todas las tablas. Las migraciones de `bbdd/migrations/` sirven para actualizar una base de datos antigua, no hacen falta en una nueva.

**Primer administrador:** se crea a mano en PostgreSQL, antes de arrancar la aplicación. Los demás usuarios se crean desde la aplicación. La contraseña se guarda como hash SHA-256, así que hay que insertarla ya convertida:

```sql
INSERT INTO usuario (username, email, password_hash, rol)
VALUES ('admin', 'admin@ejemplo.com', encode(sha256('tu_contraseña'::bytea), 'hex'), 'ADMIN');
```

Al final de `schema_v1.sql` hay datos de ejemplo comentados, pero sus contraseñas (`$2b$12$...`) son de relleno y no sirven para entrar.

### 2. Configurar el backend

Crea el archivo `backend/.env` con estas variables:

```env
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=training_tool
PG_USER=tu_usuario_postgres
PG_PASSWORD=tu_contraseña
JWT_SECRET=un_texto_largo_y_secreto
```

El archivo `.env` está en `.gitignore`, así que no se sube a GitHub.

### 3. Arrancar el backend

```bash
cd backend
npm install
npm run dev
```

El servidor queda en `http://localhost:3000`.

### 4. Arrancar el frontend

```bash
cd frontend
npm install
npm run dev
```

Vite muestra en la terminal la dirección donde abrir la aplicación. Por defecto el frontend llama a `http://localhost:3000`. Para usar otra dirección, define `VITE_API_BASE_URL` en `frontend/.env`.
