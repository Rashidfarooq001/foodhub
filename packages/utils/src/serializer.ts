export function serializePrisma<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    (((data as any).s !== undefined &&
      (data as any).e !== undefined &&
      Array.isArray((data as any).d)) ||
      typeof (data as any).toNumber === 'function')
  ) {
    return Number(data) as unknown as T;
  }

  if (typeof data === 'bigint') {
    return Number(data) as unknown as T;
  }

  if (data instanceof Date) {
    return data as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializePrisma(item)) as unknown as T;
  }

  if (typeof data === 'object' && data.constructor === Object) {
    const result: any = {};
    for (const key of Object.keys(data)) {
      result[key] = serializePrisma((data as any)[key]);
    }
    return result as T;
  }

  return data;
}
