# 06 - Objetivos

## Para qué sirve

Un **objetivo** es la meta deportiva de un atleta (por ejemplo, "Media maratón en 1:45"). Todo el entrenamiento (semanas, sesiones y feedback) cuelga del objetivo activo.

## Datos de un objetivo

| Campo | Qué es |
|---|---|
| `atleta_id` | El atleta al que pertenece |
| `nombre` | Nombre del objetivo |
| `distancia_objetivo` | Distancia: `5K`, `10K`, `Media Maratón`, `Maratón`, `Trail`, `Ultra Trail` u otra escrita a mano |
| `fecha_objetivo` | Fecha de la prueba (obligatoria) |
| `activo` | `true` si es el objetivo actual |
| `marca_conseguida` | Tiempo final; está vacío mientras el objetivo sigue activo |

## Crear un objetivo

**Quién puede:**
- El **atleta**, solo para sí mismo.
- El **entrenador**, para los atletas que tiene asignados.
- El **administrador** no puede crear objetivos.

**Dónde:** en la pantalla **Atletas**, el entrenador expande un atleta y pulsa "Nuevo objetivo". El atleta aún no tiene pantalla para hacerlo, solo puede por la API.

**Reglas:**
1. El objetivo siempre se crea activo. No se puede elegir.
2. Un atleta no puede tener más de un objetivo activo a la vez. Si ya tiene uno, responde 409. La base de datos lo garantiza con un índice único.
3. Si es un atleta quien lo crea, el `atleta_id` se toma de su sesión. Si envía otro, se ignora.
4. Si es un entrenador, debe indicar `atleta_id` y ese atleta tiene que ser suyo (si no, 403).
5. Para elegir "otra distancia", se envía `"distancia_objetivo": "Otro"` y `"distancia_objetivo_manual": "15K"`.

**Ejemplo:** `POST /objetivos`

```json
{
  "atleta_id": 5,
  "nombre": "Media maratón de Sevilla",
  "distancia_objetivo": "Media Maratón",
  "fecha_objetivo": "2026-12-20"
}
```

## Finalizar un objetivo (registrar la marca)

**Quién puede:** el entrenador (solo con sus atletas) o el administrador.

**Cuándo:** el día del objetivo o después (faltan 0 días o menos).

**Qué pasa:** `PATCH /planificacion/:atletaId/objetivos/:objetivoId/marca`

```json
{ "marca_conseguida": "1:18:42" }
```

1. Se guarda la marca en el objetivo.
2. En la misma operación, el objetivo pasa a inactivo. Es una sola instrucción en la base de datos, así que no puede quedar la marca guardada con el objetivo aún activo.
3. El objetivo **no se borra**. Se conserva en el [Historial](03_historial.md).
4. Si el objetivo ya estaba finalizado, responde 409 y la marca anterior no se cambia.
5. La marca es obligatoria y puede tener hasta 120 caracteres.

Después de finalizar, el atleta queda sin objetivo activo y se puede crear uno nuevo.

## Qué no se puede hacer

- **Borrar** un objetivo: no existe esa opción, para no perder el historial.
- **Editar** `activo`, `atleta_id` o `marca_conseguida` con `PUT /objetivos/:id`: devuelve 400. Esos datos solo cambian al crear o al finalizar.
