import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactClientListComponent } from './contact-client-list-component';

describe('ContactClientListComponent', () => {
    let component: ContactClientListComponent;
    let fixture: ComponentFixture<ContactClientListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactClientListComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactClientListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
