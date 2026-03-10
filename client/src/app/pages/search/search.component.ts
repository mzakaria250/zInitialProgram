import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SearchService } from '../../services/search.service';
import { Item } from '../../models/item.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="search-results">
      <h2>Search: "{{ query }}"</h2>
      <span class="count">{{ items.length }} result{{ items.length !== 1 ? 's' : '' }}</span>

      @if (items.length > 0) {
        <div class="items-grid">
          @for (item of items; track item.id) {
            <a class="item-card" [routerLink]="['/item', item.id]">
              <div class="item-thumb">
                @if (item.photos && item.photos.length > 0) {
                  <img [src]="item.photos[0].url" [alt]="item.name" />
                } @else {
                  <div class="no-photo">&#128247;</div>
                }
              </div>
              <div class="item-info">
                <strong>{{ item.name }}</strong>
                @if (item.description) {
                  <span class="desc">{{ item.description }}</span>
                }
                @if (item.tags && item.tags.length > 0) {
                  <div class="tags">
                    @for (tag of item.tags; track tag) {
                      <span class="tag">#{{ tag }}</span>
                    }
                  </div>
                }
                @if (item.location_path) {
                  <span class="loc-label">{{ item.location_path }}</span>
                }
              </div>
            </a>
          }
        </div>
      } @else if (query) {
        <p class="empty">No items found matching "{{ query }}"</p>
      }
    </div>
  `,
  styles: [`
    .search-results { padding: 0; }
    h2 { color: #fff; margin-bottom: 0.5rem; font-size: 1.3rem; }
    .count { font-size: 0.85rem; color: #6688aa; display: block; margin-bottom: 1.5rem; }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    .item-card {
      display: flex;
      flex-direction: column;
      background: #0d1b2a;
      border: 1px solid #1a2a40;
      border-radius: 10px;
      overflow: hidden;
      text-decoration: none;
      transition: all 0.2s;
    }
    .item-card:hover { border-color: #1e90ff; transform: translateY(-2px); }
    .item-thumb {
      height: 140px;
      background: #111a2e;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .item-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .no-photo { font-size: 2.5rem; opacity: 0.3; }
    .item-info {
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .item-info strong { color: #fff; font-size: 0.95rem; }
    .desc { font-size: 0.8rem; color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tags { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .tag { font-size: 0.7rem; color: #1e90ff; background: #0a1628; padding: 0.15rem 0.4rem; border-radius: 4px; }
    .loc-label { font-size: 0.7rem; color: #556; }
    .empty { text-align: center; color: #556; padding: 3rem 0; }
  `],
})
export class SearchComponent implements OnInit {
  query = '';
  items: Item[] = [];

  constructor(
    private route: ActivatedRoute,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.query = params['q'] || '';
      if (this.query) {
        this.searchService.search(this.query).subscribe(items => {
          this.items = items;
          this.cdr.markForCheck();
        });
      }
    });
  }
}
