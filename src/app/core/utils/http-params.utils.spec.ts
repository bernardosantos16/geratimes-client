import { describe, it, expect } from 'vitest';
import { HttpParams } from '@angular/common/http';
import { buildPageableParams } from './http-params.utils';
import { PageableParams } from '../models/api.models';

describe('buildPageableParams', () => {
  it('should return empty HttpParams when no params provided', () => {
    const result = buildPageableParams();
    expect(result.keys().length).toBe(0);
  });

  it('should set page, size, and sort when provided', () => {
    const params: PageableParams = { page: 2, size: 15, sort: 'name,asc' };
    const result = buildPageableParams(params);

    expect(result.get('page')).toBe('2');
    expect(result.get('size')).toBe('15');
    expect(result.get('sort')).toBe('name,asc');
  });

  it('should extend base HttpParams when provided', () => {
    const base = new HttpParams().set('filter', 'active');
    const params: PageableParams = { page: 0, size: 10 };
    const result = buildPageableParams(params, base);

    expect(result.get('filter')).toBe('active');
    expect(result.get('page')).toBe('0');
    expect(result.get('size')).toBe('10');
  });

  it('should omit undefined page/size/sort', () => {
    const params: PageableParams = { page: 1 };
    const result = buildPageableParams(params);

    expect(result.get('page')).toBe('1');
    expect(result.get('size')).toBeNull();
    expect(result.get('sort')).toBeNull();
  });
});
