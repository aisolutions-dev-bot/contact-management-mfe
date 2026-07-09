import { Validators } from '@angular/forms';
import { FormField } from '@ai-solutions-ui/form-component';

/**
 * Shared field definitions for the Supplier add wizard and edit screen.
 * Uses `divider` fields as section headers so a single form reads as
 * grouped sections. Excludes legacy / web-portal / audit columns.
 */

const div = (key: string, label: string, icon: string): FormField => ({
  key, label, type: 'divider', icon, colSpan: 6, collapsible: true, collapsed: false,
});

// ── Company Details (identity) ────────────────────────────
const SEC_COMPANY: FormField[] = [
  div('div_company', 'Company Details', 'pi-id-card'),
  { key: 'contactType', label: 'Supplier Type', type: 'select', icon: 'pi-building', colSpan: 2, options: [], validators: [Validators.required] },
  { key: 'contactId', label: 'Supplier ID', type: 'text', icon: 'pi-hashtag', colSpan: 2, validators: [Validators.required] },
  { key: 'contactRegId', label: 'Registration No.', type: 'text', icon: 'pi-file', colSpan: 2 },
  { key: 'contactName', label: 'Supplier Name', type: 'text', icon: 'pi-user', colSpan: 4, validators: [Validators.required] },
  { key: 'dateJoin', label: 'Registration Date', type: 'date', icon: 'pi-calendar', colSpan: 2 },
  { key: 'industry', label: 'Industry', type: 'text', icon: 'pi-briefcase', colSpan: 3 },
];

// ── Sales & Classification ────────────────────────────────
const SEC_CLASSIFICATION: FormField[] = [
  div('div_class', 'Sales & Classification', 'pi-sitemap'),
  { key: 'contactGroup', label: 'Group', type: 'text', icon: 'pi-users', colSpan: 2 },
  { key: 'locationGroup', label: 'Location Group', type: 'text', icon: 'pi-map-marker', colSpan: 2 },
  { key: 'salesGroup', label: 'Sales Group', type: 'text', icon: 'pi-chart-line', colSpan: 2 },
  { key: 'salesPerson', label: 'Salesman', type: 'text', icon: 'pi-user', colSpan: 3 },
  { key: 'inCharge', label: 'In-Charge', type: 'text', icon: 'pi-user', colSpan: 3 },
];

// ── Financial / Accounting (tax, currency, terms) ─────────
// The 'Currency & Terms' sub-divider (full width) forces the currency/term
// fields onto a fresh row, so when GST No. is hidden (GST = No) they still
// tile 3-up cleanly instead of back-filling the hole and staggering the grid.
const SEC_FINANCIAL: FormField[] = [
  div('div_financial', 'Tax Registration', 'pi-file'),
  {
    key: 'gstRegistered', label: 'GST Registered', type: 'radio', colSpan: 6,
    options: [{ label: 'Yes', value: true }, { label: 'No', value: false }],
  },
  {
    key: 'gstNo', label: 'GST No.', type: 'text', icon: 'pi-hashtag', colSpan: 3,
    hiddenWhen: (m) => !m['gstRegistered'],
  },
  div('div_terms', 'Currency & Terms', 'pi-dollar'),
  { key: 'arCurrency', label: 'AR Currency', type: 'text', icon: 'pi-dollar', colSpan: 2 },
  { key: 'arTerm', label: 'AR Term', type: 'text', icon: 'pi-calendar-clock', colSpan: 2 },
  { key: 'rentalTerm', label: 'Rental Term', type: 'text', icon: 'pi-calendar-clock', colSpan: 2 },
  { key: 'apCurrency', label: 'AP Currency', type: 'text', icon: 'pi-dollar', colSpan: 2 },
  { key: 'apTerm', label: 'AP Term', type: 'text', icon: 'pi-calendar-clock', colSpan: 2 },
  { key: 'shippingTerm', label: 'Shipping Term', type: 'text', icon: 'pi-truck', colSpan: 2 },
];

// ── Primary contact ───────────────────────────────────────
const SEC_MAIN_CONTACT: FormField[] = [
  div('div_main_contact', 'Primary Contact', 'pi-phone'),
  { key: 'contactPerson', label: 'Contact Person', type: 'text', icon: 'pi-user', colSpan: 3 },
  { key: 'email', label: 'Email', type: 'email', icon: 'pi-envelope', colSpan: 3, validators: [Validators.email] },
  { key: 'tel', label: 'Telephone', type: 'text', icon: 'pi-phone', colSpan: 2 },
  { key: 'hp', label: 'Mobile', type: 'text', icon: 'pi-mobile', colSpan: 2 },
  { key: 'fax', label: 'Fax', type: 'text', icon: 'pi-print', colSpan: 2 },
];

// ── Main address ─────────────────────────────────────────
const SEC_MAIN_ADDRESS: FormField[] = [
  div('div_main_addr', 'Registered / Main Address', 'pi-map-marker'),
  { key: 'addBlock', label: 'Block', type: 'text', icon: 'pi-building', colSpan: 1 },
  { key: 'addNos', label: 'No.', type: 'text', icon: 'pi-hashtag', colSpan: 1 },
  { key: 'addFloor', label: 'Floor', type: 'text', icon: 'pi-sort-numeric-up', colSpan: 1 },
  { key: 'addUnit', label: 'Unit', type: 'text', icon: 'pi-home', colSpan: 1 },
  { key: 'addPostal', label: 'Postal Code', type: 'text', icon: 'pi-map', colSpan: 2 },
  { key: 'address1', label: 'Address', type: 'text', icon: 'pi-map-marker', colSpan: 6 },
  { key: 'addStreet', label: 'Street', type: 'text', icon: 'pi-directions', colSpan: 3 },
  { key: 'addBuilding', label: 'Building', type: 'text', icon: 'pi-building', colSpan: 3 },
  { key: 'addCity', label: 'City', type: 'text', icon: 'pi-map-marker', colSpan: 2 },
  { key: 'addState', label: 'State', type: 'text', icon: 'pi-map-marker', colSpan: 2 },
  { key: 'addCountry', label: 'Country', type: 'text', icon: 'pi-globe', colSpan: 2 },
];

// ── Billing contact ──────────────────────────────────────
const SEC_BILLING_CONTACT: FormField[] = [
  div('div_bill_contact', 'Billing Contact', 'pi-credit-card'),
  { key: 'billTel', label: 'Telephone', type: 'text', icon: 'pi-phone', colSpan: 2 },
  { key: 'billFax', label: 'Fax', type: 'text', icon: 'pi-print', colSpan: 2 },
  { key: 'billHp', label: 'Mobile', type: 'text', icon: 'pi-mobile', colSpan: 2 },
  { key: 'billEmail', label: 'Email', type: 'email', icon: 'pi-envelope', colSpan: 6, validators: [Validators.email] },
];

// ── Billing address ──────────────────────────────────────
const SEC_BILLING_ADDRESS: FormField[] = [
  div('div_bill_addr', 'Billing Address', 'pi-map-marker'),
  { key: 'billBlock', label: 'Block', type: 'text', icon: 'pi-building', colSpan: 1 },
  { key: 'billNos', label: 'No.', type: 'text', icon: 'pi-hashtag', colSpan: 1 },
  { key: 'billFloor', label: 'Floor', type: 'text', icon: 'pi-sort-numeric-up', colSpan: 1 },
  { key: 'billUnit', label: 'Unit', type: 'text', icon: 'pi-home', colSpan: 1 },
  { key: 'billPostal', label: 'Postal Code', type: 'text', icon: 'pi-map', colSpan: 2 },
  { key: 'billAddress1', label: 'Address', type: 'text', icon: 'pi-map-marker', colSpan: 6 },
  { key: 'billStreet', label: 'Street', type: 'text', icon: 'pi-directions', colSpan: 3 },
  { key: 'billBuilding', label: 'Building', type: 'text', icon: 'pi-building', colSpan: 3 },
  { key: 'billCity', label: 'City', type: 'text', icon: 'pi-map-marker', colSpan: 2 },
  { key: 'billState', label: 'State', type: 'text', icon: 'pi-map-marker', colSpan: 2 },
  { key: 'billCountry', label: 'Country', type: 'text', icon: 'pi-globe', colSpan: 2 },
];

// ── Wizard steps (4 steps) ───────────────────────────────
// 1. Who are they?     → Company + Classification
// 2. How do we bill?   → Financial / Accounting
// 3. How to reach them → Primary Contact + Main Address
// 4. Where invoices go → Billing
export const SUPPLIER_STEP1_FIELDS: FormField[] = [...SEC_COMPANY, ...SEC_CLASSIFICATION];
export const SUPPLIER_STEP2_FIELDS: FormField[] = [...SEC_FINANCIAL];
export const SUPPLIER_STEP3_FIELDS: FormField[] = [...SEC_MAIN_CONTACT, ...SEC_MAIN_ADDRESS];
export const SUPPLIER_STEP4_FIELDS: FormField[] = [
  { key: 'sameAsMain', label: 'Same as main address', type: 'toggle', colSpan: 6 },
  ...SEC_BILLING_CONTACT,
  ...SEC_BILLING_ADDRESS,
];

// ── Edit screen (all sections, one form, no wizard) ──────
export const SUPPLIER_EDIT_FIELDS: FormField[] = [
  ...SEC_COMPANY, ...SEC_CLASSIFICATION, ...SEC_FINANCIAL,
  ...SEC_MAIN_CONTACT, ...SEC_MAIN_ADDRESS,
  ...SEC_BILLING_CONTACT, ...SEC_BILLING_ADDRESS,
];

// Map main-address/contact keys to their billing counterparts (for the "same as main" toggle).
export const MAIN_TO_BILLING: Record<string, string> = {
  tel: 'billTel',
  fax: 'billFax',
  hp: 'billHp',
  email: 'billEmail',
  addBlock: 'billBlock',
  addNos: 'billNos',
  addFloor: 'billFloor',
  addUnit: 'billUnit',
  addPostal: 'billPostal',
  address1: 'billAddress1',
  addStreet: 'billStreet',
  addBuilding: 'billBuilding',
  addCity: 'billCity',
  addState: 'billState',
  addCountry: 'billCountry',
};

// Every persisted field key (excludes dividers and the sameAsMain helper).
export const SUPPLIER_ALL_FIELD_KEYS: string[] = SUPPLIER_EDIT_FIELDS
  .filter((f) => f.type !== 'divider')
  .map((f) => f.key);

/** Returns an error message if GST No. is required (GST Registered = Yes) but missing, else null. */
export function gstValidationError(model: Record<string, any>): string | null {
  if (model['gstRegistered'] && (!model['gstNo'] || String(model['gstNo']).trim() === '')) {
    return 'GST No. is required when GST Registered is Yes.';
  }
  return null;
}

/** Drops GST No. when the contact is not GST-registered. */
export function normalizeGst(payload: Record<string, any>): void {
  if (!payload['gstRegistered']) delete payload['gstNo'];
}

export function emptySupplierModel(): Record<string, any> {
  const model: Record<string, any> = {};
  for (const key of SUPPLIER_ALL_FIELD_KEYS) model[key] = null;
  model['gstRegistered'] = false;
  return model;
}

/**
 * Seed model holding ONLY the (non-divider) keys of the given step's fields,
 * each null. Wizard steps must be seeded per-step — seeding every step with the
 * full model makes later steps carry null for keys they don't own, which then
 * clobber earlier steps' values when the step models are merged at save time.
 */
export function emptyForFields(fields: FormField[]): Record<string, any> {
  const model: Record<string, any> = {};
  for (const f of fields) {
    if (f.type !== 'divider') model[f.key] = null;
  }
  return model;
}
