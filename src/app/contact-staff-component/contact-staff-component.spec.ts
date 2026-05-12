import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactStaffComponent } from './contact-staff-component';

describe('ContactStaffComponent', () => {
    let component: ContactStaffComponent;
    let fixture: ComponentFixture<ContactStaffComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactStaffComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactStaffComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
