# CU 04 - Administración V2 (Entrenadores y Atletas)

## Objetivo
Consolidar el módulo de Administración en dos únicos casos de uso visibles:
- Entrenadores
- Atletas

Se elimina el apartado de Usuarios como bloque de negocio en UI.

## Alcance funcional

### 1. Entrenadores
- Crear entrenador con campos obligatorios:
  - nombre
  - correo
  - password inicial
- Editar datos del entrenador:
  - nombre
  - correo
- Resetear contraseña temporal del entrenador desde su bloque de edición.

### 2. Atletas
- Listar atletas y distinguir pendientes (sin entrenador asignado).
- Autoasignar atleta pendiente a un entrenador.
- Reasignar atleta entre entrenadores.
- Editar datos base del atleta:
  - nombre
  - sexo (M, F, OTRO)
  - peso
- Resetear contraseña temporal del atleta desde su bloque de edición.

## Decisiones de arquitectura
- Se mantiene separación por capas en backend:
  - routes: contrato HTTP
  - controllers: adaptación HTTP
  - services: reglas de negocio y acceso a datos
- En frontend se mantiene separación:
  - page: estado y orquestación de UI
  - services/api: cliente HTTP por caso de uso
- Seguridad:
  - Las contraseñas se persisten únicamente como hash en backend.
  - Frontend nunca recibe password_hash.

## Cambios backend

### Nuevas capacidades
- Edición de atleta desde administración.
- Reset de contraseña temporal por atleta (resuelto por su usuario vinculado).

### Endpoints activos del módulo administración
- GET /api/administracion/atletas
- POST /api/administracion/atletas/:atletaId/autoasignacion
- POST /api/administracion/atletas/:atletaId/reasignacion
- PUT /api/administracion/atletas/:atletaId
- POST /api/administracion/atletas/:atletaId/reset-password

### Nota sobre Usuarios
- El endpoint de usuarios de administración deja de formar parte del contrato expuesto por rutas de administración en esta versión.
- El dominio usuario sigue existiendo internamente como base de autenticación/perfiles.

## Cambios frontend
- La pantalla de Administración renderiza solo dos tarjetas:
  - Entrenadores
  - Atletas
- Se elimina la tarjeta Usuarios.
- Se añaden formularios de edición y reset contextual por entidad.

## Cambios de datos
- No se introducen nuevos campos en BBDD para entrenadores en esta versión.
  - Ajuste de esquema base: bbdd/schema_v1.sql

## Archivos principales modificados
- backend/src/services/crud/entrenadoresService.js
- backend/src/services/negocio/administracionService.js
- backend/src/controllers/negocio/administracionController.js
- backend/src/routes/negocio/administracionRoute.js
- frontend/src/services/administracionApi.js
- frontend/src/page/administracion.jsx
- bbdd/schema_v1.sql

## Riesgos y consideraciones
- Validar consistencia de datos históricos de entrenadores en los entornos donde se despliegue el módulo.

## Próximas mejoras sugeridas
- Añadir validación de fortaleza de contraseña temporal.
- Añadir auditoría (quién reseteó contraseña, cuándo y a quién).
- Incorporar búsqueda/paginación en listados de administración.
