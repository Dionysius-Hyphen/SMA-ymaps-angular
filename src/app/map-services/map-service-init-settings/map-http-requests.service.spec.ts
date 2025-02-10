import { TestBed } from '@angular/core/testing';

import { MapHttpRequestsService } from './map-http-requests.service';

describe('MapHttpRequestsService', () => {
  let service: MapHttpRequestsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapHttpRequestsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
