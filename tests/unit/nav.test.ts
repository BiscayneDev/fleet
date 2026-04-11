import { describe, expect, it } from 'vitest';

import { fleetNavItems } from '../../src/lib/fleet/nav';

describe('fleetNavItems', () => {
  it('exposes the approved top-level navigation order', () => {
    expect(fleetNavItems.map((item) => item.key)).toEqual([
      'home',
      'projects',
      'inbox',
      'gmail',
      'calendar',
      'wiki',
      'agents',
      'artifacts',
    ]);
  });
});
