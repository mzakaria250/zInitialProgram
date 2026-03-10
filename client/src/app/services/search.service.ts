import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Item } from '../models/item.model';

@Injectable({ providedIn: 'root' })
export class SearchService {
  constructor(private http: HttpClient) {}

  search(query: string, locationId?: number): Observable<Item[]> {
    let params = new HttpParams().set('q', query);
    if (locationId) params = params.set('location_id', locationId.toString());
    return this.http.get<Item[]>('/api/search', { params });
  }
}
