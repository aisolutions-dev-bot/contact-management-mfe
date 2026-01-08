import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormConfig } from '@ai-solutions-ui/form-component';
import { RemoteComponent } from '../../components/remote-component';
import { ContactStaffService } from '../services/contact-staff-service';
import { environment } from '../../../environments/environment';
import { DropdownOption, DropdownResponse, IAppMessageService } from '../../models/contact';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-contact-staff-add',
  standalone: true,
  imports: [RemoteComponent, ButtonModule, RouterLink],
  templateUrl: './contact-staff-add-component.html',
  styleUrls: ['./contact-staff-add-component.scss'],
})
export class ContactStaffAddComponent implements OnInit {

    //#region INJECTED DEPENDENCIES
    private router = inject(Router);
    private staffService = inject(ContactStaffService);

    constructor(
        @Inject('MESSAGING_SERVICE')
        public messageService: IAppMessageService,
    ) { }
    //#endregion

    //#region SIGNALS - UI STATE MANAGEMENT

    // Data maps for lookups
    private departmentDataMap = signal<Map<string, string>>(new Map());

    // Dropdown options
    departmentOpts = signal<DropdownOption[]>([]);
    formTypeOpts = signal<DropdownOption[]>([]);
    skillSetOpts = signal<DropdownOption[]>([]);
    
    // UI loading states
    uniqId = signal<number | null>(null);
    loading = signal<boolean>(false);
    saving = signal<boolean>(false);
    
    // Configuration & Environment
    uiMfeUrl = environment.uiMfeUrl;

    // Track previous value for change detection
    private previousFormType: string = '';
    //#endregion

    //#region FORM CONFIGURATION

    private readonly formFields = [
        // ========== ROW 1: Staff ID, Staff Name ==========
        {
            key: 'staffId',
            label: 'Staff ID',
            type: 'text' as const,
            icon: 'pi-hashtag',
            colSpan: 3,
        },
        {
            key: 'staffName',
            label: 'Staff Name',
            type: 'text' as const,
            icon: 'pi-user',
            colSpan: 3,
        },
        // ========== ROW 2: NRIC ==========
        {
            key: 'nric',
            label: 'NRIC',
            type: 'text' as const,
            icon: 'pi-id-card',
            colSpan: 6,
        },
        // ========== ROW 3: Department, Date Join ==========
        {
            key: 'departmentId',
            label: 'Department',
            type: 'select' as const,
            icon: 'pi-sitemap',
            colSpan: 4,
            options: [],
        },
        {
            key: 'dateJoin',
            label: 'Join Date',
            type: 'date' as const,
            icon: 'pi-calendar',
            colSpan: 2,
        },
        // ========== ROW 4: Form Type ==========
        {
            key: 'formType',
            label: 'Form Type',
            type: 'select' as const,
            icon: 'pi-file',
            colSpan: 6,
            options: [],
        },
        // ========== ROW 5: Skill Set ==========
        {
            key: 'skillSet',
            label: 'Skillset',
            type: 'select' as const,
            icon: 'pi-list-check',
            colSpan: 6,
            options: [],
        },
    ];

    private formConfigSignal = signal<FormConfig>({
        title: 'Add New Staff',
        layout: 'grid',
        gridColumns: 6,
        fields: this.formFields,
        model: {
            staffId: '',
            staffName: '',
            nric: '',
            departmentId: '',
            dateJoin: '',
            formType: '',
            skillSet: '',
        },
        buttonLabel: 'Create Staff',
    });

    formConfig = this.formConfigSignal.asReadonly();

    //#endregion

    ngOnInit(): void {
        this.loadInitialFormData();
    }

    //#region INITIALIZATION & DATA LOAD

    private loadInitialFormData(): void {
        this.loading.set(true);

        const requiredTypes = ['departments'];

        this.staffService.getDropdownsByTypes(requiredTypes).subscribe({
            next: (data: DropdownResponse) => {
                this.processDropdownData(data);
                 this.loadFormTypeDropdown().then(() => {
                    this.loadStaff();
                });
            },
            error: (err) => {
                this.messageService.showError('Error', err);
                this.loading.set(false);
            }
        });
    }

    private processDropdownData(data: DropdownResponse): void {
        const departmentMap = new Map<string, string>();

        const departmentOptions = (data.departments || []).map((item: DropdownOption) => {
            departmentMap.set(item.value, item.label);
            return {
                value: item.value,
                label: `${item.label}`
            };
        });

        this.departmentDataMap.set(departmentMap);

        this.departmentOpts.set(departmentOptions);

        this.updateFieldOptions('departmentId', this.departmentOpts());
    }

    private loadStaff(): void {

        // Create complete initial model
        const initialModel = {
            staffId: '',
            staffName: '',
            nric: '',
            departmentId: '',
            dateJoin: '',
            formType: '',
            skillSet: '',
        };

        this.formConfigSignal.update(cfg => ({
            ...cfg,
            title: 'Add New Staff',
            model: initialModel,
        }));
        this.loading.set(false);
    }

    //#endregion

    //#region EVENT HANDLERS
    onRemoteOutput(event: Record<string, any>): void {
        if (event['modelChange']) {
            this.handleModelChange(event['modelChange']);
        }

        if (event['formButtonClicked']) {
            this.addStaff(event['formButtonClicked']);
        }
    }

    private handleModelChange(model: Record<string, any>): void {
        const currentFormType = model['formType'];

        // If formType changed, reload skillSet options
        if (currentFormType !== this.previousFormType) {
            this.previousFormType = currentFormType;
            this.onFormTypeChange(currentFormType);
        }
    }

    //#endregion

    //#region API DATA LOADING METHODS

    private loadFormTypeDropdown(): Promise<void> {
        return new Promise((resolve) => {
            this.staffService.getFormTypes().subscribe({
                next: (data) => {
                    this.formTypeOpts.set(data);
                    this.updateFieldOptions('formType', data);
                    resolve();
                },
                error: (err) => {
                    this.messageService.showError('Error', 'Failed to load Form Types');
                    resolve();
                }
            });
        });
    }

    private loadSkillSetDropdown(formType: string): Promise<void> {
        if (!formType) {
            this.skillSetOpts.set([]);
            this.updateFieldOptions('skillSet', []);
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            this.staffService.getSkillSetsByFormType(formType).subscribe({
                next: (data) => {
                    this.skillSetOpts.set(data);
                    this.updateFieldOptions('skillSet', data);
                    resolve();
                },
                error: (err) => {
                    this.messageService.showError('Error', 'Failed to load Skillset');
                    resolve();
                }
            });
        });
    }

    private onFormTypeChange(formType: string): void {
        if (!formType) {
            this.skillSetOpts.set([]);
            this.updateFieldOptions('skillSet', []);
            this.updateFormModel({ skillSet: '' });
            return;
        }

        this.loadSkillSetDropdown(formType);
        this.updateFormModel({ skillSet: '' });
    }

    //#endregion

    //#region FORM SUBMISSION & STAFF CREATION

    addStaff(model: Record<string, any>): void {
        const payload = this.buildPayload(model);

        this.saving.set(true);

        this.staffService.createStaff(payload).subscribe({
            next: () => {
                this.messageService.showSuccess('Success', 'Staff created successfully!');
                this.saving.set(false);
                this.router.navigate(['/contact/staff/']);
            },
            error: (err) => {
                this.messageService.showError(
                    'Error', 
                    err.error?.error || 'Failed to create staff');
                this.saving.set(false);
            }
        });
    }

    private buildPayload(model: Record<string, any>): Record<string, any> {

        // Field name mapping (form → backend)
        const fieldMap: Record<string, string> = { };

        const dateFields = ['dateJoin'];
        const uppercaseFields = ['staffId', 'staffName'];

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

    private updateFormModel(updates: Record<string, any>): void {
        this.formConfigSignal.update((cfg) => ({
            ...cfg,
            model: { ...cfg.model, ...updates },
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