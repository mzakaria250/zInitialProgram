import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Location, LocationDetail } from '../models/location.model';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private apiUrl = '/api/locations';
  private treeSubject = new BehaviorSubject<Location[]>([]);
  tree$ = this.treeSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadTree(): void {
    this.http.get<Location[]>(this.apiUrl).subscribe(tree => {
      this.treeSubject.next(tree);
    });
  }

  getTree(): Observable<Location[]> {
    return this.http.get<Location[]>(this.apiUrl);
  }

  getLocation(id: number): Observable<LocationDetail> {
    return this.http.get<LocationDetail>(`${this.apiUrl}/${id}`);
  }

  createLocation(name: string, parentId?: number): Observable<{ message: string; location: Location }> {
    return this.http.post<{ message: string; location: Location }>(this.apiUrl, {
      name,
      parent_id: parentId || null,
    }).pipe(tap(() => this.loadTree()));
  }

  renameLocation(id: number, name: string): Observable<{ message: string; location: Location }> {
    return this.http.put<{ message: string; location: Location }>(`${this.apiUrl}/${id}`, { name })
      .pipe(tap(() => this.loadTree()));
  }

  deleteLocation(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.loadTree()));
  }
}
