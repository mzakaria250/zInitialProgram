import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Item } from '../models/item.model';

export interface ApiMessage {
  message: string;
  item?: Item;
}

@Injectable({ providedIn: 'root' })
export class ItemService {
  private apiUrl = '/api/items';

  constructor(private http: HttpClient) {}

  getItems(locationId?: number, includeChildren?: boolean, unsorted?: boolean): Observable<Item[]> {
    let params = new HttpParams();
    if (unsorted) params = params.set('unsorted', 'true');
    else if (locationId) {
      params = params.set('location_id', locationId.toString());
      if (includeChildren) params = params.set('include_children', 'true');
    }
    return this.http.get<Item[]>(this.apiUrl, { params });
  }

  getItem(id: number): Observable<Item> {
    return this.http.get<Item>(`${this.apiUrl}/${id}`);
  }

  createItem(formData: FormData): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(this.apiUrl, formData);
  }

  updateItem(id: number, data: { name?: string; description?: string; location_id?: number | null; tags?: string[] }): Observable<ApiMessage> {
    return this.http.put<ApiMessage>(`${this.apiUrl}/${id}`, data);
  }

  addPhotos(itemId: number, formData: FormData): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${this.apiUrl}/${itemId}/photos`, formData);
  }

  deletePhoto(itemId: number, photoId: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/${itemId}/photos/${photoId}`);
  }

  deleteItem(id: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/${id}`);
  }

  clearAll(): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/all`);
  }
}
