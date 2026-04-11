import { HomeBriefing } from '@/components/home/home-briefing';
import { deriveHomeBriefing } from '@/lib/fleet/home';
import { listProjects } from '@/lib/fs/project-store';

export default async function FleetHomePage() {
  const projects = await listProjects();
  const briefing = deriveHomeBriefing(projects);

  return <HomeBriefing briefing={briefing} />;
}
