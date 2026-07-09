import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormConfig } from '@ai-solutions-ui/form-component';
import { RemoteComponent } from '../../components/remote-component';
import { ContactSupplierService } from '../services/contact-supplier-service';
import { environment } from '../../../environments/environment';
import { DropdownOption, DropdownResponse, IAppMessageService, LoadingState } from '../../models/contact';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ActionButton, FloatingActionBarComponent } from '../../components/floating-action-bar/floating-action-bar-component';
import { SUPPLIER_ALL_FIELD_KEYS, SUPPLIER_EDIT_FIELDS, emptySupplierModel, gstValidationError, normalizeGst } from '../supplier-form-fields';

@Component({
  selector: 'app-contact-supplier-edit',
  standalone: true,
  imports: [
    RemoteComponent,
    ProgressSpinnerModule,
    ButtonModule,
    CardModule,
    RouterLink,
    FloatingActionBarComponent,
  ],
  templateUrl: './contact-supplier-edit-component.html',
  styleUrls: ['./contact-supplier-edit-component.scss'],
})
export class ContactSupplierEditComponent implements OnInit {

  //#region INJECTED DEPENDENCIES
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supplierService = inject(ContactSupplierService);

  constructor(
    @Inject('MESSAGING_SERVICE')
    public messageService: IAppMessageService,
  ) { }
  //#endregion

  //#region SIGNALS - UI STATE MANAGEMENT
  uniqId = signal<number | null>(null);
  LoadingState = LoadingState;
  loadingState = signal<LoadingState>(LoadingState.Loading);
  saving = signal<boolean>(false);
  triggerSubmit = signal<boolean>(false);

  actionButtons: ActionButton[] = [
    { label: 'Cancel', icon: 'pi pi-times', action: 'cancel', severity: 'secondary', outlined: true },
    { label: 'Save Changes', icon: 'pi pi-check', action: 'save', severity: 'primary' },
  ];

  uiMfeUrl = environment.uiMfeUrl;
  //#endregion

  //#region FORM CONFIGURATION

  private readonly formFields = SUPPLIER_EDIT_FIELDS;

  private formConfigSignal = signal<FormConfig>({
    title: 'Edit Supplier',
    layout: 'grid',
    gridColumns: 6,
    fields: this.formFields,
    model: emptySupplierModel(),
    showButton: false,
  });

  formConfig = this.formConfigSignal.asReadonly();

  //#endregion

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (isNaN(id) || id <= 0) {
        this.messageService.showError('Error', 'Invalid Supplier ID');
        this.router.navigate(['/contact/supplier']);
        return;
      }
      this.uniqId.set(id);
      this.loadInitialFormData(id);
    });
  }

  //#region INITIALIZATION & DATA LOAD

  private loadInitialFormData(id: number): void {
    this.loadingState.set(LoadingState.Loading);

    this.supplierService.getDropdownsByTypes(['contacttypes']).subscribe({
      next: (data: DropdownResponse) => {
        const options = (data.contacttypes || []).map((item: DropdownOption) => ({
          value: item.value,
          label: item.label,
        }));
        this.updateFieldOptions('contactType', options);
        this.loadSupplier(id);
      },
      error: (err) => {
        this.messageService.showError('Error', err);
        this.loadingState.set(LoadingState.Error);
      }
    });
  }

  private loadSupplier(id: number): void {
    this.supplierService.getSupplierById(id).subscribe({
      next: (supplier) => {
        const model: Record<string, any> = { ...emptySupplierModel(), ...supplier };
        model['gstRegistered'] = !!model['gstRegistered'];
        this.prevGst = model['gstRegistered'];
        if (model['dateJoin']) {
          const d = new Date(model['dateJoin']);
          model['dateJoin'] = isNaN(d.getTime()) ? null : d;
        }
        this.formConfigSignal.update(cfg => ({
          ...cfg,
          title: `Edit Supplier: ${supplier.contactName ?? ''}`,
          model,
        }));
        // Snapshot the loaded values so Save can skip when nothing changed.
        this.currentModel = { ...model };
        this.originalSnapshot = this.normalize(model);
        this.loadingState.set(LoadingState.Success);
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.error || err.message || 'Failed to load supplier');
        this.router.navigate(['/contact/supplier']);
      }
    });
  }

  //#endregion

  //#region EVENT HANDLERS

  private prevGst = false;
  private currentModel: Record<string, any> = {};
  private originalSnapshot = '';

  onRemoteOutput(event: Record<string, any>): void {
    if (event['modelChange']) {
      this.currentModel = event['modelChange'];
      const registered = !!event['modelChange']['gstRegistered'];
      // Poke the config so GST No.'s hiddenWhen re-evaluates when GST Registered flips.
      if (registered !== this.prevGst) {
        this.prevGst = registered;
        this.formConfigSignal.update((cfg) => ({ ...cfg }));
      }
    }

    if (event['formSubmit']) {
      this.triggerSubmit.set(false);
      this.updateSupplier(event['formSubmit']);
    }

    if ('validationFailed' in event) {
      this.triggerSubmit.set(false);
      this.messageService.showWarn('Validation', 'Please check the form for errors');
    }
  }

  onActionClicked(action: string): void {
    switch (action) {
      case 'cancel':
        this.router.navigate(['/contact/supplier']);
        break;
      case 'save':
        if (this.normalize(this.currentModel) === this.originalSnapshot) {
          this.messageService.showInfo('No Changes', 'There are no changes to save');
          return;
        }
        this.triggerSubmit.set(true);
        break;
    }
  }

  /** Stable string of the comparable field values, for change detection on save. */
  private normalize(model: Record<string, any>): string {
    return SUPPLIER_ALL_FIELD_KEYS.map((k) => {
      const v = model?.[k];
      if (v instanceof Date) return `${k}=${v.getTime()}`;
      if (v === null || v === undefined || v === '') return `${k}=`;
      return `${k}=${String(v)}`;
    }).join('|');
  }

  //#endregion

  //#region FORM SUBMISSION

  updateSupplier(model: Record<string, any>): void {
    const id = this.uniqId();
    if (!id) {
      this.messageService.showError('Error', 'Supplier ID is missing');
      return;
    }

    const gstErr = gstValidationError(model);
    if (gstErr) {
      this.messageService.showWarn('Validation', gstErr);
      return;
    }

    const payload = this.buildPayload(model);
    this.saving.set(true);

    this.supplierService.updateSupplier(id, payload).subscribe({
      next: () => {
        this.messageService.showSuccess('Success', 'Supplier updated successfully!');
        this.saving.set(false);
        this.router.navigate(['/contact/supplier/']);
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.error || 'Failed to update supplier');
        this.saving.set(false);
      }
    });
  }

  private buildPayload(model: Record<string, any>): Record<string, any> {
    const dateFields = ['dateJoin'];
    const uppercaseFields = ['contactId', 'contactName', 'contactRegId'];

    const payload: Record<string, any> = {};

    Object.entries(model).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      if (dateFields.includes(key)) {
        if (value instanceof Date) {
          payload[key] = this.convertDateToISOWithTimezone(value);
        } else if (typeof value === 'string' && value) {
          payload[key] = value;
        }
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
    this.formConfigSignal.update(cfg => ({
      ...cfg,
      fields: cfg.fields.map(field =>
        field.key === fieldKey ? { ...field, options } : field
      )
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
