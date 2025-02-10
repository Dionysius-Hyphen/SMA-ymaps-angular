import { TestBed } from '@angular/core/testing';

import { MapServiceGeozonesService } from './map-service-geozones.service';

describe('MapServiceGeozonesService', () => {
  let service: MapServiceGeozonesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapServiceGeozonesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
