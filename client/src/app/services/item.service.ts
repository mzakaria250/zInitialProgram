import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>(this.apiUrl);
  }

  getItem(id: number): Observable<Item> {
    return this.http.get<Item>(`${this.apiUrl}/${id}`);
  }

  createItem(item: Partial<Item>): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(this.apiUrl, item);
  }

  updateItem(id: number, item: Partial<Item>): Observable<Item> {
    return this.http.put<Item>(`${this.apiUrl}/${id}`, item);
  }

  deleteItem(id: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/${id}`);
  }

  clearAll(): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/all`);
  }
}
