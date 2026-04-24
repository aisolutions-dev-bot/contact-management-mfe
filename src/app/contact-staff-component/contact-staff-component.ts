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
    readonly ADD_ACCESS_CODE      = 'a0303.01';
    readonly EDIT_ACCESS_CODE     = 'a0303.02';
    readonly DELETE_ACCESS_CODE   = 'a0303.03';
    readonly SECURITY_ACCESS_CODE = 'a0303.04';
    readonly IMPORT_ACCESS_CODE   = 'a0303.05';

    canAddStaff      = false;
    canEditStaff     = false;
    canDeleteStaff   = false;
    canSecurityStaff = false;
    canImportStaff   = false;

    private cdr = inject(ChangeDetectorRef);

    constructor(
        @Inject('MESSAGING_SERVICE') public messageService: IAppMessageService,
        @Inject('AUTH_SERVICE') public authService: IAuthService,
    ) { }

    filter = signal<Record<string, any>>({});

    @ViewChild('table') table!: ContactStaffListComponent;

    async ngOnInit(): Promise<void> {
        try {
            await this.authService.fetchUserRole();
            await this.authService.fetchGroupAuthorityAccesses(this.MODULE_ID);
        } catch { }

        const accesses = this.authService.groupAuthorityAccesses();
        this.canAddStaff      = accesses.some((a) => a.accessCode === this.ADD_ACCESS_CODE      && a.accessValue);
        this.canEditStaff     = accesses.some((a) => a.accessCode === this.EDIT_ACCESS_CODE     && a.accessValue);
        this.canDeleteStaff   = accesses.some((a) => a.accessCode === this.DELETE_ACCESS_CODE   && a.accessValue);
        this.canSecurityStaff = accesses.some((a) => a.accessCode === this.SECURITY_ACCESS_CODE && a.accessValue);
        this.canImportStaff   = accesses.some((a) => a.accessCode === this.IMPORT_ACCESS_CODE   && a.accessValue);
        this.cdr.markForCheck();
    }

    navigateToImport(): void {
        window.location.href = '/system/import?screen=staff';
    }
}
