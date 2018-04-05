# Aggregate Markers Map
This custom chart for Zoomdata uses the OpenLayers Javascript library and data from Zoomdata to display markers.  The Zoomdata query uses a multi-group query so that the data is playable, and for other aspects of Zoomdata queries.  The data source must have the lat and lon in each row of the data, and the data must be of type "attribute" in the source configuration in Zoomdata.

## Other
* Use the [Zoomdata Chart CLI](https://github.com/jonavila/zoomdata-chart-cli) to edit this custom visualization in Zoomdata
* Used Jon Avila's [webpack starter](https://github.com/jonavila/zoomdata-chart-webpack-starter)
- [Creating a Custom Chart in Zoomdata](https://www.zoomdata.com/docs/2.6/creating-a-custom-chart-template.html)


### NPM scripts

 - `npm start`: Generates the development bundle. Webpack will run in [watch mode](https://webpack.js.org/configuration/watch/)
 - `npm run build`: Generate the production bundle. All of the code in chart's components folder will be minified



