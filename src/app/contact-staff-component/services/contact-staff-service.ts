import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DropdownResponse,
  ContactStaffList,
  ImportStaffRow,
  DropdownOption,
} from '../../models/contact';

interface ContactStaffListResponse {
  data: ContactStaffList[];
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class ContactStaffService {
    private readonly baseUrl = `${environment.apiUrl}/v1/contact-staff`;
    private readonly apiUrl = environment.apiUrl;
    private http = inject(HttpClient);

    getContactStaff(filter: Record<string, any> = {}): Observable<ContactStaffList[]> {
        const params = new HttpParams({ fromObject: filter as any });
        return this.http.get<ContactStaffList[]>(
            `${this.baseUrl}/list`,
            { params },
        );
    }

    getStaffById(uniqId: number): Observable<ContactStaffList> {
        return this.http.get<ContactStaffList>(
            `${this.baseUrl}/${uniqId}`
        );
    }

    createStaff(payload: Record<string, any>): Observable<any> {
        return this.http.post(
            `${this.baseUrl}/add`, 
            payload
        );
    }

    importStaff(staffList: ImportStaffRow[]): Observable<any> {
        return this.http.post<any>(
            `${this.baseUrl}/import`, 
            staffList
        );
    }

    updateStaff(id: number, data: Record<string, any>): Observable<ContactStaffList> {
        return this.http.put<ContactStaffList>(
            `${this.baseUrl}/${id}`, 
            data
        );
    }

    updateStaffSecurity(id: number, data: Record<string, any>): Observable<any> {
        return this.http.put(
            `${this.baseUrl}/security/${id}`, 
            data
        );
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

    getFormTypes(): Observable<DropdownOption[]> {
        return this.http.get<DropdownOption[]>(
            `${this.apiUrl}/v1/dropdowns/formtypes`
        );
    }

    getSkillSetsByFormType(formType: string): Observable<DropdownOption[]> {
        // Properly encode the formType to handle special characters
        const encodedFormType = encodeURIComponent(formType);

        return this.http.get<DropdownOption[]>(
            `${this.apiUrl}/v1/dropdowns/skillsets?formType=${encodedFormType}`
        );
    }
}
