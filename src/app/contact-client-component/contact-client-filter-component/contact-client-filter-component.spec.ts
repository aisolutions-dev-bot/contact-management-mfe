import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactClientFilterComponent } from './contact-client-filter-component';

describe('ContactClientFilterComponent', () => {
    let component: ContactClientFilterComponent;
    let fixture: ComponentFixture<ContactClientFilterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactClientFilterComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactClientFilterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
