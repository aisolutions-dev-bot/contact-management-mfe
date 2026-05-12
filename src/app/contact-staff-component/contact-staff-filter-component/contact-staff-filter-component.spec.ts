import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactStaffFilterComponent } from './contact-staff-filter-component';

describe('ContactStaffFilterComponent', () => {
    let component: ContactStaffFilterComponent;
    let fixture: ComponentFixture<ContactStaffFilterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactStaffFilterComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactStaffFilterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
