import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactClientComponent } from './contact-client-component';

describe('ContactClientComponent', () => {
    let component: ContactClientComponent;
    let fixture: ComponentFixture<ContactClientComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactClientComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactClientComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
