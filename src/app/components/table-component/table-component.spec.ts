import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactTableComponent } from './table-component';

describe('ContactTableComponent', () => {
  let component: ContactTableComponent;
  let fixture: ComponentFixture<ContactTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
