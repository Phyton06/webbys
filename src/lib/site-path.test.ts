import { describe, expect, it } from 'vitest';
import { withBasePath } from './site-path';

describe('withBasePath', () => {
  it('prefixes app routes with the deployment base', () => {
    expect(withBasePath('/webbys/', '/login/')).toBe('/webbys/login/');
  });

  it('keeps root deployments at the origin root', () => {
    expect(withBasePath('/', '/admin/')).toBe('/admin/');
  });
});
