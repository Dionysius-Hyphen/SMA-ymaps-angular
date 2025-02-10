import { TestBed } from '@angular/core/testing';

import { MapServiceTracksService } from './map-service-tracks.service';

describe('MapServiceTracksService', () => {
  let service: MapServiceTracksService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapServiceTracksService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
