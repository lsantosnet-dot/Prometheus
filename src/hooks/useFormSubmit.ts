import { useRef, useState, type FormEvent } from 'react'

/** Runs a form action once at a time and exposes its saving state and error message. */
export function useFormSubmit(action: () => Promise<void>) {
  const running = useRef(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    // The ref blocks a second click that lands before React re-renders the disabled button.
    if (running.current) return
    running.current = true
    setSaving(true)
    setError('')
    try {
      await action()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The record could not be saved.')
    } finally {
      running.current = false
      setSaving(false)
    }
  }

  return { onSubmit, saving, error }
}
