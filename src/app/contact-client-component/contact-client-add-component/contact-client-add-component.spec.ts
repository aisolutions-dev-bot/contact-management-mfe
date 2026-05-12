import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactClientAddComponent } from './contact-client-add-component';

describe('ContactClientAddComponent', () => {
    let component: ContactClientAddComponent;
    let fixture: ComponentFixture<ContactClientAddComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactClientAddComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactClientAddComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
