import { TestBed } from '@angular/core/testing';

import { MapServiceCitySelectButtonService } from './map-service-city-select-button.service';

describe('MapServiceCitySelectButtonService', () => {
  let service: MapServiceCitySelectButtonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapServiceCitySelectButtonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
