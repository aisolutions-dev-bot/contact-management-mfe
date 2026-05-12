import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageModule } from 'primeng/message';
import * as XLSX from 'xlsx';
import { ImportClientRow } from '../../models/contact';

@Component({
  selector: 'app-contact-client-import',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    ProgressBarModule,
    MessageModule,
  ],
  templateUrl: './contact-client-import-component.html',
  styleUrls: ['./contact-client-import-component.scss'],
})
export class ContactClientImportComponent {
    private dialogRef = inject(DynamicDialogRef);

    //#region ==================== Signals ====================
    isDragOver = signal(false);
    isProcessing = signal(false);
    parsedData = signal<ImportClientRow[]>([]);
    errorMessage = signal('');
    validationErrors = signal<string[]>([]);
    //#endregion

    //#region ==================== Column Mapping ====================

    // Maps Excel headers to object properties (supports multiple naming conventions)
    private columnMapping: Record<string, keyof ImportClientRow> = {
        'Contact Type': 'contactType',
        'ContactType': 'contactType',
        'contact_type': 'contactType',
        'contactType': 'contactType',
        'contacttype': 'contactType',
        'Contact ID': 'contactId',
        'ContactID': 'contactId',
        'contact_id': 'contactId',
        'contactId': 'contactId',
        'Contact Name': 'contactName',
        'ContactName': 'contactName',
        'contact_name': 'contactName',
        'Name': 'contactName',
        'Contact Register ID': 'contactRegId',
        'ContactRegisterId': 'contactRegId',
        'contact_register_id': 'contactRegId',
        'contactRegId': 'contactRegId',
        'Contact Register No': 'contactRegId',
        'Contact Reg No': 'contactRegId',
        'Contact Reg. No.': 'contactRegId',
        'Registration No': 'contactRegId',
        'Reg No': 'contactRegId',
        'RegNo': 'contactRegId',
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
    private mapExcelData(data: any[]): ImportClientRow[] {
        return data.map((row) => {
            const mappedRow: Partial<ImportClientRow> = {};

            for (const [excelHeader, value] of Object.entries(row)) {
                const mappedKey = this.columnMapping[excelHeader];
                if (mappedKey) {
                    mappedRow[mappedKey] = this.formatValue(mappedKey, value);
                }
            }

            // Convert to uppercase
            if(mappedRow.contactType) {
                mappedRow.contactType = mappedRow.contactType.toUpperCase();
            }
            if(mappedRow.contactId) {
                mappedRow.contactId = mappedRow.contactId.toUpperCase();
            }
            if(mappedRow.contactName) {
                mappedRow.contactName = mappedRow.contactName.toUpperCase();
            }
            if(mappedRow.contactRegId) {
                mappedRow.contactRegId = mappedRow.contactRegId.toUpperCase();
            }

            return mappedRow as ImportClientRow;
        });
    }


    private formatValue(key: keyof ImportClientRow, value: any): string {
        if (value === null || value === undefined || value === '') return '';

        return String(value).trim();
    }

    //#endregion
  
    //#region ==================== Validation ====================
    private validateData(data: ImportClientRow[]): string[] {
        const errors: string[] = [];

        data.forEach((row, index) => {
            const rowNum = index + 2;

            if (!row.contactId) {
                errors.push(`Row ${rowNum}: Contact Type is required`);
            }
            if (!row.contactId) {
                errors.push(`Row ${rowNum}: Contact ID is required`);
            }
            if (!row.contactName) {
                errors.push(`Row ${rowNum}: Contact Name is required`);
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