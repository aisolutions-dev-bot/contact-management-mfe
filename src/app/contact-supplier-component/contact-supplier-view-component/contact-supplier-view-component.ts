import { ChangeDetectorRef, Component, inject, Inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ContactSupplierList, LoadingState } from '../../models/contact';
import { ContactSupplierService } from '../services/contact-supplier-service';
import { IAuthService } from '../../models/auth';

@Component({
  selector: 'app-contact-supplier-view',
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    TagModule,
    DividerModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './contact-supplier-view-component.html',
  styleUrls: ['./contact-supplier-view-component.scss'],
})
export class ContactSupplierViewComponent implements OnInit {
  private readonly MODULE_ID = 'mod03';
  readonly EDIT_ACCESS_CODE = 'a0302.02';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supplierService = inject(ContactSupplierService);
  private cdr = inject(ChangeDetectorRef);

  LoadingState = LoadingState;
  loadingState = signal<LoadingState>(LoadingState.Loading);
  supplier = signal<ContactSupplierList | null>(null);
  canEdit = false;

  constructor(
    @Inject('AUTH_SERVICE') private authService: IAuthService,
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
    if (!id) { this.router.navigate(['/contact/supplier']); return; }

    this.supplierService.getSupplierById(id).subscribe({
      next: (data) => {
        this.supplier.set(data);
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

  /** Compose the address parts into a single readable line. */
  composeAddress(parts: Array<string | undefined>): string {
    const line = parts.filter((p) => p != null && String(p).trim() !== '').join(', ');
    return line || '—';
  }

  goBack(): void {
    this.router.navigate(['/contact/supplier']);
  }

  goEdit(): void {
    const c = this.supplier();
    if (c) this.router.navigate(['/contact/supplier/edit', c.uniqId]);
  }
}
