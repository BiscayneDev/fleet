import { useState, type FormEvent, type CSSProperties } from 'react'

export interface FleetWaitlistProps {
  /**
   * Your server-side endpoint that will receive `{ email, name?, context?, honeypot? }`
   * and call `fleet-waitlist-submit` to commit to the vault.
   * @example "/api/waitlist"
   */
  submitTo: string

  /**
   * Product slug — passed to your endpoint so it can route to the right waitlist.
   * @example "inference"
   */
  product: string

  /** Button label. Defaults to "Join waitlist". */
  buttonLabel?: string

  /** Email input placeholder. Defaults to "you@company.com". */
  placeholder?: string

  /** Message shown after successful submit. */
  successMessage?: string

  /** Show an optional "name" field. Defaults to false. */
  showNameField?: boolean

  /** Show an optional context textarea ("what are you building?"). Defaults to false. */
  showContextField?: boolean

  /** Source string sent with the submission. Defaults to "widget". */
  source?: string

  // --- Styling hooks (all optional) ---
  className?: string
  inputClassName?: string
  buttonClassName?: string
  successClassName?: string
  errorClassName?: string
  style?: CSSProperties

  // --- Events ---
  onSuccess?: (email: string) => void
  onError?: (error: string) => void
}

/**
 * Drop-in waitlist form. POSTs to your server endpoint, which is expected
 * to call `fleet-waitlist-submit` and commit the signup to your vault repo.
 *
 * The widget includes a hidden honeypot field. If a bot fills it, your
 * server should call `submit({ ..., honeypot })` so the helper silently
 * drops it.
 */
export function FleetWaitlist({
  submitTo,
  product,
  buttonLabel = 'Join waitlist',
  placeholder = 'you@company.com',
  successMessage = "You're on the list.",
  showNameField = false,
  showContextField = false,
  source = 'widget',
  className,
  inputClassName,
  buttonClassName,
  successClassName,
  errorClassName,
  style,
  onSuccess,
  onError,
}: FleetWaitlistProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [context, setContext] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [pending, setPending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || pending) return
    setPending(true)
    setError(null)

    try {
      const res = await fetch(submitTo, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          email: email.trim(),
          name: showNameField && name.trim() ? name.trim() : undefined,
          context:
            showContextField && context.trim() ? context.trim() : undefined,
          source,
          honeypot,
        }),
      })

      if (!res.ok) {
        let message = 'Something went wrong. Please try again.'
        try {
          const data = (await res.json()) as { error?: string }
          if (data.error) message = data.error
        } catch {
          // ignore parse error, keep default message
        }
        setError(message)
        onError?.(message)
        return
      }

      setSubmitted(true)
      onSuccess?.(email.trim())
    } catch {
      const msg = 'Unable to reach the server.'
      setError(msg)
      onError?.(msg)
    } finally {
      setPending(false)
    }
  }

  if (submitted) {
    return (
      <div
        className={successClassName ?? className}
        style={style}
        role="status"
      >
        {successMessage}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className} style={style}>
      {showNameField && (
        <input
          type="text"
          name="name"
          placeholder="Name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
          className={inputClassName}
        />
      )}
      <input
        type="email"
        name="email"
        placeholder={placeholder}
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={pending}
        className={inputClassName}
      />
      {showContextField && (
        <textarea
          name="context"
          placeholder="What are you building?"
          rows={2}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          disabled={pending}
          className={inputClassName}
        />
      )}
      {/* Honeypot: hidden from real users, attractive to bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: 1,
          height: 1,
          opacity: 0,
        }}
      />
      <button
        type="submit"
        disabled={pending || !email.trim()}
        className={buttonClassName}
      >
        {pending ? 'Joining…' : buttonLabel}
      </button>
      {error && (
        <div className={errorClassName} role="alert">
          {error}
        </div>
      )}
    </form>
  )
}
