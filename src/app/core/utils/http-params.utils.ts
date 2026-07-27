import { HttpParams } from '@angular/common/http';
import { PageableParams } from '../models/api.models';

export function buildPageableParams(params?: PageableParams, base?: HttpParams): HttpParams {
  let p = base ?? new HttpParams();
  if (params?.page !== undefined) p = p.set('page', params.page);
  if (params?.size !== undefined) p = p.set('size', params.size);
  if (params?.sort) p = p.set('sort', params.sort);
  return p;
}
