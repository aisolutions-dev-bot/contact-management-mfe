import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingActionBarComponent } from './floating-action-bar-component';

describe('FloatingActionBarComponent', () => {
  let component: FloatingActionBarComponent;
  let fixture: ComponentFixture<FloatingActionBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingActionBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FloatingActionBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
