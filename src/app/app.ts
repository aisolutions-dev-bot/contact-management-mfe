import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ContactTabsRouter } from './components/contact-tabs-router/contact-tabs-router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ContactTabsRouter],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class ContactApp {
  protected readonly title = signal('contact-management-mfe');
}
