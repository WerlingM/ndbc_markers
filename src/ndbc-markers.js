import './ndbc-markers.css';

import 'ol/ol.css';
import Proj from 'ol/proj';
import Map from 'ol/map';
import View from 'ol/view';
import TileLayer from 'ol/layer/tile';
import XYZ from 'ol/source/xyz';
import VectorSource from 'ol/source/vector';
import VectorLayer from 'ol/layer/vector';
import Style from 'ol/style/style';
import Circle from 'ol/style/circle';
import Fill from 'ol/style/fill';
import Stroke from 'ol/style/stroke';
import Point from 'ol/geom/point';
import Feature from 'ol/feature';

console.log('Start ndbc-markers custom vis');
// create chart container
const chartContainer = document.createElement('div');
let mapDivId = 'map-' + controller.thread.UUID; //appending a value to the ID to make it unique in case multiple maps on same dashboard
chartContainer.id = mapDivId;
chartContainer.style.width = '100%';
chartContainer.style.height = '100%';
chartContainer.classList.add('chart-container');
controller.element.appendChild(chartContainer);

let markersSource = new VectorSource({
  wrapX: false,
});

let markerStyle = new Style({
  image: new Circle({
    radius: 5,
    fill: new Fill({ color: '#666666' }),
    stroke: new Stroke({ color: '#bada55', width: 1 }),
  }),
});

let markersLayer = new VectorLayer({
  source: markersSource,
  style: markerStyle,
});

//add the basic OpenLayers map to the div
let tileLayer = new TileLayer({
  source: new XYZ({
    url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  }),
});

let map = new Map({
  target: mapDivId,
  layers: [tileLayer, markersLayer],
  view: new View({
    center: Proj.fromLonLat([-80.0, 20.0]),
    zoom: 3,
    minZoom: 2,
    extent: tileLayer.getExtent(),
  }),
});

//*** Zoomdata Controller and Functions ***
// called when new data is received from server
controller.update = data => {
  let newFeatures = [];
  data.forEach(d => {
    //The lon/lat are strings since we had to do a multi-group by request from Zoomdata
    let newPoint = new Point(
      Proj.fromLonLat([parseFloat(d.group[2]), parseFloat(d.group[1])]),
    );
    let newFeature = new Feature({
      station_id: d.group[0],
      geometry: newPoint,
    });
    newFeatures.push(newFeature);
  });
  markersSource.addFeatures(newFeatures);
  markersSource.refresh();
  map.render();
};

// called when the chart widget is resized
controller.resize = (newWidth, newHeight) => {
  map.updateSize();
};
