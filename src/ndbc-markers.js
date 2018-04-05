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

//Create an openlayers style based on the attributes
function markerStyleFunction(feature) {
  let color = feature.get('color');
  let result = new Style({
    image: new Circle({
      radius: 5,
      fill: new Fill({ color: color }),
      stroke: new Stroke({ color: '#bada55', width: 1 }),
    }),
  });
  return result;
}

let markersLayer = new VectorLayer({
  source: markersSource,
  style: markerStyleFunction,
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

map.on('pointermove', evt => {
  //TODO: implement tool tip
});

map.on('singleclick', evt => {
  //TODO implement radial menu
  /* sample from somewhere else:
  controller.menu.show({
    event: e.originalEvent,
    data: function() {
        return dataLookup[feature.properties[currRegion.regionField]];
    },
    hide: ['Zoom']
});
*/
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
    //Storing relevant values as feature properties so they are easy to retrieve during map operations
    //assuming the first field in the group is some sort of ID for the entity the marker represents
    //second two fields in d.group are lat, lon
    //Get the metrics and count from d.current, have to look them up by field name and function
    //add the color from Zoomdata as a property, making it easier to use for the styling
    //add the original Zoomdata object in case we want to use the ZOomdata tooltip or radial menu
    let colorFieldName = controller.dataAccessors.Color.getMetric().name;
    let colorMetricVal = null;
    if (colorFieldName != 'count') {
      let colorFunc = controller.dataAccessors.Color.getMetric().func;
      if (colorFunc != null) {
        colorMetricVal = d.current.metrics[colorFieldName][colorFunc];
      }
    } else {
      colorMetricVal = d.current.count;
    }
    let sizeFieldName = controller.dataAccessors.Size.getMetric().name;
    let sizeMetricVal = null;
    if (sizeFieldName != 'count') {
      let sizeFunc = controller.dataAccessors.Size.getMetric().func;
      if (sizeFunc != null) {
        sizeMetricVal = d.current.metrics[sizeFieldName][sizeFunc];
      }
    } else {
      sizeMetricVal = d.current.count;
    }
    let featureColor = controller.dataAccessors.Color.getColor(colorMetricVal);
    let newFeatureProps = {
      count: d.current.count,
      geometry: newPoint,
      zdObj: d,
      color: featureColor,
    };
    newFeatureProps[colorFieldName] = colorMetricVal;
    newFeatureProps[sizeFieldName] = sizeMetricVal;
    newFeatureProps[controller.dataAccessors['Group By'].getGroups()[0].name] =
      d.group[0];
    //TODO: use the data accessor to get the actual field name for the attribute/metric and set keys to match
    let newFeature = new Feature(newFeatureProps);

    newFeatures.push(newFeature);
  });
  markersSource.addFeatures(newFeatures);
  markersSource.refresh();
  map.render();
};

controller.createAxisLabel({
  picks: 'Color',
  orientation: 'horizontal',
  position: 'bottom',
  popoverTitle: 'Color',
});

/* TODO: when we implement a size rendering add the picker back in so user can choose field.  Issue is that
range/units is arbitrary, so we have to somehow math the metric value into a proportional sizing
controller.createAxisLabel({
  picks: 'Size',
  orientation: 'horizontal',
  position: 'bottom',
  popoverTitle: 'Size'
})
*/

// called when the chart widget is resized
controller.resize = (newWidth, newHeight) => {
  map.updateSize();
};
