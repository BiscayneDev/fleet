'use client';

import { useState } from 'react';

export function ExportActions() {
  const [copied, setCopied] = useState(false);

  function handlePrint() {
    window.print();
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="gtm-export-actions">
      <button className="gtm-export-btn" onClick={handlePrint}>
        Download PDF
      </button>
      <button
        className="gtm-export-btn gtm-export-btn-secondary"
        onClick={handleCopyLink}
      >
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  );
}
