import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  model,
  OnInit,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ReactiveFormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { Popover } from 'primeng/popover';
import { PopoverModule } from 'primeng/popover';
import { FormBuilder, FormGroup } from '@angular/forms';
import { distinctUntilChanged } from 'rxjs';
import { ContactSupplierService } from '../services/contact-supplier-service';
import { DropdownOption } from '../../models/contact';

@Component({
    selector: 'app-contact-supplier-filter-component',
    imports: [
        ButtonModule,
        DatePickerModule,
        InputTextModule,
        ReactiveFormsModule,
        SelectModule,
        PopoverModule
    ],
    templateUrl: './contact-supplier-filter-component.html',
    styleUrl: './contact-supplier-filter-component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactSupplierFilterComponent implements OnInit {
    @ViewChild('ContactSupplierFilter') contactSupplierFilter!: Popover;
    @Output() applied = new EventEmitter<void>();

    statusOpts = signal<DropdownOption[]>([
        { label: 'Active', value: 'ACTIVE' },
        { label: 'All Suppliers', value: '' }
    ]);
    contactsOpts = signal<DropdownOption[]>([]);

    loading = signal<boolean>(false);
    supplierLoading = signal<boolean>(false);

    fb = inject(FormBuilder);
    supplierListService = inject(ContactSupplierService);

    form: FormGroup;
    localFilter = signal<Record<string, any>>({});
    filter = model.required<Record<string, any>>();

    constructor() {
        this.form = this.fb.group({
            status: [''],
            contactId: [''],
            contactRegId: [''],
        });

        this.form.valueChanges.pipe(distinctUntilChanged()).subscribe((v) => this.localFilter.set(v));
    }

    ngOnInit(): void {
        this.loadDropdowns();
        const current = this.filter();
        if (current && Object.keys(current).length > 0) {
            this.form.patchValue(current, { emitEvent: false });
            this.localFilter.set(current);
        }
    }

    private loadDropdowns(): void {
        this.loading.set(true);

        const requiredTypes = ['suppliers'];

        this.supplierListService.getDropdownsByTypes(requiredTypes).subscribe({
            next: (data) => {
                this.contactsOpts.set(this.formatDropdownOptions(data.suppliers || []));
                this.loading.set(false);
            },
            error: (err) => {
                this.loading.set(false);
            }
        })
    }

    private formatDropdownOptions(options: DropdownOption[]): DropdownOption[] {
        return options.map(opt => ({
            value: opt.value,
            label: `${opt.value} - ${opt.label}`
        }));
    }

    toggle(event: MouseEvent) {
        this.contactSupplierFilter.toggle(event);
    }

    apply(): void {
        const raw = this.form.getRawValue();

        const cleaned = Object.fromEntries(
            Object.entries(raw)
                .map(([k, v]) => [k, this.formatDate(v)])
                .filter(([k, v]) => {
                    if (k === 'status') return true;
                    return v !== null && v !== undefined && v !== '';
                }),
            );

        this.filter.set(cleaned);

        this.applied.emit();
        this.contactSupplierFilter.hide();
    }

    clear(): void {
        // Reset form UI
        this.form.reset();

        // Clear filter completely
        this.localFilter.set({});
        this.filter.set({});

        // Notify parent to reload data
        this.applied.emit();

        // Close popover
        this.contactSupplierFilter.hide();
    }

    private formatDate(value: any): string | null {
        if (!value) return null;
        if (value instanceof Date) {
            return value.toISOString().split('T')[0]; // yyyy-mm-dd
        }
        return value;
    }
}
