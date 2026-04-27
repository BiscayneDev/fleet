export type FleetNavItem = {
  key:
    | 'home'
    | 'projects'
    | 'inbox'
    | 'network'
    | 'wiki';
  label: string;
  href: string;
};

export const fleetNavItems: FleetNavItem[] = [
  { key: 'home', label: 'Home', href: '/home' },
  { key: 'projects', label: 'Projects', href: '/projects' },
  { key: 'inbox', label: 'Inbox', href: '/inbox' },
  { key: 'network', label: 'Network', href: '/network' },
  { key: 'wiki', label: 'Wiki', href: '/wiki' },
];
