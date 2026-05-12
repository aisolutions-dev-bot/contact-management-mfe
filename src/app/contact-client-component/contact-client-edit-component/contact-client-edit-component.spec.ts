import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactClientEditComponent } from './contact-client-edit-component';

describe('ContactClientEditComponent', () => {
    let component: ContactClientEditComponent;
    let fixture: ComponentFixture<ContactClientEditComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactClientEditComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactClientEditComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
