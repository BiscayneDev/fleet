export interface SessionListItem {
  id: string;
  title: string;
  detail: string;
}

export function SessionList({ sessions }: { sessions: SessionListItem[] }) {
  if (sessions.length === 0) {
    return <p className="fleet-muted">No session history yet.</p>;
  }

  return (
    <ul className="fleet-simple-list">
      {sessions.map((session) => (
        <li key={session.id} className="fleet-simple-list-item">
          <h2 className="fleet-heading-reset">{session.title}</h2>
          <p className="fleet-muted">{session.detail}</p>
        </li>
      ))}
    </ul>
  );
}
