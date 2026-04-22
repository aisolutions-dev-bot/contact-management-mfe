import { ButtonModule } from 'primeng/button';
import { Component, Inject, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactStaffFilterComponent } from './contact-staff-filter-component/contact-staff-filter-component';
import { ContactStaffListComponent } from './contact-staff-list-component/contact-staff-list-component';
import { SelectModule } from 'primeng/select';
import { RouterLink } from '@angular/router';
import { ContactStaffImportComponent } from './contact-staff-import-component/contact-staff-import-component';
import { IAppMessageService } from '../models/contact';

@Component({
  selector: 'app-contact-staff',
  imports: [
    ButtonModule,
    ContactStaffListComponent,
    ContactStaffFilterComponent,
    SelectModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './contact-staff-component.html',
  styleUrl: './contact-staff-component.scss',
})
export class ContactStaffComponent {

  constructor(
    @Inject('MESSAGING_SERVICE')
    public messageService: IAppMessageService,
  ) { }

  filter = signal<Record<string, any>>({});

  @ViewChild('table') table!: ContactStaffListComponent;

  navigateToImport(): void {
    window.location.href = '/system/import?screen=staff';
  }
}
