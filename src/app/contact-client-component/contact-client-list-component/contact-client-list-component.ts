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
import { ContactClientList, TableColumn } from '../../models/contact';
import { ContactClientService } from '../services/contact-client-service';

@Component({
    selector: 'app-contact-client-list',
    standalone: true,
    imports: [ReactiveFormsModule, ContactTableComponent, TableModule, TagModule, ContextMenuModule],
    templateUrl: './contact-client-list-component.html',
    styleUrls: ['./contact-client-list-component.scss'],
})
export class ContactClientListComponent implements OnInit, OnChanges {
    @Input({ required: true }) filter!: Record<string, any>;
    @Output() filterChange = new EventEmitter<Record<string, any>>();

    private router = inject(Router);
    cdr = inject(ChangeDetectorRef);
    private clientService = inject(ContactClientService);

    clients = signal<ContactClientList[]>([]);
    loading = signal(false);
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
        this.clientService.getContactClient().subscribe({
            next: (data) => {
                this.clients.set(data);
                this.cdr.detectChanges();
            },
            error: (err) => console.error(err),
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['filter'] && !changes['filter'].firstChange) {
            this.load();
        }
    }

    load(): void {
        this.loading.set(true); 

        this.clientService.getContactClient(this.filter).subscribe({
            next: (data) => {
                
                this.clients.set(data || []);
                this.loading.set(false);
                this.cdr.detectChanges();

            },
            error: (err) => {

                this.clients.set([]);
                this.loading.set(false);
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