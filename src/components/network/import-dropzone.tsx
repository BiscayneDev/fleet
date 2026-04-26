'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function ImportDropzone() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function detectPlatform(filename: string, content: string): 'linkedin' | 'twitter' | null {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.csv') || lower.includes('connections')) return 'linkedin';
    if (lower.includes('following') || lower.endsWith('.js')) return 'twitter';
    if (content.includes('First Name') && content.includes('Last Name')) return 'linkedin';
    if (content.includes('YTD.following') || content.includes('accountId')) return 'twitter';
    return null;
  }

  async function handleFile(file: File) {
    setImporting(true);
    setError(null);
    setStatus('Reading file...');

    try {
      const content = await file.text();
      const platform = detectPlatform(file.name, content);

      if (!platform) {
        setError('Could not detect platform. Use a LinkedIn Connections.csv or Twitter following.js file.');
        setImporting(false);
        return;
      }

      setStatus(`Importing ${platform === 'linkedin' ? 'LinkedIn' : 'Twitter'} connections...`);

      const response = await fetch('/api/network/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          content,
          filename: file.name,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? 'Import failed');
        return;
      }

      const data = await response.json();
      setStatus(data.summary);
      router.refresh();
    } catch {
      setError('Failed to import file');
    } finally {
      setImporting(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div
      className={`import-dropzone ${dragging ? 'import-dropzone-active' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.js,.json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {importing ? (
        <div className="import-dropzone-content">
          <div className="import-spinner" />
          <p className="import-status">{status}</p>
        </div>
      ) : (
        <div className="import-dropzone-content">
          <div className="import-dropzone-icon">&#8645;</div>
          <p className="import-dropzone-title">Drop your network export here</p>
          <p className="import-dropzone-subtitle">
            LinkedIn <code>Connections.csv</code> or Twitter <code>following.js</code>
          </p>
          {status && <p className="import-success">{status}</p>}
          {error && <p className="import-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
