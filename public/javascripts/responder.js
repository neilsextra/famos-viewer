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
    
    if (map != null) {

        map.off();
        map.remove();
    }

    var coordinates = [];
    var startPos = null;
    var midPos = Math.trunc(rows.length/2);

    for (row in rows) {
        var latlng = [rows[row][6], rows[row][7]];
 
        if (row == midPos) {
            startPos = latlng;
        }

        coordinates.push(latlng);

    }
 
    try {
       map = L.map('map').setView([startPos[0], startPos[1]], 20);

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

    }, 200);

    $('.leaflet-control-attribution').hide();
   
    } catch (e) {
        alert(e);
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