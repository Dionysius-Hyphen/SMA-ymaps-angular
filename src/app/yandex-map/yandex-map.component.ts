import { Component, OnInit, AfterViewInit, Input, ChangeDetectorRef, signal  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FeatureCollection } from 'geojson';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon'
import { RouterOutlet } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CustomSidenavComponent } from "../custom-sidenav/custom-sidenav.component";


declare const ymaps:any;

interface MapObjectRecord {
  id: number;
  object: string;
  start_point?: any
  end_point?: any
}

@Component({
  selector: 'app-yandex-map',
  templateUrl: './yandex-map.component.html',
  styleUrl: './yandex-map.component.scss',
  imports: [CommonModule, FormsModule, MatToolbarModule, MatIconModule, MatButtonModule, MatSidenavModule, CustomSidenavComponent],
  standalone: true
})

export class YandexMapComponent implements OnInit, AfterViewInit {
  
  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  drawMode = signal(false)

  //Creation of object Map
  public map:any
  public objectManager:any
  public mapCenter:number[]|any = [59.93245701691211, 30.3579130053922]//[58.539244168719485, 31.252706726744687]
  public polyline:any
  public coord_array:any
  public geozone:any
  public myPlacemark:any 
  public chosenMapObject:any 
  public mapObjectType:any

  /// icons
  icon_changeFrame: any = 'branding_watermark'
  icon_draw: any = 'draw'
  icon_edit: any = 'mode_edit'
  icon_delete: any = 'delete' 


  // Временный ID внутри JS (для новых объектов несохраненных на сервере)
  tempObjectID:number = 0;
  
  //////////////////////////////////////////////////////

  ///// Arrays for different types of map objects
  mapObjectDict: MapObjectRecord[] = [];
  mapGeozoneObjectDict: MapObjectRecord[] = [];

  ///// Add new object to array
  // Route
  public addMapObject(id: number, object: string, start_point?: any, end_point?: any): void {
    const newMapObjectRecord: MapObjectRecord = { id, object, start_point, end_point};
    this.mapObjectDict.push(newMapObjectRecord);
  }
  // Geozone
  public addGeozoneMapObject(id: number, object: string, start_point?: any, end_point?: any): void {
    const newMapObjectRecord: MapObjectRecord = { id, object, start_point, end_point};
    this.mapGeozoneObjectDict.push(newMapObjectRecord);
  }

  ///// Delete object by ID
  public deleteMapObjectRecordById(id: number): void {
    this.mapObjectDict = this.mapObjectDict.filter(p => p.id !== id);
  }
  public deleteGeozoneMapObjectRecordById(id: number): void {
    this.mapGeozoneObjectDict = this.mapGeozoneObjectDict.filter(p => p.id !== id);
  }  

  ///// Get object by ID
  // For routes
  public getMapObjectRecordById(id: number): { object: string } | undefined {
    const MapObjectRecord = this.mapObjectDict.find(p => p.id === id);
    return MapObjectRecord ? { object: MapObjectRecord.object } : undefined;
  }
  // For geozones
  public getGeozoneMapObjectRecordById(id: number): { object: string } | undefined {
    const MapObjectRecord = this.mapGeozoneObjectDict.find(p => p.id === id);
    return MapObjectRecord ? { object: MapObjectRecord.object } : undefined;
  }

  ////// Get start and finish point objects from rountes
  // Start
  public getMapStartPointById(id: number): { object: string } | undefined {
    const MapObjectRecord = this.mapObjectDict.find(p => p.id === id);
    return MapObjectRecord ? { object: MapObjectRecord.start_point } : undefined;
  }
  // Finish
  public getMapEndPointById(id: number): { object: string } | undefined {
    const MapObjectRecord = this.mapObjectDict.find(p => p.id === id);
    return MapObjectRecord ? { object: MapObjectRecord.end_point } : undefined;
  }

  ////// Get object data to draw it 
  // Return track_geojson 
  public getTrackGeoJsonById(id: number, array:any): string | undefined {
    const elem = array.find((el:any) => el.id === id);
    return elem ? elem.track_geojson : undefined;
  }
  public getTrackNameById(id: number, array:any): string | undefined {
    const elem = array.find((el:any) => el.id === id);
    return elem ? elem.name : undefined;
  }
  // Return geozone_geojson 
  public getGeozoneCoordsById(id: number, array:any): string | undefined {
    const elem = array.find((el:any) => el.id === id);
    return elem ? elem.geozone_geojson : undefined;
  }
  public getGeozoneFillColorById(id: number, array:any): string | undefined {
    const elem = array.find((el:any) => el.id === id);
    return elem ? (elem.colorFill ? elem.colorFill : '#0026E6') : undefined;
  }
  public getGeozoneLineColorById(id: number, array:any): string | undefined {
    const elem = array.find((el:any) => el.id === id);
    return elem ? (elem.colorLine ? elem.colorLine : '#0034AD') : undefined;
  }
  public getGeozoneOpacityById(id: number, array:any): string | undefined {
    const elem = array.find((el:any) => el.id === id);
    return elem ? (elem.opacity ? elem.opacity : 0.3) : undefined;
  }
  public getGeozoneNameById(id: number, array:any): string | undefined {
    const elem = array.find((el:any) => el.id === id);
    return elem ? elem.name : undefined;
  }
  /////////////////////////////////////////////////

  @Input() colorCode: string = '#F00FFF'; // Default color
  @Input() mapObjectName: string = ''; // Default color
  @Input() geozoneFillColor: string = '#F00FFF'; // Default color
  @Input() geozoneStrokeColor: string = '#F00FFF'; // Default color
  @Input() geozoneOpacity: number = 0.3; // Default color
  @Input() geozoneCoords: any = []; // Default color


  @Input() tracks_json:any = null; //container for tracks information
  @Input() geozones_json:any = null; //container for tracks information
  @Input() pointCollections_json:any = null; //container for tracks information
  @Input() post_message: string = "";

  @Input() geozoneName: string = "";
  @Input() geozoneColor: string = "";

  trackName: string = '';
  trackNumber: number = 1;
  trackNumber_toDel: number = 1;
  trackID!: number

  clusterer_1: any
  


  ngOnInit() {
  }

  ngAfterViewInit() {

    this.createMap()

  }
  
  public tempTextButton(){

          // GET data from server
          this.getGeoData() 
          // Manually trigger change detection
          this.cdr.detectChanges(); 

          this.drawCollection()
  }

  public tempTextButton_2(){

    console.log("Hi!")
}

  ListBoxLayout:any
  ListBoxItemLayout:any
  listBoxItems:any
  listBox:any

  clusterer:any

  private createMap() {

  
      //Загрузка пользовательских настроек карты
      ymaps.ready(() => {

        this.map = new ymaps.Map('map', {
          center: this.mapCenter,
          zoom: 12,
          //type: 'yandex#satellite'
      });

      //////////////////////////////////////////////////////////////////////// Buttons ////////////////////////////////////////////////////////////////////////
      // Создадим собственный макет выпадающего списка.
      const ListBoxLayout = ymaps.templateLayoutFactory.createClass(
          "<div class='button_x'>"+
          "<button id='my-listbox-header' class='btn btn-success dropdown-toggle' data-toggle='dropdown'>" +
              "{{data.title}} <span class='caret'></span>" +
          "</button>" +
          // Этот элемент будет служить контейнером для элементов списка.
          // В зависимости от того, свернут или развернут список, этот контейнер будет
          // скрываться или показываться вместе с дочерними элементами.
          "<ul id='my-listbox'" +
              " class='dropdown-menu' role='menu' aria-labelledby='dropdownMenu'" +
              " style='display: {% if state.expanded %}block{% else %}none{% endif %};'></ul>"+
          "</div>", {

          build: function() {
              // Вызываем метод build родительского класса перед выполнением
              // дополнительных действий.
              ListBoxLayout.superclass.build.call(this);

              this.childContainerElement = document.querySelector('#my-listbox');
              // Генерируем специальное событие, оповещающее элемент управления
              // о смене контейнера дочерних элементов.
              this.events.fire('childcontainerchange', {
                  newChildContainerElement: this.childContainerElement,
                  oldChildContainerElement: null
              });
          },

          // Переопределяем интерфейсный метод, возвращающий ссылку на
          // контейнер дочерних элементов.
          getChildContainerElement: function () {
              return this.childContainerElement;
          },

          clear: function () {
              // Заставим элемент управления перед очисткой макета
              // откреплять дочерние элементы от родительского.
              // Это защитит нас от неожиданных ошибок,
              // связанных с уничтожением dom-элементов в ранних версиях ie.
              this.events.fire('childcontainerchange', {
                  newChildContainerElement: null,
                  oldChildContainerElement: this.childContainerElement
              });
              this.childContainerElement = null;
              // Вызываем метод clear родительского класса после выполнения
              // дополнительных действий.
              ListBoxLayout.superclass.clear.call(this);
          }
      });

      // Также создадим макет для отдельного элемента списка.
      const ListBoxItemLayout = ymaps.templateLayoutFactory.createClass(
          "<li><a>{{data.content}}</a></li>"
      );

      // Создадим 2 пункта выпадающего списка
      const listBoxItems = [
          new ymaps.control.ListBoxItem({
              data: {
                  content: 'Москва',
                  center: [55.751574, 37.573856],
                  zoom: 9
              }
          }),
          new ymaps.control.ListBoxItem({
              data: {
                  content: 'Санкт-Петербург',
                  center: [59.93245701691211, 30.3579130053922],
                  zoom: 9
              }
          }),
          new ymaps.control.ListBoxItem({
              data: {
                  content: 'Омск',
                  center: [54.990215, 73.365535],
                  zoom: 9
              }
          }),
          new ymaps.control.ListBoxItem({
              data: {
                  content: 'Новгород',
                  center: [58.539244168719485, 31.252706726744687],
                  zoom: 9
              }
          })
      ];

      // Теперь создадим список, содержащий 2 пункта.
      const listBox = new ymaps.control.ListBox({
              items: listBoxItems,
              data: {
                  title: 'Выберите город'
              },
              options: {
                  // С помощью опций можно задать как макет непосредственно для списка,
                  layout: ListBoxLayout,
                  // так и макет для дочерних элементов списка. Для задания опций дочерних
                  // элементов через родительский элемент необходимо добавлять префикс
                  // 'item' к названиям опций.
                  itemLayout: ListBoxItemLayout
              }
          });

      listBox.events.add('click', (e:any) => {
          // Получаем ссылку на объект, по которому кликнули.
          // События элементов списка пропагируются
          // и их можно слушать на родительском элементе.
          var item = e.get('target');
          // Клик на заголовке выпадающего списка обрабатывать не надо.
          if (item != listBox) {
              this.map.setCenter(
                  item.data.get('center'),
                  item.data.get('zoom')
              );
          }
      });

      this.map.controls.add(listBox, {float: 'left'});
    
      this.changeObject()

      })


}

  //Возможно, стоит сделать отедльный класс, где будут перечислены все возможные трансформации объектов. 
  // Допустим, changeObject.geozone.fillColor
  // Get нужен для:
  // 1. Отображения текущих параметров объекта в форме в html
  public changeObject(){
    
    // Select object on map by cliking it
    this.map.geoObjects.events.add('click', (e:any) => {
        
      // Get selected map object
      this.chosenMapObject = e.get('target');

      // Renew data
      this.renewGeozonePropeties() 
      
      console.log("CLICKED")
      //console.log(this.mapObjectType)
      //console.log(this.chosenMapObject)
      
    })
  }
      
  public renewGeozonePropeties(){

    // Get iconColor of selected object
    this.colorCode = this.chosenMapObject.options.get('iconColor')

    this.mapObjectName = this.chosenMapObject.properties.get('hintContent')
    this.geozoneFillColor = this.chosenMapObject.options.get('fillColor')
    this.geozoneStrokeColor = this.chosenMapObject.options.get('strokeColor')
    this.geozoneOpacity = this.chosenMapObject.options.get('opacity')
    this.geozoneCoords = this.chosenMapObject.geometry.getCoordinates()

    // Attemp to get map object type (maybe there is a better way to do it)
    this.mapObjectType = this.chosenMapObject.getOverlay()._value.options._name

    // Manually trigger change detection
    this.cdr.detectChanges();

    console.log("geozoneCoords: ", this.geozoneCoords)
  }

/////////////////////////////////////////////////////////////// DUPLICTES ///////////////////////////////////////////////////////////////
  // api of server with track database
  private url:string = 'http://127.0.0.1:8000/api/tracks/'
  private url_geozones:string = 'http://127.0.0.1:8000/api/geozones/'
  private url_pointCollections:string = 'http://127.0.0.1:8000/api/pointcollections/'

  // GET data from serverside database
  public async getGeoData(): Promise<void> {

    const response = await fetch(this.url)
    //console.log(response)    
    this.tracks_json = await response.json();
    //console.log(this.tracks_json)

    // Geozones
    const response_geozones = await fetch(this.url_geozones)
    //console.log(response)    
    this.geozones_json = await response_geozones.json();
    //console.log(this.geozones_json)   

    // Point Collections
    const response_pointCollections = await fetch(this.url_pointCollections)

    this.pointCollections_json = await response_pointCollections.json();
    //console.log(this.pointCollections_json)   
  }

  // Delay for secondary GET request
  public updateTrackArray(){
    setTimeout(() => {
      console.log("Delayed for 1 second.")
      this.getGeoData()
      window.location.reload()
    }, 1000);
  }


   // DELETE data in serverside database by id of track
   public async deleteTrack() {

    // GeoJSON data via variable
    this.trackID =  this.tracks_json[this.trackNumber_toDel-1].id

    // Delete data in DB   
    this.http.delete<any>(this.url+this.trackID).subscribe(config => {
      console.log('Deleted track:', config);
    })    
    
    // GET data from server - to renew list of tracks
    this.updateTrackArray()
  }
  

  
    // POST data to serverside database
    public postTrack(){

      // Check that nessessary data provided
      if (this.mapObjectName == ""){
        //Warning message
        this.post_message = "Введите имя геозоны";

      } else if (!this.geozoneCoords[0]){
        //Warning message
        this.post_message = "Нарисуйте геозону";

      } else{
  
        //Empty warning message
        this.post_message = ""
  
        // Data to post
        const newConfig:any = {"name":this.mapObjectName, 
                              "geozone_geojson":this.geozoneCoords,
                              "colorFill": this.geozoneFillColor,
                              "colorLine": this.geozoneStrokeColor,
                              "opacity": this.geozoneOpacity} 
  
        // Post data to server
        const headers = {'Content-Type':'application/json'};
        this.http.post<any>(this.url_geozones, newConfig, {headers: headers}).subscribe({
          next: (config) => console.log('Updated config:', config),
          error: (error) => console.error('Error updating config:', error)
      })
  
        // GET data from server - to renew list of tracks
        this.updateTrackArray()
    }
  }

  // Обновление данных по объекту
  public patchMapObjectByID(){
  
    const patchURL = this.url_geozones+this.chosenMapObject['ID_in_DB']

    // Data to patch
    const newConfig:any = {"name":this.mapObjectName, 
                            "geozone_geojson":this.geozoneCoords,
                            "colorFill": this.geozoneFillColor,
                            "colorLine": this.geozoneStrokeColor,
                            "opacity": this.geozoneOpacity} 

    const headers = { 'Content-Type': 'application/json' };
    this.http.patch<any>(patchURL, newConfig, { headers: headers})
        .subscribe({
            next: (config) => console.log('Updated config:', config),
            error: (error) => console.error('Error updating config:', error)
        });
  }


  deletionStatus:any = 0;

  public async deleteGeozone(){

    const deleteURL = this.url_geozones+this.chosenMapObject['ID_in_DB']

    // Delete data in DB   
    this.http.delete<any>(deleteURL)
        .subscribe({
            next: (config) => {

              this.deletionStatus = config
              console.log('Deleted config:', config)
            },
            error: (error) => {
              this.deletionStatus = error
              console.error('Error deleting config:', error)
            }
        });   
    /*
    .subscribe(config => {
      
      this.deletionStatus = config
      console.log('Deleted track:', config);
    })    */
    
    // GET data from server - to renew list of tracks
    this.updateTrackArray()

  }
  
  /////////////////////////////////////////////////////////////// Draw new objects on map (from received data) //////////////////////////////////////////////////////////////////

  public swapCoordinates(geojson:any) {
    geojson.features.forEach((feature:any) => {
        const geometry = feature.geometry;

        if (geometry) {
            if (geometry.type === "Point") {
                // Swap coordinates for Point
                geometry.coordinates = [geometry.coordinates[1], geometry.coordinates[0]];
            } else if (geometry.type === "LineString" || geometry.type === "MultiPoint") {
                // Swap coordinates for LineString or MultiPoint
                geometry.coordinates = geometry.coordinates.map((coord:any) => [coord[1], coord[0]]);
            } else if (geometry.type === "Polygon" || geometry.type === "MultiLineString") {
                // Swap coordinates for Polygon or MultiLineString
                geometry.coordinates = geometry.coordinates.map((ring:any) =>
                    ring.map((coord:any) => [coord[1], coord[0]])
                );
            } else if (geometry.type === "MultiPolygon") {
                // Swap coordinates for MultiPolygon
                geometry.coordinates = geometry.coordinates.map((polygon:any) =>
                    polygon.map((ring:any) =>
                        ring.map((coord:any) => [coord[1], coord[0]])
                    )
                );
            }
        }
    });

    return geojson;
}

  public drawCollection(){
    
    // GET data from server
    this.getGeoData()   

    console.log(this.pointCollections_json)

    const string_geojson = this.pointCollections_json[25].pointCollection_geojson

    console.log(string_geojson)

    
    // Replace single quotes with double quotes. 
    // Is needed because JSON from server has single quotes (wrong format) and it causes an error
    //const pointCollection_X_repl = string_geojson.replace(/'/g, '"');

    // Create JSON object
    // I'm using type=any because with type=FeatureCollection it does not see geometry.coordinates
    const pointCollection_X:any = JSON.parse(string_geojson)
   
    //.geometry.coordinates
    //const pointCollection_X_1:any = pointCollection_X.features.map(([lon, lat]:[number, number][]) => [lat, lon])
    //const pointCollection_X_1:any = this.swapCoordinates(pointCollection_X)

    //console.log(pointCollection_X_1)


    const result = ymaps.geoQuery(pointCollection_X)
    // Добавление не точечных объектов на карту как есть.
    result.search('geometry.type != "Point"').addToMap(this.map);

    //console.log("clusterer_1", this.clusterer_1.options.get())


    const clusterer_options = {
      clusterIconLayout: ymaps.templateLayoutFactory.createClass(
       '<div class="stretchy-placemark stretchy-placemark_state_active stretchy-placemark_theme_blue" style="opacity: 1;">'
         +'<div class="stretchy-placemark__l stretchy-placemark_theme_black"></div>'
         +'<div class="stretchy-placemark__r stretchy-placemark_theme_black"></div>'
           +'<div class="stretchy-placemark__content">'
             +'<div class="stretchy-placemark__content-inner">'
               +'<div>'
               + '<span>{{properties.hintContentXXX}}</span>'


               //+'<span>Кол-во меток: {{properties.geoObjects.length}}</span>'
               //+'<span>Кол-во меток: {{properties.geoObjects[0].geometry.getType()}}</span>'
               //+'{ console.log(properties.geoObjects) }'
               
           //+'<button (click)="{{this.tempTextButton_2()}}">Тестить</button>'
           //+'<button onclick="{{tempTextButton_2()}}">Click me</button>'
       // Using a closure to access properties
               //+ '<button id="logGeoObjectsButton">Click me</button>'
               //+ '<ul class=list>'+
               /*
                   // Выводим в цикле список всех геообъектов.
                   +'{% for geoObject in properties.geoObjects %}'
                       +'<li><a href=# data-placemarkid="{{ geoObject.properties.placemarkId }}" class="list_item">{{ geoObject.geometry.type}}</a></li>'+
                       +'<a> {{ geoObject.type }} </a>'
                   +'{% endfor %}'
                 //+'</ul>'
                 */
               +'</div>'
             +'</div>'
           +'</div>'
       +'</div>'),

      // Чтобы метка была кликабельной, переопределим ее активную область.
      clusterIconShape: {
        type: 'Polygon',
        coordinates: [[[0, -20], [0, -40], [-80, -40], [-80, -20]]]
      },
    /**
     * Через кластеризатор можно указать только стили кластеров,
     * стили для меток нужно назначать каждой метке отдельно.
     * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/option.presetStorage.xml
     */
    /*
    preset: 'islands#invertedVioletClusterIcons',
    /**
     * Ставим true, если хотим кластеризовать только точки с одинаковыми координатами.
     *//*
    
    groupByCoordinates: false,
    /**
     * Опции кластеров указываем в кластеризаторе с префиксом "cluster".
     * @see https://api.yandex.ru/maps/doc/jsapi/2.1/ref/reference/ClusterPlacemark.xml
     */
    
    numbers: [300, 200],
    clusterDisableClickZoom: true,
    clusterHideIconOnBalloonOpen: false,
    geoObjectHideIconOnBalloonOpen: false,
    clusterOpenBalloonOnClick: false         
  }

    let geoQuery_result = result.search('geometry.type == "Point"')
                                .search('properties.speed >= 0')

    
    const clusterer_2 = geoQuery_result.clusterize(clusterer_options)


    clusterer_2.createCluster = function (center:any, geoObjects:any) {
        
        // Создаем метку-кластер с помощью стандартной реализации метода.
        const clusterPlacemark = ymaps.Clusterer.prototype.createCluster.call(this, center, geoObjects)
        
        const  geoObjectsList = clusterPlacemark.getGeoObjects()

        const speedList:any = []

        geoObjectsList.forEach((obj:any) => {
          
          let speed = obj.properties.get('speed')

          speedList.push(speed)

          });

        const  geoObjectsLength = geoObjectsList.length

        const avgSpeed = speedList.reduce((acc:any, cV:any) => acc + cV)/geoObjectsLength;
            
        let hintContent = 'Ср. скорость: ' + avgSpeed.toFixed(2) + ' км/ч для ' + geoObjectsLength + ' точек';

        clusterPlacemark.properties.set('hintContentXXX', hintContent);
        return clusterPlacemark;
    };

     // Точечные объекты добавим на карту через кластеризатор.
     this.map.geoObjects.add(clusterer_2);




/*
    // Object Manager
    this.objectManager = new ymaps.ObjectManager({ clusterize: false });
    this.objectManager.add(pointCollection_X_1);

    console.log(this.objectManager)
    this.map.geoObjects.add(this.objectManager); 
*/

      console.log(this.map.geoObjects)
  }
  // Draw track on map from received data from server
  public drawTrack(id:number){

    // GET data from server
    this.getGeoData()   

    // GeoJSON data via variable
    const track_X_str:any = this.getTrackGeoJsonById(id, this.tracks_json);
    const track_name:any = this.getTrackNameById(id, this.tracks_json);

    console.log("R2: " + track_X_str)

    // Replace single quotes with double quotes. 
    // Is needed because JSON from server has single quotes (wrong format) and it causes an error
    const track_X_repl = track_X_str.replace(/'/g, '"');

    // Create JSON object
    // I'm using type=any because with type=FeatureCollection it does not see geometry.coordinates
    const track_X:any = JSON.parse(track_X_repl)

    // отдельный файл

    // надо переделывать бэк под апи яндекса под new ymaps.GeoObject, лат-лон местами перепутаны и ключи нужны другие
    // drawRoute

    interface Geometry {
      type: string;
      coordinates: [number, number][];
    }
    
    interface Properties {
      stroke: string;
      'stroke-width': number;
    }

    interface myFeature {
      type: string;
      geometry: Geometry;
      properties: Properties|any;
    }

    interface myFeatureCollection {
      type: string;
      features: myFeature[]
    }

    // Different geojson structures (FeatureCollection, Feature) requires different ts types and methods to be red 
    switch (track_X.type){

      case 'FeatureCollection':

        const track_fc:myFeatureCollection = track_X

        this.coord_array = track_fc.features.find(({ geometry }) => geometry.type === 'LineString')?.geometry.coordinates
          .map(([lon, lat]) => [lat, lon])
        break

      case 'Feature':

        const track_f:myFeature = track_X

        this.coord_array =  track_f.geometry.coordinates
          .map(([lon, lat]) => [lat, lon])
        break

      default:
        console.log( "Структура geojson не описана" );
  }
    
    const endP:any = this.coord_array.length-1

    //Select only start coords 
    this.mapCenter =this.coord_array[endP]
    //Update map center
    this.map.setCenter(this.mapCenter, 10)

    //Add polylina as one object
    this.polyline = new ymaps.Polyline(
      this.coord_array,
      {
        hintContent: track_name
      }, 
      {
        strokeColor: "#009933",
        strokeWidth: 4,
      }
    )

    this.map.geoObjects.add(this.polyline)

    /////////////////////////////////////////////////////////////////// Start and End Placemarks ///////////////////////////////////////////////////////////////////


    const startPoint = new ymaps.Placemark(this.coord_array[0], {
            hintContent: track_name,
          }, 
          {
            // Необходимо указать данный тип макета. Показываем что это изображение.
            iconLayout: 'default#image',
            // Своё изображение иконки метки. Указываем путь до картинки
            iconImageHref: 'assets/img/track_start.png',
          });

    //this.map.geoObjects.add(startPoint);
/*
    const endPoint = new ymaps.Placemark(this.coord_array[endP], {
      hintContent: this.mapObjectName,
    }, 
    {
      // Необходимо указать данный тип макета. Показываем что это изображение.
      iconLayout: 'default#image',
      // Своё изображение иконки метки. Указываем путь до картинки
      iconImageHref: 'assets/img/track_finish.png',
      //'islands#darkBlueStretchyIcon'


    });
*/
    
      const endPoint = new ymaps.GeoObject(
      {
        // Описание геометрии.
        geometry: {
            type: "Point",
            coordinates: this.coord_array[endP]
        },
        // Свойства.
        properties: {
            // Контент метки.
            iconContent: track_name,
            hintContent: ''
        }
      }, 
      {
          // Иконка метки будет растягиваться под размер ее содержимого.
          preset: 'islands#blackStretchyIcon'
      })

    this.map.geoObjects.add(endPoint);
    
    // Добавляем в список объектов для дальнейшего вызова по ID
    this.addMapObject(id, this.polyline, startPoint, endPoint);
  }

  public draw_geozone(){

    const geoZoneString = '37.65031,55.792919,0 37.650465,55.794212,0 37.651304,55.795943,0 37.651334,55.796418,0 37.651143,55.7969,0 37.650984,55.797832,0 37.65101,55.798708,0 37.651155,55.799058,0 37.651398,55.80011,0 37.65453,55.804101,0 37.657819,55.808022,0 37.658119,55.808361,0 37.663108,55.814046,0 37.66607,55.81747,0 37.668081,55.819877,0 37.668576,55.820448,0 37.669246,55.821541,0 37.669852,55.82279,0 37.670323,55.824082,0 37.670463,55.824424,0 37.670606,55.824838,0 37.670643,55.824917,0 37.67095,55.825686,0 37.671282,55.826604,0 37.671462,55.827231,0 37.671495,55.827552,0 37.671525,55.828204,0 37.671543,55.82902,0 37.671501,55.829474,0 37.671274,55.830887,0 37.671027,55.832565,0 37.670767,55.834508,0 37.670381,55.837676,0 37.67021,55.83874,0 37.670721,55.838635,0 37.672088,55.838407,0 37.672849,55.838336,0 37.673502,55.838318,0 37.674206,55.838347,0 37.674964,55.83845,0 37.675689,55.838614,0 37.676317,55.838822,0 37.676898,55.839094,0 37.677384,55.83939,0 37.677738,55.839676,0 37.678009,55.83994,0 37.678293,55.840343,0 37.678457,55.84069,0 37.678533,55.84104,0 37.678529,55.841439,0 37.67844,55.841823,0 37.680258,55.842475,0 37.681389,55.843213,0 37.685844,55.845542,0 37.689067,55.847289,0 37.69032,55.848005,0 37.69114,55.848544,0 37.692226,55.850307,0 37.68997,55.851223,0 37.692392,55.852953,0 37.688328,55.853926,0 37.686863,55.85452,0 37.687981,55.855516,0 37.688706,55.856122,0 37.68941,55.855957,0 37.690243,55.855896,0 37.690598,55.856084,0 37.690747,55.856177,0 37.691631,55.85603,0 37.692522,55.856133,0 37.693133,55.855797,0 37.693069,55.855699,0 37.692896,55.855568,0 37.692634,55.85551,0 37.69243,55.85533,0 37.692774,55.855167,0 37.694676,55.853402,0 37.6945,55.853025,0 37.693964,55.851807,0 37.694506,55.84951,0 37.696823,55.848161,0 37.703587,55.848773,0 37.705518,55.847861,0 37.709781,55.847543,0 37.711899,55.847356,0 37.71216,55.847355,0 37.712388,55.847433,0 37.712503,55.847528,0 37.714075,55.846915,0 37.717128,55.849057,0 37.71802,55.84935,0 37.719379,55.850044,0 37.720105,55.850573,0 37.719405,55.851423,0 37.721005,55.852206,0 37.721639,55.852924,0 37.721456,55.853365,0 37.718246,55.860008,0 37.717921,55.860634,0 37.71047,55.860735,0 37.700564,55.861122,0 37.700773,55.861456,0 37.702658,55.862558,0 37.70504,55.861001,0 37.709322,55.861008,0 37.709116,55.862564,0 37.708864,55.863198,0 37.706669,55.864143,0 37.706614,55.864286,0 37.707212,55.864758,0 37.707924,55.865337,0 37.707699,55.865519,0 37.709035,55.866252,0 37.711143,55.867432,0 37.715232,55.869802,0 37.715813,55.870154,0 37.719053,55.872246,0 37.721736,55.872983,0 37.722445,55.873632,0 37.723624,55.873406,0 37.723629,55.873202,0 37.724256,55.873008,0 37.726555,55.873799,0 37.727082,55.873855,0 37.72734,55.873922,0 37.72755,55.873924,0 37.727927,55.873901,0 37.728324,55.874215,0 37.728542,55.874259,0 37.729479,55.874387,0 37.729833,55.874666,0 37.73182,55.874945,0 37.731081,55.87596,0 37.731196,55.876767,0 37.731479,55.876879,0 37.732658,55.877665,0 37.73426,55.878642,0 37.735505,55.878,0 37.744659,55.873325,0 37.768498,55.860892,0 37.777406,55.856442,0 37.789546,55.850239,0 37.79541,55.847193,0 37.802231,55.84367,0 37.807961,55.84074,0 37.813896,55.837664,0 37.818586,55.835295,0 37.823348,55.832771,0 37.827386,55.830599,0 37.829744,55.830558,0 37.830139,55.830303,0 37.83005,55.829722,0 37.830082,55.829153,0 37.832338,55.827567,0 37.83439,55.825961,0 37.83605,55.824223,0 37.83737,55.82249,0 37.838094,55.820972,0 37.83839,55.819927,0 37.838591,55.819321,0 37.838707,55.819106,0 37.839175,55.816262,0 37.839809,55.81587,0 37.841991,55.815182,0 37.842727,55.815118,0 37.843302,55.815208,0 37.843762,55.814774,0 37.843044,55.814365,0 37.841449,55.812895,0 37.840632,55.812452,0 37.840046,55.812078,0 37.839791,55.811739,0 37.839762,55.811625,0 37.839952,55.80903,0 37.840207,55.806135,0 37.840514,55.802471,0 37.840902,55.798865,0 37.841318,55.795145,0 37.843138,55.77924,0 37.844622,55.778501,0 37.845557,55.778208,0 37.846052,55.778171,0 37.846382,55.778199,0 37.848425,55.778652,0 37.850004,55.778929,0 37.850473,55.778904,0 37.850679,55.778563,0 37.850409,55.778479,0 37.848652,55.777866,0 37.847179,55.777393,0 37.84669,55.777254,0 37.845757,55.777007,0 37.845396,55.776459,0 37.845037,55.77598,0 37.843809,55.775315,0 37.843513,55.775058,0 37.843401,55.774735,0 37.843459,55.773962,0 37.843565,55.773852,0 37.843506,55.773668,0 37.843572,55.77284,0 37.843625,55.772557,0 37.844453,55.771137,0 37.844527,55.771131,0 37.844591,55.771021,0 37.844519,55.771002,0 37.845137,55.770037,0 37.845591,55.769254,0 37.845934,55.768615,0 37.845698,55.768071,0 37.845188,55.767969,0 37.844422,55.767597,0 37.843829,55.767279,0 37.843611,55.767108,0 37.843498,55.766907,0 37.843439,55.766081,0 37.843259,55.762403,0 37.843411,55.762361,0 37.843412,55.762201,0 37.843234,55.762195,0 37.843201,55.761847,0 37.84314,55.760697,0 37.84316,55.76046,0 37.842939,55.756818,0 37.842894,55.755057,0 37.842806,55.755024,0 37.84275,55.753791,0 37.842709,55.753792,0 37.842655,55.753142,0 37.842725,55.752824,0 37.842698,55.751589,0 37.842738,55.750806,0 37.842714,55.749445,0 37.842684,55.749073,0 37.842543,55.747176,0 37.842655,55.746735,0 37.843146,55.746325,0 37.843678,55.745903,0 37.844804,55.745315,0 37.845707,55.744872,0 37.846805,55.744587,0 37.847917,55.744535,0 37.847996,55.7445,0 37.849706,55.744621,0 37.853921,55.74495,0 37.856617,55.745068,0 37.859187,55.745155,0 37.860543,55.745243,0 37.863233,55.745573,0 37.864223,55.745724,0 37.864739,55.745847,0 37.87285,55.747413,0 37.879525,55.748729,0 37.882541,55.74934,0 37.887345,55.748457,0 37.887711,55.748577,0 37.888246,55.748464,0 37.888712,55.747143,0 37.890028,55.743628,0 37.890953,55.742195,0 37.890403,55.742085,0 37.890085,55.741871,0 37.890085,55.741604,0 37.885829,55.742613,0 37.883604,55.742692,0 37.88175,55.742731,0 37.880753,55.742504,0 37.880107,55.742255,0 37.880033,55.741747,0 37.878009,55.73787,0 37.873161,55.738157,0 37.868489,55.73729,0 37.866539,55.736296,0 37.866705,55.736182,0 37.864238,55.734717,0 37.865471,55.733159,0 37.868892,55.732973,0 37.871234,55.730839,0 37.87157,55.730848,0 37.873412,55.729648,0 37.872167,55.727705,0 37.870271,55.726586,0 37.87245,55.723377,0 37.876109,55.723435,0 37.876996,55.721617,0 37.876396,55.720437,0 37.881005,55.719099,0 37.882486,55.719003,0 37.883426,55.719159,0 37.886123,55.719594,0 37.88692,55.720261,0 37.887129,55.721653,0 37.886081,55.72237,0 37.884156,55.723396,0 37.885478,55.724192,0 37.887444,55.723769,0 37.888903,55.723787,0 37.889851,55.723701,0 37.890633,55.722309,0 37.892308,55.723187,0 37.898367,55.723569,0 37.899318,55.723619,0 37.89933,55.724027,0 37.900185,55.724343,0 37.901823,55.724419,0 37.902421,55.725251,0 37.903526,55.725334,0 37.905051,55.7251,0 37.905048,55.72497,0 37.905441,55.724945,0 37.906356,55.724791,0 37.907788,55.724803,0 37.911834,55.725745,0 37.913806,55.726581,0 37.915048,55.726984,0 37.915467,55.727468,0 37.916175,55.72771,0 37.916396,55.72816,0 37.916928,55.728357,0 37.917383,55.72945,0 37.91797,55.730523,0 37.918039,55.730622,0 37.918665,55.730704,0 37.919327,55.730705,0 37.919978,55.730802,0 37.920605,55.730878,0 37.921162,55.730858,0 37.92212,55.731013,0 37.922866,55.731231,0 37.923585,55.731226,0 37.924045,55.731052,0 37.924144,55.731002,0 37.924241,55.730891,0 37.92448,55.730827,0 37.924794,55.730765,0 37.9252,55.73051,0 37.925552,55.730518,0 37.925616,55.73047,0 37.92653,55.730542,0 37.92748,55.730227,0 37.928022,55.730003,0 37.928353,55.729541,0 37.928401,55.729427,0 37.928523,55.729354,0 37.928859,55.729323,0 37.929964,55.729453,0 37.930242,55.729807,0 37.930414,55.729858,0 37.930874,55.729755,0 37.931379,55.729374,0 37.931945,55.729156,0 37.932952,55.728691,0 37.93429,55.727876,0 37.93496,55.727639,0 37.935596,55.727386,0 37.936336,55.727131,0 37.937609,55.726887,0 37.937683,55.726534,0 37.938967,55.725578,0 37.939757,55.725033,0 37.94014,55.724685,0 37.940458,55.724572,0 37.94065,55.724558,0 37.94061,55.724516,0 37.940522,55.724492,0 37.940819,55.724338,0 37.941583,55.723495,0 37.94181,55.72317,0 37.942273,55.722992,0 37.942432,55.72281,0 37.942403,55.722762,0 37.942482,55.722693,0 37.942401,55.722529,0 37.942405,55.722487,0 37.942485,55.722479,0 37.942527,55.722429,0 37.942504,55.722386,0 37.942471,55.722386,0 37.94261,55.722052,0 37.943097,55.721916,0 37.943265,55.721935,0 37.943335,55.721914,0 37.943369,55.721881,0 37.943302,55.721784,0 37.943579,55.72145,0 37.943705,55.72143,0 37.943969,55.721442,0 37.944006,55.721483,0 37.944087,55.721507,0 37.944135,55.721497,0 37.944067,55.721397,0 37.944331,55.721327,0 37.944355,55.721357,0 37.944435,55.721535,0 37.944479,55.721549,0 37.944548,55.721538,0 37.94565,55.720839,0 37.945163,55.720812,0 37.942996,55.719813,0 37.938367,55.717426,0 37.937997,55.717383,0 37.936587,55.716238,0 37.930933,55.716193,0 37.92807,55.716159,0 37.926254,55.71515,0 37.926115,55.712187,0 37.925692,55.711982,0 37.924847,55.711113,0 37.924794,55.711117,0 37.921917,55.707961,0 37.919245,55.707606,0 37.907012,55.706991,0 37.905442,55.706993,0 37.897244,55.706255,0 37.89337,55.705554,0 37.892897,55.705506,0 37.886971,55.705215,0 37.884015,55.703226,0 37.883871,55.703286,0 37.882497,55.702356,0 37.882306,55.702461,0 37.880573,55.70115,0 37.88114,55.700862,0 37.881099,55.700845,0 37.879472,55.700268,0 37.875304,55.697519,0 37.872946,55.696055,0 37.871532,55.695298,0 37.864865,55.698675,0 37.860053,55.701137,0 37.859529,55.700825,0 37.858952,55.701104,0 37.858782,55.700995,0 37.858176,55.701254,0 37.853409,55.70354,0 37.853435,55.703789,0 37.85234,55.704195,0 37.849201,55.705267,0 37.843956,55.707026,0 37.842371,55.707614,0 37.841371,55.707966,0 37.837409,55.709289,0 37.836024,55.709776,0 37.833901,55.710475,0 37.827312,55.712683,0 37.82388,55.713846,0 37.820728,55.714896,0 37.816772,55.716226,0 37.812093,55.717821,0 37.804808,55.720267,0 37.800811,55.721539,0 37.796771,55.722893,0 37.793719,55.723979,0 37.792307,55.724462,0 37.789796,55.725293,0 37.779063,55.728889,0 37.777143,55.729506,0 37.775897,55.729939,0 37.774888,55.730387,0 37.773853,55.730906,0 37.769965,55.732905,0 37.769267,55.733254,0 37.767132,55.734358,0 37.765891,55.734964,0 37.762636,55.736542,0 37.762205,55.736708,0 37.761758,55.736857,0 37.761271,55.736993,0 37.760911,55.737069,0 37.759228,55.737364,0 37.758548,55.737453,0 37.755363,55.737849,0 37.753978,55.738048,0 37.752766,55.738258,0 37.751622,55.738499,0 37.750459,55.7388,0 37.74935,55.739157,0 37.748392,55.739535,0 37.747509,55.739946,0 37.746723,55.740368,0 37.745945,55.740878,0 37.745287,55.74139,0 37.743967,55.74254,0 37.743099,55.743178,0 37.742374,55.743666,0 37.741742,55.744052,0 37.741018,55.744452,0 37.740182,55.744832,0 37.739342,55.745177,0 37.738416,55.745486,0 37.737447,55.745756,0 37.736598,55.745975,0 37.736189,55.74609,0 37.725325,55.748967,0 37.724446,55.749232,0 37.723633,55.749516,0 37.723015,55.749773,0 37.722401,55.750062,0 37.721852,55.750353,0 37.721365,55.750635,0 37.720573,55.751161,0 37.720309,55.751355,0 37.719745,55.75185,0 37.719168,55.752411,0 37.718719,55.752942,0 37.718385,55.753419,0 37.718133,55.753881,0 37.717915,55.754405,0 37.717757,55.75496,0 37.717681,55.755507,0 37.71766,55.755965,0 37.717713,55.756483,0 37.717817,55.756983,0 37.71797,55.757493,0 37.71818,55.758018,0 37.718428,55.758507,0 37.720249,55.76161,0 37.720472,55.762028,0 37.720632,55.762465,0 37.720705,55.762784,0 37.720745,55.763123,0 37.720873,55.764946,0 37.720853,55.76547,0 37.720782,55.765883,0 37.720628,55.766318,0 37.720389,55.766733,0 37.720086,55.767134,0 37.719613,55.767679,0 37.717839,55.769589,0 37.717367,55.770146,0 37.716971,55.770701,0 37.716303,55.771776,0 37.715946,55.772298,0 37.713612,55.775301,0 37.713525,55.775256,0 37.713328,55.775479,0 37.712681,55.776171,0 37.710931,55.778001,0 37.71043,55.778449,0 37.70992,55.778875,0 37.709337,55.779285,0 37.70879,55.779623,0 37.708298,55.779907,0 37.707742,55.780161,0 37.707127,55.780384,0 37.706093,55.780737,0 37.705069,55.781043,0 37.703181,55.781524,0 37.70253,55.781655,0 37.701897,55.78177,0 37.701244,55.781851,0 37.700611,55.781891,0 37.699901,55.781914,0 37.699518,55.781968,0 37.699386,55.781969,0 37.696786,55.782016,0 37.696335,55.781944,0 37.692602,55.781956,0 37.69225,55.781845,0 37.688822,55.781905,0 37.685998,55.782523,0 37.682667,55.783163,0 37.675748,55.78453,0 37.675093,55.784683,0 37.674071,55.784891,0 37.672279,55.785221,0 37.667092,55.786136,0 37.662518,55.787013,0 37.661061,55.787324,0 37.655598,55.788381,0 37.651522,55.789369,0 37.650817,55.790756,0 37.650452,55.79164,0 37.65031,55.792919,0'

    const createGeozone = (geozoneData:any) => {
      const geozoneCoords = geoZoneString
          .split(',0')
          .map(coordsStr => coordsStr.split(',').map(parseFloat).reverse())
          .slice(0, -1);
      return new ymaps.Polygon([geozoneCoords]);
    }

    const geozone = createGeozone(geoZoneString);  
    this.map.geoObjects.add(geozone);

  }

  public drawSavedGeozone(id:number){

    // GET data from server
    this.getGeoData()   

    ////// Временные (несохраненные)

    ////// Серверные (сохраненные)

    // GeoJSON data via variable
    const geozoneFromDB:any = this.getGeozoneCoordsById(id, this.geozones_json);
    const nameFromDB:any = this.getGeozoneNameById(id, this.geozones_json);
    
    const fillColorFromDB:any = this.getGeozoneFillColorById(id, this.geozones_json);
    const lineColorFromDB:any = this.getGeozoneLineColorById(id, this.geozones_json);
    const opacityFromDB:any = this.getGeozoneOpacityById(id, this.geozones_json);

    console.log("getGeozoneFillColorById", fillColorFromDB)
    console.log("getGeozoneLineColorById", lineColorFromDB)
    console.log("getGeozoneOpacityById", opacityFromDB)
    
    // Парсим, так как данные приходят как string    
    const geozone_cooords:any = JSON.parse(geozoneFromDB)

    //Данные: [[Внешний контур], [Внутренний контур]]
    const geozone2 = new ymaps.Polygon([geozone_cooords], 
      {
        // Описываем свойства геообъекта.
        // Содержимое балуна.
        hintContent: nameFromDB
      }, 
      {
      // Курсор в режиме добавления новых вершин.
      editorDrawingCursor: "crosshair",  
      //openHintOnHover: true, 
      // Максимально допустимое количество вершин.
      // editorMaxPoints: 7,
      // Цвет заливки.
      fillColor: fillColorFromDB,
      // Цвет обводки.
      strokeColor: lineColorFromDB,
      // Ширина обводки.
      strokeWidth: 5,
      // Прохрачность
      opacity: opacityFromDB
    });

    //// Добавить ID к объекту
    geozone2['ID_in_DB'] = id

    //Добавляем на карту
    this.map.geoObjects.add(geozone2);

    // Добавляем в список объектов для дальнейшего вызова по ID
    this.addGeozoneMapObject(id, geozone2);
   
    console.log("drawSavedGeozone", this.mapGeozoneObjectDict)
  }
  

  public addNewGeozone(){

    //1. Нужно создать временный массив с новой геозоной (до тех пор пока ее не сохранили на сервер, чтобы не создавать в БД лишних пустых случайных геозон)

    // Создаем многоугольник без вершин.
    this.chosenMapObject = new ymaps.Polygon([], 
      {
        // Описываем свойства геообъекта.
        // Содержимое балуна.
        hintContent: ""
      }, 
      {
      // Курсор в режиме добавления новых вершин.
      editorDrawingCursor: "crosshair",  
      //openHintOnHover: true, 
      // Максимально допустимое количество вершин.
      // editorMaxPoints: 7,
      // Цвет заливки.
      fillColor: '#00FF00',
      // Цвет обводки.
      strokeColor: '#0000FF',
      // Ширина обводки.
      strokeWidth: 5,
      // Прохрачность
      opacity: 0.3
    });


    
    this.mapObjectName = this.chosenMapObject.properties.get('hintContent')
    this.geozoneFillColor = this.chosenMapObject.options.get('fillColor')
    this.geozoneStrokeColor = this.chosenMapObject.options.get('strokeColor')
    this.geozoneOpacity = this.chosenMapObject.options.get('opacity')

    // Добавляем атрибут со временным ID  (ID объекта до сохранения на сервер)
    // Простой итератор созданных объектов
    this.tempObjectID = this.tempObjectID + 1

    this.chosenMapObject['Temp_ID'] = this.tempObjectID

    // Добавляем многоугольник на карту.
    this.map.geoObjects.add(this.chosenMapObject);

    // В режиме добавления новых вершин меняем цвет обводки многоугольника.
    const stateMonitor = new ymaps.Monitor(this.chosenMapObject.editor.state);

    stateMonitor.add("drawing",  (newValue:any) => {
      this.chosenMapObject.options.set("strokeColor", newValue ? '#FF0000' : '#0000FF');
    });

    // Включаем режим редактирования с возможностью добавления новых вершин.
    this.chosenMapObject.editor.startDrawing();
    

    // Обновление информации в редакторе
    //this.renewGeozonePropeties()
  
  this.takeNewCoords()

  }

  public takeNewCoords(){

    if(this.chosenMapObject){

      // На изменение геометрии объекта забираеются новые значения
      this.chosenMapObject.geometry.events.add('change', (event:any) => {
        //var oldCoordinates = event.get('oldCoordinates');
        //var newCoordinates = event.get('newCoordinates');
        this.geozoneCoords = this.chosenMapObject.geometry.getCoordinates()
      });

      /*
      //При окончании режима рисования берем итоговые координаты
      this.chosenMapObject.editor.events.add("drawingstop", (event:any) => {
        console.log("drawingstop")
        this.geozoneCoords = this.chosenMapObject.geometry.getCoordinates()
      });

      // Вместо оконочания режима редактирования (editingstop) за событие лучше взять перенос грани (edgedragend) и вершины (vertexdragend)
      // Это охватывает больше пользовательских сценариев. 
      // Например, событие editingstop нужно завершать вручную, а перенос грани (edgedragend) и вершины (vertexdragend) происходят по факту переноса
      this.chosenMapObject.editor.events.add("edgedragend", (event:any) => {
        console.log("edgedragend")
        this.geozoneCoords = this.chosenMapObject.geometry.getCoordinates()
      });
      
      this.chosenMapObject.editor.events.add("vertexdragend", (event:any) => {
        console.log("vertexdragend")
        this.geozoneCoords = this.chosenMapObject.geometry.getCoordinates()
      });

      //При окончании режима фрейминга берем итоговые координаты
      this.chosenMapObject.editor.events.add("framingstop", (event:any) => {
        console.log("framingstop")
        this.geozoneCoords = this.chosenMapObject.geometry.getCoordinates()
      });
      */
      /*
      //При изменений заданных опций, например, цвета (реагирует на изменения значений метода options в объекте)
      this.chosenMapObject.editor.events.add("optionschange", (event:any) => {
        console.log("optionschange")
      });

      //При изменении состояния (судя по всему реагирует на изменения значений метода state в объекте)
      this.chosenMapObject.editor.events.add("statechange", (event:any) => {
        console.log("statechange")
      });
        /*

      //При окончании режима рисования
      this.chosenMapObject.editor.events.add("drawingstart", (event:any) => {
        console.log("drawingstart")

        //this.chosenMapObject = this.geozone

      });

      //При создании новой вершины через точку на гране
      tthis.chosenMapObject.editor.events.add("edgedragend", (event:any) => {
        console.log("edgedragend")
      });

      //При создании новой вершины в режиме рисования
      tthis.chosenMapObject.editor.events.add("vertexdragend", (event:any) => {
        console.log("vertexdragend")
      });

      //При изменений заданных опций, например, цвета (реагирует на изменения значений метода options в объекте)
      this.chosenMapObject.editor.events.add("optionschange", (event:any) => {
        console.log("optionschange")
      });

      //При изменении состояния (судя по всему реагирует на изменения значений метода state в объекте)
      this.chosenMapObject.editor.events.add("statechange", (event:any) => {
        console.log("statechange")
      });
      
    */
    }
  }

  public changeFrameChanges(){

    console.log(this.chosenMapObject.editor.state.get('framing'))

    if(!this.chosenMapObject.editor.state.get('framing')){
      this.chosenMapObject.editor.startFraming()
      this.icon_changeFrame = 'check'
    // Manually trigger change detection
    this.cdr.detectChanges(); 
    this.takeNewCoords()

    } else {
      this.chosenMapObject.editor.stopFraming()
      this.icon_changeFrame = 'branding_watermark'
    // Manually trigger change detection
    this.cdr.detectChanges(); 
    }
      
  }

  public changeDrawStatus(){

    if(!this.chosenMapObject.editor.state.get('drawing')){
      this.chosenMapObject.editor.startDrawing()
      this.icon_draw = 'check'
    // Manually trigger change detection
    this.cdr.detectChanges(); 
    this.takeNewCoords()

    } else {
      this.chosenMapObject.editor.stopDrawing()
      this.icon_draw = 'draw'
    // Manually trigger change detection
    this.cdr.detectChanges(); 
    }
      
  }

  public changeEditStatus(){

    if(!this.chosenMapObject.editor.state.get('editing')){
      this.chosenMapObject.editor.startEditing()
      this.icon_edit = 'check'
    // Manually trigger change detection
    this.cdr.detectChanges(); 
    this.takeNewCoords()

    } else {
      this.chosenMapObject.editor.stopEditing()
      this.icon_edit = 'mode_edit'
    // Manually trigger change detection
    this.cdr.detectChanges(); 
    }
      
  }


  // Возможно, можно обойстись бех этой функции, а вызывать напрямую то параметр, который меняется в данный момент. Здесь меняются сразу все
  ngOnChanges() {

    // Update object options when they change
    if (this.chosenMapObject) {

      //Color of icon
      this.chosenMapObject.options.set('iconColor', this.colorCode);

      this.chosenMapObject.options.set('fillColor', this.geozoneFillColor);
      this.chosenMapObject.options.set('strokeColor', this.geozoneStrokeColor);
      this.chosenMapObject.options.set('opacity', this.geozoneOpacity);

      

      //Hint or Name of Object
      this.chosenMapObject.properties.set('hintContent', this.mapObjectName);
      

    }

  }

}

