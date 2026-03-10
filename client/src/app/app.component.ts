import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { LocationTreeComponent } from './components/location-tree/location-tree.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, LocationTreeComponent],
  template: `
    <header>
      <a class="brand" routerLink="/">
        <img src="assets/zak-1.png" alt="ZAK" class="logo" />
        <span class="title">Zak Inventory</span>
      </a>
      <div class="search-bar">
        <input
          [(ngModel)]="searchQuery"
          placeholder="Search items, tags..."
          (keyup.enter)="doSearch()"
        />
        <button (click)="doSearch()">&#128269;</button>
      </div>
    </header>
    <div class="layout">
      <aside class="sidebar">
        <app-location-tree />
      </aside>
      <main>
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    header {
      background: linear-gradient(135deg, #0d1b2a, #1b2a4a);
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #1e90ff;
      gap: 1rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
      white-space: nowrap;
    }
    .logo {
      height: 56px;
      width: auto;
      border-radius: 4px;
      mix-blend-mode: lighten;
    }
    .title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #fff;
    }
    .search-bar {
      display: flex;
      flex: 1;
      max-width: 400px;
    }
    .search-bar input {
      flex: 1;
      padding: 0.55rem 1rem;
      background: #0a1628;
      border: 1px solid #333;
      border-right: none;
      border-radius: 8px 0 0 8px;
      color: #e0e0e0;
      font-size: 0.9rem;
      outline: none;
    }
    .search-bar input:focus { border-color: #1e90ff; }
    .search-bar input::placeholder { color: #556; }
    .search-bar button {
      padding: 0.55rem 0.85rem;
      background: #1e90ff;
      border: none;
      border-radius: 0 8px 8px 0;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.2s;
    }
    .search-bar button:hover { background: #1570cc; }

    .layout {
      display: flex;
      height: calc(100vh - 56px);
    }
    .sidebar {
      width: 240px;
      min-width: 240px;
      background: #0a0e1a;
      border-right: 1px solid #1a2a40;
      overflow-y: auto;
    }
    main {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 1.5rem;
    }

    @media (max-width: 768px) {
      header {
        flex-direction: column;
        padding: 0.75rem;
      }
      .search-bar { max-width: 100%; }
      .layout { flex-direction: column; height: auto; }
      .sidebar {
        width: 100%;
        min-width: 100%;
        border-right: none;
        border-bottom: 1px solid #1a2a40;
        max-height: 200px;
      }
      main { padding: 1rem; }
    }
  `],
})
export class AppComponent {
  searchQuery = '';

  constructor(private router: Router) {}

  doSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }
}
