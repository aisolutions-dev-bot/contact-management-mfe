import { ButtonModule } from 'primeng/button';
import { Component, Inject, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactStaffFilterComponent } from './contact-staff-filter-component/contact-staff-filter-component';
import { ContactStaffListComponent } from './contact-staff-list-component/contact-staff-list-component';
import { SelectModule } from 'primeng/select';
import { RouterLink } from '@angular/router';
import { ContactStaffService } from './services/contact-staff-service';
import { DialogService } from 'primeng/dynamicdialog';
import { ContactStaffImportComponent } from './contact-staff-import-component/contact-staff-import-component';
import { MessageService } from 'primeng/api';
import { IAppMessageService, ImportStaffRow } from '../models/contact';

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
    providers: [DialogService],
    templateUrl: './contact-staff-component.html',
    styleUrl: './contact-staff-component.scss',
})
export class ContactStaffComponent {

    //#region ==================== Injected Dependencies ====================
    private dialogService = inject(DialogService);
    private staffService = inject(ContactStaffService);
    constructor(
        @Inject('MESSAGING_SERVICE')
        public messageService: IAppMessageService,
    ) { }
    //#endregion

    //#region ==================== Signals ====================
    filter = signal<Record<string, any>>({});
    loading = signal(false);
    //#endregion
    
    //#region ==================== View Child ====================
    @ViewChild('table') table!: ContactStaffListComponent;
    //#endregion

    //#region // ==================== Functionality ====================
    openImportDialog(): void {
        const ref = this.dialogService.open(ContactStaffImportComponent, {
            header: 'Import Staff from Excel',
            width: '700px',
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
        });

        ref?.onClose.subscribe((data: ImportStaffRow[] | null) => {
            if (data && data.length > 0) {
                this.importStaff(data);
            }
        });
    }

    private importStaff(data: ImportStaffRow[]): void {
        this.loading.set(true);

        this.staffService.importStaff(data).subscribe({
            next: () => {
                this.messageService.showSuccess(
                    'Success',
                    `${data.length} staff records imported successfully`,
                );
                this.loading.set(false);
                // Reload the table data
                this.table.load();
            },
            error: (err) => {
                console.error('Import error:', err);
                this.messageService.showError(
                    'Error',
                    err.error?.message || 'Failed to import staff records',
                );
                this.loading.set(false);
            },
        });
    }
    //#endregion
}
