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
// Set up elements to hold the map and tooltip
const chartContainer = document.createElement('div');
let mapDivId = 'map-' + controller.thread.UUID; //appending a value to the ID to make it unique in case multiple maps on same dashboard
chartContainer.id = mapDivId;
chartContainer.style.width = '100%';
chartContainer.style.height = '100%';
chartContainer.classList.add('chart-container');

let tooltipElement = document.createElement('div');
tooltipElement.id = mapDivId + '_tooltip';
tooltipElement.classList.add('map-tooltip');
tooltipElement.style.display = 'none';
chartContainer.appendChild(tooltipElement);
controller.element.appendChild(chartContainer);

//Create the layer to hold the markers for each feature.  A layer consists of a source (which contains the data) and
//style (which controls how the data is drawn)
let markersSource = new VectorSource({
  wrapX: false,
});

//The style is dynamic based on the color attribute of the feature, see controller.update for setting the color value
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

//add the OpenLayers map to the div
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

// When the user hovers over a feature show the tooltip window
map.on('pointermove', evt => {
  let tooltipBoxHeight = 120;
  let tooltipBoxWidth = 400;
  let cursorLocation = map.getEventPixel(evt.originalEvent);
  let feature = map.forEachFeatureAtPixel(cursorLocation, feature => {
    return feature;
  }); //only really care if there is one or more features
  if (feature) {
    let leftSide = cursorLocation[0] - tooltipBoxWidth / 2;
    let top = cursorLocation[1] - tooltipBoxHeight - 10;
    //Build the contents for the tooltip.  TODO: make it prettier, better formatting and use the human readable field names, include the function name for metric
    //also TODO: add the Size metric once we get that implemented
    let entityID = feature.get(
      controller.dataAccessors['Group By'].getGroups()[0].name,
    );
    let colorMetricTitle = controller.dataAccessors.Color.getMetric().name;
    let colorMetricVal = controller.dataAccessors.Color.format(
      feature.get(colorMetricTitle),
    ); //use the formatting configured in the Zoomdata source
    let tooltipContents = `<span style="text-align:center;">${entityID}</span><table class="map-tooltip-text"><tr><td>${colorMetricTitle}</td> <td>${colorMetricVal}</td></tr>`;
    //look up the metadata in the secondary query result
    if (stationInfo[entityID]) {
      console.log(stationInfo[entityID]);
      tooltipContents += `<tr><td>Owner</td><td>${
        stationInfo[entityID].owner
      }</td></tr><tr><td>Name</td><td>${
        stationInfo[entityID].name
      }</td></tr><td>Type</td><td>${stationInfo[entityID].type}</td></tr>`;
    } else {
      tooltipContents += `<tr><td>Owner</td><td>unknown</td></tr><tr><td>Name</td><td>unknown</td></tr><tr><td>Type</td><td>unknown</td></tr>`;
    }
    tooltipContents += '</table>';
    tooltipElement.style.cssText = `width:${tooltipBoxWidth}px;height:${tooltipBoxHeight}px;left:${leftSide}px;top:${top}px;`;
    tooltipElement.innerHTML = tooltipContents;
    tooltipElement.style.display = 'block';
  } else {
    //no feature under cursor, hide the tooltip
    tooltipElement.style.display = 'none';
  }
});

//When the user clicks show the Zoomdata radial menu.
map.on('singleclick', evt => {
  //Hide the tooltip so it isn't in the way of the menu
  tooltipElement.style.display = 'none';
  let feature = map.forEachFeatureAtPixel(
    map.getEventPixel(evt.originalEvent),
    feature => {
      return feature;
    },
  );
  if (feature) {
    controller.menu.show({
      x: evt.originalEvent.clientX,
      y: evt.originalEvent.clientY,
      data: function() {
        return feature.get('zdObj');
      },
      hide: ['Zoom', 'Trend'],
    });
  }
});

//Create a secondary query.  This query loads additional fields for each buoy from the metadata source, which is specified as
//a variable on the chart configuration page.  This query uses a raw data query to get the data, there are no metrics we are
//interested in aggregating
//
// This could be done with a fusion, but in Zoomdata 2.5 we couldn't use real time.  The drawback here is we can't filter based
//on attribute like 'owner'.
let stationInfo = {};
console.log(controller.variables['Metadata Source Name']);
let fieldNames = ['id', 'name', 'owner', 'pgm', 'type'];
let fields = [];
fieldNames.forEach(name => {
  fields.push({
    name: name,
    limit: 5000,
  });
});
fieldNames.forEach;
controller
  .createQuery(
    {
      name: controller.variables['Metadata Source Name'],
    },
    {
      fields: fields,
    },
  )
  .then(newQuery => {
    console.log('secondary query created', newQuery);
    controller.runQuery(newQuery, queryResult => {
      console.log('metadata query result: ', queryResult);
      queryResult.forEach(d => {
        stationInfo[d[0]] = {
          name: d[1],
          owner: d[2],
          pgm: d[3],
          type: d[4],
        };
      });
      console.log('processed station info: ', stationInfo);
    });
  })
  .catch(err => {
    console.error('Error creating query', err);
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
    //
    // TODO: Next, supplement the properties with the results of the secondary query
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
