import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DropdownResponse,
  ContactSupplierList,
  ImportSupplierRow,
} from '../../models/contact';

interface ContactSupplierListResponse {
  data: ContactSupplierList[];
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class ContactSupplierService {
    private apiUrl = environment.apiUrl;

    private dropdownCache$: Observable<DropdownResponse> | null = null;

    constructor(private http: HttpClient) { }

    getContactSupplier(filter: Record<string, any> = {}): Observable<ContactSupplierList[]> {
        const params = new HttpParams({ fromObject: filter as any });
        return this.http.get<ContactSupplierList[]>(
        `${this.apiUrl}/v1/contact-supplier/list`,
        { params },
        );
    }

    getSupplierById(uniqId: number): Observable<ContactSupplierList> {
        return this.http.get<ContactSupplierList>(`${this.apiUrl}/v1/contact-supplier/${uniqId}`);
    }

    createSupplier(payload: Record<string, any>): Observable<any> {
        return this.http.post(`${this.apiUrl}/v1/contact-supplier/add`, payload)
    }

    importSupplier(supplierList: ImportSupplierRow[]): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/v1/contact-supplier/import`, supplierList);
    }

    updateSupplier(id: number, data: Record<string, any>): Observable<ContactSupplierList> {
        return this.http.put<ContactSupplierList>(`${this.apiUrl}/v1/contact-supplier/${id}`, data);
    }

    updateSupplierSecurity(id: number, data: Record<string, any>): Observable<any> {
        return this.http.put(`${this.apiUrl}/v1/contact-supplier/security/${id}`, data);
    }

    /**
     * Get specific dropdowns by type
     * Use when only certain dropdowns are needed
     * 
     * @param types - Array of types: 'projects', 'staff', 'salesmen', etc.
     */
    getDropdownsByTypes(types: string[]): Observable<DropdownResponse> {
        const typesParam = types.join(',');
        return this.http.get<DropdownResponse>(
            `${this.apiUrl}/v1/dropdowns?types=${typesParam}`
        );
    }

    clearCache(): void {
        this.dropdownCache$ = null;
    }
}
