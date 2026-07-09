import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactSupplierFilterComponent } from './contact-supplier-filter-component';

describe('ContactSupplierFilterComponent', () => {
    let component: ContactSupplierFilterComponent;
    let fixture: ComponentFixture<ContactSupplierFilterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactSupplierFilterComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactSupplierFilterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
