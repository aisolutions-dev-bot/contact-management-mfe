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
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContextMenuModule } from 'primeng/contextmenu';
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
      ContactTableComponent, 
      ProgressSpinnerModule,
      TableModule, 
      TagModule, 
      ContextMenuModule
    ],
    templateUrl: './contact-staff-list-component.html',
    styleUrls: ['./contact-staff-list-component.scss'],
})
export class ContactStaffListComponent implements OnInit, OnChanges {
    @Input({ required: true }) filter!: Record<string, any>;
    @Output() filterChange = new EventEmitter<Record<string, any>>();

    private router = inject(Router);
    cdr = inject(ChangeDetectorRef);
    private staffService = inject(ContactStaffService);

    LoadingState = LoadingState;
    loadingState = signal<LoadingState>(LoadingState.Loading);
    staffs = signal<ContactStaffList[]>([]);
    selectedRowData = signal<ContactStaffList | null>(null);

    columns = signal<TableColumn[]>([
        { field: 'staffId', header: 'Staff ID' },
        { field: 'staffName', header: 'Staff Name' },
        { field: 'nric', header: 'NRIC' },
        { field: 'departmentId', header: 'Department' },
        // { field: 'roles', header: 'Role' },
        { field: 'telMobile', header: 'Phone' },
        { field: 'emailCompany', header: 'Email' },
        { field: 'dateJoin', header: 'Join Date', formatter: this.formatDate },
        // { 
        //   field: 'status', 
        //   header: 'Status', 
        //   type: 'tag', 
        //   tagConfig: {
        //     O: { label: 'ACTIVE', severity: 'success ' },
        //     R: { label: 'INACTIVE', severity: 'warn' },
        //   }
        // },
    ]);

    contextMenuItems = computed(() => {
        const selected = this.selectedRowData();
        if (!selected) return [];

        return [
        {
            label: 'Edit Staff',
            icon: 'pi pi-fw pi-file-edit',
            command: () => this.navigateToStaffEdit(selected),
        },
        {
            label: 'Security',
            icon: 'pi pi-fw pi-shield',
            command: () => this.navigateToSecurity(selected),
        },
        {
            separator: true
        },
        {
            label: 'Cancel',
            icon: 'pi pi-fw pi-times'
        },
    ]
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
}