/**
 * Famos Log Viewer
 * 
 * Author: Neil Brittliff (Microsoft)
 * 
 */

var map = null;
var csvFile = null;
var imageVehicleSide = null;
var imageVehicleFront= null;

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
    
    function rad2degr(rad) { 
        return rad * 180 / Math.PI; 
    }

    function degr2rad(degr) { 
        return degr * Math.PI / 180; 
    }

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
  * Calculate vehicle pitch
  * @param {Float} x 
  * @param {Float} y 
  * @param {Float} z 
  */
 function calculatePitch(x,y,z) {
    
    return Math.atan2(x, Math.sqrt(y^2+z^2));
 
}

 /**
  * Calculate vehicle roll
  * 
  * @param {Float} x 
  * @param {Float} y 
  * @param {Float} z 
  */
 function calculateRoll(x,y,z) {
    
    return Math.atan2(y, Math.sqrt(x^2+z^2));
 
}

 /**
  * Clear the Canvas
  * 
  * @param {String} containerID the container
  * @param {String} canvasID the canvas to clear
  */
 function clearCanvas(parentID, canvasID) {
    $('#' + canvasID).remove(); 

    $(parentID).append('<canvas id= '+ canvasID + ' style="position:absolute; left:0px; right:0px; top:0px; bottom:0px;"/>');
 }

function showRotatedImage(canvas, context, image, angleInDegrees) {
    var angleInRadians = angleInDegrees * (Math.PI/180)
    var x = canvas.width / 2;
    var y = canvas.height / 2;
    var width = image.width;
    var height = image.height;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.translate(x, y);
    context.rotate(angleInRadians);
 
    context.drawImage(image, -width / 2, -height / 2, width, height);
    context.rotate(-angleInRadians);
    context.translate(-x, -y);
    
}

 /**
  * Inactivate the Tabs
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

/**
 * Show the Map
 * @param {*} columns the columns in the data
 * @param {*} rows the data rows
 */
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
        if (rows[row][6] && rows[row][7] && rows[row][6] != 0 && rows[row][7]) {
            var latlng = [rows[row][6], rows[row][7]];

            if (startLatLng == null) {
                startLatLng = latlng;
            }

            stopLatLng = latlng;
            coordinates.push(latlng);

        }

    }
    
    var midLatLng = getLatLngCenter(coordinates);

    map = L.map('map', {
        preferCanvas: true
    }).setView([midLatLng[0], midLatLng[1]], 15);

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

        if (rows[row][11] && rows[row][12] && rows[row][11] != 0 && rows[row][11] != 0) {

            if (latlng) {
                distanceKms += geolib.getDistance({latitude: latlng[0], 
                                        longitude: latlng[1]},
                                       {latitude:  parseFloat(rows[row][6]), 
                                        longitude:  parseFloat(rows[row][7])})

             }

            if (!startTime) {
                startTime = Math.trunc(rows[row][12]);
            }

            latlng = [parseFloat(rows[row][6]), parseFloat(rows[row][7])];
            totalSpeed += parseFloat(rows[row][11]);
            topSpeed = Math.max(parseFloat(rows[row][11]), topSpeed);
            count += 1;

            if (row % modulus == 0 && rows[row][11] != 0 && rows[row][4] != 0) {
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
            label: "Speed in Kmh",
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
            label: "Height in metres",
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
    '<p/><b>Distance Travelled: </b><p/>' + ((distanceKms/1000).toFixed(2)) + "&nbsp;kms");
    $('#details').css('display', 'inline-block');

}

/**
 * Show the Gauges
 * @param {*} columns 
 * @param {*} rows 
 */
function showGauges(columns, rows) {

    var speedGauge = new RadialGauge({
        renderTo: 'speedGauge',
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

    var bearingGauge = new RadialGauge({
        dataMinValue:0,
        dataMaxValue:360,
        renderTo: 'bearingGauge',
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
        needleType:'line',
        needleStart:75,
        needleEnd: 99,
        needleWidth: 5,
        borders: true,
        borderInnerWidth: 0,
        borderMiddleWidth: 0,
        borderOuterWidth: 10,
        colorBorderOuter: '#ccc',
        colorBorderOuterEnd: '#ccc',
        colorNeedleShadowDown: '#222',
        borderShadowWidth: 0,
        animationRule:"linear",
        animationDuration:100
    }).draw();

    speedGauge.value = 0;
    bearingGauge.value = 0;

    var context = $('#pitchView')[0].getContext('2d');
    
    showVehicleOrientation(rows[0]);

    $("#range").attr('max', rows.length);
    $("#range").val(0);

    $('#sliderPos').html("<b>Time:</b>&nbsp;" + (new Date(Math.trunc(rows[0][12]) * 1000)) + "&nbsp;[0:0:0]");

    var slider = document.getElementById("range");
    bearingGauge.value = 0;
    let timerId = null;
    var speed = 0;
    var bearing = 0;
    
    slider.oninput = function() {

        if (this.value < rows.length) {
            var sample = rows.length >= 10000 ? 1000 : 10;

            var totalSeconds = Math.trunc(rows[this.value][12]) - Math.trunc(rows[0][12]);
            var hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            var minutes = Math.floor(totalSeconds / 60);
            seconds = totalSeconds % 60;

            $('#sliderPos').html("<b>Time:</b>&nbsp;" + (new Date(Math.trunc(rows[this.value][12]) * 1000)) + "&nbsp;[" + 
                    hours + ":" + minutes + ":" + seconds + "] - [Observation&nbsp;:&nbsp;" + this.value + "&nbsp;]");
            speed = parseFloat(rows[this.value][11]);
            bearing = Math.trunc(rows[this.value][1]);

            if (timerId == null) { 
                timerId = setTimeout(function() {
                    speedGauge.value = speed;
                    console.log('Bearing: ' + bearing);

                    bearingGauge.value = bearing;

                    bearingGauge.draw();
                    speedGauge.draw();
                    
                    timerId = null;

                }, 200);
            
            }

            showVehicleOrientation(rows[this.value]);

        }

    }
    
}

/**
 * The row to process
 * @param {*} row the famos row to process
 */
function showVehicleOrientation(row) {
    var pitch = calculatePitch(row[14], row[15], row[16]);
    var contextPitch = $('#pitchView')[0].getContext('2d');
    
    showRotatedImage($('#pitchView')[0], contextPitch, imageVehicleSide, pitch * 100,);
    $('#pitchLabel').html('<b>Pitch:</b>&nbsp;' + ((pitch * 100).toFixed(3)) + '&deg;');

    var roll = calculateRoll(row[14], row[15], row[16]);
    var contextRoll = $('#rollView')[0].getContext('2d');
    
    showRotatedImage($('#rollView')[0], contextRoll, imageVehicleFront, roll * 100);
    $('#rollLabel').html('<b>Roll:</b>&nbsp;' + ((roll * 100).toFixed(3)) + '&deg;');

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
        showGauges(columns, rows);
        
        console.log('completed conversion');

    }, 100);

}

$('#reportBtn').on('click', function(e) {
    $("#modal").css('display', 'inline-block');
    var done = false;
    
    if (map) {
        leafletImage(map, function(err, canvas) {
   
            document.body.onfocus = function() {   

                loadTimer = setTimeout(
                  () => { 
                    $("#modal").css('display', 'none');
                }, 200);
       
                document.body.onfocus = null;
             
            }
            
            var imgData = canvas.toDataURL("image/svg+xml", 1.0);

            var dimensions = map.getSize();
            var pdf = new jsPDF('l', 'pt', 'letter');
            pdf.text(24, 20, 'Famos IMC Report');

            pdf.addImage(imgData, 'PNG', 30, 50, dimensions.x * 0.5, dimensions.y * 0.5);
            var source = window.document.getElementById('details');
            pdf.setFontSize(9);
            pdf.fromHTML(
                source,
                34,
                465,
                {
                    'width': 500
                }

            );

            pdf.save("famos-analysis.pdf");
            
            $("#modal").css('display', 'none');
 
        });
    }

    return false;

 });

$(document).ready(function() {
    imageVehicleSide = new Image();
    imageVehicleSide.src = 'icons/jeep-side.png';

    imageVehicleFront = new Image();
    imageVehicleFront.src = 'icons/jeep-front.png';
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