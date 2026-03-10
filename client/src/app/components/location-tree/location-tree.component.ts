import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LocationService } from '../../services/location.service';
import { Location } from '../../models/location.model';

@Component({
  selector: 'app-location-tree',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <nav class="tree">
      <div class="tree-header">
        <span class="tree-title">Locations</span>
      </div>

      <div class="tree-item root-item" [class.active]="isActive(null)" (click)="navigateTo(null)">
        <span>All Items</span>
      </div>

      @for (loc of tree; track loc.id) {
        <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: loc, depth: 0 }"></ng-container>
      }

      <div class="tree-item root-item" [class.active]="isUnsorted" (click)="navigateUnsorted()">
        <span>Unsorted</span>
      </div>

      <!-- Add location form -->
      @if (showAddForm) {
        <div class="add-form">
          <input
            [(ngModel)]="newLocationName"
            placeholder="Location name"
            (keyup.enter)="addLocation()"
            (keyup.escape)="showAddForm = false"
            #addInput
          />
          <button class="btn-sm" (click)="addLocation()">+</button>
        </div>
      }
      <button class="btn-add-loc" (click)="showAddForm = !showAddForm">
        {{ showAddForm ? 'Cancel' : '+ Add Location' }}
      </button>
    </nav>

    <ng-template #nodeTemplate let-loc let-depth="depth">
      <div
        class="tree-item"
        [style.paddingLeft.px]="12 + depth * 16"
        [class.active]="isActive(loc.id)"
      >
        @if (loc.children && loc.children.length > 0) {
          <button class="toggle" (click)="toggleExpand(loc.id); $event.stopPropagation()">
            {{ expanded[loc.id] ? '▾' : '▸' }}
          </button>
        } @else {
          <span class="toggle-spacer"></span>
        }
        <span class="loc-name" (click)="navigateTo(loc.id)">{{ loc.name }}</span>
        <span class="item-count">{{ loc.item_count }}</span>
        <button class="btn-add-child" (click)="addChildTo(loc.id); $event.stopPropagation()" title="Add sublocation">+</button>
      </div>

      @if (addingChildTo === loc.id) {
        <div class="add-form" [style.paddingLeft.px]="28 + depth * 16">
          <input
            [(ngModel)]="childLocationName"
            placeholder="Sublocation name"
            (keyup.enter)="addChildLocation(loc.id)"
            (keyup.escape)="addingChildTo = null"
          />
          <button class="btn-sm" (click)="addChildLocation(loc.id)">+</button>
        </div>
      }

      @if (expanded[loc.id] && loc.children) {
        @for (child of loc.children; track child.id) {
          <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: child, depth: depth + 1 }"></ng-container>
        }
      }
    </ng-template>
  `,
  styles: [`
    .tree {
      padding: 0.5rem 0;
    }
    .tree-header {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #1a2a40;
      margin-bottom: 0.5rem;
    }
    .tree-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #4488bb;
    }
    .tree-item {
      display: flex;
      align-items: center;
      padding: 0.45rem 0.75rem;
      cursor: pointer;
      transition: background 0.15s;
      gap: 0.25rem;
    }
    .tree-item:hover { background: #12233d; }
    .tree-item.active { background: #1a3355; border-right: 3px solid #1e90ff; }
    .root-item { padding-left: 12px; font-weight: 500; }

    .toggle {
      background: none;
      border: none;
      color: #6688aa;
      cursor: pointer;
      font-size: 0.75rem;
      width: 16px;
      padding: 0;
      flex-shrink: 0;
    }
    .toggle-spacer { width: 16px; flex-shrink: 0; }

    .loc-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #c0c8e0;
      font-size: 0.9rem;
    }
    .item-count {
      font-size: 0.7rem;
      color: #556;
      background: #111a2e;
      padding: 0.1rem 0.4rem;
      border-radius: 8px;
      flex-shrink: 0;
    }
    .btn-add-child {
      background: none;
      border: none;
      color: #4488bb;
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0 0.3rem;
      opacity: 0;
      transition: opacity 0.15s;
      flex-shrink: 0;
    }
    .tree-item:hover .btn-add-child { opacity: 1; }

    .add-form {
      display: flex;
      gap: 0.3rem;
      padding: 0.3rem 0.75rem;
    }
    .add-form input {
      flex: 1;
      padding: 0.35rem 0.5rem;
      background: #0d1b2a;
      border: 1px solid #333;
      border-radius: 4px;
      color: #e0e0e0;
      font-size: 0.8rem;
      outline: none;
    }
    .add-form input:focus { border-color: #1e90ff; }
    .btn-sm {
      background: #1e90ff;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      padding: 0.35rem 0.5rem;
      font-size: 0.8rem;
    }

    .btn-add-loc {
      display: block;
      width: calc(100% - 1.5rem);
      margin: 0.5rem 0.75rem;
      padding: 0.4rem;
      background: transparent;
      border: 1px dashed #333;
      border-radius: 6px;
      color: #4488bb;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.15s;
    }
    .btn-add-loc:hover { border-color: #1e90ff; color: #1e90ff; }
  `],
})
export class LocationTreeComponent implements OnInit {
  tree: Location[] = [];
  expanded: Record<number, boolean> = {};
  showAddForm = false;
  newLocationName = '';
  addingChildTo: number | null = null;
  childLocationName = '';
  activeLocationId: number | null = null;
  isUnsorted = false;

  constructor(
    private locationService: LocationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.locationService.loadTree();
    this.locationService.tree$.subscribe(tree => {
      this.tree = tree;
      // Auto-expand root nodes
      for (const loc of tree) {
        if (this.expanded[loc.id] === undefined) {
          this.expanded[loc.id] = true;
        }
      }
      this.cdr.markForCheck();
    });
  }

  isActive(id: number | null): boolean {
    if (id === null) return !this.isUnsorted && this.activeLocationId === null;
    return this.activeLocationId === id;
  }

  navigateTo(locationId: number | null): void {
    this.isUnsorted = false;
    this.activeLocationId = locationId;
    if (locationId === null) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/location', locationId]);
    }
  }

  navigateUnsorted(): void {
    this.isUnsorted = true;
    this.activeLocationId = null;
    this.router.navigate(['/unsorted']);
  }

  toggleExpand(id: number): void {
    this.expanded[id] = !this.expanded[id];
  }

  addChildTo(parentId: number): void {
    this.addingChildTo = parentId;
    this.childLocationName = '';
  }

  addLocation(): void {
    if (!this.newLocationName.trim()) return;
    this.locationService.createLocation(this.newLocationName.trim()).subscribe(() => {
      this.newLocationName = '';
      this.showAddForm = false;
      this.cdr.markForCheck();
    });
  }

  addChildLocation(parentId: number): void {
    if (!this.childLocationName.trim()) return;
    this.locationService.createLocation(this.childLocationName.trim(), parentId).subscribe(() => {
      this.childLocationName = '';
      this.addingChildTo = null;
      this.expanded[parentId] = true;
      this.cdr.markForCheck();
    });
  }
}
