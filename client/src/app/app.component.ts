import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <header>
      <h1>Zak Item Management</h1>
    </header>
    <main>
      <router-outlet />
    </main>
  `,
  styles: [`
    header {
      background: linear-gradient(135deg, #0d1b2a, #1b2a4a);
      padding: 1.5rem 1rem;
      text-align: center;
      border-bottom: 3px solid #1e90ff;
    }
    h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.5px;
    }
    main {
      padding: 1rem;
    }
    @media (max-width: 480px) {
      header { padding: 1rem 0.5rem; }
      h1 { font-size: 1.4rem; }
      main { padding: 0.5rem; }
    }
  `],
})
export class AppComponent {}
