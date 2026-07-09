import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactSupplierImportComponent } from './contact-supplier-import-component';

describe('ContactSupplierImportComponent', () => {
    let component: ContactSupplierImportComponent;
    let fixture: ComponentFixture<ContactSupplierImportComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactSupplierImportComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactSupplierImportComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
