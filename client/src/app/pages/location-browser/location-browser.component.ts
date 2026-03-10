import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ItemService } from '../../services/item.service';
import { LocationService } from '../../services/location.service';
import { Item } from '../../models/item.model';
import { LocationDetail } from '../../models/location.model';

@Component({
  selector: 'app-location-browser',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="browser">
      <!-- Breadcrumb -->
      @if (location) {
        <div class="breadcrumb">
          <a routerLink="/">All Items</a>
          @for (crumb of location.breadcrumb; track crumb.id) {
            <span class="sep">/</span>
            @if (crumb.id === location.id) {
              <span class="current">{{ crumb.name }}</span>
            } @else {
              <a [routerLink]="['/location', crumb.id]">{{ crumb.name }}</a>
            }
          }
        </div>

        <!-- Child locations -->
        @if (location.children && location.children.length > 0) {
          <div class="child-locations">
            @for (child of location.children; track child.id) {
              <a class="loc-card" [routerLink]="['/location', child.id]">
                <span class="loc-icon">&#128193;</span>
                <span class="loc-name">{{ child.name }}</span>
                <span class="loc-count">{{ child.item_count }} items</span>
              </a>
            }
          </div>
        }
      } @else {
        <div class="breadcrumb">
          <span class="current">{{ isUnsorted ? 'Unsorted Items' : 'All Items' }}</span>
        </div>
      }

      <!-- Actions -->
      <div class="actions-bar">
        <span class="count">{{ items.length }} item{{ items.length !== 1 ? 's' : '' }}</span>
        <a class="btn-primary" [routerLink]="['/item', 'new']" [queryParams]="location ? { location_id: location.id } : {}">
          + Add Item
        </a>
      </div>

      <!-- Items grid -->
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
                @if (!location && item.location_path) {
                  <span class="loc-label">{{ item.location_path }}</span>
                }
              </div>
            </a>
          }
        </div>
      } @else {
        <p class="empty">No items here yet. Add one above!</p>
      }
    </div>
  `,
  styles: [`
    .browser { padding: 0; }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.75rem 0;
      font-size: 0.9rem;
      flex-wrap: wrap;
    }
    .breadcrumb a {
      color: #1e90ff;
      text-decoration: none;
    }
    .breadcrumb a:hover { text-decoration: underline; }
    .breadcrumb .sep { color: #444; }
    .breadcrumb .current { color: #c0c8e0; font-weight: 600; }

    .child-locations {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .loc-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem 1.25rem;
      background: #0d1b2a;
      border: 1px solid #1a2a40;
      border-radius: 10px;
      text-decoration: none;
      transition: all 0.2s;
      min-width: 100px;
    }
    .loc-card:hover { border-color: #1e90ff; background: #12233d; }
    .loc-icon { font-size: 1.5rem; margin-bottom: 0.3rem; }
    .loc-card .loc-name { color: #e0e0e0; font-size: 0.85rem; font-weight: 500; }
    .loc-card .loc-count { color: #556; font-size: 0.7rem; }

    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .count { font-size: 0.85rem; color: #6688aa; }
    .btn-primary {
      padding: 0.6rem 1.2rem;
      background: #1e90ff;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      text-decoration: none;
      transition: background 0.2s;
    }
    .btn-primary:hover { background: #1570cc; }

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
    .item-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .no-photo {
      font-size: 2.5rem;
      opacity: 0.3;
    }

    .item-info {
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .item-info strong {
      color: #fff;
      font-size: 0.95rem;
    }
    .desc {
      font-size: 0.8rem;
      color: #888;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }
    .tag {
      font-size: 0.7rem;
      color: #1e90ff;
      background: #0a1628;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }
    .loc-label {
      font-size: 0.7rem;
      color: #556;
    }

    .empty {
      text-align: center;
      color: #556;
      padding: 3rem 0;
      font-size: 1rem;
    }

    @media (max-width: 480px) {
      .items-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
      .child-locations { gap: 0.5rem; }
      .loc-card { padding: 0.75rem; min-width: 80px; }
    }
  `],
})
export class LocationBrowserComponent implements OnInit {
  items: Item[] = [];
  location: LocationDetail | null = null;
  isUnsorted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itemService: ItemService,
    private locationService: LocationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const locationId = params['id'];
      this.isUnsorted = this.router.url === '/unsorted';

      if (this.isUnsorted) {
        this.location = null;
        this.itemService.getItems(undefined, undefined, true).subscribe(items => {
          this.items = items;
          this.cdr.markForCheck();
        });
      } else if (locationId) {
        this.locationService.getLocation(+locationId).subscribe(loc => {
          this.location = loc;
          this.cdr.markForCheck();
        });
        this.itemService.getItems(+locationId).subscribe(items => {
          this.items = items;
          this.cdr.markForCheck();
        });
      } else {
        this.location = null;
        this.itemService.getItems().subscribe(items => {
          this.items = items;
          this.cdr.markForCheck();
        });
      }
    });
  }
}
