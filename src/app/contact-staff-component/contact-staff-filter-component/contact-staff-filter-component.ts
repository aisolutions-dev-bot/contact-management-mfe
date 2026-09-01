import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  model,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { SelectModule } from 'primeng/select';
import { ContactStaffService } from '../services/contact-staff-service';
import { DropdownOption } from '../../models/contact';

interface FilterChip {
  key: string;
  label: string;
}

@Component({
  selector: 'app-contact-staff-filter-component',
  imports: [
    FormsModule,
    AutoCompleteModule,
    ButtonModule,
    ChipModule,
    DatePickerModule,
    InputTextModule,
    PanelModule,
    SelectModule,
  ],
  templateUrl: './contact-staff-filter-component.html',
  styleUrl: './contact-staff-filter-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactStaffFilterComponent implements OnInit {
  /** Two-way filter state, shared with the parent. */
  filter = model.required<Record<string, any>>();
  /** Whether the caller may filter by department (holds a0303.07). */
  canViewAllDept = input<boolean>(false);
  /** Fired after Search/Reset so the parent reloads the list. */
  applied = output<void>();

  private staffService = inject(ContactStaffService);

  statusOptions: DropdownOption[] = [
    { value: '', label: 'All Statuses' },
    { value: 'O', label: 'Open' },
    { value: 'R', label: 'Resigned' },
    { value: 'T', label: 'Terminated' },
  ];
  departmentOptions = signal<DropdownOption[]>([]);
  filteredDepartments = signal<DropdownOption[]>([]);
  staffOptions = signal<DropdownOption[]>([]);
  filteredStaff = signal<DropdownOption[]>([]);
  loadingStaff = signal<boolean>(false);

  // Form fields (plain, bound via ngModel). Status defaults to Open.
  status = 'O';
  /** Department search box (view-all only). A pick → exact `department`; typed text → `departmentSearch` (name LIKE). */
  departmentModel: DropdownOption | string | null = null;
  /** The option actually selected from the dropdown (null once the user types again). */
  private departmentPicked: DropdownOption | null = null;
  /** Staff search box. A pick → exact `staffId`; typed text → `staffSearch` (id/name LIKE). */
  staffModel: DropdownOption | string | null = null;
  /** The option actually selected from the dropdown (null once the user types again). */
  private staffPicked: DropdownOption | null = null;
  nric = '';
  dateFrom: Date | null = null;
  dateTo: Date | null = null;

  isExpanded = signal<boolean>(false);
  appliedChips = signal<FilterChip[]>([]);

  /** How many of the advanced (expanded-section) filters currently hold a value. */
  get advancedCount(): number {
    let n = 0;
    if (this.nric) n++;
    return n;
  }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadStaffOptions();
    this.hydrateFromFilter(this.filter());
  }

  private hydrateFromFilter(f: Record<string, any>): void {
    if (!f || Object.keys(f).length === 0) {
      this.appliedChips.set([]);
      return;
    }
    this.status = f['status'] ?? '';
    if (f['department']) {
      const opt = this.departmentOptions().find((o) => o.value === f['department'])
        ?? { value: f['department'], label: f['department'] };
      this.departmentModel = opt;
      this.departmentPicked = opt;
    } else if (f['departmentSearch']) {
      this.departmentModel = f['departmentSearch'];
      this.departmentPicked = null;
    } else {
      this.departmentModel = null;
      this.departmentPicked = null;
    }
    if (f['staffId']) {
      const opt = this.staffOptions().find((o) => o.value === f['staffId'])
        ?? { value: f['staffId'], label: f['staffId'] };
      this.staffModel = opt;
      this.staffPicked = opt;
    } else if (f['staffSearch']) {
      this.staffModel = f['staffSearch'];
      this.staffPicked = null;
    } else {
      this.staffModel = null;
      this.staffPicked = null;
    }
    this.nric = f['nric'] ?? '';
    this.dateFrom = f['dateFrom'] ? new Date(f['dateFrom']) : null;
    this.dateTo = f['dateTo'] ? new Date(f['dateTo']) : null;
    this.appliedChips.set(this.buildChips(f));
  }

  private loadDepartments(): void {
    this.staffService.getDropdownsByTypes(['departments']).subscribe({
      next: (data) => {
        this.departmentOptions.set(data.departments || []);
        // Upgrade a placeholder pick to the full option label now that they're loaded.
        if (this.departmentPicked?.value) {
          const opt = this.departmentOptions().find((o) => o.value === this.departmentPicked!.value);
          if (opt) { this.departmentModel = opt; this.departmentPicked = opt; }
        }
        this.appliedChips.set(this.buildChips(this.filter()));
      },
      error: () => {},
    });
  }

  /** AutoComplete search — filter loaded departments by name as the user types. */
  onDepartmentSearch(event: { query: string }): void {
    // Typing invalidates any prior pick — we're back to a free-text search.
    this.departmentPicked = null;
    const q = (event.query || '').toLowerCase();
    this.filteredDepartments.set(
      this.departmentOptions().filter((o) => !q || o.label.toLowerCase().includes(q)),
    );
  }

  /** A department was chosen from the dropdown — remember the exact option. */
  onDepartmentSelect(event: { value: DropdownOption }): void {
    this.departmentPicked = event.value;
  }

  onDepartmentClear(): void {
    this.departmentPicked = null;
    this.departmentModel = null;
  }

  private loadStaffOptions(): void {
    this.loadingStaff.set(true);
    this.staffService.getStaffOptions().subscribe({
      next: (opts) => {
        this.staffOptions.set(opts.map((o) => ({ value: o.value, label: `${o.value} - ${o.label}` })));
        this.loadingStaff.set(false);
        // Upgrade a placeholder pick to the full option label now that they're loaded.
        if (this.staffPicked?.value) {
          const opt = this.staffOptions().find((o) => o.value === this.staffPicked!.value);
          if (opt) { this.staffModel = opt; this.staffPicked = opt; }
        }
        this.appliedChips.set(this.buildChips(this.filter()));
      },
      error: () => this.loadingStaff.set(false),
    });
  }

  /** AutoComplete search — filter loaded staff by id or name as the user types. */
  onStaffSearch(event: { query: string }): void {
    // Typing invalidates any prior pick — we're back to a free-text search.
    this.staffPicked = null;
    const q = (event.query || '').toLowerCase();
    this.filteredStaff.set(
      this.staffOptions().filter((o) => !q || o.label.toLowerCase().includes(q)),
    );
  }

  /** A staff was chosen from the dropdown — remember the exact option. */
  onStaffSelect(event: { value: DropdownOption }): void {
    this.staffPicked = event.value;
  }

  onStaffClear(): void {
    this.staffPicked = null;
    this.staffModel = null;
  }

  toggleExpand(): void {
    this.isExpanded.update((v) => !v);
  }

  search(): void {
    const f = this.buildFilter();
    this.filter.set(f);
    this.appliedChips.set(this.buildChips(f));
    this.applied.emit();
  }

  reset(): void {
    // Reset returns to the default view: Open staff.
    this.status = 'O';
    this.departmentModel = null;
    this.departmentPicked = null;
    this.staffModel = null;
    this.staffPicked = null;
    this.nric = '';
    this.dateFrom = null;
    this.dateTo = null;
    const f = { status: 'O' };
    this.filter.set(f);
    this.appliedChips.set(this.buildChips(f));
    this.applied.emit();
  }

  removeChip(key: string): void {
    switch (key) {
      case 'status': this.status = ''; break;
      case 'department': this.departmentModel = null; this.departmentPicked = null; break;
      case 'departmentSearch': this.departmentModel = null; this.departmentPicked = null; break;
      case 'staffId': this.staffModel = null; this.staffPicked = null; break;
      case 'staffSearch': this.staffModel = null; this.staffPicked = null; break;
      case 'nric': this.nric = ''; break;
      case 'dateFrom': this.dateFrom = null; break;
      case 'dateTo': this.dateTo = null; break;
    }
    this.search();
  }

  private buildFilter(): Record<string, any> {
    const f: Record<string, any> = {};
    if (this.status) f['status'] = this.status;
    // Department only applies for a view-all user; the backend pins others to their own dept.
    if (this.canViewAllDept()) {
      if (this.departmentPicked?.value) {
        f['department'] = this.departmentPicked.value;
      } else {
        const term = this.modelText(this.departmentModel);
        if (term) f['departmentSearch'] = term;
      }
    }
    // A real pick → exact id; otherwise the typed term → free-text search (id or name).
    if (this.staffPicked?.value) {
      f['staffId'] = this.staffPicked.value;
    } else {
      const term = this.modelText(this.staffModel);
      if (term) f['staffSearch'] = term;
    }
    if (this.nric) f['nric'] = this.nric;
    if (this.dateFrom) f['dateFrom'] = this.toDateStr(this.dateFrom);
    if (this.dateTo) f['dateTo'] = this.toDateStr(this.dateTo);
    return f;
  }

  private buildChips(f: Record<string, any>): FilterChip[] {
    const chips: FilterChip[] = [];
    if (f['status']) chips.push({ key: 'status', label: `Status: ${this.statusLabel(f['status'])}` });
    if (f['department']) chips.push({ key: 'department', label: `Dept: ${this.deptLabel(f['department'])}` });
    if (f['departmentSearch']) chips.push({ key: 'departmentSearch', label: `Dept search: "${f['departmentSearch']}"` });
    if (f['staffId']) chips.push({ key: 'staffId', label: `Staff: ${this.staffLabel(f['staffId'])}` });
    if (f['staffSearch']) chips.push({ key: 'staffSearch', label: `Staff search: "${f['staffSearch']}"` });
    if (f['nric']) chips.push({ key: 'nric', label: `NRIC: ${f['nric']}` });
    if (f['dateFrom']) chips.push({ key: 'dateFrom', label: `Join From: ${f['dateFrom']}` });
    if (f['dateTo']) chips.push({ key: 'dateTo', label: `Join To: ${f['dateTo']}` });
    return chips;
  }

  /** The free-text term from an autocomplete model (string as-is, else its label). */
  private modelText(m: DropdownOption | string | null): string {
    if (typeof m === 'string') return m.trim();
    if (m && typeof m === 'object' && m.label) return m.label.trim();
    return '';
  }

  private statusLabel(v: string): string {
    return this.statusOptions.find((o) => o.value === v)?.label ?? v;
  }

  private deptLabel(v: string): string {
    return this.departmentOptions().find((o) => o.value === v)?.label ?? v;
  }

  private staffLabel(v: string): string {
    return this.staffOptions().find((o) => o.value === v)?.label ?? v;
  }

  /** yyyy-MM-dd from local date parts (avoids the UTC day-shift toISOString causes). */
  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
