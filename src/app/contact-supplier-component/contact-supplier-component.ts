import { ChangeDetectorRef, Component, Inject, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { SelectModule } from 'primeng/select';
import { IAppMessageService, ImportSupplierRow } from '../models/contact';
import { IAuthService } from '../models/auth';
import { ContactSupplierFilterComponent } from './contact-supplier-filter-component/contact-supplier-filter-component';
import { ContactSupplierImportComponent } from './contact-supplier-import-component/contact-supplier-import-component';
import { ContactSupplierListComponent } from './contact-supplier-list-component/contact-supplier-list-component';
import { ContactSupplierService } from './services/contact-supplier-service';

@Component({
    selector: 'app-contact-supplier',
    imports: [
        ButtonModule,
        ContactSupplierListComponent,
        ContactSupplierFilterComponent,
        SelectModule,
        FormsModule,
        RouterLink
    ],
    providers: [DialogService, MessageService],
    templateUrl: './contact-supplier-component.html',
    styleUrl: './contact-supplier-component.scss',
})
export class ContactSupplierComponent implements OnInit {
    private readonly MODULE_ID = 'mod03';
    readonly ADD_ACCESS_CODE    = 'a0302.01';
    readonly EDIT_ACCESS_CODE   = 'a0302.02';
    readonly DELETE_ACCESS_CODE = 'a0302.03';
    readonly IMPORT_ACCESS_CODE = 'a0302.04';

    canAddSupplier    = false;
    canEditSupplier   = false;
    canDeleteSupplier = false;
    canImportSupplier = false;

    private dialogService = inject(DialogService);
    private supplierService = inject(ContactSupplierService);
    private cdr = inject(ChangeDetectorRef);

    constructor(
        @Inject('MESSAGING_SERVICE') public messageService: IAppMessageService,
        @Inject('AUTH_SERVICE') public authService: IAuthService,
    ) { }

    private readonly FILTER_KEY = 'contact_supplier_filter';

    filter = signal<Record<string, any>>(this.restoreFilter());
    loading = signal(false);

    @ViewChild('table') table!: ContactSupplierListComponent;

    async ngOnInit(): Promise<void> {
        try {
            await this.authService.fetchUserRole();
            await this.authService.fetchGroupAuthorityAccesses(this.MODULE_ID);
        } catch { }

        const accesses = this.authService.groupAuthorityAccesses();
        this.canAddSupplier    = accesses.some((a) => a.accessCode === this.ADD_ACCESS_CODE    && a.accessValue);
        this.canEditSupplier   = accesses.some((a) => a.accessCode === this.EDIT_ACCESS_CODE   && a.accessValue);
        this.canDeleteSupplier = accesses.some((a) => a.accessCode === this.DELETE_ACCESS_CODE && a.accessValue);
        this.canImportSupplier = accesses.some((a) => a.accessCode === this.IMPORT_ACCESS_CODE && a.accessValue);
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
        if (!this.canImportSupplier) return;

        const ref = this.dialogService.open(ContactSupplierImportComponent, {
            header: 'Import Supplier from Excel',
            width: '700px',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
        });

        ref?.onClose.subscribe((data: ImportSupplierRow[] | null) => {
            if (data && data.length > 0) {
                this.importSupplier(data);
            }
        });
    }

    private importSupplier(data: ImportSupplierRow[]): void {
        this.loading.set(true);

        this.supplierService.importSupplier(data).subscribe({
            next: () => {
                this.messageService.showSuccess(
                    'Success',
                    `${data.length} supplier records imported successfully`,
                );
                this.loading.set(false);
                this.table.load();
            },
            error: (err) => {
                console.error('Import error:', err);
                this.messageService.showError(
                    'Error',
                    err.error?.message || 'Failed to import supplier records',
                );
                this.loading.set(false);
            },
        });
    }
}
