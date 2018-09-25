var map = null;
var csvFile = null;

 /**
  * Inactivate Tabs
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
    var midLatLng = null;
    var startLatLng = null;
    var midPos = Math.trunc(rows.length/2);

    for (row in rows) {
        if (rows[row][6] && rows[row][7]) {
            var latlng = [rows[row][6], rows[row][7]];

            if (startLatLng == null) {
                startLatLng = latlng;
            }

            if (row >= midPos && !midLatLng) {
                midLatLng = latlng;
            }

            coordinates.push(latlng);
        }

    }
    
    map = L.map('map').setView([midLatLng[0], midLatLng[1]], 15);

    var startIcon = L.icon({
        iconUrl: 'icons/start-flag.png',
        iconSize: [32, 32],
        popupAnchor: [-3, -76]
    });

    L.marker(startLatLng, {icon: startIcon}).addTo(map);

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

function showCharts(columns, rows) {
    var dataSpeed = [];
    var dataHeight = [];
    var labels = [];

    var length = rows.length;
    var modulus = length >= 100000 ? 1000 : length >= 10000 ? 100 : 1;
    var totalSpeed = 0.0;
    for (row in rows) {

        if (rows[row][11] && rows[row][12]) {
    
            totalSpeed += parseFloat(rows[row][11]);
    
            if (row % modulus == 0) {
               dataSpeed.push(rows[row][11]);
               dataHeight.push(rows[row][4]);
               labels.push(Math.trunc(rows[row][12]));
            }
        }

    }

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

    $('#details').html('<b>Start: </b><p/>' + (new Date(Math.trunc(rows[0][12]) * 1000)) +
    '<p/><b>Finish: </b><p/>' + (new Date(Math.trunc(labels[labels.length - 1]) * 1000)) +
    '<p/><b>Average Speed: </b><p/>' + ((totalSpeed/rows.length).toFixed(2)) + "&nbsp;kph");
    $('#details').css('display', 'inline-block');

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