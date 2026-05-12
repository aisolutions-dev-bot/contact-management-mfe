import { TestBed } from '@angular/core/testing';

import { ContactClientService } from './contact-client-service';

describe('ContactClientService', () => {
  let service: ContactClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContactClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
