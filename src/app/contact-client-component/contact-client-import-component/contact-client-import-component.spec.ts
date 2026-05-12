import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactClientImportComponent } from './contact-client-import-component';

describe('ContactClientImportComponent', () => {
    let component: ContactClientImportComponent;
    let fixture: ComponentFixture<ContactClientImportComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactClientImportComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactClientImportComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
