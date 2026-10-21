import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownOption } from '../../models/contact';

export interface StaffPayroll {
  basicPay: number | null;
  /** The staff's usual shift, from General Settings' Shift Type list; null when not set. */
  shiftId: string | null;
  cpfYN: 'Y' | 'N';
  levyYN: 'Y' | 'N';
  nationalityId: string | null;
  skillLevel: 'BASIC' | 'HIGHER' | null;
  otYN: 'Y' | 'N';
}

export function emptyStaffPayroll(): StaffPayroll {
  return {
    basicPay: null, shiftId: null, cpfYN: 'N', levyYN: 'N', nationalityId: null, skillLevel: null, otYN: 'N',
  };
}

export interface StaffPayrollErrors {
  nationalityId?: string;
  skillLevel?: string;
}

/** Nationality and skill level are needed to work out the levy tier, so they are required when levy is on. */
export function staffPayrollErrors(payroll: StaffPayroll): StaffPayrollErrors {
  const errors: StaffPayrollErrors = {};
  if (payroll.levyYN === 'Y') {
    if (!payroll.nationalityId) errors.nationalityId = 'Select a nationality.';
    if (!payroll.skillLevel) errors.skillLevel = 'Select a skill level.';
  }
  return errors;
}

/** Payroll fields of the staff form, shared by the add wizard and the edit page. */
@Component({
  selector: 'app-contact-staff-payroll',
  standalone: true,
  imports: [FormsModule, InputNumberModule, SelectModule, SelectButtonModule, TooltipModule],
  templateUrl: './contact-staff-payroll-component.html',
  styleUrls: ['./contact-staff-payroll-component.scss'],
})
export class ContactStaffPayrollComponent {
  value = model.required<StaffPayroll>();
  nationalities = input<DropdownOption[]>([]);
  shiftTypes = input<DropdownOption[]>([]);
  errors = input<StaffPayrollErrors>({});

  readonly yesNo = [
    { label: 'Yes', value: 'Y' },
    { label: 'No', value: 'N' },
  ];

  readonly skillLevels = [
    { label: 'Basic', value: 'BASIC' },
    { label: 'Higher', value: 'HIGHER' },
  ];

  update<K extends keyof StaffPayroll>(key: K, next: StaffPayroll[K]): void {
    this.value.update(current => ({ ...current, [key]: next }));
  }

  setLevy(next: 'Y' | 'N'): void {
    this.value.update(current => ({
      ...current,
      levyYN: next,
      nationalityId: next === 'Y' ? current.nationalityId : null,
      skillLevel: next === 'Y' ? current.skillLevel : null,
    }));
  }
}
