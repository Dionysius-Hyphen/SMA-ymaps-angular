import { Injectable } from '@angular/core';

// Сделан отдельный сервисом, а не компонентом по той причине, что 
// является частью api от Яндекса и не отрисовывается как отдельный angular компонент
@Injectable({
  providedIn: 'root'
})
export class MapServiceCitySelectButtonService {

  constructor() { }
}
