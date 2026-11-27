import { z } from 'zod';
import { supabaseAdmin } from '@/lib/admin-api';
import { AdminServiceError, fromDatabaseError } from './errors';
import { formatZodError } from './schema-helpers';

export type Row = Record<string, unknown>;

export interface ServiceResult {
  data: Row[];
  /** Things worth telling the user that didn't block the save. */
  warnings: string[];
}

export interface CheckContext {
  mode: 'create' | 'update';
  /** The row's id when updating. */
  id?: string | number;
}

export interface CrudServiceConfig<Shape extends z.ZodRawShape> {
  table: string;
  /** Singular, capitalised: used in "Match not found". */
  label: string;
  idSchema: z.ZodType<string | number>;
  /**
   * The writable columns, as a create payload. Unknown keys (e.g. id or
   * created_at from a form that spreads a whole row) are stripped rather than
   * rejected, so they can never reach the database. Update payloads are the
   * same schema with every field optional.
   */
  fields: z.ZodObject<Shape>;
  /**
   * Cross-field rules, run on the full row as it would be after the write
   * (for an update, the stored row merged with the changes). Throws an
   * AdminServiceError to block the save; returns warnings otherwise.
   */
  check?: (row: Row, context: CheckContext) => string[] | Promise<string[]>;
  /** Invalidates the caches that read this table. */
  invalidate: () => void;
  /** Create with an upsert on these columns instead of a plain insert. */
  upsertOnConflict?: string;
}

/** Validates input against a schema, throwing a 400 AdminServiceError if it doesn't fit. */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AdminServiceError(formatZodError(result.error));
  }
  return result.data;
}

/**
 * Builds the create/update/remove services for one admin table. Each one
 * validates its input with zod, writes with the service-role client and
 * invalidates the table's caches, so the admin API routes and the admin MCP
 * write tools (WEB-251) share one validated code path.
 */
export function createCrudService<Shape extends z.ZodRawShape>(config: CrudServiceConfig<Shape>) {
  const { table, label, idSchema, fields, check, invalidate, upsertOnConflict } = config;
  const updateSchema = fields.partial().extend({ id: idSchema });
  const idOnlySchema = z.object({ id: idSchema });

  async function fetchExisting(id: string | number): Promise<Row> {
    const { data, error } = await supabaseAdmin.from(table).select('*').eq('id', id).maybeSingle();
    if (error) throw fromDatabaseError(error);
    if (!data) throw new AdminServiceError(`${label} not found`, 404);
    return data as Row;
  }

  async function create(input: unknown): Promise<ServiceResult> {
    const values = parseInput(fields, input) as Row;
    const warnings = check ? await check(values, { mode: 'create' }) : [];

    const query = upsertOnConflict
      ? supabaseAdmin.from(table).upsert(values, { onConflict: upsertOnConflict, ignoreDuplicates: false })
      : supabaseAdmin.from(table).insert(values);
    const { data, error } = await query.select();
    if (error) throw fromDatabaseError(error);

    invalidate();
    return { data: (data ?? []) as Row[], warnings };
  }

  async function update(input: unknown): Promise<ServiceResult> {
    const { id, ...changes } = parseInput(updateSchema, input) as Row & { id: string | number };
    if (Object.keys(changes).length === 0) {
      throw new AdminServiceError('Nothing to update');
    }

    let warnings: string[] = [];
    if (check) {
      const existing = await fetchExisting(id);
      warnings = await check({ ...existing, ...changes }, { mode: 'update', id });
    }

    const { data, error } = await supabaseAdmin.from(table).update(changes).eq('id', id).select();
    if (error) throw fromDatabaseError(error);
    if (!data || data.length === 0) throw new AdminServiceError(`${label} not found`, 404);

    invalidate();
    return { data: data as Row[], warnings };
  }

  async function remove(input: unknown): Promise<ServiceResult> {
    const { id } = parseInput(idOnlySchema, input);

    const { data, error } = await supabaseAdmin.from(table).delete().eq('id', id).select('id');
    if (error) throw fromDatabaseError(error);
    if (!data || data.length === 0) throw new AdminServiceError(`${label} not found`, 404);

    invalidate();
    return { data: data as Row[], warnings: [] };
  }

  return { create, update, remove, schemas: { create: fields, update: updateSchema } };
}
