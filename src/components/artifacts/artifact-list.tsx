export interface ArtifactListItem {
  id: string;
  title: string;
  type: string;
  detail: string;
}

export function ArtifactList({ artifacts }: { artifacts: ArtifactListItem[] }) {
  if (artifacts.length === 0) {
    return <p className="fleet-muted">No artifacts attached yet.</p>;
  }

  return (
    <ul className="fleet-simple-list">
      {artifacts.map((artifact) => (
        <li key={artifact.id} className="fleet-simple-list-item fleet-row fleet-row-between fleet-row-start">
          <div>
            <h2 className="fleet-heading-reset">{artifact.title}</h2>
            <p className="fleet-muted">{artifact.detail}</p>
          </div>
          <span className="fleet-badge">{artifact.type}</span>
        </li>
      ))}
    </ul>
  );
}
