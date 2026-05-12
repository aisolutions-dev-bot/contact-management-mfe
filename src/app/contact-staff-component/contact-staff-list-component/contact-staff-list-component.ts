import {
  ChangeDetectorRef,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContextMenuModule } from 'primeng/contextmenu';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ContactTableComponent } from '../../components/table-component/table-component';
import { ContactStaffList, LoadingState, TableColumn } from '../../models/contact';
import { ContactStaffService } from '../services/contact-staff-service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-contact-staff-list',
    standalone: true,
    imports: [
      ReactiveFormsModule,
      FormsModule,
      ContactTableComponent, 
      ProgressSpinnerModule,
      TableModule, 
      TagModule, 
      ContextMenuModule,
      DialogModule,
      SelectModule,
    ],
    templateUrl: './contact-staff-list-component.html',
    styleUrls: ['./contact-staff-list-component.scss'],
})
export class ContactStaffListComponent implements OnInit, OnChanges {
    @Input({ required: true }) filter!: Record<string, any>;
    @Input() canEdit = false;
    @Input() canSecurity = false;
    @Input() canChangeStatus = false;
    @Output() filterChange = new EventEmitter<Record<string, any>>();

    private router = inject(Router);
    cdr = inject(ChangeDetectorRef);
    private staffService = inject(ContactStaffService);

    LoadingState = LoadingState;
    loadingState = signal<LoadingState>(LoadingState.Loading);
    staffs = signal<ContactStaffList[]>([]);
    selectedRowData = signal<ContactStaffList | null>(null);

    // Status change dialog
    showStatusDialog = signal<boolean>(false);
    statusDialogStaff = signal<ContactStaffList | null>(null);
    selectedNewStatus = signal<string>('');
    savingStatus = signal<boolean>(false);

    readonly statusOptions = [
      { label: 'Open', value: 'O' },
      { label: 'Resigned', value: 'R' },
      { label: 'Terminated', value: 'T' },
    ];

    columns = signal<TableColumn[]>([
        { field: 'staffId', header: 'Staff ID' },
        { field: 'staffName', header: 'Staff Name' },
        { field: 'nric', header: 'NRIC' },
        { field: 'departmentId', header: 'Department' },
        // { field: 'roles', header: 'Role' },
        { field: 'telMobile', header: 'Phone' },
        { field: 'emailCompany', header: 'Email' },
        { field: 'dateJoin', header: 'Join Date', formatter: this.formatDate },
        {
          field: 'status',
          header: 'Status',
          type: 'tag',
          tagConfig: {
            O: { label: 'Open', severity: 'success' },
            R: { label: 'Resigned', severity: 'warn' },
            T: { label: 'Terminated', severity: 'danger' },
          }
        },
    ]);

    contextMenuItems = computed(() => {
        const selected = this.selectedRowData();
        if (!selected) return [];

        const items: any[] = [];

        if (this.canEdit) {
            items.push({
                label: 'Edit Staff',
                icon: 'pi pi-fw pi-file-edit',
                command: () => this.navigateToStaffEdit(selected),
            });
        }

        if (this.canSecurity) {
            items.push({
                label: 'Security',
                icon: 'pi pi-fw pi-shield',
                command: () => this.navigateToSecurity(selected),
            });
        }

        if (this.canChangeStatus) {
            items.push({
                label: 'Change Status',
                icon: 'pi pi-fw pi-refresh',
                command: () => this.openStatusDialog(selected),
            });
        }

        if (items.length === 0) return [];

        items.push({ separator: true });
        items.push({ label: 'Cancel', icon: 'pi pi-fw pi-times' });

        return items;
    });

    ngOnInit() {
       this.load();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['filter'] && !changes['filter'].firstChange) {
            this.load();
        }
    }

    load(): void {
        this.loadingState.set(LoadingState.Loading); 

        this.staffService.getContactStaff(this.filter).subscribe({
            next: (data) => {
              this.staffs.set(data || []);
              this.loadingState.set(LoadingState.Success); 
              this.cdr.detectChanges();
            },
            error: (err) => {
              this.staffs.set([]);
                this.loadingState.set(LoadingState.Error); 
              this.cdr.detectChanges();
            }
        });
    }

    private formatDate(value: any): string {
        if (!value) return '';

        let date: Date;

        if (value instanceof Date) {
            date = value;
        } else if (typeof value === 'string') {
            date = new Date(value);
        } else {
            return String(value);
        }

        if (isNaN(date.getTime())) {
            return String(value);
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    onContextMenu(event: MouseEvent, rowData: ContactStaffList): void {
        event.preventDefault();
        this.selectedRowData.set(rowData);
    }

    navigateToStaffEdit(staff: ContactStaffList | null): void {
        if (!staff) return;

        this.router.navigate(['/contact/staff/edit', staff.uniqId]);
    }

    navigateToSecurity(staff: ContactStaffList | null): void {
        if (!staff) return;

        this.router.navigate(['/contact/staff/security', staff.uniqId]);
    }

    openStatusDialog(staff: ContactStaffList): void {
        this.statusDialogStaff.set(staff);
        this.selectedNewStatus.set(staff.status || '');
        this.showStatusDialog.set(true);
    }

    closeStatusDialog(): void {
        this.showStatusDialog.set(false);
        this.statusDialogStaff.set(null);
        this.selectedNewStatus.set('');
    }

    confirmStatusChange(): void {
        const staff = this.statusDialogStaff();
        const newStatus = this.selectedNewStatus();
        if (!staff || !newStatus) return;

        this.savingStatus.set(true);
        this.staffService.updateStaffStatus(staff.uniqId, newStatus).subscribe({
            next: () => {
                this.savingStatus.set(false);
                this.closeStatusDialog();
                this.load();
            },
            error: (err) => {
                this.savingStatus.set(false);
                // error handled silently — dialog stays open
            }
        });
    }
}