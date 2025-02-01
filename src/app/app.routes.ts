import { Routes } from '@angular/router';
import { LeafletMapComponent } from './leaflet-map/leaflet-map.component';
import { YandexMapComponent } from './yandex-map/yandex-map.component';

export const routes: Routes = [
    //Версия карт 1 - созданная вручную
    {
        path: 'leaflet',
        component: LeafletMapComponent
    },

    //Версия карт 2 - Яндекс
    {
        path: '',
        component: YandexMapComponent
    }
];
