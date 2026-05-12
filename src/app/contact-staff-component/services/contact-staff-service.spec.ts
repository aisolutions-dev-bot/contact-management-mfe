import { TestBed } from '@angular/core/testing';

import { ContactStaffService } from './contact-staff-service';

describe('ContactStaffService', () => {
  let service: ContactStaffService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContactStaffService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
