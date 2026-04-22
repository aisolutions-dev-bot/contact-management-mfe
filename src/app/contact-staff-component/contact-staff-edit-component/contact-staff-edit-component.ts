import { FormConfig } from '@ai-solutions-ui/form-component';
import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';
import { RemoteComponent } from '../../components/remote-component';
import { DropdownOption, DropdownResponse, IAppMessageService, LoadingState } from '../../models/contact';
import { ContactStaffService } from '../services/contact-staff-service';
import { Validators } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ActionButton, FloatingActionBarComponent } from '../../components/floating-action-bar/floating-action-bar-component';

@Component({
  selector: 'app-contact-staff-edit',
  standalone: true,
  imports: [
    RemoteComponent,
    ProgressSpinnerModule,
    ButtonModule,
    RouterLink,
    FloatingActionBarComponent
  ],
  templateUrl: './contact-staff-edit-component.html',
  styleUrls: ['./contact-staff-edit-component.scss'],
})
export class ContactStaffEditComponent implements OnInit {

  //#region INJECTED DEPENDENCIES
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private staffService = inject(ContactStaffService);

  constructor(
    @Inject('MESSAGING_SERVICE')
    public messageService: IAppMessageService,
  ) { }
  //#endregion

  //#region SIGNALS - UI STATE MANAGEMENT

  // UI loading states
  externalPatch = signal<Record<string, any> | null>(null);
  fieldErrors = signal<Record<string, any>>({});
  uniqId = signal<number | null>(null);
  LoadingState = LoadingState;
  loadingState = signal<LoadingState>(LoadingState.Loading);
  saving = signal<boolean>(false);

  // Configuration & Environment
  uiMfeUrl = environment.uiMfeUrl;

  // Floating action bar buttons
  actionButtons: ActionButton[] = [
    {
      label: 'Cancel',
      icon: 'pi pi-times',
      action: 'cancel',
      severity: 'secondary',
      outlined: true,
    },
    {
      label: 'Save',
      icon: 'pi pi-check',
      action: 'save',
      severity: 'primary',
    },
  ];

  // Track previous value for change detection
  private previousFormType = '';

  // Trigger form validation/submission
  triggerSubmit = signal<boolean>(false);

  // Form model tracking
  private currentFormModel: Record<string, any> = {};

  //#endregion

  //#region FORM CONFIGURATION

  private readonly formFields = [
    {
      key: 'staffId',
      label: 'Staff ID',
      type: 'text' as const,
      icon: 'pi-hashtag',
      colSpan: 3,
      validators: [Validators.required],
    },
    {
      key: 'staffName',
      label: 'Staff Name',
      type: 'text' as const,
      icon: 'pi-user',
      colSpan: 3,
      validators: [Validators.required],
    },
    {
      key: 'nric',
      label: 'NRIC',
      type: 'text' as const,
      icon: 'pi-id-card',
      colSpan: 3,
    },
    {
      key: 'telMobile',
      label: 'Mobile No.',
      type: 'text' as const,
      icon: 'pi-phone',
      colSpan: 3,
    },
    {
      key: 'departmentId',
      label: 'Department',
      type: 'select' as const,
      icon: 'pi-sitemap',
      colSpan: 4,
      options: [],
      validators: [Validators.required],
    },
    {
      key: 'dateJoin',
      label: 'Join Date',
      type: 'date' as const,
      icon: 'pi-calendar',
      colSpan: 2,
    },
    {
      key: 'emailCompany',
      label: 'Email',
      type: 'email' as const,
      icon: 'pi-envelope',
      colSpan: 6,
      validators: [Validators.email],
    },
    {
      key: 'formType',
      label: 'Form Type',
      type: 'select' as const,
      icon: 'pi-file',
      colSpan: 6,
      options: [],
    },
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
    model: {},
    showButton: false,
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

  //#region DATA LOADING

  private loadInitialFormData(id: number): void {
    this.loadingState.set(LoadingState.Loading);

    const requiredTypes = ['departments'];

    this.staffService.getDropdownsByTypes(requiredTypes).subscribe({
      next: (data: DropdownResponse) => {
        this.updateFieldOptions('departmentId', data.departments || []);

        this.loadFormTypeDropdown().then(() => {
          this.loadStaff(id);
        });
      },
      error: (err) => {
        this.messageService.showError('Error', 'Failed to load form data', err);
        this.loadingState.set(LoadingState.Error);
      }
    });
  }

  private loadStaff(id: number): void {
    this.loadingState.set(LoadingState.Loading);

    this.staffService.getStaffById(id).subscribe({
      next: (staff) => {
        this.handleStaffLoaded(staff);
      },
      error: (err) => {
        this.messageService.showError('Error', 'Failed to load staff data', err);
        this.router.navigate(['/contact/staff']);
      }
    });
  }

  private handleStaffLoaded(staff: Record<string, any>): void {
    const formattedStaff = this.formatStaffData(staff);

    // Track formType for change detection
    this.previousFormType = formattedStaff['formType'] || '';

    // If staff has formType, load skillSet options first
    if (formattedStaff['formType']) {
      this.loadSkillSetForFormType(formattedStaff['formType']).then(() => {
        this.initializeFormWithData(formattedStaff);
      });
    } else {
      this.initializeFormWithData(formattedStaff);
    }
  }

  private initializeFormWithData(staff: Record<string, any>): void {
    this.formConfigSignal.update((cfg) => ({
      ...cfg,
      title: `Edit Staff: ${staff['staffName'] || ''}`,
      model: {
        staffId: staff['staffId'] ?? null,
        staffName: staff['staffName'] ?? null,
        nric: staff['nric'] ?? null,
        telMobile: staff['telMobile']?.trim() ?? null,
        departmentId: staff['departmentId']?.trim() ?? null,
        dateJoin: staff['dateJoin'] ?? null,
        emailCompany: staff['emailCompany']?.trim() ?? null,
        formType: staff['formType']?.trim() ?? null,
        skillSet: staff['skillSet']?.trim() ?? null,
      },
    }));

    this.loadingState.set(LoadingState.Success);
  }

  private formatStaffData(staff: Record<string, any>): Record<string, any> {
    return {
      ...staff,
      dateJoin: this.formatDate(staff['dateJoin']),
      departmentId: staff['departmentId']?.trim() || null,
      formType: staff['formType']?.trim() || null,
      skillSet: staff['skillSet']?.trim() || null,
      emailCompany: staff['emailCompany']?.trim() || null,
      telMobile: staff['telMobile']?.trim() || null,
    };
  }

  private loadFormTypeDropdown(): Promise<void> {
    return new Promise((resolve) => {
      this.staffService.getFormTypes().subscribe({
        next: (data) => {
          this.updateFieldOptions('formType', data);
          resolve();
        },
        error: () => {
          this.messageService.showError('Error', 'Failed to load Form Types');
          resolve();
        }
      });
    });
  }

  private loadSkillSetForFormType(formType: string): Promise<void> {
    if (!formType) {
      this.updateFieldOptions('skillSet', []);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.staffService.getSkillSetsByFormType(formType).subscribe({
        next: (data) => {
          this.updateFieldOptions('skillSet', data);
          resolve();
        },
        error: () => {
          this.updateFieldOptions('skillSet', []);
          this.messageService.showError('Error', 'Failed to load Skill Sets');
          resolve();
        }
      });
    });
  }

  //#endregion

  //#region EVENT HANDLERS

  onRemoteOutput(event: Record<string, any>): void {
    if (event['modelChange']) {
      this.handleModelChange(event['modelChange']);
      this.currentFormModel = event['modelChange'];
    }

    if (event['formSubmit']) {
      this.handleFormSubmit(event['formSubmit']);
    }

    if ('validationFailed' in event) {
      this.triggerSubmit.set(false);
      this.messageService.showWarn(
        'Validation',
        'Please check the form for errors'
      );
    }
  }

  private handleModelChange(model: Record<string, any>): void {
    this.fieldErrors.set({});

    const newFormType = model?.['formType'] ?? '';

    // Only do if formType actually changed
    if (newFormType !== this.previousFormType) {
      this.previousFormType = newFormType;

      if (newFormType) {
        this.loadSkillSetForFormType(newFormType);
      } else {
        this.updateFieldOptions('skillSet', []);
      }

      // Clear skillSet selection when formType changes
      this.externalPatch.set({ skillSet: '' });
    }
  }

  private handleFormSubmit(model: Record<string, any>): void {
    this.triggerSubmit.set(false);

    // Run custom validation
    if (!this.validateForm(model)) {
      this.messageService.showWarn(
        'Validation',
        'Please check the form for errors'
      );
      return;
    }

    this.editStaff(model);
  }

  //#endregion

  //#region FLOATING ACTION BAR HANDLERS

  onCancel(): void {
    this.router.navigate(['/contact/staff']);
  }

  onSave(): void {
    // Check if form has data
    if (Object.keys(this.currentFormModel).length === 0) {
      this.messageService.showInfo(
        'No Changes',
        'There are no changes to save'
      );
      return;
    }

    // Trigger form validation and submission
    this.triggerSubmit.set(true);
  }

  //#region VALIDATION

  private validateForm(model: Record<string, any>): boolean {
    const errors: Record<string, string> = {};

    // Email validation
    if (model['emailCompany']) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(model['emailCompany'])) {
        errors['emailCompany'] = 'Please enter a valid email address';
      }
    }

    // Phone validation - Might need requirement on this
    if (model['telMobile']) {
      const cleanedPhone = model['telMobile'].replace(/[\s\-\(\)]/g, '');
      const phoneRegex = /^[\+]?[0-9]{6,15}$/;

      if (!phoneRegex.test(cleanedPhone)) {
        errors['telMobile'] = 'Please enter a valid phone number (6-15 digits)';
      }
    }

    this.fieldErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  //#endregion

  //#region FORM SUBMISSION & STAFF UPDATE

  private editStaff(model: Record<string, any>): void {
    this.saving.set(true);

    const id = this.uniqId();
    if (!id) {
      this.messageService.showError('Error', 'Invalid Staff ID');
      this.saving.set(false);
      return;
    }

    const payload = this.buildPayload(model);

    this.staffService.updateStaff(id, payload).subscribe({
      next: () => {
        this.messageService.showSuccess('Success', 'Staff updated successfully!');
        this.saving.set(false);
        this.router.navigate(['/contact/staff/']);
      },
      error: (err) => {
        this.messageService.showError(
          'Error',
          err.error?.error || 'Failed to update staff');
        this.saving.set(false);
      }
    });
  }

  private buildPayload(model: Record<string, any>): Record<string, any> {
    const dateFields = ['dateJoin'];
    const uppercaseFields = ['staffId', 'staffName'];
    const payload: Record<string, any> = {};

    Object.entries(model).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      if (dateFields.includes(key)) {
        if (value instanceof Date) {
          payload[key] = this.convertDateToISOWithTimezone(value);
        } else if (typeof value === 'string' && value) {
          const parsedDate = this.parseFormattedDate(value);
          if (parsedDate) {
            payload[key] = this.convertDateToISOWithTimezone(parsedDate);
          }
        }
      } else if (uppercaseFields.includes(key) && typeof value === 'string') {
        payload[key] = value.toUpperCase();
      } else {
        payload[key] = value;
      }
    });

    return payload;
  }

  //#endregion

  //#region FORM MANIPULATION HELPERS

  private updateFieldOptions(fieldKey: string, options: DropdownOption[]): void {
    this.formConfigSignal.update((cfg) => ({
      ...cfg,
      fields: cfg.fields.map((field) =>
        field.key === fieldKey ? { ...field, options } : field
      )
    }));
  }

  //#endregion

  //#region UTILITY METHODS - Date & Format Conversions

  private parseFormattedDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    try {
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;

      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      const date = new Date(year, month, day);
      if (isNaN(date.getTime())) return null;

      return date;
    } catch {
      return null;
    }
  }

  private formatDate(value: any): string {
    if (!value) return '';

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return '';

      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();

      return `${month}/${day}/${year}`;
    } catch {
      return '';
    }
  }

  private convertDateToISOWithTimezone(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}T00:00:00`;
  }

  //#endregion

}