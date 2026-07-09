import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactSupplierListComponent } from './contact-supplier-list-component';

describe('ContactSupplierListComponent', () => {
    let component: ContactSupplierListComponent;
    let fixture: ComponentFixture<ContactSupplierListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactSupplierListComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactSupplierListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
