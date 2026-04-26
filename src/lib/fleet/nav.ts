export type FleetNavItem = {
  key:
    | 'home'
    | 'projects'
    | 'inbox'
    | 'network'
    | 'gmail'
    | 'calendar'
    | 'wiki'
    | 'agents'
    | 'artifacts';
  label: string;
  href: string;
};

export const fleetNavItems: FleetNavItem[] = [
  { key: 'home', label: 'Home', href: '/home' },
  { key: 'projects', label: 'Projects', href: '/projects' },
  { key: 'inbox', label: 'Inbox', href: '/inbox' },
  { key: 'network', label: 'Network', href: '/network' },
  { key: 'gmail', label: 'Gmail', href: '/gmail' },
  { key: 'calendar', label: 'Calendar', href: '/calendar' },
  { key: 'wiki', label: 'Wiki', href: '/wiki' },
  { key: 'agents', label: 'Agents', href: '/agents' },
  { key: 'artifacts', label: 'Artifacts', href: '/artifacts' },
];
