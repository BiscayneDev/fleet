import type { InboxItem } from '@/lib/fs/inbox-store';

export function InboxList({ items }: { items: InboxItem[] }) {
  if (items.length === 0) {
    return <p className="fleet-eyebrow">Nothing captured yet.</p>;
  }

  return (
    <ul className="fleet-inbox-list">
      {items.map((item) => (
        <li className="fleet-inbox-list-item" key={item.id}>
          <div className="fleet-inbox-list-header">
            <strong>{item.title}</strong>
            <span className="fleet-eyebrow">{item.type}</span>
          </div>
          <p>{item.body}</p>
          <div className="fleet-inbox-list-meta">
            <span>{new Date(item.createdAt).toLocaleString()}</span>
            <span>{item.ingestionStatus}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
