export function withBasePath(base: string, path: string): string {
  const normalizedBase = `${base.replace(/\/+$/, '')}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}${normalizedPath}`;
}

export function sitePath(path: string): string {
  return withBasePath(import.meta.env.BASE_URL, path);
}
