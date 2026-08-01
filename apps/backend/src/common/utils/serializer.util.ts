/**
 * FOODHUB ENTERPRISE RESPONSE SERIALIZER
 * Recursively converts Prisma Decimal objects, BigInts, and nested structures
 * into clean, frontend-friendly plain numbers and primitives.
 */

export function serializePrisma<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Prisma Decimal or Decimal.js instances or unparsed decimal objects { s, e, d }
  if (
    typeof data === 'object' &&
    data !== null &&
    (
      (data as any).s !== undefined &&
      (data as any).e !== undefined &&
      Array.isArray((data as any).d) ||
      typeof (data as any).toNumber === 'function'
    )
  ) {
    return Number(data) as unknown as T;
  }

  // Handle BigInt
  if (typeof data === 'bigint') {
    return Number(data) as unknown as T;
  }

  // Handle Date instances
  if (data instanceof Date) {
    return data as unknown as T;
  }

  // Handle Arrays recursively
  if (Array.isArray(data)) {
    return data.map((item) => serializePrisma(item)) as unknown as T;
  }

  // Handle Objects recursively
  if (typeof data === 'object' && data.constructor === Object) {
    const result: any = {};
    for (const key of Object.keys(data)) {
      result[key] = serializePrisma((data as any)[key]);
    }
    return result as T;
  }

  return data;
}
