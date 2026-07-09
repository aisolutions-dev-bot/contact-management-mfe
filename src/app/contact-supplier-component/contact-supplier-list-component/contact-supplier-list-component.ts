import {
  ChangeDetectorRef,
  Component,
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
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ContactTableComponent } from '../../components/table-component/table-component';
import { ContactSupplierList, LoadingState, TableColumn } from '../../models/contact';
import { ContactSupplierService } from '../services/contact-supplier-service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-contact-supplier-list',
    standalone: true,
    imports: [
      ReactiveFormsModule,
      ContactTableComponent,
      ProgressSpinnerModule,
      TableModule,
      TagModule,
    ],
    templateUrl: './contact-supplier-list-component.html',
    styleUrls: ['./contact-supplier-list-component.scss'],
})
export class ContactSupplierListComponent implements OnInit, OnChanges {
    @Input({ required: true }) filter!: Record<string, any>;
    @Output() filterChange = new EventEmitter<Record<string, any>>();

    private router = inject(Router);
    cdr = inject(ChangeDetectorRef);
    private supplierService = inject(ContactSupplierService);

    LoadingState = LoadingState;
    loadingState = signal<LoadingState>(LoadingState.Loading);
    suppliers = signal<ContactSupplierList[]>([]);

    columns = signal<TableColumn[]>([
        { field: 'contactType', header: 'Supplier Type' },
        { field: 'contactId', header: 'Supplier ID' },
        { field: 'contactName', header: 'Supplier Name' },
        { field: 'contactRegId', header: 'Registration No.' },
        { field: 'email', header: 'Email' },
        { field: 'tel', header: 'Phone' },
    ]);

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

        this.supplierService.getContactSupplier(this.filter).subscribe({
            next: (data) => {
              this.suppliers.set(data || []);
              this.loadingState.set(LoadingState.Success);
              this.cdr.detectChanges();
            },
            error: () => {
              this.suppliers.set([]);
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

    navigateToSupplierView(supplier: ContactSupplierList | null): void {
        if (!supplier) return;

        this.router.navigate(['/contact/supplier/view', supplier.uniqId]);
    }
}