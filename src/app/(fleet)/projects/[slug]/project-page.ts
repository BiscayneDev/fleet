import { cache } from 'react';

import { notFound } from 'next/navigation';

import { getProject } from '@/lib/fs/project-store';

export interface ProjectRouteProps {
  params: Promise<{ slug: string }>;
}

export const getProjectOrNotFound = cache(async (slug: string) => {
  try {
    return await getProject(slug);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      notFound();
    }

    throw error;
  }
});