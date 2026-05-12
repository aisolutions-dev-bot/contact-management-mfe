import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactStaffListComponent } from './contact-staff-list-component';

describe('ContactStaffListComponent', () => {
    let component: ContactStaffListComponent;
    let fixture: ComponentFixture<ContactStaffListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactStaffListComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactStaffListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
