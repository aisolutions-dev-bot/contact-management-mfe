import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactStaffAddComponent } from './contact-staff-add-component';

describe('ContactStaffAddComponent', () => {
    let component: ContactStaffAddComponent;
    let fixture: ComponentFixture<ContactStaffAddComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactStaffAddComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactStaffAddComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
