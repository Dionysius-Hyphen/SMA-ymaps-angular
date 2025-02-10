import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { YandexMapComponent } from './map-components/yandex-map/yandex-map.component';
import { MapHttpRequestsService } from './map-services/map-service-init-settings/map-http-requests.service';

export const appConfig: ApplicationConfig = {
  providers: [MapHttpRequestsService, YandexMapComponent, provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideHttpClient(), provideAnimations()]
};

