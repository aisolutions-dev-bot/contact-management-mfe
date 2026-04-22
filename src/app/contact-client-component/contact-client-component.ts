import { Component, Inject, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { SelectModule } from 'primeng/select';
import { IAppMessageService, ImportClientRow } from '../models/contact';
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
export class ContactClientComponent {

    //#region ==================== Injected Dependencies ====================
    private dialogService = inject(DialogService);
    private clientService = inject(ContactClientService);
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
    @ViewChild('table') table!: ContactClientListComponent;
    //#endregion

    //#region ==================== Functionality ====================
    openImportDialog(): void {
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
                // Reload the table data
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
    //#endregion
}
