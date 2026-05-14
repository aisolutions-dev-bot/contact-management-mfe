import { Component, computed, Inject, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormConfig } from '@ai-solutions-ui/form-component';
import { RemoteComponent } from '../../components/remote-component';
import { ContactStaffService } from '../services/contact-staff-service';
import { environment } from '../../../environments/environment';
import { DropdownOption, DropdownResponse, IAppMessageService, LoadingState } from '../../models/contact';
import { ActionButton, FloatingActionBarComponent } from '../../components/floating-action-bar/floating-action-bar-component';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Validators } from '@angular/forms';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact-staff-add',
  standalone: true,
  imports: [
    RemoteComponent,
    ProgressSpinnerModule,
    ButtonModule,
    CardModule,
    RouterLink,
    SelectModule,
    InputTextModule,
    SelectButtonModule,
    FormsModule,
    FloatingActionBarComponent,
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

  // Wizard step tracking
  wizardStep = signal<number>(1);
  actionButtons = computed<ActionButton[]>(() => {
    if (this.wizardStep() === 1) {
      return [
        { label: 'Cancel', icon: 'pi pi-times', action: 'cancel', severity: 'secondary', outlined: true },
        { label: 'Next', icon: 'pi pi-arrow-right', action: 'next', severity: 'primary' },
      ];
    }
    return [
      { label: 'Back', icon: 'pi pi-arrow-left', action: 'back', severity: 'secondary', outlined: true },
      { label: 'Create', icon: 'pi pi-check', action: 'save', severity: 'primary' },
    ];
  });

  // Dropdown options
  departmentOpts = signal<DropdownOption[]>([]);
  formTypeOpts = signal<DropdownOption[]>([]);
  skillSetOpts = signal<DropdownOption[]>([]);
  groupAuthorityOpts = signal<DropdownOption[]>([]);

  // UI loading states
  fieldErrors = signal<Record<string, any>>({});
  LoadingState = LoadingState;
  loadingState = signal<LoadingState>(LoadingState.Loading);
  saving = signal<boolean>(false);

  // Configuration & Environment
  uiMfeUrl = environment.uiMfeUrl;

  // Track previous value for change detection
  private previousFormType: string = '';

  // Trigger form validation/submission
  triggerSubmit = signal<boolean>(false);

  // Step 1 form model storage
  private stepOneModel: Record<string, any> = {};

  // Step 2 Security fields
  loginId = signal<string>('');
  loginIdAutoFilled = false;
  password = signal<string>('password');
  systemUser = signal<string>('Y');
  groupAuthority = signal<string>('');
  systemUserOptions = [
    { label: 'Yes', value: 'Y' },
    { label: 'No', value: 'N' },
  ];

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
          this.loadGroupAuthorities();
        });
      },
      error: (err) => {
        this.messageService.showError('Error', 'Failed to load form data', err);
        this.loadingState.set(LoadingState.Error);
      }
    });
  }

  private loadGroupAuthorities(): void {
    this.staffService.getGroupAuthorities().subscribe({
      next: (data) => {
        this.groupAuthorityOpts.set(data);
        this.loadingState.set(LoadingState.Success);
      },
      error: () => {
        this.groupAuthorityOpts.set([]);
        this.loadingState.set(LoadingState.Success);
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
    this.stepOneModel = model;

    const newFormType = model?.['formType'] ?? '';

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

    if (!this.validateForm(model)) {
      this.messageService.showWarn(
        'Validation',
        'Please check the form for errors'
      );
      return;
    }

    // Save step 1 model and advance to step 2
    this.stepOneModel = model;

    if (this.systemUser() === 'Y' && !this.loginIdAutoFilled) {
      this.loginId.set(model['staffId'] || '');
      this.loginIdAutoFilled = true;
    }

    this.wizardStep.set(2);
  }

  //#endregion

  //#region WIZARD NAVIGATION

  onNext(): void {
    this.triggerSubmit.set(true);
  }

  wizardBack(): void {
    this.loginIdAutoFilled = false;
    this.formConfigSignal.update((cfg) => ({
      ...cfg,
      model: { ...this.stepOneModel }
    }));
    this.wizardStep.set(1);
  }

  onCancel(): void {
    this.router.navigate(['/contact/staff']);
  }

  onCreate(): void {
    const mergedPayload = this.buildMergedPayload();
    this.addStaff(mergedPayload);
  }

  onActionClicked(action: string): void {
    switch (action) {
      case 'cancel': this.onCancel(); break;
      case 'next': this.onNext(); break;
      case 'back': this.wizardBack(); break;
      case 'save': this.onCreate(); break;
    }
  }

  //#endregion

  //#region VALIDATION

  private validateForm(model: Record<string, any>): boolean {
    const errors: Record<string, string> = {};

    if (model['emailCompany']) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(model['emailCompany'])) {
        errors['emailCompany'] = 'Please enter a valid email address';
      }
    }

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

  private addStaff(payload: Record<string, any>): void {
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

  private buildMergedPayload(): Record<string, any> {
    const dateFields = ['dateJoin'];
    const uppercaseFields = ['staffId', 'staffName'];

    const step1Payload: Record<string, any> = {};

    Object.entries(this.stepOneModel).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      if (dateFields.includes(key)) {
        if (value instanceof Date) {
          step1Payload[key] = this.convertDateToISOWithTimezone(value);
        } else {
          step1Payload[key] = value;
        }
      } else if (uppercaseFields.includes(key) && typeof value === 'string') {
        step1Payload[key] = value.toUpperCase();
      } else {
        step1Payload[key] = value;
      }
    });

    const securityFields: Record<string, any> = {
      systemUser: this.systemUser(),
      secGroupAuthority: this.groupAuthority(),
    };

    if (this.systemUser() === 'Y') {
      securityFields['loginId'] = this.loginId();
      securityFields['password'] = this.password();
      securityFields['changePassword'] = 1;
    }

    return {
      ...step1Payload,
      ...securityFields,
    };
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
