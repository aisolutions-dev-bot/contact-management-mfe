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
import {
  ContactStaffPayrollComponent,
  emptyStaffPayroll,
  StaffPayroll,
  StaffPayrollErrors,
  staffPayrollErrors,
} from '../contact-staff-payroll-component/contact-staff-payroll-component';

type WizardStepKey = 'basic' | 'payroll' | 'security';

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
    ContactStaffPayrollComponent,
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

  // Wizard step tracking (1-based); the payroll step exists only when Payroll is subscribed
  wizardStep = signal<number>(1);
  payrollEnabled = signal<boolean>(false);
  nationalityOpts = signal<DropdownOption[]>([]);
  shiftTypeOpts = signal<DropdownOption[]>([]);
  payroll = signal<StaffPayroll>(emptyStaffPayroll());
  payrollErrors = signal<StaffPayrollErrors>({});
  steps = computed<WizardStepKey[]>(() =>
    this.payrollEnabled() ? ['basic', 'payroll', 'security'] : ['basic', 'security'],
  );
  stepKey = computed<WizardStepKey>(() => this.steps()[this.wizardStep() - 1]);
  actionButtons = computed<ActionButton[]>(() => {
    const first: ActionButton = this.wizardStep() === 1
      ? { label: 'Cancel', icon: 'pi pi-times', action: 'cancel', severity: 'secondary', outlined: true }
      : { label: 'Back', icon: 'pi pi-arrow-left', action: 'back', severity: 'secondary', outlined: true };
    const last: ActionButton = this.wizardStep() === this.steps().length
      ? { label: 'Create', icon: 'pi pi-check', action: 'save', severity: 'primary' }
      : { label: 'Next', icon: 'pi pi-arrow-right', action: 'next', severity: 'primary' };
    return [first, last];
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
        this.loadPayrollOptions();
      },
      error: () => {
        this.groupAuthorityOpts.set([]);
        this.loadPayrollOptions();
      }
    });
  }

  private loadPayrollOptions(): void {
    this.staffService.getPayrollOptions().subscribe({
      next: (options) => {
        this.payrollEnabled.set(options.subscribed);
        this.nationalityOpts.set(options.nationalities ?? []);
        this.shiftTypeOpts.set(options.shiftTypes ?? []);
        this.loadingState.set(LoadingState.Success);
      },
      error: () => {
        this.payrollEnabled.set(false);
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

    // Save step 1 model and advance
    this.stepOneModel = model;
    this.goToStep(2);
  }

  //#endregion

  //#region WIZARD NAVIGATION

  onNext(): void {
    if (this.stepKey() === 'basic') {
      this.triggerSubmit.set(true);
      return;
    }
    if (this.stepKey() === 'payroll' && !this.payrollValid()) {
      return;
    }
    this.goToStep(this.wizardStep() + 1);
  }

  private payrollValid(): boolean {
    const errors = staffPayrollErrors(this.payroll());
    this.payrollErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  private goToStep(step: number): void {
    this.wizardStep.set(step);
    const reachedSecurity = this.steps()[step - 1] === 'security';
    if (reachedSecurity && this.systemUser() === 'Y' && !this.loginIdAutoFilled) {
      this.loginId.set(this.stepOneModel['staffId'] || '');
      this.loginIdAutoFilled = true;
    }
  }

  wizardBack(): void {
    if (this.wizardStep() > 2) {
      this.wizardStep.update((step) => step - 1);
      return;
    }
    this.returnToFirstStep();
  }

  private returnToFirstStep(): void {
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
    // Email is mandatory for system users (they receive the account activation link).
    // The System User toggle lives on step 2, so validate here before creating.
    if (this.systemUser() === 'Y') {
      const email = this.stepOneModel['emailCompany'];
      if (!email || !String(email).trim()) {
        this.messageService.showWarn(
          'Validation',
          'Email is required when System User is set to Yes.'
        );
        this.returnToFirstStep();
        return;
      }
    }

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
      next: () => this.savePayrollThenLeave(payload['staffId']),
      error: (err) => {
        this.messageService.showError(
          'Error',
          err.error?.error || 'Failed to create staff');
        this.saving.set(false);
      }
    });
  }

  /** A payroll row is saved only when something was entered, so untouched staff stay "not set up". */
  private payrollEntered(): boolean {
    return this.payrollEnabled() && JSON.stringify(this.payroll()) !== JSON.stringify(emptyStaffPayroll());
  }

  private savePayrollThenLeave(staffId: string): void {
    if (!this.payrollEntered()) {
      this.finishCreate();
      return;
    }
    this.staffService.saveStaffPayroll(staffId, this.payroll()).subscribe({
      next: () => this.finishCreate(),
      error: (err) => {
        this.messageService.showWarn(
          'Payroll setting not saved',
          err.error?.message || 'The staff was created, but the payroll setting could not be saved. Edit the staff to retry.');
        this.finishCreate(false);
      }
    });
  }

  private finishCreate(announce = true): void {
    if (announce) {
      this.messageService.showSuccess('Success', 'Staff created successfully!');
    }
    this.saving.set(false);
    this.router.navigate(['/contact/staff/']);
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
