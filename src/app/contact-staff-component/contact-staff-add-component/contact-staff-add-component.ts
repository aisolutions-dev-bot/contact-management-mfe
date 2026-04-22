import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormConfig } from '@ai-solutions-ui/form-component';
import { RemoteComponent } from '../../components/remote-component';
import { ContactStaffService } from '../services/contact-staff-service';
import { environment } from '../../../environments/environment';
import { DropdownOption, DropdownResponse, IAppMessageService, LoadingState } from '../../models/contact';
import { ButtonModule } from 'primeng/button';
import { Validators } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ActionButton, FloatingActionBarComponent } from '../../components/floating-action-bar/floating-action-bar-component';

@Component({
  selector: 'app-contact-staff-add',
  standalone: true,
  imports: [
    RemoteComponent,
    ProgressSpinnerModule,
    ButtonModule,
    RouterLink,
    FloatingActionBarComponent
  ],
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

  // Dropdown options
  departmentOpts = signal<DropdownOption[]>([]);
  formTypeOpts = signal<DropdownOption[]>([]);
  skillSetOpts = signal<DropdownOption[]>([]);

  // UI loading states
  fieldErrors = signal<Record<string, any>>({});
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
      label: 'Create',
      icon: 'pi pi-check',
      action: 'save',
      severity: 'primary',
    },
  ];

  // Track previous value for change detection
  private previousFormType: string = '';

  // Trigger form validation/submission
  triggerSubmit = signal<boolean>(false);

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
    title: 'Add New Staff',
    layout: 'grid',
    gridColumns: 6,
    fields: this.formFields,
    model: {
      staffId: null,
      staffName: null,
      nric: null,
      telMobile: null,
      departmentId: null,
      dateJoin: null,
      emailCompany: null,
      formType: null,
      skillSet: null,
    },
    showButton: false,
  });

  formConfig = this.formConfigSignal.asReadonly();

  //#endregion

  ngOnInit(): void {
    this.loadInitialFormData();
  }

  //#region DATA LOADING

  private loadInitialFormData(): void {
    this.loadingState.set(LoadingState.Loading);

    const requiredTypes = ['departments'];

    this.staffService.getDropdownsByTypes(requiredTypes).subscribe({
      next: (data: DropdownResponse) => {
        this.updateFieldOptions('departmentId', data.departments || []);

        this.loadFormTypeDropdown().then(() => {
          this.loadingState.set(LoadingState.Success);
        });
      },
      error: (err) => {
        this.messageService.showError('Error', 'Failed to load form data', err);
        this.loadingState.set(LoadingState.Error);
      }
    });
  }

  private loadFormTypeDropdown(): Promise<void> {
    return new Promise((resolve) => {
      this.staffService.getFormTypes().subscribe({
        next: (data) => {
          this.formTypeOpts.set(data);
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
          this.messageService.showError('Error', 'Failed to load Skillset');
          resolve();
        }
      });
    });
  }

  //#endregion

  //#region EVENT HANDLERS
  onRemoteOutput(event: Record<string, any>): void {
    if (event['modelChange']) {
      this.handleFormModelChange(event['modelChange']);
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

  private handleFormModelChange(model: Record<string, any>): void {
    this.fieldErrors.set({});

    const newFormType = model?.['formType'] ?? '';

    // If formType changed, reload skillSet options
    if (newFormType !== this.previousFormType) {
      this.previousFormType = newFormType;

      if (newFormType) {
        this.loadSkillSetForFormType(newFormType);
      } else {
        this.updateFieldOptions('skillSet', []);
      }
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
    
    this.addStaff(model);
  }

  //#endregion

  //#region FLOATING ACTION BAR HANDLERS

  onCancel(): void {
    this.router.navigate(['/contact/staff']);
  }

  onSave(): void {
    // Trigger form validation and submission
    this.triggerSubmit.set(true);
  }

  //#endregion

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

    // Phone validation - flexible for MY/SG
    if (model['telMobile']) {
      const cleanedPhone = model['telMobile'].replace(/[\s\-\(\)]/g, '');
      const phoneRegex = /^[\+]?[0-9]{8,15}$/;

      if (!phoneRegex.test(cleanedPhone)) {
        errors['telMobile'] = 'Please enter a valid phone number (6-15 digits)';
      }
    }

    this.fieldErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  //#endregion

  //#region FORM SUBMISSION & STAFF CREATION

  private addStaff(model: Record<string, any>): void {
    this.saving.set(true);

    const payload = this.buildPayload(model);

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
    const dateFields = ['dateJoin'];
    const uppercaseFields = ['staffId', 'staffName'];

    const payload: Record<string, any> = {};

    // Build payload from model
    Object.entries(model).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      if (dateFields.includes(key)) {
        if (value instanceof Date) {
          payload[key] = this.convertDateToISOWithTimezone(value);
        } else {
          payload[key] = value;
        }
      } else if (uppercaseFields.includes(key) && typeof value === 'string') {
        payload[key] = value.toUpperCase();
      }
      else {
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

  private convertDateToISOWithTimezone(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const result = `${year}-${month}-${day}T00:00:00`;
    return result;
  }

  //#endregion 

}