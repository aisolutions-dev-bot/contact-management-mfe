import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormConfig } from '@ai-solutions-ui/form-component';
import { RemoteComponent } from '../../components/remote-component';
import { ContactClientService } from '../services/contact-client-service';
import { environment } from '../../../environments/environment';
import { DropdownOption, DropdownResponse, IAppMessageService, LoadingState } from '../../models/contact';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-contact-client-edit',
    standalone: true,
    imports: [
      RemoteComponent,
      ProgressSpinnerModule,
      ButtonModule,
      RouterLink],
    templateUrl: './contact-client-edit-component.html',
    styleUrls: ['./contact-client-edit-component.scss'],
})
export class ContactClientEditComponent implements OnInit {

    //#region INJECTED DEPENDECIES
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private clientService = inject(ContactClientService);

    constructor(
        @Inject('MESSAGING_SERVICE')
        public messageService: IAppMessageService,
    ) { }
    //#endregion

    //#region SIGNALS - UI STATE MANAGEMENT

    // Data maps for lookups
    private contactTypeDataMap = signal<Map<string, string>>(new Map());
    
    // Dropdown options
    contactTypeOpts = signal<DropdownOption[]>([]);
    
    // UI loading states
    uniqId = signal<number | null>(null);
    LoadingState = LoadingState;
    loadingState = signal<LoadingState>(LoadingState.Loading);
    saving = signal<boolean>(false);
    
    // Configuration & Environment
    uiMfeUrl = environment.uiMfeUrl;
    //#endregion

    //#region FORM CONFIGURATION

    private readonly formFields = [
        // ========== ROW 1: Contact Type, Contact ID ==========
         {
            key: 'contactType',
            label: 'Contact Type',
            type: 'select' as const,
            icon: 'pi-building',
            colSpan: 3,
            options: [],
        },
        {
            key: 'contactId',
            label: 'Contact ID',
            type: 'text' as const,
            icon: 'pi-hashtag',
            colSpan: 3,
        },

        // ========== ROW 2: Contact Name, Contact Registration No ==========
        {
            key: 'contactName',
            label: 'Contact Name',
            type: 'text' as const,
            icon: 'pi-user',
            colSpan: 4,
        },
    
        {
            key: 'contactRegId',
            label: 'Contact Registration No.',
            type: 'text' as const,
            icon: 'pi-file',
            colSpan: 2,
        },
    ];

    private formConfigSignal = signal<FormConfig>({
        title: 'Edit Client',
        layout: 'grid',  
        gridColumns: 6,   
        fields: this.formFields,
        model: {
            contactType: '',
            contactId: '',
            contactName: '',
            contactRegId: '',
        },
        buttonLabel: 'Save Changes',
    });

    formConfig = this.formConfigSignal.asReadonly();

    //#endregion
 
    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const id = Number(params['id']);
            
            if (isNaN(id) || id <= 0) {
                this.messageService.showError('Error', 'Invalid Client ID');
                this.router.navigate(['/contact/client/list']);
                return;
            }
            
            this.uniqId.set(id);
            this.loadInitialFormData(id);
        });
    }

    //#region INITIALIZATION & DATA LOAD

    private loadInitialFormData(id: number): void {
        this.loadingState.set(LoadingState.Loading);
        
        const requiredTypes = ['contacttypes'];

        this.clientService.getDropdownsByTypes(requiredTypes).subscribe({
            next: (data: DropdownResponse) => {
                this.processDropdownData(data)          
                this.loadClient(id);
            },
            error: (err) => {
                this.messageService.showError('Error', err);
                this.loadingState.set(LoadingState.Error);
            }
        });
    }

    private processDropdownData(data: DropdownResponse): void {
        const contactTypeMap = new Map<string, string>();

        const contactTypeOptions = (data.contacttypes || []).map((item: DropdownOption) => {
            contactTypeMap.set(item.value, item.label); 
            return {
                value: item.value,
                label: `${item.label}` 
            };
        });

        this.contactTypeDataMap.set(contactTypeMap);

        this.contactTypeOpts.set(contactTypeOptions);

        this.updateFieldOptions('contactType', this.contactTypeOpts());
    }

    private loadClient(id: number): void {
        this.loadingState.set(LoadingState.Loading);
        
        this.clientService.getClientById(id).subscribe({
            next: (client) => {
                this.handleClientLoaded(client);
            },
            error: (err) => {
                this.messageService.showError(
                    'Error', 
                    err.error?.error || err.message || 'Failed to load client'
                );
                this.router.navigate(['/contact/client/list']);
            }
        });
    }

    private handleClientLoaded(client: Record<string, any>): void {
        const formattedClient = this.formatClientData(client);

        this.setFormModel(formattedClient);
        this.loadingState.set(LoadingState.Success);
    }

    private formatClientData(client: Record<string, any>): Record<string, any> {
        return {
            ...client,
        };
    }

    private setFormModel(client: Record<string, any>): void {
        this.formConfigSignal.update(cfg => ({
            ...cfg,
            title: `Edit Client: ${client['contactName']}`,
            model: { ...client }
        }));
    }

    //#endregion

    //#region EVENT HANDLERS

    onRemoteOutput(event: Record<string, any>): void {
        if (event['modelChange']) { }

        if (event['formButtonClicked']) {
            this.updateClient(event['formButtonClicked']);
        }
    }

    //#endregion

    //#region API DATA LOADING METHODS
    //#endregion
  
    //#region FORM SUBMISSION & STAFF UPDATE

    updateClient(model: Record<string, any>): void {
        const id = this.uniqId();
        if (!id) {
            this.messageService.showError('Error', 'Contact ID is missing');
            return;
        }

        const payload = this.buildPayload(model);

        this.saving.set(true);
        
        this.clientService.updateClient(id, payload).subscribe({
        next: () => {
            this.messageService.showSuccess('Success', 'Client updated successfully!');
            this.saving.set(false);
            this.router.navigate(['/contact/client/']);
        },
        error: (err) => {
            this.messageService.showError(
                'Error', 
                err.error?.error || 'Failed to update client'
            );
            this.saving.set(false);
        }
        });
    }

    private buildPayload(model: Record<string, any>): Record<string, any> {
        // Field name mapping (form → backend)
        const fieldMap: Record<string, string> = { };

        const dateFields = '';
        const uppercaseFields = ['contactId', 'contactName', 'contactRegId'];

        const payload: Record<string, any> = {};

        // Build payload from model
        Object.entries(model).forEach(([key, value]) => {
            // Skip null/undefined
            if (value === null || value === undefined) return;

            // Map field name if needed
            const fieldName = fieldMap[key] || key;

            // Convert dates to ISO with timezone offset
            if (dateFields.includes(key)) {
                if (value instanceof Date) {
                    payload[fieldName] = this.convertDateToISOWithTimezone(value);
                } else if (typeof value === 'string' && value) {
                    // String date (e.g., "11/17/2025") - parse then convert
                    const parsedDate = this.parseFormattedDate(value);
                    if (parsedDate) {
                        payload[fieldName] = this.convertDateToISOWithTimezone(parsedDate);
                    }
                }
            }
            // Convert to uppercase
            else if (uppercaseFields.includes(key) && typeof value === 'string') {
                payload[fieldName] = value.toUpperCase();
            }
            else {
                payload[fieldName] = value;
            }
        });

        return payload;
    }

    //#endregion

    //#region FORM MANIPULATION HELPERS
    private updateFieldOptions(fieldKey: string, options: DropdownOption[]): void {
        this.formConfigSignal.update(cfg => ({
            ...cfg,
            fields: cfg.fields.map(field =>
                field.key === fieldKey ? { ...field, options } : field
            )
        }));
    }
    //#endregion
  
    //#region UTILITY METHODS - Date & Format Conversions

    private parseFormattedDate(dateStr: string): Date | null {
        if (!dateStr) return null;

        try {
            // Expected format: mm/dd/yyyy
            const parts = dateStr.split('/');
            if (parts.length !== 3) return null;

            const month = parseInt(parts[0], 10) - 1; // Month is 0-indexed
            const day = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);

            const date = new Date(year, month, day);
            
            // Validate the date is valid
            if (isNaN(date.getTime())) return null;

            return date;
        } catch {
            return null;
        }
    }
    
    // Format date: "2025-12-08T00:00:00" → "08/12/2025"
    private formatDate(value: any): string {
        if (!value) return '';

        try {
            const date = new Date(value);
            if (isNaN(date.getTime())) return '';

            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();

            return `${month}/${day}/${year}`;  // mm/dd/yyyy
        } catch {
            return '';
        }
    }

    private convertDateToISOWithTimezone(date: Date): string {
        // Get date components in local timezone (not UTC)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Return ISO format with time: YYYY-MM-DDTHH:mm:ss
        const result = `${year}-${month}-${day}T00:00:00`;
        return result;
    }

    //#endregion

}