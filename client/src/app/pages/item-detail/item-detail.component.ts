import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ItemService } from '../../services/item.service';
import { Item } from '../../models/item.model';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (item) {
      <div class="detail">
        <!-- Photo gallery -->
        @if (item.photos && item.photos.length > 0) {
          <div class="gallery">
            <div class="main-photo">
              <img [src]="item.photos[selectedPhoto].url" [alt]="item.name" />
            </div>
            @if (item.photos.length > 1) {
              <div class="thumbs">
                @for (photo of item.photos; track photo.id; let i = $index) {
                  <div
                    class="thumb"
                    [class.active]="i === selectedPhoto"
                    (click)="selectedPhoto = i"
                  >
                    <img [src]="photo.url" [alt]="item.name" />
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="no-photos">
            <span>&#128247;</span>
            <p>No photos</p>
          </div>
        }

        <!-- Item info -->
        <div class="info">
          <h2>{{ item.name }}</h2>

          @if (item.location_path) {
            <div class="location">
              <span class="label">Location:</span>
              <span>{{ item.location_path }}</span>
            </div>
          }

          @if (item.description) {
            <p class="description">{{ item.description }}</p>
          }

          @if (item.tags && item.tags.length > 0) {
            <div class="tags">
              @for (tag of item.tags; track tag) {
                <span class="tag">#{{ tag }}</span>
              }
            </div>
          }

          <div class="meta">
            <span>Created: {{ item.created_at | date:'medium' }}</span>
            <span>Updated: {{ item.updated_at | date:'medium' }}</span>
          </div>

          <div class="actions">
            <a class="btn-edit" [routerLink]="['/item', item.id, 'edit']">Edit</a>
            <button class="btn-delete" (click)="deleteItem()">Delete</button>
            <a class="btn-back" routerLink="/" *ngIf="!item.location_id">Back</a>
            <a class="btn-back" [routerLink]="['/location', item.location_id]" *ngIf="item.location_id">Back to Location</a>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .detail {
      max-width: 700px;
      margin: 0 auto;
    }

    .gallery { margin-bottom: 1.5rem; }
    .main-photo {
      width: 100%;
      max-height: 400px;
      background: #111a2e;
      border-radius: 10px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .main-photo img {
      max-width: 100%;
      max-height: 400px;
      object-fit: contain;
    }
    .thumbs {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }
    .thumb {
      width: 60px;
      height: 60px;
      border-radius: 6px;
      overflow: hidden;
      cursor: pointer;
      border: 2px solid transparent;
      flex-shrink: 0;
      transition: border-color 0.2s;
    }
    .thumb.active { border-color: #1e90ff; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }

    .no-photos {
      background: #111a2e;
      border-radius: 10px;
      padding: 3rem;
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .no-photos span { font-size: 3rem; opacity: 0.3; }
    .no-photos p { color: #556; margin-top: 0.5rem; }

    .info h2 {
      color: #fff;
      font-size: 1.5rem;
      margin-bottom: 0.75rem;
    }
    .location {
      font-size: 0.9rem;
      color: #6688aa;
      margin-bottom: 0.75rem;
    }
    .location .label {
      color: #4488bb;
      font-weight: 600;
      margin-right: 0.3rem;
    }
    .description {
      color: #b0b8d0;
      margin-bottom: 1rem;
      line-height: 1.5;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 1rem;
    }
    .tag {
      font-size: 0.85rem;
      color: #1e90ff;
      background: #0a1628;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
    }
    .meta {
      font-size: 0.75rem;
      color: #556;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      margin-bottom: 1.5rem;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .btn-edit, .btn-back {
      padding: 0.6rem 1.2rem;
      background: #1e90ff;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      text-decoration: none;
      transition: background 0.2s;
      cursor: pointer;
    }
    .btn-edit:hover, .btn-back:hover { background: #1570cc; }
    .btn-back { background: transparent; border: 1px solid #333; color: #888; }
    .btn-back:hover { border-color: #1e90ff; color: #1e90ff; background: transparent; }
    .btn-delete {
      padding: 0.6rem 1.2rem;
      background: transparent;
      color: #e04040;
      border: 1px solid #e04040;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-delete:hover { background: #e04040; color: #fff; }

    @media (max-width: 480px) {
      .main-photo { max-height: 250px; }
      .info h2 { font-size: 1.2rem; }
    }
  `],
})
export class ItemDetailComponent implements OnInit {
  item: Item | null = null;
  selectedPhoto = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itemService: ItemService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.itemService.getItem(+params['id']).subscribe(item => {
        this.item = item;
        this.selectedPhoto = 0;
        this.cdr.markForCheck();
      });
    });
  }

  deleteItem(): void {
    if (!this.item || !confirm('Delete this item?')) return;
    const locationId = this.item.location_id;
    this.itemService.deleteItem(this.item.id).subscribe(() => {
      if (locationId) {
        this.router.navigate(['/location', locationId]);
      } else {
        this.router.navigate(['/']);
      }
    });
  }
}
