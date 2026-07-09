import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactSupplierEditComponent } from './contact-supplier-edit-component';

describe('ContactSupplierEditComponent', () => {
    let component: ContactSupplierEditComponent;
    let fixture: ComponentFixture<ContactSupplierEditComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactSupplierEditComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactSupplierEditComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
