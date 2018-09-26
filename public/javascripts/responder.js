var map = null;
var csvFile = null;

/**
 * Distance between to points
 * 
 * @param {Float} lat1 the from Latitude
 * @param {Float} lon1 the from Longitude
 * @param {Float} lat2 the to Latitude
 * @param {Float} lon2 the to Longitude
 */
function distance(lat1, lon1, lat2, lon2) {
	var radlat1 = Math.PI * lat1/180;
	var radlat2 = Math.PI * lat2/180;
	var theta = lon1-lon2;
	var radtheta = Math.PI * theta/180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) +
               Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	if (dist > 1) {
		dist = 1;
	}
    dist = Math.acos(dist)
    
	dist = dist * 180/Math.PI;
	dist = dist * 60 * 1.1515;
    return dist * 1.609344;
    
}

function rad2degr(rad) { 
    return rad * 180 / Math.PI; 
}

function degr2rad(degr) { 
    return degr * Math.PI / 180; 
}

function calculateBearing(endpoint, startpoint) {
    var radians = Math.atan2((endpoint[1]- startpoint[1]), (endpoint[0]- startpoint[0]));
    var compassReading = radians * (180 / Math.PI);

  //  var coordNames = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
    var coordIndex = Math.round(compassReading / 45);
    if (coordIndex < 0) {
        coordIndex = coordIndex + 8
    };
   return compassReading / 45;
    //return coordNames[coordIndex]; // returns the coordinate value
}

/**
 * Get the Central Position within a series of Lats/Longs
 * 
 * @param latLngInDeg array of arrays with latitude and longtitude
 *   pairs in degrees. e.g. [[latitude1, longtitude1], [latitude2
 *   [longtitude2] ...]
 *
 * @return array with the center latitude longtitude pairs in 
 *   degrees.
 */
function getLatLngCenter(latLngInDegr) {
    var LATIDX = 0;
    var LNGIDX = 1;
    var sumX = 0;
    var sumY = 0;
    var sumZ = 0;

    for (var i=0; i<latLngInDegr.length; i++) {
        var lat = degr2rad(latLngInDegr[i][LATIDX]);
        var lng = degr2rad(latLngInDegr[i][LNGIDX]);
        // sum of cartesian coordinates
        sumX += Math.cos(lat) * Math.cos(lng);
        sumY += Math.cos(lat) * Math.sin(lng);
        sumZ += Math.sin(lat);
    }

    var avgX = sumX / latLngInDegr.length;
    var avgY = sumY / latLngInDegr.length;
    var avgZ = sumZ / latLngInDegr.length;

    // convert average x, y, z coordinate to latitude and longtitude
    var lng = Math.atan2(avgY, avgX);
    var hyp = Math.sqrt(avgX * avgX + avgY * avgY);
    var lat = Math.atan2(avgZ, hyp);

    return ([rad2degr(lat), rad2degr(lng)]);

 }

 /**
  * Clear the Canvas
  * @param {String} containerID the container
  *  @param {String} canvasID the canvas to clear
  */
 function clearCanvas(parentID, canvasID) {
    $('#' + canvasID).remove(); 

    $(parentID).append('<canvas id= '+ canvasID + ' style="position:absolute; left:0px; right:0px; top:0px; bottom:0px;"/>');
 }
 /**
  * Inactivate the Tabs
  * 
  */
 function inactivateTabs() {
    var iTab, tabcontent, tabbuttons, tablinks;
     
     // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (iTab = 0; iTab < tabcontent.length; iTab++) {
        tabcontent[iTab].style.display = "none";
    }
  
    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (iTab = 0; iTab < tablinks.length; iTab++) {
        tablinks[iTab].className = tablinks[iTab].className.replace(" active", "");
        tablinks[iTab].style.textDecoration = "none";
    }

 }

 /**
 * Show the Active Tab
 * 
 * @param {*} evt the Tab to Show
 * @param {*} tab the name of the Tab
 * @param {*} button the Tab's button
 */
function showTab(evt, tab, button) {

    inactivateTabs();

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tab).style.display = "block";
    document.getElementById(button).style.textDecoration = "underline";
 
    evt.currentTarget.className += " active";

}

function showMap(columns, rows) {
    
    $('#map').css('display', 'none');  

    if (map != null) {

        map.off();
        map.remove();
    }

    var coordinates = [];
    var startLatLng = null;
    var stopLatLng = null;
  
    for (row in rows) {
        if (rows[row][6] && rows[row][7]) {
            var latlng = [rows[row][6], rows[row][7]];

            if (startLatLng == null) {
                startLatLng = latlng;
            }

            stopLatLng = latlng;
            coordinates.push(latlng);

        }

    }
    
    var midLatLng = getLatLngCenter(coordinates);

    map = L.map('map').setView([midLatLng[0], midLatLng[1]], 15);

    var startIcon = L.icon({
        iconUrl: 'icons/start-marker.png',
        iconSize: [24, 24],
        iconAnchor: [10, 10],
        popupAnchor: [-3, -76]
    });    
    
    var stopIcon = L.icon({
        iconUrl: 'icons/stop-marker.png',
        iconSize: [24, 24],
        iconAnchor: [20, 20],
        popupAnchor: [-3, -76]
    });

    L.marker(startLatLng, {icon: startIcon}).addTo(map);
    L.marker(stopLatLng, {icon: stopIcon}).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 30,
    minZoom: 9,
    noWrap:true
    }).addTo(map);

    var options = {}

    L.polyline(
        coordinates,
        {
            color: 'blue',
            weight: 2,
            opacity: .7,
            lineJoin: 'round'
        }
    ).addTo(map);

    setTimeout(function() {
        map.invalidateSize();
        $('#map').css('display', 'inline-block');

        setTimeout(function() {
            map.invalidateSize();
        }, 500);
    }, 100);

    window.addEventListener("resize", function() {
       map.invalidateSize();      
    });

    $('.leaflet-control-attribution').hide();
    
}

/**
 * Show the Charts
 * 
 * @param {*} columns 
 * @param {*} rows 
 */
function showCharts(columns, rows) {
    var dataSpeed = [];
    var dataHeight = [];
    var labels = [];

    var length = rows.length;
    var modulus = length >= 100000 ? 1000 : length >= 10000 ? 100 : 1;
    var totalSpeed = 0.0;

    var distanceKms = 0;
    var latlng = null;
    var topSpeed = 0.0;
    var startTime = null;
    var count = 0;

    for (row in rows) {

        if (rows[row][11] && rows[row][12]) {

            if (latlng) {
                distanceKms += distance(latlng[0], latlng[1], 
                                        parseFloat(rows[row][6]), parseFloat(rows[row][7]));
            }

            if (!startTime) {
                startTime = Math.trunc(rows[row][12]);
            }

            latlng = [parseFloat(rows[row][6]), parseFloat(rows[row][7])];
            totalSpeed += parseFloat(rows[row][11]);
            topSpeed = Math.max(parseFloat(rows[row][11]), topSpeed);
            count += 1;

            if (row % modulus == 0) {
               dataSpeed.push(rows[row][11]);
               dataHeight.push(rows[row][4]);
               var totalSeconds = Math.trunc(rows[row][12]) - startTime;
               var hours = Math.floor(totalSeconds / 3600);
               totalSeconds %= 3600;
               var minutes = Math.floor(totalSeconds / 60);
               seconds = totalSeconds % 60;

               labels.push(hours + ":" + minutes + ":" + seconds);

            }
        }

    }

    clearCanvas('#speed', 'speedChart');

    new Chart(document.getElementById('speedChart'), {
        type: 'line',
        data: {
            labels: labels,
         datasets: [{ 
            data: dataSpeed,
            label: "Speed",
            borderColor: "#3e95cd",
            fill: false
      }],
      options: {
        title: {    
          display: true,
          text: 'Speed of Vehicle'
        }
      }
    }
    });  
    
    clearCanvas('#height', 'heightChart');

    new Chart(document.getElementById('heightChart'), {
        type: 'line',
        data: {
            labels: labels,
         datasets: [{ 
            data: dataHeight,
            label: "Height",
            borderColor: "#3e95cd",
            fill: false
      }],
      options: {
        title: {
          display: true,
          text: 'Terrain Height above Sea Level'
        }
      }
    }
    
    });  

    $('#details').html('<b>Start Time: </b><p/>' + (new Date(Math.trunc(rows[0][12]) * 1000)) +
    '<p/><b>Finish Time: </b><p/>' + (new Date(Math.trunc(rows[count - 1][12]) * 1000)) +
    '<p/><b>Average Speed: </b><p/>' + ((totalSpeed/rows.length).toFixed(2)) + "&nbsp;kph" +
    '<p/><b>Top Speed: </b><p/>' + (topSpeed.toFixed(2)) + "&nbsp;kph" +
    '<p/><b>Distance Travelled: </b><p/>' + (distanceKms.toFixed(2)) + "&nbsp;kms");
    $('#details').css('display', 'inline-block');

}

function showGuages(columns, rows) {

    var speedGuage = new RadialGauge({
        renderTo: 'speedGuage',
        width: 200,
        height: 200,
        units: 'Km/h',
        title: false,
        value: 0,
        minValue: 0,
        maxValue: 220,
        majorTicks: [
            '0','20','40','60','80','100','120','140','160','180','200','220'
        ],
        minorTicks: 2,
        strokeTicks: false,
        highlights: [
            { from: 0, to: 50, color: 'rgba(0,255,0,.15)' },
            { from: 50, to: 100, color: 'rgba(255,255,0,.15)' },
            { from: 100, to: 150, color: 'rgba(255,30,0,.25)' },
            { from: 150, to: 200, color: 'rgba(255,0,225,.25)' },
            { from: 200, to: 220, color: 'rgba(0,0,255,.25)' }
        ],
        colorPlate: '#222',
        colorMajorTicks: '#f5f5f5',
        colorMinorTicks: '#ddd',
        colorTitle: '#fff',
        colorUnits: '#ccc',
        colorNumbers: '#eee',
        colorNeedle: 'rgba(240, 128, 128, 1)',
        colorNeedleEnd: 'rgba(255, 160, 122, .9)',
        valueBox: true,
        animationDuration: 100
    }).draw();

    var bearingGuage = new RadialGauge({
        renderTo: 'bearingGuage',
        width: 200,
        height: 200,
        title: false,
        value: 0,
        minValue: 0,
        maxValue: 360,
        majorTicks: [
            'N','NE','E','SE','S','SW','W','NW','N'
        ],
        minorTicks: 22,
        colorPlate: '#222',
        colorMajorTicks: '#f5f5f5',
        colorMinorTicks: '#ddd',
        ticksAngle: 360,
        startAngle: 180,
        highlights: false,
        colorPlate: '#222',
        colorMajorTicks: '#f5f5f5',
        colorMinorTicks: '#ddd',
        colorNumbers: '#ccc',
        colorNeedle: 'rgba(240, 128, 128, 1)',
        colorNeedleEnd: 'rgba(255, 160, 122, .9)',
        valueBox: false,
        valueTextShadow: false,
        colorCircleInner: "#fff",
        colorNeedleCircleOuter: "#ccc",
        needleCircleSize: 15,
        needleCircleOuter: false,
        animationRule: 'linear',
        needleType:'line',
        needleStart:75,
        needleEnd: 99,
        needleWidth: 3,
        borders: true,
        borderInnerWidth: 0,
        borderMiddleWidth: 0,
        borderOuterWidth: 10,
        colorBorderOuter: '#ccc',
        colorBorderOuterEnd: '#ccc',
        colorNeedleShadowDown: '#222',
        borderShadowWidth: 0,
        animationDuration: 100
    }).draw();

    speedGuage.value = 0;
    bearingGuage.value = 0;

    $("#range").attr('max', rows.length);
    $("#range").val(0);
    $('#sliderPos').html("<b>Time:</b>&nbsp;" + (new Date(Math.trunc(rows[0][12]) * 1000)) + "&nbsp;[0:0:0]");

    var slider = document.getElementById("range");

    slider.oninput = function() {

        var totalSeconds = Math.trunc(rows[this.value][12]) - Math.trunc(rows[0][12]);
        var hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        var minutes = Math.floor(totalSeconds / 60);
        seconds = totalSeconds % 60;

         $('#sliderPos').html("<b>Time:</b>&nbsp;" + (new Date(Math.trunc(rows[this.value][12]) * 1000)) + "&nbsp;[" + 
                hours + ":" + minutes + ":" + seconds + "]");

        speedGuage.value = parseFloat(rows[this.value][11]);

        if (this.value < rows.length) {
            var nextObs = parseInt(this.value) + 1;
            var from = [parseFloat(rows[this.value][6]), parseFloat(rows[this.value][7])];
            var to = [parseFloat(rows[nextObs][6]), parseFloat(rows[nextObs][7])];

           bearingGuage.value = calculateBearing(from, to) * 100;
 
        } else {
            var prevObs = parseInt(this.value) - 1;
            var from = [parseFloat(rows[prevObs][6]), parseFloat(rows[prevObs][7])];
            var to = [parseFloat(rows[this.value][6]), parseFloat(rows[this.value][7])];
       
            bearingGuage.value = calculateBearing(from, to) * 100;
       
        }

    }
    
}

function display(columns, rows) {

    showMap(columns, rows);

    window.setTimeout(() => {

        inactivateTabs();

        $('#rendering').css('display', 'inline-block');
        $('#structureFrame').css('display', 'inline-block');
        $('#uploadWait').css('display', 'none');
        $('#tab1').css('text-decoration', 'underline');
        $('#tab1').addClass('active');

        showCharts(columns, rows);
        showGuages(columns, rows);
        console.log('completed conversion');

    }, 100);

}

$(document).ready(function() {
    var header = $('#caption').html();
    var dropzone = $('#droparea');
     
    dropzone.on('dragover', function() {
        //add hover class when drag over
        dropzone.addClass('hover');
        return false;
    });
     
    dropzone.on('dragleave', function() {
        //remove hover class when drag out
        dropzone.removeClass('hover');
        return false;
    });
     
    dropzone.on('drop', function(e) {
        //prevent browser from open the file when drop off
        e.stopPropagation();
        e.preventDefault();
        dropzone.removeClass('hover');
     
        //retrieve uploaded files data
        var files = e.originalEvent.dataTransfer.files;
        processFiles(files);
     
        return false;
    });

    var uploadBtn = $('#uploadbtn');
    var defaultUploadBtn = $('#upload');
     
    uploadBtn.on('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        defaultUploadBtn.click();
    });
     
    defaultUploadBtn.on('change', function() {

        var files = $(this)[0].files;

        processFiles(files);   

        return false;

    });

	var processFiles = function(files) {
        $('#details').css('display', 'none');

 		if (files && typeof FileReader !== "undefined") {
			for(var iFile = 0; iFile<files.length; iFile++) {
			    readFile(files[iFile]);
			}
        } 
        
    }
    
    var readFile = function(file) {
      
        if (file.size == 0) {
            alert("File: '" + file.name + "' is empty!");
        } else if( (/csv/i).test(file.name) ) {  
            $('#uploadWait').css('display', 'inline-block');
            $('#rendering').css('display', 'none');

            csvFile = file;      
            var reader = new FileReader();
            
			reader.onload = function(e) {
                csvFile = file;
                
                 $('#caption').html(header.replace(/$.*/, '&nbsp;-&nbsp;\'' + file.name + '\''));
                
                 var progress = "100";

                 var results = Papa.parse(reader.result);

                 var lines = results.data;
                 var rows = [];
                 var columns = null;
     
                 for (var line in lines) {
     
                   if (!columns) {
                        columns = lines[line];
                   } else {
                        rows.push(lines[line]);
                   }
     
                 }

                 display(columns, rows);
                
			};
            
            reader.onprogress = function(data) {
                
                if (data.lengthComputable) {                                            
                    var progress = parseInt( ((data.loaded / data.total) * 100), 10 );
                    document.getElementById("uploadProgress").className = "c100 p" + 
                    progress + 
                    " big blue";
                    $('#percentage').html(progress + "%");

                }

            }

            reader.readAsText(file);	
          
        } else {
            alert(file.type + " - is not supported");
        }
    
     }

});     