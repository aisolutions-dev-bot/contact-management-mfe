import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DropdownResponse,
  ContactClientList,
  ImportClientRow,
} from '../../models/contact';

interface ContactClientListResponse {
  data: ContactClientList[];
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class ContactClientService {
    private apiUrl = environment.apiUrl;

    private dropdownCache$: Observable<DropdownResponse> | null = null;

    constructor(private http: HttpClient) { }

    getContactClient(filter: Record<string, any> = {}): Observable<ContactClientList[]> {
        const params = new HttpParams({ fromObject: filter as any });
        return this.http.get<ContactClientList[]>(
        `${this.apiUrl}/v1/contact-client/list`,
        { params },
        );
    }

    getClientById(uniqId: number): Observable<ContactClientList> {
        return this.http.get<ContactClientList>(`${this.apiUrl}/v1/contact-client/${uniqId}`);
    }

    createClient(payload: Record<string, any>): Observable<any> {
        return this.http.post(`${this.apiUrl}/v1/contact-client/add`, payload)
    }

    importClient(clientList: ImportClientRow[]): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/v1/contact-client/import`, clientList);
    }

    updateClient(id: number, data: Record<string, any>): Observable<ContactClientList> {
        return this.http.put<ContactClientList>(`${this.apiUrl}/v1/contact-client/${id}`, data);
    }

    updateClientSecurity(id: number, data: Record<string, any>): Observable<any> {
        return this.http.put(`${this.apiUrl}/v1/contact-client/security/${id}`, data);
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
