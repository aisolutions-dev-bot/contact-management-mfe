import { ChangeDetectorRef, Component, Inject, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { ContactStaffFilterComponent } from './contact-staff-filter-component/contact-staff-filter-component';
import { ContactStaffListComponent } from './contact-staff-list-component/contact-staff-list-component';
import { SelectModule } from 'primeng/select';
import { RouterLink } from '@angular/router';
import { IAppMessageService } from '../models/contact';
import { IAuthService } from '../models/auth';

@Component({
    selector: 'app-contact-staff',
    imports: [
        ButtonModule,
        ContactStaffListComponent,
        ContactStaffFilterComponent,
        SelectModule,
        FormsModule,
        RouterLink
    ],
    templateUrl: './contact-staff-component.html',
    styleUrl: './contact-staff-component.scss',
})
export class ContactStaffComponent implements OnInit {
    private readonly MODULE_ID = 'mod03';
    readonly ADD_ACCESS_CODE           = 'a0303.01';
    readonly EDIT_ACCESS_CODE          = 'a0303.02';
    readonly DELETE_ACCESS_CODE        = 'a0303.03';
    readonly SECURITY_ACCESS_CODE      = 'a0303.04';
    readonly IMPORT_ACCESS_CODE        = 'a0303.05';
    readonly CHANGE_STATUS_ACCESS_CODE = 'a0303.06';
    readonly VIEW_ALL_DEPT_ACCESS_CODE = 'a0303.07';

    canAddStaff          = false;
    canEditStaff         = false;
    canDeleteStaff       = false;
    canSecurityStaff     = false;
    canImportStaff       = false;
    canChangeStatusStaff = false;
    canViewAllDept       = false;

    private cdr = inject(ChangeDetectorRef);

    constructor(
        @Inject('MESSAGING_SERVICE') public messageService: IAppMessageService,
        @Inject('AUTH_SERVICE') public authService: IAuthService,
    ) { }

    private readonly FILTER_KEY = 'contact_staff_filter';
    private readonly FIRST_KEY = 'contact_staff_first';

    filter = signal<Record<string, any>>(this.restoreFilter());
    first = signal<number>(this.restoreFirst());

    @ViewChild('table') table!: ContactStaffListComponent;

    async ngOnInit(): Promise<void> {
        try {
            await this.authService.fetchUserRole();
            await this.authService.fetchGroupAuthorityAccesses(this.MODULE_ID);
        } catch { }

        const accesses = this.authService.groupAuthorityAccesses();
        this.canAddStaff          = accesses.some((a) => a.accessCode === this.ADD_ACCESS_CODE           && a.accessValue);
        this.canEditStaff         = accesses.some((a) => a.accessCode === this.EDIT_ACCESS_CODE          && a.accessValue);
        this.canDeleteStaff       = accesses.some((a) => a.accessCode === this.DELETE_ACCESS_CODE        && a.accessValue);
        this.canSecurityStaff     = accesses.some((a) => a.accessCode === this.SECURITY_ACCESS_CODE      && a.accessValue);
        this.canImportStaff       = accesses.some((a) => a.accessCode === this.IMPORT_ACCESS_CODE        && a.accessValue);
        this.canChangeStatusStaff = accesses.some((a) => a.accessCode === this.CHANGE_STATUS_ACCESS_CODE && a.accessValue);
        this.canViewAllDept       = accesses.some((a) => a.accessCode === this.VIEW_ALL_DEPT_ACCESS_CODE   && a.accessValue);
        this.cdr.markForCheck();
    }

    onFilterChange(f: Record<string, any>): void {
        this.filter.set(f);
        this.persistFilter(f);
        // A new filter starts from page one.
        this.first.set(0);
        this.persistFirst(0);
    }

    onFirstChange(first: number): void {
        this.first.set(first);
        this.persistFirst(first);
    }

    private restoreFilter(): Record<string, any> {
        // Default view = Open staff (matches the Status dropdown's default).
        try {
            const raw = sessionStorage.getItem(this.FILTER_KEY);
            return raw ? JSON.parse(raw) : { status: 'O' };
        } catch {
            return { status: 'O' };
        }
    }

    private persistFilter(f: Record<string, any>): void {
        try {
            sessionStorage.setItem(this.FILTER_KEY, JSON.stringify(f));
        } catch { }
    }

    private restoreFirst(): number {
        try {
            const raw = sessionStorage.getItem(this.FIRST_KEY);
            const n = raw ? parseInt(raw, 10) : 0;
            return Number.isFinite(n) && n >= 0 ? n : 0;
        } catch {
            return 0;
        }
    }

    private persistFirst(first: number): void {
        try {
            sessionStorage.setItem(this.FIRST_KEY, String(first));
        } catch { }
    }

    navigateToImport(): void {
        window.location.href = '/system/import?screen=staff';
    }
}
