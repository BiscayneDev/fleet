'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface MatchedRecord {
  product: string;
  signupId: string;
  email: string;
  contactRef: string;
  contactName: string;
}

interface MatchRunResult {
  signupsScanned: number;
  newMatches: number;
  matched: MatchedRecord[];
}

interface RunMatcherButtonProps {
  /** Limit to a single product. Omit to scan all waitlists. */
  readonly product?: string;
  /** Optional override for the vault contacts directory. */
  readonly vaultContactsDir?: string;
}

export function RunMatcherButton({
  product,
  vaultContactsDir,
}: RunMatcherButtonProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function handleClick() {
    if (running) return;
    setRunning(true);
    try {
      const res = await fetch('/api/waitlists/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, vaultContactsDir }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? 'Matcher failed');
        return;
      }
      const data = (await res.json()) as { result: MatchRunResult };
      const r = data.result;

      if (r.newMatches === 0) {
        toast(
          r.signupsScanned === 0
            ? 'No new signups to scan'
            : `Scanned ${r.signupsScanned} new signup${
                r.signupsScanned === 1 ? '' : 's'
              } — no matches`,
        );
      } else {
        for (const m of r.matched) {
          toast.success(`🎯 ${m.contactName} signed up for ${m.product}`, {
            description: m.email,
          });
        }
      }
      router.refresh();
    } catch {
      toast.error('Unable to reach the server');
    } finally {
      setRunning(false);
    }
  }

  return (
    <button
      className="fleet-button fleet-button-primary"
      onClick={handleClick}
      disabled={running}
      type="button"
    >
      {running ? 'Scanning…' : product ? `Run matcher on ${product}` : 'Run matcher'}
    </button>
  );
}
