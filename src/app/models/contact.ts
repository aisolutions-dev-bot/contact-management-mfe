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
    formType?: string;
    skillSet?: string;
    secGroupAuthority?: string;
    loginId?: string;
    systemUser?: string;
    disablePassword?: number;
    changePassword?: number;
    tokenActivated?: string;
    entryStaff?: string;
    entryDate?: string;
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
    contactType?: string;
    contactId: string;
    contactName: string;
    contactRegId: string;
    status?: string;

    // Registration / profile
    dateJoin?: string;
    gstRegistered?: boolean;
    gstNo?: string;
    contactPerson?: string;
    industry?: string;

    // Grouping
    locationGroup?: string;
    salesGroup?: string;
    contactGroup?: string;
    salesPerson?: string;
    inCharge?: string;

    // Main contact
    tel?: string;
    fax?: string;
    hp?: string;
    email?: string;

    // Main address
    addBlock?: string;
    addNos?: string;
    addFloor?: string;
    addUnit?: string;
    address1?: string;
    addStreet?: string;
    addBuilding?: string;
    addPostal?: string;
    addState?: string;
    addCity?: string;
    addCountry?: string;

    // Billing contact
    billTel?: string;
    billFax?: string;
    billHp?: string;
    billEmail?: string;

    // Billing address
    billBlock?: string;
    billNos?: string;
    billFloor?: string;
    billUnit?: string;
    billAddress1?: string;
    billStreet?: string;
    billBuilding?: string;
    billPostal?: string;
    billState?: string;
    billCity?: string;
    billCountry?: string;

    // Terms & currency
    arTerm?: string;
    apTerm?: string;
    rentalTerm?: string;
    shippingTerm?: string;
    arCurrency?: string;
    apCurrency?: string;

    entryStaff?: string;
    entryDate?: string;
    lastEditStaff?: string;
    lastEditDate?: string;
}

export interface ImportClientRow {
  contactType: string;
  contactId: string;
  contactName: string;
  contactRegId: string;
  status?: string;
}

// Supplier shares the same shape as Client (same m03ContactMaster table).
export type ContactSupplierList = ContactClientList;
export type ImportSupplierRow = ImportClientRow;

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownResponse {
  clients: DropdownOption[];
  suppliers: DropdownOption[];
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
