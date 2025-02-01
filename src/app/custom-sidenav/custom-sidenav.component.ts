import { Component, Input, input, model, OnInit, signal } from '@angular/core';
import { MatListModule} from '@angular/material/list';
import { MatIconModule} from '@angular/material/icon';
import { MatButtonModule} from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { YandexMapComponent } from '../yandex-map/yandex-map.component';
import { FormsModule } from '@angular/forms';

export type MenuObjects = {
  id: number
  name: string
  track_geojson: string
  icon: string
  lable: string
  attached: boolean
}

export type MenuItem = {
  icon: string
  lable: string
  open: boolean
  show: boolean
  route?: string
  subItems?: MenuObjects[]
}

@Component({
  selector: 'app-custom-sidenav',
  standalone: true,
  // Adding animation for smooth appearing and diappearing effect in menu
  animations: [
      trigger('expandContractMenu', [
        transition(':enter', [
          style({ opacity:0, height:'0px' }),
          animate('500ms ease-in-out', style({ opacity:1, height:'*' }))
        ]),
        transition(':leave', [
          animate('500ms ease-in-out', style({ opacity:0, height:'0px' }))
        ])
      ])
    ],
  imports: [FormsModule, CommonModule, MatListModule, MatIconModule, MatCheckboxModule, MatButtonModule, MatSliderModule, MatInputModule],
  templateUrl: './custom-sidenav.component.html',
  styleUrl: './custom-sidenav.component.scss'
})
export class CustomSidenavComponent implements OnInit{

  tracks_list: any;
  geozone_list: any;
  menuItems = signal<MenuItem[]>([]); // Initialize as an empty signal

  constructor(public yandexMapComponent: YandexMapComponent) {}

  currentItem!: MenuItem; 
  nestedMenuOpen = signal(false)
  redactorOpen_flag = signal(false)
  readonly isChecked = model(false);
  

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return `${value}`;
  }

  toggleNested(item: MenuItem){

    this.currentItem = item

    //If there is no subItems, then return nothing
    if (!this.currentItem || !this.currentItem.subItems){
      return
    }

    this.nestedMenuOpen.set(!this.nestedMenuOpen())
  }


  // Remove object from map 
  detachFromMenu(id:number, lable:any){

    //console.log(this.yandexMapComponent.mapObjectDict)
    console.log("Delete:", id)

    switch (lable){

      case 'Маршруты':
        //Маршрут
        const objectToDetach = this.yandexMapComponent.getMapObjectRecordById(id)?.object
        this.yandexMapComponent.map.geoObjects.remove(objectToDetach)
        //Метка старта
        const objectToDetach_2 = this.yandexMapComponent.getMapStartPointById(id)?.object
        this.yandexMapComponent.map.geoObjects.remove(objectToDetach_2)
        //Метка финиша
        const objectToDetach_3 = this.yandexMapComponent.getMapEndPointById(id)?.object
        this.yandexMapComponent.map.geoObjects.remove(objectToDetach_3)

        //Удаление из массива
        this.yandexMapComponent.deleteMapObjectRecordById(id)  
        break

      case 'Геозоны':

        //Геозона
        const geozoneToDetach = this.yandexMapComponent.getGeozoneMapObjectRecordById(id)?.object
        this.yandexMapComponent.map.geoObjects.remove(geozoneToDetach)

        console.log("drawSavedGeozone1", this.yandexMapComponent.mapGeozoneObjectDict)
        //Удаление из массива
        this.yandexMapComponent.deleteGeozoneMapObjectRecordById(id)  
        console.log("drawSavedGeozone2", this.yandexMapComponent.mapGeozoneObjectDict)

        break
    }
 

  }

  // Add object on map from menu
  attachFromMenu(id:number, lable:any){

    switch (lable){

      case 'Маршруты':

        if(!this.yandexMapComponent.getMapObjectRecordById(id)?.object){

          this.yandexMapComponent.drawTrack(id)
        }        
        break

      case 'Геозоны':
        //Геозона        

        if(!this.yandexMapComponent.getGeozoneMapObjectRecordById(id)?.object){

          this.yandexMapComponent.drawSavedGeozone(id)
        }        
        break
    }
  }

  checkboxFromMenu(id:number, attached:boolean, lable:any){

    console.log(attached)

    if(!attached){
      this.detachFromMenu(id, lable)
    } else {
      this.attachFromMenu(id, lable)
    }
  }

  // Delete object from menu
  deleteFromMenu(id:number){

    console.log("ID: ",id)
    this.yandexMapComponent.trackID = id
    this.yandexMapComponent.deleteTrack()
  }

  id_toDel:any 

  deleteGozoneFromMenu(){

    if(this.yandexMapComponent.chosenMapObject['ID_in_DB']){
      console.log("1")
      this.id_toDel = this.yandexMapComponent.chosenMapObject['ID_in_DB']
      this.detachFromMenu(this.id_toDel, 'Геозоны')
      this.yandexMapComponent.deleteGeozone()

    } else if(this.yandexMapComponent.chosenMapObject['Temp_ID']){
      console.log("2")
      this.id_toDel = this.yandexMapComponent.chosenMapObject['Temp_ID']
      this.detachFromMenu(this.id_toDel, 'Геозоны')
      this.yandexMapComponent.map.geoObjects.remove(this.yandexMapComponent.chosenMapObject)

    } else {
      console.log("Нет заданого ID")
    }
    
    this.closeRedactor()
    //console.log("IID",this.yandexMapComponent.chosenMapObject['ID_in_DB'])
  }

  // async here because getGeoData() is GET request
  async ngOnInit() {

    await this.yandexMapComponent.getGeoData();

    this.tracks_list = this.yandexMapComponent.tracks_json;
    this.tracks_list = this.tracks_list.map((task:any) => ({
      ...task,
      attached: false // Add the new property
    }));

    this.geozone_list = this.yandexMapComponent.geozones_json
    this.geozone_list = this.geozone_list.map((task:any) => ({
      ...task,
      attached: false // Add the new property
    }));

    const list_b = [this.tracks_list]
    const list_gz = [this.geozone_list]

    console.log(list_b)

    // Update menuItems after tracks_list is set
    this.menuItems.set([
      {
        icon: 'edit_mode',
        lable: 'Редактор геозон',
        open: false,
        show: false,
        route: ''
      },
      {
        icon: 'directions_car',
        lable: 'Маршруты',
        open: false,
        show: true,
        route: '',
        subItems: list_b[0]
      },
      {
        icon: 'blur_circular',
        lable: 'Геозоны',
        open: false,
        show: true,
        route: '',
        subItems: list_gz[0]
      }
    ])

    this.changeObjectinMenu()
  }

  update(completed: boolean, j: number, i: number, lable:any) {

    this.menuItems.update(menuItems => {
        const subItem = menuItems[j].subItems![i]; // Access the specific subItem
        subItem.attached = completed; // Update the attached property

        this.checkboxFromMenu(subItem.id, subItem.attached, lable)
        return [...menuItems]; // Return updated menuItems
    });
  
  }

  updateNested(j: number) {

    this.menuItems.update(menuItems => {
      
      // Close all except current
      for (let i = 0; i < menuItems.length; i++) {
        if(i != j){
          menuItems[i].open = false;
        } else {
          const CurrentItem = menuItems[j]; 
          CurrentItem.open = !CurrentItem.open; 
        }
        
      }

      return [...menuItems]; 
    });
  }

  openRedactor(j: number) {

    this.menuItems.update(menuItems => {
      
      // 
      for (let i = 0; i < menuItems.length; i++) {
        if(i != j && menuItems[i].lable != 'Редактор геозон'){
          menuItems[i].show = false;
        } else {
          menuItems[i].show = true;
        }
        
      }
      // Флаг открытия редактора
      this.redactorOpen_flag.set(true)

      return [...menuItems]; 
    });
  }

  closeRedactor() {

    this.menuItems.update(menuItems => {
      
      // 
      for (let i = 0; i < menuItems.length; i++) {
        if(menuItems[i].lable == 'Редактор геозон'){
          menuItems[i].show = false;
        } else {
          menuItems[i].show = true;
        }
        
      }
      
      // Флаг закрытия редактора
      this.redactorOpen_flag.set(false)

      return [...menuItems]; 
    });
  }

  // For redactor tab in menu
  menuAddNewGeozone(j: number){
    //
    this.yandexMapComponent.addNewGeozone()
    this.openRedactor(j)
  }

  // Открытие редактора при выборе объекта на карте
  public async changeObjectinMenu(){
    
    // Select object on map by cliking it
    this.yandexMapComponent.map.geoObjects.events.add('click', (e:any) => {
      
      console.log("CHANGING!")
      this.openRedactor(3)
    })
  }

  openGeozoneInRadactor(checked:boolean, j:any, i:any, lable:any, id:any){

    //console.log("@!@", this.yandexMapComponent.mapGeozoneObjectDict)
    
    //Загрузить объект по iD
    this.yandexMapComponent.chosenMapObject = this.yandexMapComponent.getGeozoneMapObjectRecordById(id)

    //Ставится галочка и отображается объект на карте
    this.update(checked, j, i, lable)
    //Открыть редактор
    this.openRedactor(j)
  }
      
}
