import { TestBed } from '@angular/core/testing';

import { MapServiceCitySelectService } from './map-service-city-select.service';

describe('MapServiceCitySelectService', () => {
  let service: MapServiceCitySelectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapServiceCitySelectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
