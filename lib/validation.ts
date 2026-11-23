import { z } from 'zod';
import { EMOJIS } from '@/types';

export const daySchema = z.coerce.number().int().min(1).max(25);

const password = z.string().min(4).max(64);
const trimmed = (max: number) => z.string().trim().max(max);

const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((u) => {
    try {
      return ['http:', 'https:'].includes(new URL(u).protocol);
    } catch {
      return false;
    }
  }, 'http(s) のURLのみ');

export const reserveSchema = z.object({
  authorName: trimmed(30).min(1),
  editPassword: password,
});

export const passwordOnlySchema = z.object({ editPassword: password });

export const updateSlotSchema = z.object({
  editPassword: password,
  title: trimmed(100).min(1),
  url: httpUrl,
});

export const commentSchema = z.object({
  name: trimmed(30).optional().default('').transform((s) => s || '名無し'),
  body: trimmed(280).min(1),
});

export const reactionSchema = z.object({
  emoji: z.enum(EMOJIS),
  clientId: z.string().uuid(),
});

export const adminSlotPatchSchema = z.object({
  authorName: trimmed(30).min(1).optional(),
  title: trimmed(100).nullable().optional(),
  url: httpUrl.nullable().optional(),
  hidden: z.boolean().optional(),
});

export const adminLoginSchema = z.object({ password: z.string().min(1).max(200) });
export const adminCommentPatchSchema = z.object({ hidden: z.boolean() });
export const adminSettingsSchema = z.object({ entryOpen: z.boolean() });
