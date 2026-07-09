import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactSupplierAddComponent } from './contact-supplier-add-component';

describe('ContactSupplierAddComponent', () => {
    let component: ContactSupplierAddComponent;
    let fixture: ComponentFixture<ContactSupplierAddComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactSupplierAddComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactSupplierAddComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
