import type { NextRequest } from 'next/server';
import { parseBody, parseCal, parseDay, withErrorHandling } from '@/lib/request';
import { loadSlotWithPassword } from '@/lib/slotAuth';
import { passwordOnlySchema } from '@/lib/validation';

type Ctx = { params: Promise<{ day: string }> };

/** 編集画面のロック解除。本人なので公開前でも title/url を返す */
export const POST = withErrorHandling(async (req: NextRequest, { params }: Ctx) => {
  const day = parseDay((await params).day);
  const calendar = parseCal(req);
  const { editPassword } = await parseBody(req, passwordOnlySchema);
  const data = await loadSlotWithPassword(req, calendar, day, editPassword);

  return Response.json({
    calendar,
    day: data.day,
    authorName: data.author_name,
    title: data.title,
    url: data.url,
  });
});
