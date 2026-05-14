import { FormConfig } from '@ai-solutions-ui/form-component';
import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';
import { RemoteComponent } from '../../components/remote-component';
import { DropdownOption, IAppMessageService, LoadingState } from '../../models/contact';
import { ContactStaffService } from '../services/contact-staff-service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
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
    FloatingActionBarComponent,
    CardModule
  ],
  templateUrl: './contact-staff-security-component.html',
  styleUrls: ['./contact-staff-security-component.scss'],
})
export class ContactStaffSecurityComponent implements OnInit {

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

  groupAuthorityOpts = signal<DropdownOption[]>([]);

  uniqId = signal<number | null>(null);
  LoadingState = LoadingState;
  loadingState = signal<LoadingState>(LoadingState.Loading);
  saving = signal<boolean>(false);

  uiMfeUrl = environment.uiMfeUrl;

  actionButtons: ActionButton[] = [
    { label: 'Cancel', icon: 'pi pi-times', action: 'cancel', severity: 'secondary', outlined: true },
    { label: 'Save',   icon: 'pi pi-check', action: 'save',   severity: 'primary' },
  ];

  triggerSubmit = signal<boolean>(false);
  private currentFormModel: Record<string, any> = {};
  private previousSystemUser: boolean | null = null;

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
      type: 'select' as const,
      icon: 'pi-sitemap',
      colSpan: 6,
      options: [],
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

    this.staffService.getGroupAuthorities().subscribe({
      next: (opts) => {
        this.groupAuthorityOpts.set(opts);
        this.updateFieldOptions('secGroupAuthority', opts);
        this.loadStaff(id);
      },
      error: () => {
        this.updateFieldOptions('secGroupAuthority', []);
        this.loadStaff(id);
      }
    });
  }

  private loadStaff(id: number): void {
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
    const isSystemUser = this.ynToBoolean(staff['systemUser']);

    const formData = {
      ...staff,
      systemUser: isSystemUser,
      disablePassword: this.bitToBoolean(staff['disablePassword']),
      changePassword: this.bitToBoolean(staff['changePassword']),
    };

    this.updateSecurityFields(isSystemUser);
    this.previousSystemUser = isSystemUser;
    this.setFormModel(formData);
    this.loadingState.set(LoadingState.Success);
  }

  private setFormModel(staff: Record<string, any>): void {
    this.formConfigSignal.update(cfg => ({
      ...cfg,
      model: { ...staff }
    }));
  }

  private updateSecurityFields(isSystemUser: boolean): void {
    const conditionalKeys = ['loginId', 'disablePassword', 'changePassword'];
    this.formConfigSignal.update(cfg => ({
      ...cfg,
      fields: cfg.fields.map(field =>
        conditionalKeys.includes(field.key)
          ? { ...field, hiddenWhen: () => !isSystemUser }
          : field
      )
    }));
  }

  private updateFieldOptions(fieldKey: string, options: DropdownOption[]): void {
    this.formConfigSignal.update(cfg => ({
      ...cfg,
      fields: cfg.fields.map(field =>
        field.key === fieldKey ? { ...field, options } : field
      )
    }));
  }

  //#endregion

  //#region EVENT HANDLERS

  onRemoteOutput(event: Record<string, any>): void {
    if (event['modelChange']) {
      this.currentFormModel = event['modelChange'];

      const isSystemUser = !!event['modelChange']['systemUser'];
      if (this.previousSystemUser !== isSystemUser) {
        this.previousSystemUser = isSystemUser;
        this.updateSecurityFields(isSystemUser);
      }
    }

    if (event['formSubmit']) {
      this.triggerSubmit.set(false);
      this.editStaffSecurity(event['formSubmit']);
    }

    if ('validationFailed' in event) {
      this.triggerSubmit.set(false);
      this.messageService.showWarn('Validation', 'Please check the form for errors');
    }
  }

  //#endregion

  //#region FLOATING ACTION BAR HANDLERS

  onCancel(): void {
    this.router.navigate(['/contact/staff']);
  }

  onSave(): void {
    if (Object.keys(this.currentFormModel).length === 0) {
      this.messageService.showInfo('No Changes', 'There are no changes to save');
      return;
    }
    this.triggerSubmit.set(true);
  }

  //#endregion

  //#region FORM SUBMISSION

  private editStaffSecurity(model: Record<string, any>): void {
    this.saving.set(true);

    const id = this.uniqId();
    if (!id) {
      this.messageService.showError('Error', 'Invalid Staff ID');
      return;
    }

    const payload = this.buildPayload(model);

    this.staffService.updateStaffSecurity(id, payload).subscribe({
      next: () => {
        this.messageService.showSuccess('Success', 'Security settings updated successfully!');
        this.saving.set(false);
        this.router.navigate(['/contact/staff/']);
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Failed to update security settings');
        this.saving.set(false);
      }
    });
  }

  private buildPayload(model: Record<string, any>): Record<string, any> {
    return {
      ...model,
      systemUser: model['systemUser'] ? 'Y' : 'N',
      disablePassword: model['disablePassword'] ? 1 : 0,
      changePassword: model['changePassword'] ? 1 : 0,
    };
  }

  //#endregion

  //#region UTILITY METHODS

  private ynToBoolean(value: string | null | undefined): boolean {
    return value === 'Y';
  }

  private bitToBoolean(value: number | boolean | null | undefined): boolean {
    if (typeof value === 'boolean') return value;
    return value === 1;
  }

  //#endregion
}
