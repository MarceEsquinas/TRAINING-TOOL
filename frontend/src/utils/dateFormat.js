export function formatDate(value) {
  if (!value) {
    return '-'
  }

  const raw = String(value)
  const ymdOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (ymdOnlyMatch) {
    const [, year, month, day] = ymdOnlyMatch
    // Para DATE puro de BD, mostramos el día literal sin conversiones horarias.
    return `${day}/${month}/${year}`
  }

  const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (ymdMatch) {
    // Si llega timestamp ISO (ej. ...T23:00:00.000Z), lo normalizamos a la zona de negocio.
    const parsedIsoDate = new Date(raw)
    if (!Number.isNaN(parsedIsoDate.getTime())) {
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Europe/Madrid',
      }).format(parsedIsoDate)
    }

    const [, year, month, day] = ymdMatch
    return `${day}/${month}/${year}`
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsedDate)
}
