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
      <h2>Items</h2>

      <div class="add-form">
        <input [(ngModel)]="newItemName" placeholder="Item name" />
        <input [(ngModel)]="newItemDescription" placeholder="Description" />
        <button (click)="addItem()">Add</button>
      </div>

      <ul>
        @for (item of items; track item.id) {
          <li>
            <strong>{{ item.name }}</strong> — {{ item.description }}
            <button (click)="deleteItem(item.id)">Delete</button>
          </li>
        }
      </ul>
    </div>
  `,
  styles: [`
    .container { max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
    .add-form { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .add-form input { padding: 0.5rem; flex: 1; }
    ul { list-style: none; padding: 0; }
    li { padding: 0.5rem 0; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 0.5rem; }
    li button { margin-left: auto; }
  `],
})
export class ItemListComponent implements OnInit {
  items: Item[] = [];
  newItemName = '';
  newItemDescription = '';

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
      .subscribe(() => {
        this.newItemName = '';
        this.newItemDescription = '';
        this.loadItems();
      });
  }

  deleteItem(id: number): void {
    this.itemService.deleteItem(id).subscribe(() => this.loadItems());
  }
}
