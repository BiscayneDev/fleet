'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function CreateWaitlistForm() {
  const router = useRouter();
  const [product, setProduct] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!product.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/waitlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: product.trim(),
          name: name.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? 'Failed to create waitlist');
        return;
      }
      toast.success(`Waitlist "${product.trim()}" created`);
      setProduct('');
      setName('');
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
        <span className="fleet-eyebrow">Product slug</span>
        <input
          className="capture-textarea"
          type="text"
          placeholder="my-product"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          disabled={submitting}
          pattern="[a-z0-9][a-z0-9-]*"
          title="Lowercase letters, numbers, and dashes"
          required
        />
      </label>
      <label className="capture-form-label">
        <span className="fleet-eyebrow">Display name (optional)</span>
        <input
          className="capture-textarea"
          type="text"
          placeholder="My Product"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
        />
      </label>
      <button
        className="fleet-button fleet-button-primary"
        type="submit"
        disabled={submitting || !product.trim()}
      >
        {submitting ? 'Creating…' : 'Create waitlist'}
      </button>
    </form>
  );
}
