import { z } from 'zod';

// Shared zod building blocks for the admin write services. Every admin form
// sends blank inputs as '' (text/date/select) or null (number inputs), and a
// blank must be stored as null - never '' or 0 - so the database can tell
// "not entered" from a real value (CLAUDE.md, "Match score/stat fields").

function blankToNull(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? null : value;
}

/** A nullable field: '' and whitespace-only strings become null. */
export function blankable<T extends z.ZodType>(schema: T) {
  return z.preprocess(blankToNull, schema.nullable());
}

export const uuid = z.uuid({ error: 'must be a valid id' });

/** teams.id is a serial integer, not a uuid. */
export const teamId = z.int({ error: 'must be a team id' }).positive({ error: 'must be a team id' });

export const requiredText = (max: number) =>
  z
    .string({ error: 'is required' })
    .trim()
    .min(1, { error: 'is required' })
    .max(max, { error: `must be at most ${max} characters` });

export const optionalText = (max: number) =>
  blankable(z.string().trim().max(max, { error: `must be at most ${max} characters` }));

export const isoDate = z.iso.date({ error: 'must be a date (YYYY-MM-DD)' });

export const nonNegativeInt = z
  .int({ error: 'must be a whole number' })
  .min(0, { error: 'can\'t be negative' });

/** A nullable whole number in [0, max]; blank becomes null. */
export const count = (max: number) =>
  blankable(nonNegativeInt.max(max, { error: `must be at most ${max}` }));

/**
 * Turns a zod error into one readable line, e.g.
 * "date: must be a date (YYYY-MM-DD); spurs_score: can't be negative".
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message))
    .join('; ');
}
