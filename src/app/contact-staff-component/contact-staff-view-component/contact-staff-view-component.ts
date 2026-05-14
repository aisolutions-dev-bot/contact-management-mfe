import { ChangeDetectorRef, Component, inject, Inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ContactStaffList, IAppMessageService, LoadingState } from '../../models/contact';
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
    ProgressSpinnerModule,
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

    this.staffService.getStaffById(id).subscribe({
      next: (data) => {
        this.staff.set(data);
        this.loadingState.set(LoadingState.Success);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingState.set(LoadingState.Error);
        this.cdr.detectChanges();
      },
    });
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
