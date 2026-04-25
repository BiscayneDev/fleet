import { getProjectOrNotFound, type ProjectRouteProps } from './project-page';

export default async function ProjectDetailPage({ params }: ProjectRouteProps) {
  const { slug } = await params;
  const project = await getProjectOrNotFound(slug);

  return (
    <div
      style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      }}
    >
      <article className="fleet-panel fleet-stack">
        <h2>Goals</h2>
        <ul
          style={{
            display: 'grid',
            gap: '0.75rem',
            listStyle: 'disc',
            margin: 0,
            paddingLeft: '1.25rem',
          }}
        >
          {(project.goals.length > 0 ? project.goals : ['No goals captured yet.']).map((goal) => (
            <li key={goal}>{goal}</li>
          ))}
        </ul>
      </article>

      <article className="fleet-panel fleet-stack">
        <h2>Desired outcomes</h2>
        <ul
          style={{
            display: 'grid',
            gap: '0.75rem',
            listStyle: 'disc',
            margin: 0,
            paddingLeft: '1.25rem',
          }}
        >
          {(project.desiredOutcomes.length > 0
            ? project.desiredOutcomes
            : ['No desired outcomes captured yet.']).map((outcome) => (
            <li key={outcome}>{outcome}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}
