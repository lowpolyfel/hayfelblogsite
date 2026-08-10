import { useState, type FormEvent } from 'react'

export function NewsletterForm() {
  const [sent, setSent] = useState(false)
  function subscribe(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSent(true) }
  return <form className="newsletter__form" onSubmit={subscribe}>{sent ? <p role="status">¡Listo! Revisa tu bandeja de entrada.</p> : <><label className="sr-only" htmlFor="email">Correo electrónico</label><input id="email" name="email" type="email" placeholder="tu@correo.com" autoComplete="email" required /><button type="submit">Quiero leerlo</button></>}</form>
}
