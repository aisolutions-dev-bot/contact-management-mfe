import { FormConfig } from '@ai-solutions-ui/form-component';
import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';
import { RemoteComponent } from '../../components/remote-component';
import { DropdownOption, DropdownResponse, IAppMessageService } from '../../models/contact';
import { ContactStaffService } from '../services/contact-staff-service';

@Component({
    selector: 'app-contact-staff-edit',
    standalone: true,
    imports: [RemoteComponent, ButtonModule, RouterLink],
    templateUrl: './contact-staff-edit-component.html',
    styleUrls: ['./contact-staff-edit-component.scss'],
})
export class ContactStaffEditComponent implements OnInit {

    //#region INJECTED DEPENDECIES
    private route = inject(ActivatedRoute);
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
        title: 'Edit Staff',
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
        buttonLabel: 'Save Changes',
    });

    formConfig = this.formConfigSignal.asReadonly();
    //#endregion
 
    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const id = Number(params['id']);
            
            if (isNaN(id) || id <= 0) {
                this.messageService.showError('Error', 'Invalid Staff ID');
                this.router.navigate(['/contact/staff/list']);
                return;
            }
            
            this.uniqId.set(id);
            this.loadInitialFormData(id);
        });
    }

    //#region INITIALIZATION & DATA LOAD

    private loadInitialFormData(id: number): void {
        this.loading.set(true);
        
        const requiredTypes = ['departments'];

        this.staffService.getDropdownsByTypes(requiredTypes).subscribe({
            next: (data: DropdownResponse) => {
                this.processDropdownData(data)    
                
                this.loadFormTypeDropdown().then(() => {
                    this.loadStaff(id);
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

    private loadStaff(id: number): void {
        this.loading.set(true);
        
        this.staffService.getStaffById(id).subscribe({
            next: (staff) => {
                this.handleStaffLoaded(staff);
            },
            error: (err) => {
                this.messageService.showError(
                    'Error', 
                    err.error?.error || err.message || 'Failed to load staff'
                );
                this.loading.set(false);
                this.router.navigate(['/contact/staff/list']);
            }
        });
    }

    private handleStaffLoaded(staff: Record<string, any>): void {
        const formattedStaff = this.formatStaffData(staff);

        // If staff has formType, load skillSet option
        if (formattedStaff['formType']) {
            this.previousFormType = formattedStaff['formType'];
            this.loadSkillSetDropdown(formattedStaff['formType']).then(() => {
                this.setFormModel(formattedStaff);
                this.loading.set(false);
            });
        } else {
            this.setFormModel(formattedStaff);
            this.loading.set(false);
        }
    }

    private formatStaffData(staff: Record<string, any>): Record<string, any> {
        return {
            ...staff,
            dateJoin: this.formatDate(staff['dateJoin']),
        };
    }

    private setFormModel(staff: Record<string, any>): void {
        this.formConfigSignal.update(cfg => ({
            ...cfg,
            title: `Edit Staff: ${staff['staffName']}`,
            model: { ...staff }
        }));
    }

    //#endregion

    //#region EVENT HANDLERS

    onRemoteOutput(event: Record<string, any>): void {
        if (event['modelChange']) {
            this.handleModelChange(event['modelChange']);
        }

        if (event['formButtonClicked']) {
            this.updateStaff(event['formButtonClicked']);
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
  
    //#region FORM SUBMISSION & STAFF UPDATE

    updateStaff(model: Record<string, any>): void {
        const id = this.uniqId();
        if (!id) {
            this.messageService.showError('Error', 'Staff ID is missing');
            return;
        }

        const payload = this.buildPayload(model);

        this.saving.set(true);
        
        this.staffService.updateStaff(id, payload).subscribe({
        next: () => {
            this.messageService.showSuccess('Success', 'Staff updated successfully!');
            this.saving.set(false);
            this.loadInitialFormData(id);
        },
        error: (err) => {
            this.messageService.showError(
                'Error', 
                err.error?.message || 'Failed to update staff'
            );
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

    private updateFormModel(updates: Record<string, any>): void {
        this.formConfigSignal.update((cfg) => ({
            ...cfg,
            model: { ...cfg.model, ...updates },
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