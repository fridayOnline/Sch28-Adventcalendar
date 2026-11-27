import type { NextRequest } from 'next/server';
import { apiError } from '@/lib/errors';
import { getDayDetail } from '@/lib/queries';
import { parseCal, parseDay, withErrorHandling } from '@/lib/request';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ day: string }> };

export const GET = withErrorHandling(async (req: NextRequest, { params }: Ctx) => {
  const day = parseDay((await params).day);
  const clientId = req.nextUrl.searchParams.get('clientId') ?? undefined;

  const detail = await getDayDetail(parseCal(req), day, clientId);
  if (!detail) throw apiError('NOT_PUBLISHED');

  return Response.json(detail);
});
