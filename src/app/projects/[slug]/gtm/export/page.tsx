import { notFound } from 'next/navigation';

import { getProject } from '@/lib/fs/project-store';
import { listArtifacts } from '@/lib/fs/artifact-store';
import { gtmSteps } from '@/lib/gtm/steps';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { ExportActions } from '@/components/gtm/export-actions';

interface ExportPageProps {
  params: Promise<{ slug: string }>;
}

const STEP_LABELS: Record<string, string> = {
  'icp-profile': 'Ideal Customer Profile',
  'positioning': 'Positioning',
  'messaging': 'Messaging Framework',
  'channel-strategy': 'Channel Strategy',
  'brief': 'Launch Content',
  'network-analysis': 'Outreach Plan',
  'launch-plan': 'Launch Plan',
};

export default async function GtmExportPage({ params }: ExportPageProps) {
  const { slug } = await params;

  let project;
  try {
    project = await getProject(slug);
  } catch {
    notFound();
  }

  const allArtifacts = await listArtifacts(slug);

  // Order artifacts by GTM step sequence
  const gtmArtifactTypes = gtmSteps.map((s) => s.artifactType);
  const gtmArtifacts = gtmSteps
    .map((step) => {
      const artifact = allArtifacts.find((a) => a.type === step.artifactType);
      return artifact ? { step, artifact } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const completedCount = gtmArtifacts.length;
  const now = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="gtm-export">
      <style>{`
        .gtm-export {
          max-width: 800px;
          margin: 0 auto;
          padding: 3rem 2rem;
          color: #1a1a2e;
          background: #ffffff;
          min-height: 100vh;
        }

        .gtm-export-header {
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
        }

        .gtm-export-brand {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #38bdf8;
          margin: 0 0 0.5rem;
        }

        .gtm-export-title {
          font-size: 1.8rem;
          font-weight: 800;
          margin: 0 0 0.25rem;
          letter-spacing: -0.02em;
          color: #0f172a;
        }

        .gtm-export-meta {
          font-size: 0.82rem;
          color: #64748b;
          margin: 0;
        }

        .gtm-export-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .gtm-export-btn {
          background: #38bdf8;
          color: #0f172a;
          border: none;
          border-radius: 0.4rem;
          padding: 0.5rem 1rem;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }

        .gtm-export-btn:hover {
          opacity: 0.85;
        }

        .gtm-export-btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .gtm-export-section {
          margin-bottom: 2.5rem;
          page-break-inside: avoid;
        }

        .gtm-export-section-number {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #38bdf8;
          margin: 0 0 0.25rem;
        }

        .gtm-export-section-title {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0 0 0.75rem;
          color: #0f172a;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .gtm-export-section-body {
          font-size: 0.85rem;
          line-height: 1.7;
          color: #334155;
        }

        /* Override markdown renderer for light theme */
        .gtm-export .fleet-md-h1 { color: #0f172a; font-size: 1.1rem; }
        .gtm-export .fleet-md-h2 { color: #1e40af; font-size: 0.95rem; }
        .gtm-export .fleet-md-h3 { color: #0f172a; font-size: 0.88rem; }
        .gtm-export .fleet-md-h4 { color: #475569; }
        .gtm-export .fleet-md-p { color: #334155; }
        .gtm-export .fleet-md-li { color: #334155; }
        .gtm-export .fleet-md-hr { border-top-color: #e5e7eb; }
        .gtm-export .fleet-md-code {
          background: #f1f5f9;
          border-color: #e2e8f0;
          color: #1e40af;
        }

        .gtm-export .fleet-md-table-wrap {
          border-color: #e2e8f0;
        }

        .gtm-export .fleet-md-table th {
          background: #f8fafc;
          color: #334155;
          border-bottom-color: #e2e8f0;
        }

        .gtm-export .fleet-md-table td {
          color: #334155;
          border-bottom-color: #f1f5f9;
        }

        .gtm-export .fleet-md-table tr:hover td {
          background: #f8fafc;
        }

        .gtm-export-footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
          margin-top: 3rem;
          text-align: center;
          color: #94a3b8;
          font-size: 0.75rem;
        }

        .gtm-export-empty {
          text-align: center;
          padding: 3rem 1rem;
          color: #64748b;
        }

        @media print {
          .gtm-export { padding: 1rem; }
          .gtm-export-actions { display: none; }
          .gtm-export-section { page-break-inside: avoid; }
          .gtm-export-footer { margin-top: 1rem; }
        }
      `}</style>

      {/* Header */}
      <div className="gtm-export-header">
        <p className="gtm-export-brand">Fleet GTM</p>
        <h1 className="gtm-export-title">Go-To-Market Strategy</h1>
        <p className="gtm-export-meta">
          {project.title} — Generated {now} — {completedCount} of {gtmSteps.length} sections
        </p>
        <ExportActions />
      </div>

      {/* Sections */}
      {gtmArtifacts.length > 0 ? (
        gtmArtifacts.map(({ step, artifact }) => (
          <div key={step.key} className="gtm-export-section">
            <p className="gtm-export-section-number">Step {step.number}</p>
            <h2 className="gtm-export-section-title">
              {STEP_LABELS[artifact.type] ?? step.title}
            </h2>
            <div className="gtm-export-section-body">
              <MarkdownRenderer content={artifact.body} />
            </div>
          </div>
        ))
      ) : (
        <div className="gtm-export-empty">
          <h2 style={{ margin: '0 0 0.5rem' }}>No GTM artifacts yet</h2>
          <p style={{ margin: 0 }}>
            Generate your GTM strategy in the GTM Builder first, then export it here.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="gtm-export-footer">
        <p style={{ margin: 0 }}>
          Built with <strong style={{ color: '#64748b' }}>Fleet</strong> by Shipyard
        </p>
      </div>
    </div>
  );
}
