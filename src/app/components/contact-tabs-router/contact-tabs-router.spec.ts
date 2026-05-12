import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactTabsRouter } from './contact-tabs-router';

describe('ContactTabsRouter', () => {
  let component: ContactTabsRouter;
  let fixture: ComponentFixture<ContactTabsRouter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactTabsRouter],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactTabsRouter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
