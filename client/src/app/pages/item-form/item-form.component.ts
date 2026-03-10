import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ItemService } from '../../services/item.service';
import { LocationService } from '../../services/location.service';
import { TagService, Tag } from '../../services/tag.service';
import { Item } from '../../models/item.model';
import { Location } from '../../models/location.model';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="form-container">
      <h2>{{ isEdit ? 'Edit Item' : 'Add New Item' }}</h2>

      <div class="form-group">
        <label>Name *</label>
        <input [(ngModel)]="name" placeholder="Item name" />
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea [(ngModel)]="description" placeholder="Description" rows="3"></textarea>
      </div>

      <div class="form-group">
        <label>Location</label>
        <select [(ngModel)]="locationId">
          <option [ngValue]="null">No location (Unsorted)</option>
          @for (opt of flatLocations; track opt.id) {
            <option [ngValue]="opt.id">{{ opt.indent }}{{ opt.name }}</option>
          }
        </select>
      </div>

      <div class="form-group">
        <label>Tags</label>
        <div class="tag-input-wrap">
          <div class="current-tags">
            @for (tag of tags; track tag; let i = $index) {
              <span class="tag">
                #{{ tag }}
                <button (click)="removeTag(i)">&times;</button>
              </span>
            }
          </div>
          <input
            [(ngModel)]="tagInput"
            placeholder="Add tag and press Enter"
            (keyup.enter)="addTag()"
            (keyup)="filterSuggestions()"
            (focus)="showSuggestions = true"
            (blur)="hideSuggestions()"
          />
          @if (showSuggestions && filteredSuggestions.length > 0) {
            <div class="suggestions">
              @for (s of filteredSuggestions; track s.name) {
                <div class="suggestion" (mousedown)="selectSuggestion(s.name)">
                  {{ s.name }} <span class="s-count">({{ s.item_count }})</span>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Photos (only for new items or adding to existing) -->
      <div class="form-group">
        <label>Photos</label>

        <!-- Existing photos (edit mode) -->
        @if (isEdit && existingPhotos.length > 0) {
          <div class="existing-photos">
            @for (photo of existingPhotos; track photo.id) {
              <div class="photo-preview">
                <img [src]="photo.url" />
                <button class="remove-photo" (click)="removeExistingPhoto(photo.id)">&times;</button>
              </div>
            }
          </div>
        }

        <div class="file-upload" (click)="fileInput.click()" (drop)="onDrop($event)" (dragover)="$event.preventDefault()">
          <span>Click or drop photos here</span>
          <input #fileInput type="file" accept="image/*" multiple (change)="onFilesSelected($event)" hidden />
        </div>

        @if (previewUrls.length > 0) {
          <div class="photo-previews">
            @for (url of previewUrls; track url; let i = $index) {
              <div class="photo-preview">
                <img [src]="url" />
                <button class="remove-photo" (click)="removeNewPhoto(i)">&times;</button>
              </div>
            }
          </div>
        }
      </div>

      <div class="form-actions">
        <button class="btn-save" (click)="save()" [disabled]="!name.trim()">
          {{ isEdit ? 'Save Changes' : 'Add Item' }}
        </button>
        <button class="btn-cancel" (click)="cancel()">Cancel</button>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 600px;
      margin: 0 auto;
    }
    h2 {
      color: #fff;
      margin-bottom: 1.5rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    label {
      display: block;
      font-size: 0.85rem;
      color: #6688aa;
      margin-bottom: 0.4rem;
      font-weight: 500;
    }
    input, textarea, select {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #0d1b2a;
      border: 1px solid #333;
      border-radius: 8px;
      color: #e0e0e0;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
    }
    input:focus, textarea:focus, select:focus { border-color: #1e90ff; }
    input::placeholder, textarea::placeholder { color: #556; }
    select { cursor: pointer; }
    select option { background: #0d1b2a; }

    .tag-input-wrap { position: relative; }
    .current-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      margin-bottom: 0.4rem;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.85rem;
      color: #1e90ff;
      background: #0a1628;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }
    .tag button {
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      font-size: 1rem;
      padding: 0;
      line-height: 1;
    }
    .tag button:hover { color: #e04040; }

    .suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #0d1b2a;
      border: 1px solid #333;
      border-radius: 0 0 8px 8px;
      z-index: 10;
      max-height: 150px;
      overflow-y: auto;
    }
    .suggestion {
      padding: 0.5rem 1rem;
      cursor: pointer;
      font-size: 0.85rem;
      color: #c0c8e0;
    }
    .suggestion:hover { background: #12233d; }
    .s-count { color: #556; font-size: 0.75rem; }

    .file-upload {
      border: 2px dashed #333;
      border-radius: 10px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      color: #556;
    }
    .file-upload:hover { border-color: #1e90ff; color: #1e90ff; }

    .existing-photos, .photo-previews {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .photo-preview {
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: 8px;
      overflow: hidden;
    }
    .photo-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .remove-photo {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 20px;
      height: 20px;
      background: rgba(0,0,0,0.7);
      color: #fff;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .remove-photo:hover { background: #e04040; }

    .form-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .btn-save {
      padding: 0.75rem 1.5rem;
      background: #1e90ff;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-save:hover:not(:disabled) { background: #1570cc; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-cancel {
      padding: 0.75rem 1.5rem;
      background: transparent;
      color: #888;
      border: 1px solid #333;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-cancel:hover { border-color: #1e90ff; color: #1e90ff; }

    @media (max-width: 480px) {
      .form-actions { flex-direction: column; }
      .btn-save, .btn-cancel { width: 100%; }
    }
  `],
})
export class ItemFormComponent implements OnInit {
  isEdit = false;
  itemId: number | null = null;
  name = '';
  description = '';
  locationId: number | null = null;
  tags: string[] = [];
  tagInput = '';
  files: File[] = [];
  previewUrls: string[] = [];
  existingPhotos: { id: number; url: string }[] = [];
  photosToRemove: number[] = [];

  flatLocations: { id: number; name: string; indent: string }[] = [];
  allTags: Tag[] = [];
  filteredSuggestions: Tag[] = [];
  showSuggestions = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itemService: ItemService,
    private locationService: LocationService,
    private tagService: TagService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Load location tree for dropdown
    this.locationService.getTree().subscribe(tree => {
      this.flatLocations = [];
      this.flattenTree(tree, 0);
      this.cdr.markForCheck();
    });

    // Load existing tags for autocomplete
    this.tagService.getTags().subscribe(tags => {
      this.allTags = tags;
      this.cdr.markForCheck();
    });

    // Check if edit mode
    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEdit = true;
        this.itemId = +params['id'];
        this.itemService.getItem(this.itemId).subscribe(item => {
          this.name = item.name;
          this.description = item.description;
          this.locationId = item.location_id;
          this.tags = [...item.tags];
          this.existingPhotos = item.photos.map(p => ({ id: p.id, url: p.url }));
          this.cdr.markForCheck();
        });
      } else {
        // Check for location_id query param
        this.route.queryParams.subscribe(qp => {
          if (qp['location_id']) {
            this.locationId = +qp['location_id'];
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  private flattenTree(nodes: Location[], depth: number): void {
    for (const node of nodes) {
      this.flatLocations.push({
        id: node.id,
        name: node.name,
        indent: '\u00A0\u00A0'.repeat(depth),
      });
      if (node.children) {
        this.flattenTree(node.children, depth + 1);
      }
    }
  }

  addTag(): void {
    const tag = this.tagInput.trim().toLowerCase();
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
    }
    this.tagInput = '';
    this.showSuggestions = false;
  }

  removeTag(index: number): void {
    this.tags.splice(index, 1);
  }

  filterSuggestions(): void {
    const input = this.tagInput.trim().toLowerCase();
    if (!input) {
      this.filteredSuggestions = [];
      return;
    }
    this.filteredSuggestions = this.allTags
      .filter(t => t.name.includes(input) && !this.tags.includes(t.name))
      .slice(0, 5);
  }

  selectSuggestion(name: string): void {
    if (!this.tags.includes(name)) {
      this.tags.push(name);
    }
    this.tagInput = '';
    this.showSuggestions = false;
  }

  hideSuggestions(): void {
    setTimeout(() => { this.showSuggestions = false; }, 200);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  private addFiles(newFiles: File[]): void {
    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) continue;
      this.files.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrls.push(e.target?.result as string);
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  removeNewPhoto(index: number): void {
    this.files.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  removeExistingPhoto(photoId: number): void {
    if (!this.itemId) return;
    this.itemService.deletePhoto(this.itemId, photoId).subscribe(() => {
      this.existingPhotos = this.existingPhotos.filter(p => p.id !== photoId);
      this.cdr.markForCheck();
    });
  }

  save(): void {
    if (!this.name.trim()) return;

    if (this.isEdit && this.itemId) {
      // Update metadata + tags
      this.itemService.updateItem(this.itemId, {
        name: this.name.trim(),
        description: this.description,
        location_id: this.locationId,
        tags: this.tags,
      }).subscribe(() => {
        // Upload new photos if any
        if (this.files.length > 0) {
          const fd = new FormData();
          this.files.forEach(f => fd.append('photos', f));
          this.itemService.addPhotos(this.itemId!, fd).subscribe(() => {
            this.router.navigate(['/item', this.itemId]);
          });
        } else {
          this.router.navigate(['/item', this.itemId]);
        }
      });
    } else {
      // Create new item
      const fd = new FormData();
      fd.append('name', this.name.trim());
      fd.append('description', this.description);
      if (this.locationId) fd.append('location_id', this.locationId.toString());
      fd.append('tags', JSON.stringify(this.tags));
      this.files.forEach(f => fd.append('photos', f));

      this.itemService.createItem(fd).subscribe(res => {
        if (res.item) {
          this.router.navigate(['/item', res.item.id]);
        } else if (this.locationId) {
          this.router.navigate(['/location', this.locationId]);
        } else {
          this.router.navigate(['/']);
        }
      });
    }
  }

  cancel(): void {
    if (this.isEdit && this.itemId) {
      this.router.navigate(['/item', this.itemId]);
    } else if (this.locationId) {
      this.router.navigate(['/location', this.locationId]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
