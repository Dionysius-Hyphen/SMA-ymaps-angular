import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { FeatureCollection } from 'geojson';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-leaflet-map',
  templateUrl: './leaflet-map.component.html',
  styleUrls: ['./leaflet-map.component.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class LeafletMapComponent implements OnInit, AfterViewInit {

  /////////////////////////////////////////////////////////////// Intermethod variables ///////////////////////////////////////////////////////////////

  //Creation of object Map
  private map!: L.Map
  //private markerGroup: L.LayerGroup = L.layerGroup().addTo(this.map);
  private polyline_2: L.Polyline | null = null;     //Variable for tracking the new polyline object
  
  private tempDots:any = []                         //Coordinates
  private tempMarkers:any = []                      //Marker objects

  trackName: string = '';
  trackNumber: number = 1;
  trackNumber_toDel: number = 1;
  
  
  @Input() tracks_json:any = null; //container for tracks information
  @Input() post_message: string = "";
  /////////////////////////////////////////////////////////////// Icons ///////////////////////////////////////////////////////////////

  // start
  private icon_start:any = L.icon({
    iconUrl: 'assets/img/track_start.png',
    iconSize: [27, 40],     // size of the icon
    shadowSize: [0, 0],     // size of the shadow
    iconAnchor: [2, 38],    // point of the icon which will correspond to marker's location
    shadowAnchor: [10, 10],   // the same for the shadow
    popupAnchor: [-13, -40] // point from which the popup should open relative to the iconAnchor
  });

  // point
   private icon_point:any = L.icon({
    iconUrl: 'assets/img/orange-circle.png',
    iconSize: [15, 15],
    shadowSize: [0, 0],
    iconAnchor: [7, 7],
    shadowAnchor: [0, 0],
    popupAnchor: [0, 0]
  });

  // finish
  private icon_finish:any = L.icon({
    iconUrl: 'assets/img/track_finish.png',
    iconSize: [40, 40],
    shadowSize: [0, 0],
    iconAnchor: [15, 37],
    shadowAnchor: [0, 0],
    popupAnchor: [-20, -40]
  });

  //Start point for map
  markers: L.Marker[] = [
    L.marker([58.539244168719485, 31.252706726744687]) //Novgorod
  ];

  constructor(private http: HttpClient) { 

  }


  ngOnInit() {
  }

  ngAfterViewInit() {
    this.getGeoData();
    this.initMap();
    this.centerMap();   
  }
     
  private initMap() {
 
    //Variable that contain map object connected to html div attribute
    this.map = L.map('map');
    /////////////////////////////////////////////////////////// Chosing tile provider /////////////////////////////////////////////////////////////

    //// Variable to choose tile providor
    //// Possible tile providers: https://leaflet-extras.github.io/leaflet-providers/preview/
    const baseMapURl_osm                = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    const baseMapURl_stamen_watercolor  = 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg'
    const baseMapURl_cyclosm            = 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'
    const baseMapURl_World_Street_Map   = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
    const baseMapURl_World_Topo_Map     = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
    const baseMapURl_2gis               = 'https://tile2.maps.2gis.com/tiles?x={x}&y={y}&z={z}'

    //Adding tile layers from chosen provider to html connected map object 
    const osm_map               = L.tileLayer(baseMapURl_osm);
    const stamen_watercolor_map = L.tileLayer(baseMapURl_stamen_watercolor);
    const cyclosm_map           = L.tileLayer(baseMapURl_cyclosm);
    const World_Street_Map_map  = L.tileLayer(baseMapURl_World_Street_Map);
    const World_Topo_Map_map    = L.tileLayer(baseMapURl_World_Topo_Map);
    const map_2gis              = L.tileLayer(baseMapURl_2gis);    
    
    ////////////////////////////////////////////////////////////////// Map control //////////////////////////////////////////////////////////////////
    //Variable that contain list of maps (for Legend)
    const baseMaps = {
      "OSM": osm_map,
      "Watercolor map": stamen_watercolor_map,
      "Cyclosm": cyclosm_map,
      "World Street Map": World_Street_Map_map,
      "World Topo Map": World_Topo_Map_map,
      "2gis": map_2gis
    }

    //For one map (but for some reason it should be used once enven with multiple maps - variant below - L.control.layers)
    map_2gis.addTo(this.map)

    //Gives possibility to choose one of maps listed in baseMaps in Legend
    L.control.layers(baseMaps).addTo(this.map)


  ///////////////////////////////////////////////////////////// Polyline 2: Create new markers on click ///////////////////////////////////////////////////////////////
  let newPoint:any = null;                      //Variable for tracking the new pointed coords
  let newMarker:any = null;                     //Variable for tracking the new marker object

  this.map.on('click', (e) => {
    
    //Store given coords to list of coords (for this track)
    this.tempDots.push(e.latlng)
    newPoint = this.tempDots[this.tempDots.length - 1]

    //Create new marker from the new point coords
    newMarker = L.marker(newPoint, {icon: this.icon_finish, draggable: true});
    newMarker.addTo(this.map)

    //Store it to the list
    this.tempMarkers.push(newMarker)

    // Check for the presence of markers
    if(this.tempMarkers.length > 1){
      // Icon changes. First marker should have icon of start, others - just dots. Icon of last marker (finish) is declared above 
      if(this.tempMarkers.length == 2){
        this.tempMarkers[this.tempMarkers.length - 2].setIcon(this.icon_start)}
      else{
        this.tempMarkers[this.tempMarkers.length - 2].setIcon(this.icon_point)
      }
    }
    //Draw a line between last two markers
    this.updatePolyline('blue')
  })
  ///////////////////////////////////////////////////////////////
}
  public removePolyline(){
    // If this layerExist - remove it
    if(this.polyline_2){
      this.map.removeLayer(this.polyline_2)
    }
  }
  
  //For updating changed polyline coords
  public updatePolyline(lineColor='green'){
    //New array of changed coords
    for (let i = 0; i < this.tempMarkers.length; i++) {
      this.tempDots[i] = this.tempMarkers[i].getLatLng()
    }

    //Remove layer
    this.removePolyline()

    //Draw new polyline
    this.polyline_2 = L.polyline(this.tempDots, {color: lineColor}).addTo(this.map);
  }

  private centerMap() {
    // Create a boundary based on the markers
    const bounds = L.latLngBounds(this.markers.map(marker => marker.getLatLng()));
    // Fit the map into the boundary
    this.map.fitBounds(bounds);

    //Alternative method to give "start page" coordinates in map 
    //this.map.setView([58.539244168719485, 31.252706726744687], 13) //Novgorod
  }
  
  //Action for button to clear last polyline (step back)
  public stepBack() {

    //Check for the presence of elements to delete
    if(this.tempDots.length > 0 && this.tempMarkers.length > 0 ){
      
      //Remove Layers
      this.map.removeLayer(this.tempDots[this.tempDots.length - 1])
      this.tempDots.pop()    
      this.map.removeLayer(this.tempMarkers[this.tempMarkers.length - 1])
      this.tempMarkers.pop()

      //Check for the presence of lines to delete them (line will be always one less than markers)
      console.log(this.tempDots)
      this.updatePolyline('red')

      //Check for the presence of markers
      if(this.tempMarkers.length > 1){
        //Icon changes. First marker should have icon of start, others - just dots. Icon of last marker (finish) is declared above 
        if(this.tempMarkers.length == 1){
          this.tempMarkers[this.tempMarkers.length - 1].setIcon(this.icon_start)
        } else{
          this.tempMarkers[this.tempMarkers.length - 1].setIcon(this.icon_finish)
        }
      }
    } else{
      console.log("No more markers!")
      }
  }
     
  //Delete all markers
  public clearAllMarkers() {

    //Clean up array
    this.tempDots = []

    //Check for the presence of elements to delete
    if(this.tempMarkers.length > 0 ){
      
      for (let i = 0; i < this.tempMarkers.length; i++) {
          //Remove Layers
          this.map.removeLayer(this.tempMarkers[i])
      }

    } else {
      console.log("No more markers!")
      }
    
    //Clean up array
    this.tempMarkers = []

    //Remove layer
    this.removePolyline()

  }
  
  ////////////////////////////////////////////////////////////////// User location //////////////////////////////////////////////////////////////////
  // Get user position (from browser)
  // Needs access to work
  public realtimeLocTracker(){
    navigator.geolocation.getCurrentPosition((position) => {
      console.log(position)
      const lat = position.coords.latitude
      const long = position.coords.longitude
      const accuracy = position.coords.accuracy
      console.log(lat, long, accuracy)
    });
  }

  ////////////////////////////////////////////////////////////////// REST connection to track database //////////////////////////////////////////////////////////////////
  private LefletObject_geoJSON:any = null;
  
  // api of server with track database
  private url:string = 'http://127.0.0.1:8000/api/tracks/'

  
  // GET data from serverside database
  public async getGeoData(){

    const response = await fetch(this.url)
    //console.log(response)    
    this.tracks_json = await response.json();
    console.log(this.tracks_json)
  }

  // Trasform Leaflet Object to GeoJSON format
  public LefletObjectToGeoJSON(polyline:any){

    this.LefletObject_geoJSON = polyline.toGeoJSON();
    // Copying of properties (as they are not included in .toGeoJSON method)
    L.extend(this.LefletObject_geoJSON.properties, polyline.properties)

  }

  // POST data to serverside database
  public postTrack(){

    // Check that nessessary data provided
    if (this.trackName == "" || !this.polyline_2){
      //Warning message
      this.post_message = "Input name of track AND place it on map";
      console.log(this.post_message)
    } else{

      //Empty warning message
      this.post_message = ""

      // Trasform Leaflet Object to GeoJSON format
      this.LefletObjectToGeoJSON(this.polyline_2)
      console.log(this.LefletObject_geoJSON)

      // Data to post
      const newConfig:any = {"name":this.trackName, "track_geojson":this.LefletObject_geoJSON} 

      // Post data to server
      const headers = {'Content-Type':'application/json'};
      this.http.post<any>(this.url, newConfig, {headers: headers}).subscribe(config => {
        console.log('Updated config:', config)

      })

      // GET data from server - to renew list of tracks
      this.updateTrackArray()
  }
  }

  // Delay for secondary GET request
  public updateTrackArray(){
    setTimeout(() => {
      console.log("Delayed for 1 second.")
      this.getGeoData()
    }, 1000);
  }

  // DELETE data in serverside database by id of track
  public async deleteTrack() {

    // GeoJSON data via variable
    const trackID: number =  this.tracks_json[this.trackNumber_toDel-1].id

    // Delete data in DB   
    this.http.delete<any>(this.url+trackID).subscribe(config => {
      console.log('Deleted track:', config);
    })    
    
    // GET data from server - to renew list of tracks
    this.updateTrackArray()
  }

  /////////////////////////////////////////////////////////////// Draw new objects on map (from received data) //////////////////////////////////////////////////////////////////

  // Draw track on map from received data from server
  public drawTrack(){

    // GET data from server
    this.getGeoData()   

    // GeoJSON data via variable
    const track_X_str: any =  this.tracks_json[this.trackNumber-1].track_geojson
    console.log("R2: " + track_X_str)

    // Replace single quotes with double quotes. 
    // Is needed beacause JSON from server has single quotes (wrong format) and it causes an error
    const track_X_repl = track_X_str.replace(/'/g, '"');

    // Create JSON object
    const track_X: FeatureCollection = JSON.parse(track_X_repl)

    // Add this object on map
    L.geoJSON(track_X, {
      onEachFeature: function(feature, layer) {
      // Setting up a popup
        layer.bindPopup('<b>Name: </b>' + feature.properties.name)
      },
      // Setting up style for object (e.g. line)
      style: {
        color: 'red'
      }
    }).addTo(this.map) 

  }

  }
