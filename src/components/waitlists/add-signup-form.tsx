'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function AddSignupForm({ product }: { readonly product: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [context, setContext] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
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
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? 'Failed to add signup');
        return;
      }
      toast.success(`Added ${email.trim()} to ${product}`);
      setEmail('');
      setContext('');
      router.refresh();
    } catch {
      toast.error('Unable to reach the server');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="fleet-stack">
      <label className="capture-form-label">
        <span className="fleet-eyebrow">Email</span>
        <input
          className="capture-textarea"
          type="email"
          placeholder="someone@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          required
        />
      </label>
      <label className="capture-form-label">
        <span className="fleet-eyebrow">Context (optional)</span>
        <textarea
          className="capture-textarea"
          rows={2}
          placeholder="What are they building?"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          disabled={submitting}
        />
      </label>
      <button
        className="fleet-button fleet-button-primary"
        type="submit"
        disabled={submitting || !email.trim()}
      >
        {submitting ? 'Adding…' : 'Add signup'}
      </button>
    </form>
  );
}
