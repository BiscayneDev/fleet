import { CaptureForm } from '@/components/inbox/capture-form';
import { InboxList } from '@/components/inbox/inbox-list';
import { listInboxItems } from '@/lib/fs/inbox-store';

export default async function InboxPage() {
  const items = await listInboxItems();

  return (
    <div className="fleet-stack">
      <header className="project-header">
        <h1 className="project-header-title">Inbox</h1>
        <p className="project-header-summary">
          Drop links and notes here for later triage and ingestion into Fleet.
        </p>
      </header>

      <section className="fleet-panel">
        <CaptureForm />
      </section>

      <section className="fleet-panel fleet-stack">
        <h2 className="fleet-heading-sm">Queue</h2>
        <InboxList items={items} />
      </section>
    </div>
  );
}
