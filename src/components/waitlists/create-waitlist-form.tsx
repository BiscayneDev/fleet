'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CreateWaitlistForm() {
  const router = useRouter()
  const [product, setProduct] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!product.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/waitlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: product.trim(),
          name: name.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? 'Failed to create waitlist')
        return
      }
      toast.success(`Created waitlist /${product.trim()}`)
      setProduct('')
      setName('')
      router.refresh()
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <div className="space-y-1">
        <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Product slug
        </label>
        <Input
          type="text"
          placeholder="my-product"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          disabled={submitting}
          pattern="[a-z0-9][a-z0-9-]*"
          title="Lowercase letters, numbers, and dashes"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="block text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Display name <span className="opacity-50">(optional)</span>
        </label>
        <Input
          type="text"
          placeholder="My Product"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
        />
      </div>
      <div className="flex items-end">
        <Button
          type="submit"
          disabled={submitting || !product.trim()}
          className="w-full sm:w-auto"
        >
          <Plus className="size-3.5" />
          {submitting ? 'Creating…' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
