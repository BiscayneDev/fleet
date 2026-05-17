'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AddSignupForm({ product }: { readonly product: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [context, setContext] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!email.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(
        `/api/waitlists/${encodeURIComponent(product)}/signups`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            context: context.trim() || undefined,
            source: 'manual',
          }),
        },
      )
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? 'Failed to add signup')
        return
      }
      toast.success(`Added ${email.trim()}`)
      setEmail('')
      setContext('')
      router.refresh()
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Email
        </label>
        <Input
          type="email"
          placeholder="someone@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Context <span className="opacity-50">(optional)</span>
        </label>
        <textarea
          rows={2}
          placeholder="What are they building?"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          disabled={submitting}
          className="w-full resize-y rounded-md border border-input bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={submitting || !email.trim()}
        >
          <Plus className="size-3.5" />
          {submitting ? 'Adding…' : 'Add signup'}
        </Button>
      </div>
    </form>
  )
}
