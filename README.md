This chart has been updated to work with Zoomdata 3.3 and Zoomdata Custom Chart CLI version 4.0.  The code still works with Zoomdata 2.6.x, but the structure was updated to work in 3.3 or later.

# Aggregate Markers Map
The existing "Map: Markers" visualization in Zoomdata uses a raw data query. That query type has a couple of restrictions.  First, it is limited to the number of rows returned.  If you don't have a filter, or the filter returns a significant amount of data, not all data is displayed.  Second, the raw data query is not affected by the time settings on the dashboard.  The chart also does not change the marker symbology based on data values, nor does it allow any user interaction like tooltips or click menu.

 The Zoomdata query uses a multi-group query so that the data is playable.  The data source must have the lat and lon in each row of the data, and the lat and lon fields must be of type "attribute" (normally they would be numbers) in the source configuration in Zoomdata.  The group-by also groups on an ID field.  The chart is also configured for multiple metrics so we can symbolize color on one metric and size on another (size rendering is not implemented yet).

 This chart uses a set of sensor data from the National Oceanic and Atmospheric Administration's (NOAA) [National Data Buoy Center (NDBC)](http://www.ndbc.noaa.gov/).  Latest observation data was downloaded and re-formatted as CSV. Also, the date fields were combined into a single obs_time field so Zoomdata can easily recoginze the time format.

 For purposes of the sample visualization this custom visualization performs two queries.  The chart query with multi-group and multi-metric obtains the coordinates and aggregate metrics for each buoy.  The second query uses a different source to retrieve metadata information such as owner and description for each buoy.  

# Installation

## Add the chart to Zoomdata
A pre-built package is in the `dist` folder of this repository.  This package is compatible with Zoomdata version 2.6.x.  Use the Zoomdata Chart CLI tool to add the package to your Zoomdata instance.  From a command prompt/terminal window go to the dist folder and enter
`zd-chart add "NDBC Markers" ndbc_markers_zd26.zip`

Log in to Zoomdata (as a user with administrator privileges) and open the 'Sources' page.

First create the station information source, which will be used for the buoy metadata.  Name the source 'NDBC Stations' and use `ndbc_stations.csv` as the source.

The second source is 'NDBC Observations' using the `ndbc_observations.csv` file; this file contains the sensor readouts for each buoy along with the coordinates.  
On the "Fields" tab of the source configuration make sure to:
* Change the field type for "lat_attr" to "Attribute"
* Change the field type for "lon_attr" to "Attribute"

On the "Charts" tab of the source configuration:
* set the Time Attribute to "obs_time"
* open the "Custom" tab on the charts list and select the "NDBC Markers" chart.  
* in the chart configuration set the 3 group by fields and the two metrics for the color and shape.  
* enter the name of the NDBC stations source in the "Metadata Source Name" variable.

Save the source and open a new dashboard with the NDBC Markers chart.

 # Developer Notes

## Other
* Use the [Zoomdata Chart CLI](https://github.com/jonavila/zoomdata-chart-cli) to edit this custom visualization in Zoomdata
* Used Jon Avila's [webpack starter](https://github.com/jonavila/zoomdata-chart-webpack-starter)
- [Creating a Custom Chart in Zoomdata](https://www.zoomdata.com/docs/2.6/creating-a-custom-chart-template.html)


## NPM scripts
 - `npm start`: Generates the development bundle. Webpack will run in [watch mode](https://webpack.js.org/configuration/watch/)
 - `npm run build`: Generate the production bundle. All of the code in chart's components folder will be minified



