import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ContactTableComponent } from '../../components/table-component/table-component';
import { ContactClientList, LoadingState, TableColumn } from '../../models/contact';
import { ContactClientService } from '../services/contact-client-service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-contact-client-list',
    standalone: true,
    imports: [
      ReactiveFormsModule,
      ContactTableComponent,
      ProgressSpinnerModule,
      TableModule,
      TagModule,
    ],
    templateUrl: './contact-client-list-component.html',
    styleUrls: ['./contact-client-list-component.scss'],
})
export class ContactClientListComponent implements OnInit, OnChanges {
    @Input({ required: true }) filter!: Record<string, any>;
    @Output() filterChange = new EventEmitter<Record<string, any>>();

    private router = inject(Router);
    cdr = inject(ChangeDetectorRef);
    private clientService = inject(ContactClientService);

    LoadingState = LoadingState;
    loadingState = signal<LoadingState>(LoadingState.Loading);
    clients = signal<ContactClientList[]>([]);

    columns = signal<TableColumn[]>([
        { field: 'contactType', header: 'Client Type' },
        { field: 'contactId', header: 'Client ID' },
        { field: 'contactName', header: 'Client Name' },
        { field: 'contactRegId', header: 'Registration No.' },
        { field: 'email', header: 'Email' },
        { field: 'tel', header: 'Phone' },
    ]);

    ngOnInit() {
      this.load();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['filter'] && !changes['filter'].firstChange) {
            this.load();
        }
    }

    load(): void {
        this.loadingState.set(LoadingState.Loading);

        this.clientService.getContactClient(this.filter).subscribe({
            next: (data) => {
              this.clients.set(data || []);
              this.loadingState.set(LoadingState.Success);
              this.cdr.detectChanges();
            },
            error: () => {
              this.clients.set([]);
              this.loadingState.set(LoadingState.Error);
              this.cdr.detectChanges();
            }
        });
    }

    private formatDate(value: any): string {
        if (!value) return '';

        let date: Date;

        if (value instanceof Date) {
            date = value;
        } else if (typeof value === 'string') {
            date = new Date(value);
        } else {
            return String(value);
        }

        if (isNaN(date.getTime())) {
            return String(value);
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    navigateToClientView(client: ContactClientList | null): void {
        if (!client) return;

        this.router.navigate(['/contact/client/view', client.uniqId]);
    }
}