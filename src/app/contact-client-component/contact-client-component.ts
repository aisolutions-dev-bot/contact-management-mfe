import { ChangeDetectorRef, Component, Inject, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { SelectModule } from 'primeng/select';
import { IAppMessageService, ImportClientRow } from '../models/contact';
import { IAuthService } from '../models/auth';
import { ContactClientFilterComponent } from './contact-client-filter-component/contact-client-filter-component';
import { ContactClientImportComponent } from './contact-client-import-component/contact-client-import-component';
import { ContactClientListComponent } from './contact-client-list-component/contact-client-list-component';
import { ContactClientService } from './services/contact-client-service';

@Component({
    selector: 'app-contact-client',
    imports: [
        ButtonModule,
        ContactClientListComponent,
        ContactClientFilterComponent,
        SelectModule,
        FormsModule,
        RouterLink
    ],
    providers: [DialogService, MessageService],
    templateUrl: './contact-client-component.html',
    styleUrl: './contact-client-component.scss',
})
export class ContactClientComponent implements OnInit {
    private readonly MODULE_ID = 'mod03';
    readonly ADD_ACCESS_CODE    = 'a0301.01';
    readonly EDIT_ACCESS_CODE   = 'a0301.02';
    readonly DELETE_ACCESS_CODE = 'a0301.03';
    readonly IMPORT_ACCESS_CODE = 'a0301.04';

    canAddClient    = false;
    canEditClient   = false;
    canDeleteClient = false;
    canImportClient = false;

    private dialogService = inject(DialogService);
    private clientService = inject(ContactClientService);
    private cdr = inject(ChangeDetectorRef);

    constructor(
        @Inject('MESSAGING_SERVICE') public messageService: IAppMessageService,
        @Inject('AUTH_SERVICE') public authService: IAuthService,
    ) { }

    private readonly FILTER_KEY = 'contact_client_filter';

    filter = signal<Record<string, any>>(this.restoreFilter());
    loading = signal(false);

    @ViewChild('table') table!: ContactClientListComponent;

    async ngOnInit(): Promise<void> {
        try {
            await this.authService.fetchUserRole();
            await this.authService.fetchGroupAuthorityAccesses(this.MODULE_ID);
        } catch { }

        const accesses = this.authService.groupAuthorityAccesses();
        this.canAddClient    = accesses.some((a) => a.accessCode === this.ADD_ACCESS_CODE    && a.accessValue);
        this.canEditClient   = accesses.some((a) => a.accessCode === this.EDIT_ACCESS_CODE   && a.accessValue);
        this.canDeleteClient = accesses.some((a) => a.accessCode === this.DELETE_ACCESS_CODE && a.accessValue);
        this.canImportClient = accesses.some((a) => a.accessCode === this.IMPORT_ACCESS_CODE && a.accessValue);
        this.cdr.markForCheck();
    }

    onFilterChange(f: Record<string, any>): void {
        this.filter.set(f);
        this.persistFilter(f);
    }

    private restoreFilter(): Record<string, any> {
        try {
            const raw = sessionStorage.getItem(this.FILTER_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    private persistFilter(f: Record<string, any>): void {
        try {
            sessionStorage.setItem(this.FILTER_KEY, JSON.stringify(f));
        } catch { }
    }

    openImportDialog(): void {
        if (!this.canImportClient) return;

        const ref = this.dialogService.open(ContactClientImportComponent, {
            header: 'Import Client from Excel',
            width: '700px',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
        });

        ref?.onClose.subscribe((data: ImportClientRow[] | null) => {
            if (data && data.length > 0) {
                this.importClient(data);
            }
        });
    }

    private importClient(data: ImportClientRow[]): void {
        this.loading.set(true);

        this.clientService.importClient(data).subscribe({
            next: () => {
                this.messageService.showSuccess(
                    'Success',
                    `${data.length} client records imported successfully`,
                );
                this.loading.set(false);
                this.table.load();
            },
            error: (err) => {
                console.error('Import error:', err);
                this.messageService.showError(
                    'Error',
                    err.error?.message || 'Failed to import client records',
                );
                this.loading.set(false);
            },
        });
    }
}
