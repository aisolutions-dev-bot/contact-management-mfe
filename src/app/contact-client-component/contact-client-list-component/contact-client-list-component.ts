import {
  ChangeDetectorRef,
  Component,
  computed,
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
import { ContextMenuModule } from 'primeng/contextmenu';
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
      ContextMenuModule
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
    selectedRowData = signal<ContactClientList | null>(null);

    columns = signal<TableColumn[]>([
        { field: 'contactType', header: 'Contact Type' },
        { field: 'contactId', header: 'Contact ID' },
        { field: 'contactName', header: 'Contact Name' },
        { field: 'contactRegId', header: 'Contact Reg. No.' },
    ]);

    contextMenuItems = computed(() => {
        const selected = this.selectedRowData();
        if (!selected) return [];

        return [
        {
            label: 'Edit Client',
            icon: 'pi pi-fw pi-file-edit',
            command: () => this.navigateToClientEdit(selected),
        },
        {
            separator: true
        },
        {
            label: 'Cancel',
            icon: 'pi pi-fw pi-times'
        },
    ]
    });

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

    onContextMenu(event: MouseEvent, rowData: ContactClientList): void {
        event.preventDefault();
        this.selectedRowData.set(rowData);
    }

    navigateToClientEdit(client: ContactClientList | null): void {
        if (!client) return;

        this.router.navigate(['/contact/client/edit', client.uniqId]);
    }
}