/**
 * Serialize a Prisma record for the Mongo-style client.
 * Prisma returns `id`; the existing React client reads `_id`.
 * Adds `_id` alongside `id` so both shapes work.
 */
export const serialize = <T extends { id: string }>(record: T): T & { _id: string } => {
  return { ...record, _id: record.id };
};

export const serializeMany = <T extends { id: string }>(records: T[]): Array<T & { _id: string }> => {
  return records.map(serialize);
};

export const serializeObject = <T extends { id?: string }>(record: T): T & { _id?: string } => {
  if (!record || typeof record !== 'object' || !('id' in record)) return record as T & { _id?: string };
  return { ...record, _id: (record as { id: string }).id };
};