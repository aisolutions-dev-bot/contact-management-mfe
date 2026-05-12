import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactStaffEditComponent } from './contact-staff-edit-component';

describe('ContactStaffEditComponent', () => {
    let component: ContactStaffEditComponent;
    let fixture: ComponentFixture<ContactStaffEditComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactStaffEditComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactStaffEditComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
