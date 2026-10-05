// Fuente única de qué módulos ve cada rol. Solo afecta a la interfaz; el backend es quien protege.
export const MENU_POR_ROL = {
  ADMIN: ['dashboard', 'atletas', 'administracion'],
  ENTRENADOR: ['dashboard', 'atletas'],
  ATLETA: ['dashboard', 'planificacion', 'historial', 'perfil'],
}

export function puedeAccederAModulo(rol, moduleId) {
  return (MENU_POR_ROL[rol] || []).includes(moduleId)
}
