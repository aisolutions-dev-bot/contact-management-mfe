import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageModule } from 'primeng/message';
import * as XLSX from 'xlsx';
import { ImportStaffRow } from '../../models/contact';

@Component({
  selector: 'app-contact-staff-import',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    ProgressBarModule,
    MessageModule,
  ],
  templateUrl: './contact-staff-import-component.html',
  styleUrls: ['./contact-staff-import-component.scss'],
})
export class ContactStaffImportComponent {
    private dialogRef = inject(DynamicDialogRef);

    //#region ==================== Signals ====================
    isDragOver = signal(false);
    isProcessing = signal(false);
    parsedData = signal<ImportStaffRow[]>([]);
    errorMessage = signal('');
    validationErrors = signal<string[]>([]);
    //#endregion

    //#region ==================== Column Mapping ====================
    // Maps Excel headers to object properties (supports multiple naming conventions)
    private columnMapping: Record<string, keyof ImportStaffRow> = {
        'Staff ID': 'staffId',
        'StaffID': 'staffId',
        'staff_id': 'staffId',
        'Staff Name': 'staffName',
        'StaffName': 'staffName',
        'staff_name': 'staffName',
        'Name': 'staffName',
        'NRIC': 'nric',
        'Nric': 'nric',
        'Department': 'departmentId',
        'Department ID': 'departmentId',
        'DepartmentID': 'departmentId',
        'department_id': 'departmentId',
        'Join Date': 'dateJoin',
        'JoinDate': 'dateJoin',
        'Date Join': 'dateJoin',
        'date_join': 'dateJoin',
        'Email': 'emailCompany',
        'Company Email': 'emailCompany',
        'email_company': 'emailCompany',
        'Phone': 'telMobile',
        'Mobile': 'telMobile',
        'tel_mobile': 'telMobile',
        'Status': 'status',
    };
    //#endregion
  
    //#region ==================== Drag & Drop Handlers ====================
    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(true);
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.processFile(files[0]);
        }
    }
    //#endregion
  
    //#region ==================== File Selection Handler ====================
    onFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.processFile(input.files[0]);
        }
    }
    //#endregion
  
    //#region ==================== File Processing ====================
    private processFile(file: File): void {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];

        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
            this.errorMessage.set('Invalid file type. Please upload an Excel or CSV file.');
            return;
        }

        this.isProcessing.set(true);
        this.errorMessage.set('');

        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

                const mappedData = this.mapExcelData(jsonData);

                const errors = this.validateData(mappedData);
                this.validationErrors.set(errors);

                this.parsedData.set(mappedData);
                this.isProcessing.set(false);
            } catch (error) {
                this.errorMessage.set('Failed to parse file. Please check the file format.');
                this.isProcessing.set(false);
            }
        };

        reader.onerror = () => {
            this.errorMessage.set('Failed to read file.');
            this.isProcessing.set(false);
        };

        reader.readAsArrayBuffer(file);
    }
    //#endregion
  
    //#region ==================== Data Mapping ====================
    private mapExcelData(data: any[]): ImportStaffRow[] {
        return data.map((row) => {
            const mappedRow: Partial<ImportStaffRow> = {};

            for (const [excelHeader, value] of Object.entries(row)) {
                const mappedKey = this.columnMapping[excelHeader];
                if (mappedKey) {
                    mappedRow[mappedKey] = this.formatValue(mappedKey, value);
                }
            }

            // Convert to uppercase
            if(mappedRow.staffId) {
                mappedRow.staffId = mappedRow.staffId.toUpperCase();
            }
            if(mappedRow.staffName) {
                mappedRow.staffName = mappedRow.staffName.toUpperCase();
            }
            if(mappedRow.departmentId) {
                mappedRow.departmentId = mappedRow.departmentId.toUpperCase();
            }

            return mappedRow as ImportStaffRow;
        });
    }


    private formatValue(key: keyof ImportStaffRow, value: any): string {
        if (value === null || value === undefined || value === '') return '';

        if (key === 'dateJoin') {
            return this.parseAndFormatDate(value);
        }

        return String(value).trim();
    }

    // Parse various date formats and convert to ISO datetime string
    private parseAndFormatDate(value: any): string {
        if (!value) return '';

        let date: Date | null = null;

        // If already a Date object
        if (value instanceof Date) {
            date = value;
        } 
        // If it's a string, try to parse it
        else if (typeof value === 'string') {
            const dateStr = value.trim();
            
            // Try different date formats
            // Format: MM/dd/yy or MM/dd/yyyy
            if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
                const parts = dateStr.split('/');
                const month = parseInt(parts[0], 10) - 1;
                const day = parseInt(parts[1], 10);
                let year = parseInt(parts[2], 10);
                
                // Handle 2-digit year
                if (year < 100) {
                    year += year > 50 ? 1900 : 2000;
                }
                
                date = new Date(year, month, day);
            }
            // Format: dd-MM-yyyy or dd/MM/yyyy
            else if (dateStr.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/)) {
                const parts = dateStr.split(/[-\/]/);
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                
                date = new Date(year, month, day);
            }
            // Format: yyyy-MM-dd (ISO date)
            else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                date = new Date(dateStr);
            }
            // Try default parsing
            else {
                date = new Date(dateStr);
            }
        }
        // If it's a number (Excel serial date)
        else if (typeof value === 'number') {
            // Excel date serial number conversion
            date = new Date((value - 25569) * 86400 * 1000);
        }

        // Validate the date
        if (!date || isNaN(date.getTime())) {
            console.warn('Could not parse date:', value);
            return '';
        }

        // Return ISO datetime format for Java LocalDateTime
        return this.formatDateToISO(date);
    }

    private formatDateToISO(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // Return ISO format with time: YYYY-MM-DDTHH:mm:ss
        const result = `${year}-${month}-${day}T00:00:00`;
        return result;
    }
    //#endregion
  
    //#region ==================== Validation ====================
    private validateData(data: ImportStaffRow[]): string[] {
        const errors: string[] = [];

        data.forEach((row, index) => {
            const rowNum = index + 2;

            if (!row.staffId) {
                errors.push(`Row ${rowNum}: Staff ID is required`);
            }
            if (!row.staffName) {
                errors.push(`Row ${rowNum}: Staff Name is required`);
            }
        });

        return errors;
    }

    //#endregion
  
    //#region ==================== Actions ====================
    clearData(): void {
        this.parsedData.set([]);
        this.validationErrors.set([]);
        this.errorMessage.set('');
    }

    cancel(): void {
        this.dialogRef.close(null);
    }

    confirmImport(): void {
        this.dialogRef.close(this.parsedData());
    }
    //#endregion
}