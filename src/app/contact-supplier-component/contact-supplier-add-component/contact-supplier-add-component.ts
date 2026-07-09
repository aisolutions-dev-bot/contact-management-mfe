import { Component, computed, Inject, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormConfig } from '@ai-solutions-ui/form-component';
import { RemoteComponent } from '../../components/remote-component';
import { ContactSupplierService } from '../services/contact-supplier-service';
import { environment } from '../../../environments/environment';
import { DropdownOption, DropdownResponse, IAppMessageService, LoadingState } from '../../models/contact';
import { ActionButton, FloatingActionBarComponent } from '../../components/floating-action-bar/floating-action-bar-component';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  SUPPLIER_STEP1_FIELDS,
  SUPPLIER_STEP2_FIELDS,
  SUPPLIER_STEP3_FIELDS,
  SUPPLIER_STEP4_FIELDS,
  MAIN_TO_BILLING,
  emptyForFields,
  gstValidationError,
  normalizeGst,
} from '../supplier-form-fields';

@Component({
  selector: 'app-contact-supplier-add',
  standalone: true,
  imports: [
    RemoteComponent,
    ProgressSpinnerModule,
    ButtonModule,
    CardModule,
    RouterLink,
    FloatingActionBarComponent,
  ],
  templateUrl: './contact-supplier-add-component.html',
  styleUrls: ['./contact-supplier-add-component.scss'],
})
export class ContactSupplierAddComponent implements OnInit {

  //#region INJECTED DEPENDENCIES
  private router = inject(Router);
  private supplierService = inject(ContactSupplierService);

  constructor(
    @Inject('MESSAGING_SERVICE')
    public messageService: IAppMessageService,
  ) { }
  //#endregion

  //#region SIGNALS - UI STATE MANAGEMENT

  readonly TOTAL_STEPS = 4;
  wizardStep = signal<number>(1);

  actionButtons = computed<ActionButton[]>(() => {
    const step = this.wizardStep();
    const buttons: ActionButton[] = [];
    if (step === 1) {
      buttons.push({ label: 'Cancel', icon: 'pi pi-times', action: 'cancel', severity: 'secondary', outlined: true });
    } else {
      buttons.push({ label: 'Back', icon: 'pi pi-arrow-left', action: 'back', severity: 'secondary', outlined: true });
    }
    if (step < this.TOTAL_STEPS) {
      buttons.push({ label: 'Next', icon: 'pi pi-arrow-right', action: 'next', severity: 'primary' });
    } else {
      buttons.push({ label: 'Create', icon: 'pi pi-check', action: 'save', severity: 'primary' });
    }
    return buttons;
  });

  stepTitle = computed<string>(() => {
    switch (this.wizardStep()) {
      case 1: return 'Company & Classification';
      case 2: return 'Financial / Accounting';
      case 3: return 'Contact & Address';
      case 4: return 'Billing Contact & Address';
      default: return '';
    }
  });

  fieldErrors = signal<Record<string, any>>({});
  triggerSubmit = signal<boolean>(false);
  billingPatch = signal<Record<string, any> | null>(null);

  LoadingState = LoadingState;
  loadingState = signal<LoadingState>(LoadingState.Loading);
  saving = signal<boolean>(false);

  uiMfeUrl = environment.uiMfeUrl;

  // Accumulated model per step
  private model1: Record<string, any> = {};
  private model2: Record<string, any> = {};
  private model3: Record<string, any> = {};
  private model4: Record<string, any> = {};

  //#endregion

  //#region FORM CONFIGURATION

  config1 = signal<FormConfig>({
    title: '',
    layout: 'grid',
    gridColumns: 6,
    fields: SUPPLIER_STEP1_FIELDS,
    model: {},
    showButton: false,
  });

  config2 = signal<FormConfig>({
    title: '',
    layout: 'grid',
    gridColumns: 6,
    fields: SUPPLIER_STEP2_FIELDS,
    model: {},
    showButton: false,
  });

  config3 = signal<FormConfig>({
    title: '',
    layout: 'grid',
    gridColumns: 6,
    fields: SUPPLIER_STEP3_FIELDS,
    model: {},
    showButton: false,
  });

  config4 = signal<FormConfig>({
    title: '',
    layout: 'grid',
    gridColumns: 6,
    fields: SUPPLIER_STEP4_FIELDS,
    model: {},
    showButton: false,
  });

  //#endregion

  ngOnInit(): void {
    // Seed each step with ONLY its own fields so merging step models at save
    // time can't clobber one step's values with another step's null defaults.
    this.model1 = emptyForFields(SUPPLIER_STEP1_FIELDS);
    this.model2 = { ...emptyForFields(SUPPLIER_STEP2_FIELDS), gstRegistered: false };
    this.model3 = emptyForFields(SUPPLIER_STEP3_FIELDS);
    this.model4 = { ...emptyForFields(SUPPLIER_STEP4_FIELDS), sameAsMain: false };
    this.syncConfigModels();
    this.loadInitialFormData();
  }

  //#region DATA LOADING

  private loadInitialFormData(): void {
    this.loadingState.set(LoadingState.Loading);

    this.supplierService.getDropdownsByTypes(['contacttypes']).subscribe({
      next: (data: DropdownResponse) => {
        const options = (data.contacttypes || []).map((item: DropdownOption) => ({
          value: item.value,
          label: item.label,
        }));
        this.updateFieldOptions('contactType', options);
        this.loadingState.set(LoadingState.Success);
      },
      error: (err) => {
        this.messageService.showError('Error', 'Failed to load form data', err);
        this.loadingState.set(LoadingState.Error);
      }
    });
  }

  //#endregion

  //#region EVENT HANDLERS

  onRemoteOutput(event: Record<string, any>): void {
    if (event['modelChange']) {
      this.handleModelChange(event['modelChange']);
    }

    if (event['formSubmit']) {
      this.handleFormSubmit(event['formSubmit']);
    }

    if ('validationFailed' in event) {
      this.triggerSubmit.set(false);
      this.messageService.showWarn('Validation', 'Please check the form for errors');
    }
  }

  private handleModelChange(model: Record<string, any>): void {
    const step = this.wizardStep();
    if (step === 1) {
      this.model1 = { ...this.model1, ...model };
    } else if (step === 2) {
      const prevGst = this.model2['gstRegistered'];
      this.model2 = { ...this.model2, ...model };
      // GST No. visibility (hiddenWhen) only re-evaluates when the config signal
      // changes — poke it so the field shows/hides when GST Registered flips.
      if (this.model2['gstRegistered'] !== prevGst) {
        this.config2.update((cfg) => ({ ...cfg }));
      }
    } else if (step === 3) {
      this.model3 = { ...this.model3, ...model };
    } else {
      const wasSame = this.model4['sameAsMain'];
      this.model4 = { ...this.model4, ...model };
      // When "same as main" is switched on, copy main contact/address into billing.
      if (this.model4['sameAsMain'] && !wasSame) {
        this.applySameAsMain();
      }
    }
  }

  private applySameAsMain(): void {
    const patch: Record<string, any> = {};
    for (const [mainKey, billKey] of Object.entries(MAIN_TO_BILLING)) {
      patch[billKey] = this.model3[mainKey] ?? null;
    }
    this.model4 = { ...this.model4, ...patch };
    // Push into the already-built step-4 form (new object each time so it re-triggers).
    this.billingPatch.set({ ...patch });
  }

  private handleFormSubmit(model: Record<string, any>): void {
    this.triggerSubmit.set(false);
    const step = this.wizardStep();

    if (step === 1) {
      this.model1 = { ...this.model1, ...model };
      this.goToStep(2);
    } else if (step === 2) {
      this.model2 = { ...this.model2, ...model };
      const gstErr = gstValidationError(this.model2);
      if (gstErr) {
        this.messageService.showWarn('Validation', gstErr);
        return;
      }
      this.goToStep(3);
    } else if (step === 3) {
      this.model3 = { ...this.model3, ...model };
      this.goToStep(4);
    } else {
      this.model4 = { ...this.model4, ...model };
      this.onCreate();
    }
  }

  //#endregion

  //#region WIZARD NAVIGATION

  onActionClicked(action: string): void {
    switch (action) {
      case 'cancel': this.onCancel(); break;
      case 'next': this.triggerSubmit.set(true); break;
      case 'back': this.goToStep(this.wizardStep() - 1); break;
      case 'save': this.triggerSubmit.set(true); break;
    }
  }

  private goToStep(step: number): void {
    if (step < 1 || step > this.TOTAL_STEPS) return;
    this.fieldErrors.set({});
    this.syncConfigModels();
    this.wizardStep.set(step);
  }

  private syncConfigModels(): void {
    this.config1.update((cfg) => ({ ...cfg, model: { ...this.model1 } }));
    this.config2.update((cfg) => ({ ...cfg, model: { ...this.model2 } }));
    this.config3.update((cfg) => ({ ...cfg, model: { ...this.model3 } }));
    this.config4.update((cfg) => ({ ...cfg, model: { ...this.model4 } }));
  }

  onCancel(): void {
    this.router.navigate(['/contact/supplier']);
  }

  //#endregion

  //#region SUPPLIER CREATION

  private onCreate(): void {
    const payload = this.buildPayload();
    this.saving.set(true);

    this.supplierService.createSupplier(payload).subscribe({
      next: () => {
        this.messageService.showSuccess('Success', 'Supplier created successfully!');
        this.saving.set(false);
        this.router.navigate(['/contact/supplier/']);
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.error || 'Failed to create supplier');
        this.saving.set(false);
      }
    });
  }

  private buildPayload(): Record<string, any> {
    const merged: Record<string, any> = { ...this.model1, ...this.model2, ...this.model3, ...this.model4 };
    delete merged['sameAsMain'];

    const dateFields = ['dateJoin'];
    const uppercaseFields = ['contactId', 'contactName', 'contactRegId'];

    const payload: Record<string, any> = {};

    Object.entries(merged).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      if (typeof value === 'string' && value.trim() === '') return;

      if (dateFields.includes(key)) {
        payload[key] = value instanceof Date ? this.convertDateToISOWithTimezone(value) : value;
      } else if (uppercaseFields.includes(key) && typeof value === 'string') {
        payload[key] = value.toUpperCase();
      } else {
        payload[key] = value;
      }
    });

    normalizeGst(payload);
    return payload;
  }

  //#endregion

  //#region HELPERS

  private updateFieldOptions(fieldKey: string, options: DropdownOption[]): void {
    this.config1.update((cfg) => ({
      ...cfg,
      fields: cfg.fields.map((field) =>
        field.key === fieldKey ? { ...field, options } : field
      ),
    }));
  }

  private convertDateToISOWithTimezone(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
  }

  //#endregion
}
