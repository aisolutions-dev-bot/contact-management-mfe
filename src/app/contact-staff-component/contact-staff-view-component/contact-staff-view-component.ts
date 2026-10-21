import { ChangeDetectorRef, Component, inject, Inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ContactStaffList, DropdownOption, IAppMessageService, LoadingState } from '../../models/contact';
import { StaffPayroll } from '../contact-staff-payroll-component/contact-staff-payroll-component';
import { ContactStaffService } from '../services/contact-staff-service';
import { IAuthService } from '../../models/auth';

@Component({
  selector: 'app-contact-staff-view',
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    TagModule,
    DividerModule,
    PanelModule,
    ProgressSpinnerModule,
    DecimalPipe,
  ],
  templateUrl: './contact-staff-view-component.html',
  styleUrls: ['./contact-staff-view-component.scss'],
})
export class ContactStaffViewComponent implements OnInit {
  private readonly MODULE_ID = 'mod03';
  readonly EDIT_ACCESS_CODE = 'a0303.02';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private staffService = inject(ContactStaffService);
  private cdr = inject(ChangeDetectorRef);

  LoadingState = LoadingState;
  loadingState = signal<LoadingState>(LoadingState.Loading);
  staff = signal<ContactStaffList | null>(null);
  canEdit = false;
  resendingActivation = signal<boolean>(false);

  // Payroll section, shown only when the Payroll module is subscribed
  payrollEnabled = signal<boolean>(false);
  payroll = signal<StaffPayroll | null>(null);
  private nationalities: DropdownOption[] = [];
  private shiftTypes: DropdownOption[] = [];

  // Which sections are expanded; the payroll shortcut opens only that section
  private readonly openSections = signal<Record<'details' | 'payroll' | 'security', boolean>>({
    details: true,
    payroll: true,
    security: true,
  });

  readonly STATUS_TAG: Record<string, { label: string; severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' }> = {
    O: { label: 'Open',       severity: 'success' },
    R: { label: 'Resigned',   severity: 'warn' },
    T: { label: 'Terminated', severity: 'danger' },
  };

  constructor(
    @Inject('AUTH_SERVICE') private authService: IAuthService,
    @Inject('MESSAGING_SERVICE') private messageService: IAppMessageService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.authService.fetchUserRole();
      await this.authService.fetchGroupAuthorityAccesses(this.MODULE_ID);
    } catch {}
    const accesses = this.authService.groupAuthorityAccesses();
    this.canEdit = accesses.length === 0 ||
      accesses.some((a: any) => a.accessCode === this.EDIT_ACCESS_CODE && a.accessValue);

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/contact/staff']); return; }

    if (this.route.snapshot.queryParamMap.get('section') === 'payroll') {
      this.openSections.set({ details: false, payroll: true, security: false });
    }

    this.staffService.getStaffById(id).subscribe({
      next: (data) => {
        this.staff.set(data);
        this.loadingState.set(LoadingState.Success);
        this.cdr.detectChanges();
        this.loadPayrollSection(data.staffId);
      },
      error: () => {
        this.loadingState.set(LoadingState.Error);
        this.cdr.detectChanges();
      },
    });
  }

  private loadPayrollSection(staffId: string): void {
    this.staffService.getPayrollOptions().subscribe({
      next: (options) => {
        if (!options.subscribed) return;
        this.nationalities = options.nationalities ?? [];
        this.shiftTypes = options.shiftTypes ?? [];
        this.staffService.getStaffPayroll(staffId).subscribe({
          next: (saved) => {
            this.payroll.set(saved);
            this.payrollEnabled.set(true);
            this.cdr.detectChanges();
            this.scrollToPayroll();
          },
          error: () => this.messageService.showError('Error', 'Failed to load the payroll setting'),
        });
      },
      error: () => this.payrollEnabled.set(false),
    });
  }

  isOpen(section: 'details' | 'payroll' | 'security'): boolean {
    return this.openSections()[section];
  }

  setOpen(section: 'details' | 'payroll' | 'security', open: boolean): void {
    this.openSections.update((current) => ({ ...current, [section]: open }));
  }

  private scrollToPayroll(): void {
    if (this.route.snapshot.queryParamMap.get('section') !== 'payroll') return;
    setTimeout(() => document.getElementById('payroll-section')?.scrollIntoView({ behavior: 'smooth' }));
  }

  nationalityName(id: string | null): string {
    return this.nationalities.find((n) => n.value === id)?.label ?? id ?? '—';
  }

  shiftName(id: string | null): string {
    if (!id) return 'Company default hours';
    return this.shiftTypes.find((s) => s.value === id)?.label ?? id;
  }

  yesNo(value: string | null | undefined): string {
    return value === 'Y' ? 'Yes' : 'No';
  }

  fmtDate(value: any): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  goBack(): void {
    this.router.navigate(['/contact/staff']);
  }

  goEdit(): void {
    const s = this.staff();
    if (s) this.router.navigate(['/contact/staff/edit', s.uniqId]);
  }

  resendActivation(): void {
    const s = this.staff();
    if (!s) return;

    this.resendingActivation.set(true);
    this.staffService.resendActivation(s.uniqId).subscribe({
      next: () => {
        this.messageService.showSuccess('Success', 'Activation email has been resent');
        this.resendingActivation.set(false);
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Failed to resend activation email');
        this.resendingActivation.set(false);
      }
    });
  }
}
