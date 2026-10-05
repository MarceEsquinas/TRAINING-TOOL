import { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

const DIAS_VALIDOS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const SEXOS_VALIDOS = ['M', 'F', 'OTRO'];

// Regla de negocio: el atleta solo edita estos datos personales; username, email, rol y entrenador no.
export async function getPerfilAtletaData(atletaId) {
  const result = await query(
    `SELECT a.id, a.nombre, a.sexo, a.peso, a.dias_disponibles, a.km_medios_ultimos_2_meses,
            a.lesiones_ultimo_anio, u.username, u.email, e.nombre AS entrenador_nombre
     FROM atleta a
     INNER JOIN usuario u ON u.id = a.usuario_id
     LEFT JOIN entrenadores e ON e.id = a.entrenador_id
     WHERE a.id = $1`,
    [atletaId]
  );

  if (result.rows.length === 0) {
    throw new ServiceError(404, 'No se encontró tu perfil de atleta');
  }

  return result.rows[0];
}

function numeroEnRango(value, fieldName, { min, max, minExclusive = false }) {
  const numero = Number(value);
  if (value === '' || value === null || !Number.isFinite(numero)
    || (minExclusive ? numero <= min : numero < min) || numero > max) {
    throw new ServiceError(400, `El campo ${fieldName} no es válido`);
  }
  return numero;
}

export async function updatePerfilAtletaData(atletaId, payload = {}) {
  const fields = [];
  const params = [];
  const set = (column, value) => {
    params.push(value);
    fields.push(`${column} = $${params.length}`);
  };

  if (payload.nombre !== undefined) {
    const nombre = String(payload.nombre).trim();
    if (!nombre || nombre.length > 100) {
      throw new ServiceError(400, 'El nombre es obligatorio y no puede superar 100 caracteres');
    }
    set('nombre', nombre);
  }

  if (payload.sexo !== undefined) {
    if (!SEXOS_VALIDOS.includes(payload.sexo)) {
      throw new ServiceError(400, 'El sexo no es válido');
    }
    set('sexo', payload.sexo);
  }

  if (payload.peso !== undefined) {
    set('peso', numeroEnRango(payload.peso, 'peso', { min: 0, max: 999.99, minExclusive: true }));
  }

  if (payload.km_medios_ultimos_2_meses !== undefined) {
    set('km_medios_ultimos_2_meses', numeroEnRango(payload.km_medios_ultimos_2_meses, 'km_medios_ultimos_2_meses', { min: 0, max: 999.99 }));
  }

  if (payload.dias_disponibles !== undefined) {
    const dias = payload.dias_disponibles;
    if (!Array.isArray(dias) || dias.length === 0
      || dias.some((dia) => !DIAS_VALIDOS.includes(dia)) || new Set(dias).size !== dias.length) {
      throw new ServiceError(400, 'Selecciona días disponibles válidos');
    }
    set('dias_disponibles', JSON.stringify(dias));
  }

  if (payload.lesiones_ultimo_anio !== undefined) {
    const lesiones = payload.lesiones_ultimo_anio;
    if (!Array.isArray(lesiones) || lesiones.some((lesion) => (
      !lesion || typeof lesion !== 'object' || !String(lesion.tipo ?? '').trim()
    ))) {
      throw new ServiceError(400, 'Indica las lesiones del último año correctamente');
    }
    set('lesiones_ultimo_anio', JSON.stringify(lesiones));
  }

  if (fields.length === 0) {
    throw new ServiceError(400, 'No hay campos para actualizar');
  }

  params.push(atletaId);
  await query(
    `UPDATE atleta SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length}`,
    params
  );

  return getPerfilAtletaData(atletaId);
}
