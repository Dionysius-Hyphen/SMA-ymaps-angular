import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import json_tracks from '../../../assets/geoJson_data/tracks/tracks.json'
import json_geozones from '../../../assets/geoJson_data/geozones/geozones.json'
import json_pointCollection from '../../../assets/geoJson_data/collections/collections.json'


@Injectable({
  providedIn: 'root'
})

export class MapHttpRequestsService {

  constructor(
      private http: HttpClient
    ) { }

  // api of server with track database
  private url:string = 'http://127.0.0.1:8000/api/tracks/'
  private url_geozones:string = 'http://127.0.0.1:8000/api/geozones/'
  private url_pointCollections:string = 'http://127.0.0.1:8000/api/pointcollections/'
  

  chosenMapObject:any 

  tracks_json:any = null; 
  geozones_json:any = null; 
  pointCollections_json:any = null; 
  post_message: string = "";

  trackName: string = '';
  trackNumber: number = 1;
  trackNumber_toDel: number = 1;
  trackID!: number

  
  colorCode: string = '#F00FFF'; // Default text color
  mapObjectName: string = ''; // Default name
  geozoneFillColor: string = '#F00FFF'; // Default fill color
  geozoneStrokeColor: string = '#F00FFF'; // Default line color
  geozoneOpacity: number = 0.3; // Default opacity
  geozoneCoords: any = []; // Default coords

  // GET data from serverside database
  public async getGeoData(): Promise<void> {

    if(true){

      // Tracks
      this.tracks_json = json_tracks
      // Geozones
      this.geozones_json = json_geozones
      // Point Collections
      this.pointCollections_json = json_pointCollection

    } else {
  
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
  public patchMapObjectByID(
    chosenMapObject:any,
    mapObjectName:any,
    geozoneCoords:any,
    geozoneFillColor:any,
    geozoneStrokeColor:any,
    geozoneOpacity:any
  ){
  
    // Data to patch
    const newConfig:any = {"name":this.mapObjectName, 
                            "geozone_geojson":this.geozoneCoords,
                            "colorFill": this.geozoneFillColor,
                            "colorLine": this.geozoneStrokeColor,
                            "opacity": this.geozoneOpacity} 

    console.log("newConfig: ", newConfig)
    
    const patchURL = this.url_geozones+this.chosenMapObject['ID_in_DB']
    //const patchURL = `${this.url_geozones}${chosenMapObject['ID_in_DB']}`;

    console.log("patchURL", patchURL)

    const headers = { 'Content-Type': 'application/json' };

    console.log("patch", this.http.patch)
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
  
}
