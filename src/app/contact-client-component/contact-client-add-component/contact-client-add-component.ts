import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormConfig } from '@ai-solutions-ui/form-component';
import { RemoteComponent } from '../../components/remote-component';
import { ContactClientService } from '../services/contact-client-service';
import { environment } from '../../../environments/environment';
import { DropdownOption, DropdownResponse, IAppMessageService, LoadingState } from '../../models/contact';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-contact-client-add',
  standalone: true,
  imports: [
    RemoteComponent, 
    ProgressSpinnerModule,
    ButtonModule, 
    RouterLink
  ],
  templateUrl: './contact-client-add-component.html',
  styleUrls: ['./contact-client-add-component.scss'],
})
export class ContactClientAddComponent implements OnInit {

    //#region INJECTED DEPENDENCIES
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
        title: 'Add New Client',
        layout: 'grid',
        gridColumns: 6,
        fields: this.formFields,
        model: {
            contactType: '',
            contactId: '',
            contactName: '',
            contactRegId: '',
        },
        buttonLabel: 'Create Client',
    });

    formConfig = this.formConfigSignal.asReadonly();

    //#endregion

    ngOnInit(): void {
        this.loadInitialFormData();
    }

    //#region INITIALIZATION & DATA LOAD

    private loadInitialFormData(): void {
        this.loadingState.set(LoadingState.Loading);

        const requiredTypes = ['contacttypes'];

        this.clientService.getDropdownsByTypes(requiredTypes).subscribe({
            next: (data: DropdownResponse) => {
                this.processDropdownData(data);
                this.loadClient();
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

    private loadClient(): void {

        // Create complete initial model
        const initialModel = {
            contactType: '',
            contactId: '',
            contactName: '',
            contactRegId: '',
        };

        this.formConfigSignal.update(cfg => ({
            ...cfg,
            title: 'Add New Client',
            model: initialModel,
        }));
        this.loadingState.set(LoadingState.Success);
    }

    //#endregion

    //#region EVENT HANDLERS
    onRemoteOutput(event: Record<string, any>): void {
        if (event['modelChange']) {
        }

        if (event['formButtonClicked']) {
            this.saving.set(true);
            this.addClient(event['formButtonClicked']);
        }
    }

    //#endregion

    //#region FORM SUBMISSION & CLIENT CREATION

    addClient(model: Record<string, any>): void {
        const payload = this.buildPayload(model);

        this.clientService.createClient(payload).subscribe({
            next: () => {
                this.messageService.showSuccess('Success', 'Client created successfully!');
                this.saving.set(false);
                this.router.navigate(['/contact/client/']);
            },
            error: (err) => {
                this.messageService.showError(
                    'Error', 
                    err.error?.error || 'Failed to create client');
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
                } else {
                    payload[fieldName] = value;
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