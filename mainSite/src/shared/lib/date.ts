export function formatPublishedDate(date: string) {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
}
