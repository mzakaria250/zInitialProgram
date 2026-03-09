import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemService } from '../../services/item.service';
import { Item } from '../../models/item.model';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      @if (toast) {
        <div class="toast" [class.success]="toastType === 'success'" [class.error]="toastType === 'error'">
          {{ toast }}
        </div>
      }

      <div class="add-form">
        <input [(ngModel)]="newItemName" placeholder="Item name" (keyup.enter)="addItem()" />
        <input [(ngModel)]="newItemDescription" placeholder="Description" (keyup.enter)="addItem()" />
        <button class="btn-add" (click)="addItem()">Add</button>
      </div>

      @if (items.length > 0) {
        <div class="list-header">
          <span class="count">{{ items.length }} item{{ items.length > 1 ? 's' : '' }}</span>
          <button class="btn-clear" (click)="clearAll()">Clear All</button>
        </div>

        <ul>
          @for (item of items; track item.id) {
            <li>
              <div class="item-info">
                <strong>{{ item.name }}</strong>
                <span class="desc">{{ item.description }}</span>
              </div>
              <button class="btn-delete" (click)="deleteItem(item.id)">Delete</button>
            </li>
          }
        </ul>
      } @else {
        <p class="empty">No items yet. Add one above!</p>
      }
    </div>
  `,
  styles: [`
    .container {
      max-width: 640px;
      margin: 1.5rem auto;
      padding: 0 1rem;
    }

    .toast {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-weight: 500;
      animation: fadeIn 0.3s ease;
    }
    .toast.success { background: #0f5132; color: #badbcc; border: 1px solid #0f5132; }
    .toast.error { background: #842029; color: #f5c2c7; border: 1px solid #842029; }

    .add-form {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .add-form input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 1px solid #333;
      border-radius: 8px;
      background: #0d1b2a;
      color: #e0e0e0;
      outline: none;
      transition: border-color 0.2s;
    }
    .add-form input:focus {
      border-color: #1e90ff;
    }
    .add-form input::placeholder {
      color: #666;
    }

    .btn-add {
      padding: 0.75rem 1.5rem;
      background: #1e90ff;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }
    .btn-add:hover { background: #1570cc; }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .count {
      font-size: 0.85rem;
      color: #888;
    }
    .btn-clear {
      padding: 0.4rem 0.8rem;
      background: transparent;
      color: #1e90ff;
      border: 1px solid #1e90ff;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .btn-clear:hover { background: #1e90ff; color: #fff; }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1rem;
      margin-bottom: 0.5rem;
      background: #0d1b2a;
      border-radius: 8px;
      border: 1px solid #111a2e;
      transition: border-color 0.2s;
    }
    li:hover { border-color: #333; }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-width: 0;
    }
    .item-info strong {
      color: #fff;
      font-size: 1rem;
    }
    .desc {
      font-size: 0.85rem;
      color: #888;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .btn-delete {
      padding: 0.35rem 0.75rem;
      background: transparent;
      color: #888;
      border: 1px solid #333;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s;
      flex-shrink: 0;
      margin-left: 1rem;
    }
    .btn-delete:hover { background: #1e90ff; color: #fff; border-color: #1e90ff; }

    .empty {
      text-align: center;
      color: #666;
      padding: 2rem 0;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 480px) {
      .container { padding: 0 0.5rem; margin: 1rem auto; }
      .add-form { flex-direction: column; }
      .add-form input, .btn-add { width: 100%; }
      li { padding: 0.75rem; }
      .btn-delete { padding: 0.3rem 0.6rem; }
    }
  `],
})
export class ItemListComponent implements OnInit {
  items: Item[] = [];
  newItemName = '';
  newItemDescription = '';
  toast = '';
  toastType: 'success' | 'error' = 'success';

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private itemService: ItemService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.itemService.getItems().subscribe(items => {
      this.items = items;
      this.cdr.markForCheck();
    });
  }

  addItem(): void {
    if (!this.newItemName.trim()) return;
    this.itemService
      .createItem({ name: this.newItemName, description: this.newItemDescription })
      .subscribe(res => {
        this.newItemName = '';
        this.newItemDescription = '';
        this.showToast(res.message, 'success');
        this.loadItems();
      });
  }

  deleteItem(id: number): void {
    this.itemService.deleteItem(id).subscribe(res => {
      this.showToast(res.message, 'success');
      this.loadItems();
    });
  }

  clearAll(): void {
    this.itemService.clearAll().subscribe(res => {
      this.showToast(res.message, 'success');
      this.loadItems();
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = message;
    this.toastType = type;
    this.cdr.markForCheck();
    this.toastTimer = setTimeout(() => {
      this.toast = '';
      this.cdr.markForCheck();
    }, 3000);
  }
}
