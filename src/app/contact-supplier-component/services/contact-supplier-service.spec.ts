import { TestBed } from '@angular/core/testing';

import { ContactSupplierService } from './contact-supplier-service';

describe('ContactSupplierService', () => {
  let service: ContactSupplierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContactSupplierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
