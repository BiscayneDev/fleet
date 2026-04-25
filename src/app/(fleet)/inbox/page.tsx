import { CaptureForm } from '@/components/inbox/capture-form';
import { InboxList } from '@/components/inbox/inbox-list';
import { listInboxItems } from '@/lib/fs/inbox-store';

export default async function InboxPage() {
  const items = await listInboxItems();

  return (
    <div className="fleet-stack">
      <section className="fleet-panel">
        <p className="fleet-eyebrow">Inbox</p>
        <h1>Capture links and notes</h1>
        <p>Drop items here for later triage and ingestion into Fleet.</p>
        <CaptureForm />
      </section>

      <section className="fleet-panel">
        <p className="fleet-eyebrow">Queue</p>
        <h2>Inbox items</h2>
        <InboxList items={items} />
      </section>
    </div>
  );
}
