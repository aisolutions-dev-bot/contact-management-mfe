import { FormConfig } from '@ai-solutions-ui/form-component';
import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';
import { RemoteComponent } from '../../components/remote-component';
import { DropdownOption, IAppMessageService, LoadingState } from '../../models/contact';
import { ContactStaffService } from '../services/contact-staff-service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Validators } from '@angular/forms';
import { ActionButton, FloatingActionBarComponent } from '../../components/floating-action-bar/floating-action-bar-component';

@Component({
  selector: 'app-contact-staff-security',
  standalone: true,
  imports: [
    RemoteComponent,
    ProgressSpinnerModule,
    ButtonModule,
    RouterLink,
    FloatingActionBarComponent
  ],
  templateUrl: './contact-staff-security-component.html',
  styleUrls: ['./contact-staff-security-component.scss'],
})
export class ContactStaffSecurityComponent implements OnInit {

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

  // Dropdown options
  departmentOpts = signal<DropdownOption[]>([]);

  // UI loading states
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

  // Trigger form validation/submission
  triggerSubmit = signal<boolean>(false);

  // Form model tracking
  private currentFormModel: Record<string, any> = {};

  //#endregion

  //#region FORM CONFIGURATION

  private readonly formFields = [
    {
      key: 'staffName',
      label: 'Name',
      type: 'text' as const,
      icon: 'pi-id-card',
      disabledWhen: () => true,
      colSpan: 6,
    },
    {
      key: 'secGroupAuthority',
      label: 'User Authority',
      type: 'text' as const,
      icon: 'pi-sitemap',
      colSpan: 6,
    },
    {
      key: 'loginId',
      label: 'Login ID',
      type: 'text' as const,
      icon: 'pi-user',
      colSpan: 6,
      validators: [Validators.required],
    },
    {
      key: 'password',
      label: 'New Password',
      type: 'password' as const,
      icon: 'pi pi-lock',
      colSpan: 6,
      hiddenWhen: () => true,
    },
    {
      key: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password' as const,
      icon: 'pi pi-lock',
      colSpan: 6,
      hiddenWhen: () => true,
    },
    {
      key: 'systemUser',
      label: 'System User:',
      type: 'toggle' as const,
      colSpan: 2,
    },
    {
      key: 'disablePassword',
      label: 'Disable Password:',
      type: 'toggle' as const,
      colSpan: 2,
    },
    {
      key: 'changePassword',
      label: 'Change Password:',
      type: 'toggle' as const,
      colSpan: 2,
    },
  ];

  private formConfigSignal = signal<FormConfig>({
    title: 'Security',
    fields: this.formFields,
    layout: 'grid',
    gridColumns: 6,
    model: {
      staffName: null,
      secGroupAuthority: null,
      loginId: null,
      password: null,
      confirmPassword: null,
      systemUser: false,
      disablePassword: false,
      changePassword: false,

    },
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
    this.loadStaff(id);
  }

  private loadStaff(id: number): void {
    this.loadingState.set(LoadingState.Loading);

    this.staffService.getStaffById(id).subscribe({
      next: (staff) => {
        this.handleStaffLoaded(staff);
      },
      error: (err) => {
        this.messageService.showError(
          'Error',
          err.error?.error || err.message || 'Failed to load staff'
        );
        this.router.navigate(['/contact/staff/list']);
      }
    });
  }

  private handleStaffLoaded(staff: Record<string, any>): void {
    const formData = {
      ...staff,
      systemUser: this.ynToBoolean(staff['systemUser']),
      disablePassword: this.bitToBoolean(staff['disablePassword']),
      changePassword: this.bitToBoolean(staff['changePassword']),
    };

    this.setFormModel(formData);
    this.loadingState.set(LoadingState.Success);
  }

  private setFormModel(staff: Record<string, any>): void {
    this.formConfigSignal.update(cfg => ({
      ...cfg,
      title: 'Security',
      model: { ...staff }
    }));
  }

  //#endregion

  //#region EVENT HANDLERS

  onRemoteOutput(event: Record<string, any>): void {
    if (event['modelChange']) {
      this.currentFormModel = event['modelChange'];
    }

    if (event['formSubmit']) {
      this.triggerSubmit.set(false);
      this.editStaffSecurity(event['formSubmit']);
    }

    if ('validationFailed' in event) {
      this.triggerSubmit.set(false);
      this.messageService.showWarn(
        'Validation',
        'Please check the form for errors'
      );
    }
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

  //#endregion

  //#region FORM SUBMISSION & STAFF SECURITY UPDATE

  private editStaffSecurity(model: Record<string, any>): void {
    this.saving.set(true);
    
    const id = this.uniqId();
    if (!id) {
      this.messageService.showError('Error', 'Invalid Staff ID');
      return;
    }

    // Validate passwords
    if (!this.validatePasswords(model)) {
      return;
    }

    const payload = this.buildPayload(model);

    this.staffService.updateStaffSecurity(id, payload).subscribe({
      next: () => {
        this.messageService.showSuccess('Success', 'Security settings updated successfully!');
        this.clearPasswordFields();
        this.saving.set(false);
        this.router.navigate(['/contact/staff/']);
      },
      error: (err) => {
        this.messageService.showError(
          'Error',
          err.error?.message || 'Failed to update security settings'
        );
        this.saving.set(false);
      }
    });
  }

  private validatePasswords(model: Record<string, any>): boolean {
    const password = model['password'];
    const confirmPassword = model['confirmPassword'];

    // If password are filled
    if (password || confirmPassword) {
      if (password != confirmPassword) {
        this.messageService.showError('Error', 'Passwords do not match');
        return false;
      }

      if (password.length < 8) {
        this.messageService.showError('Error', 'Password must be at least 8 characters');
        return false;
      }
      // Optional
      // const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
      // if (!strongPasswordRegex.test(password)) {
      //     this.messageService.showError(
      //     'Error', 
      //     'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      //     );
      //     return false;
      // }
    }
    return true;
  }

  private buildPayload(model: Record<string, any>): Record<string, any> {
    const payload: Record<string, any> = {
      ...model,
      systemUser: model['systemUser'] ? 'Y' : 'N',
      disablePassword: model['disablePassword'] ? 1 : 0,
      changePassword: model['changePassword'] ? 1 : 0,
    };

    // TODO: Add password when feature is ready
    // if (model['password'] && model['password'].trim() !== '') {
    //     payload['password'] = model['password'];
    // }
    return payload;
  }

  private clearPasswordFields(): void {
    this.formConfigSignal.update(cfg => ({
      ...cfg,
      model: {
        ...cfg.model,
        password: '',
        confirmPassword: '',
      }
    }));
  }

  //#endregion

  //#region UTILITY METHODS

  private ynToBoolean(value: string | null | undefined): boolean {
    return value === 'Y';
  }

  private bitToBoolean(value: number | boolean | null | undefined): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    return value === 1;
  }

  //#endregion

}