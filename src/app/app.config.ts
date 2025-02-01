import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { YandexMapComponent } from './yandex-map/yandex-map.component';
import { CustomSidenavComponent } from './custom-sidenav/custom-sidenav.component';

export const appConfig: ApplicationConfig = {
  providers: [YandexMapComponent, provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideHttpClient(), provideAnimations()]
};

