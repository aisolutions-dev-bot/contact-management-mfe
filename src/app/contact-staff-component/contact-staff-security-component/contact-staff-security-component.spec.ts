import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactStaffSecurityComponent } from './contact-staff-security-component';

describe('ContactStaffSecurityComponent', () => {
  let component: ContactStaffSecurityComponent;
  let fixture: ComponentFixture<ContactStaffSecurityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactStaffSecurityComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactStaffSecurityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
