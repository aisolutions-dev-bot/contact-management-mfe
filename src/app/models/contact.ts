import { computed, signal } from '@angular/core';

export interface ILayoutService {
  layoutConfig: typeof signal;
  layoutState: typeof signal;
  hasInitialized: typeof signal;
  overlayOpen$: any;
  isSidebarActive: typeof computed;
  isOverlay: typeof computed;
  onMenuToggle(): void;
  isDesktop(): boolean;
  isMobile(): boolean;
}

export interface IAppMessageService {
  showSuccess(summary: string, detail: string, life?: number): void;
  showInfo(summary: string, detail: string, life?: number): void;
  showWarn(summary: string, detail: string, life?: number): void;
  showError(summary: string, detail: string, life?: number): void;
  clear(): void;
}

export interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  formatter?: (value: any) => string;
  type?: 'text' | 'date' | 'number' | 'tag';
  tagConfig?: Record<string, { label: string, severity: string }>;
}

export interface ContactStaffList {
    uniqId: number;
    staffId: string;
    staffName: string;
    nric: string;
    departmentId: string;
    dateJoin: string;
    roles: string;
    emailCompany: string;
    telMobile: string;
    status: string;  
}

export interface ImportStaffRow {
  staffId: string;
  staffName: string;
  nric: string;
  departmentId: string;
  dateJoin: string | null;
  emailCompany?: string;
  telMobile?: string;
  status?: string;
}

export interface ContactClientList {
    uniqId: number;
    contactId: string;
    contactName: string;
    contactRegId: string;
    status: string;  
}

export interface ImportClientRow {
  contactType: string;
  contactId: string;
  contactName: string;
  contactRegId: string;
  status?: string;
}

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownResponse {
  clients: DropdownOption[];
  staff: DropdownOption[];
  departments: DropdownOption[];
  contacts: DropdownOption[];
  contacttypes: DropdownOption[];
}

export enum LoadingState {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}
