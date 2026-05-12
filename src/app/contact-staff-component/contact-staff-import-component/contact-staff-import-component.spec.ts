import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactStaffImportComponent } from './contact-staff-import-component';

describe('ContactStaffImportComponent', () => {
    let component: ContactStaffImportComponent;
    let fixture: ComponentFixture<ContactStaffImportComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactStaffImportComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactStaffImportComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
