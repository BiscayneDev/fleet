import { NextResponse } from 'next/server';

import {
  getWaitlist,
  listMatches,
  listSignups,
} from '@/lib/fs/waitlist-store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ product: string }> },
): Promise<NextResponse> {
  const { product } = await params;
  const config = await getWaitlist(product);
  if (!config) {
    return NextResponse.json({ error: 'Waitlist not found' }, { status: 404 });
  }
  const [signups, matches] = await Promise.all([
    listSignups(product),
    listMatches(product),
  ]);
  return NextResponse.json({ waitlist: config, signups, matches });
}
