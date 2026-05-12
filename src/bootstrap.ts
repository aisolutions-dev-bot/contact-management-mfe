import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { ContactApp } from './app/app';

bootstrapApplication(ContactApp, appConfig).catch((err) => console.error(err));
