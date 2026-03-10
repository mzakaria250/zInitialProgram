import { Routes } from '@angular/router';
import { LocationBrowserComponent } from './pages/location-browser/location-browser.component';
import { ItemDetailComponent } from './pages/item-detail/item-detail.component';
import { ItemFormComponent } from './pages/item-form/item-form.component';
import { SearchComponent } from './pages/search/search.component';

export const routes: Routes = [
  { path: '', component: LocationBrowserComponent },
  { path: 'unsorted', component: LocationBrowserComponent },
  { path: 'location/:id', component: LocationBrowserComponent },
  { path: 'item/new', component: ItemFormComponent },
  { path: 'item/:id', component: ItemDetailComponent },
  { path: 'item/:id/edit', component: ItemFormComponent },
  { path: 'search', component: SearchComponent },
];
