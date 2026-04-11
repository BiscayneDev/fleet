export interface WikiPageListItem {
  slug: string;
  title: string;
  type: string;
  summary: string;
}

export function WikiPageList({ pages }: { pages: WikiPageListItem[] }) {
  if (pages.length === 0) {
    return <p className="fleet-muted">No wiki pages linked yet.</p>;
  }

  return (
    <ul className="fleet-simple-list">
      {pages.map((page) => (
        <li key={page.slug} className="fleet-simple-list-item">
          <div className="fleet-row fleet-row-between fleet-row-start">
            <div>
              <h2 className="fleet-heading-reset">{page.title}</h2>
              <p className="fleet-muted">{page.summary}</p>
            </div>
            <span className="fleet-badge">{page.type}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
