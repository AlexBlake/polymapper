/*
*   Defaults
*/
var default_viewport = [0,0];
var default_zoom = 2;

/*
* Data Management
*/
var persistent_geo = {
    viewpoint:default_viewport,
    zoom: default_zoom,
    collection: {
        'type': 'FeatureCollection',
        'crs': {
            'type': 'name',
            'properties': {
                'name': 'EPSG:3857'
            }
        },
        'features': []
    }
};



/*
* Map Layers
*/
var vectorSource = new ol.source.Vector({
    features: (new ol.format.GeoJSON()).readFeatures(persistent_geo.collection)
});
var vectorLayer = new ol.layer.Vector({
    source: vectorSource
});
var source = new ol.source.Vector({wrapX: false});
var vector = new ol.layer.Vector({
    source: source
});

// IMAGE OVERLAY TESTS
// var extent = [0, 0, 1024, 968];
// var projection = new ol.proj.Projection({
//     code: 'image',
//     units: 'pixels',
//     extent: extent
// });
// var imageLayer = new ol.layer.Image({
//     source: new ol.source.ImageStatic({
//         url: 'assets/data/overlay.gif',
//         projection: projection,
//         imageExtent: extent
//     })
// })


/*
* Map Drawing
*/
var map = new ol.Map({
    target: 'main-map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
        ,vector
        ,vectorLayer
        // ,imageLayer
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat(persistent_geo.viewpoint),
        zoom: persistent_geo.zoom
    })
});
addInteraction();
// Reload view
function reloadMap() {
    map.setView(new ol.View({
        center: ol.proj.fromLonLat(persistent_geo.viewpoint),
        zoom: persistent_geo.zoom
    }));
    vectorSource.addFeatures((new ol.format.GeoJSON()).readFeatures(persistent_geo.collection));
    vectorSource.refresh();
    vectorSource.changed();
}


/*
* Map Interaction Management
*/
var draw; // global so we can remove it later
var draw_active = false;
function addInteraction() {
    draw = new ol.interaction.Draw({
        source: source,
        type: "Polygon"
    });
    draw.on('drawend', persistPolygon);
    map.addInteraction(draw);
    draw.setActive(false);
    draw_active = false;
}



/*
*   Save & Update Data
*/
function persistPolygon(event) {
    // push new blank geo tracked area to data model
    persistent_geo.collection.features.push({ 
        "type": "Feature", 
        "properties": { 
            "details": {}
        }, 
        "geometry": { 
            "type": "Polygon", 
            "coordinates": [event.target.I]
        }
    });
    vectorSource.addFeatures((new ol.format.GeoJSON()).readFeatures(persistent_geo.collection));
    vectorSource.refresh();
    vectorSource.changed();
    displayModal(event);
}



/*
*   User Interaction Controls
*/
function toggleDrawing(event) {
    var elem = $(event.target);
    if(draw_active) {
        draw.setActive(false);
        draw_active = false;
        elem.removeClass('btn-default').addClass('btn-info').html('Enable Drawing');
    } else {
        draw.setActive(true);
        draw_active = true;
        elem.removeClass('btn-info').addClass('btn-default').html('Disable Drawing');
    }
}
// ESC key cancel last point
document.addEventListener('keydown', function(e) {
    if (e.which == 27)
        draw.removeLastPoint()
});



/*
* Data Control For Saving / Loading JSON files
*/
function loadFile() {
    var input, file, fr;

    if (typeof window.FileReader !== 'function') {
        alert("The file API isn't supported on this browser yet.");
        return;
    }

    input = document.getElementById('fileinput');
    if (!input) {
        alert("Um, couldn't find the fileinput element.");
    }
    else if (!input.files) {
        alert("This browser doesn't seem to support the `files` property of file inputs.");
    }
    else if (!input.files[0]) {
        alert("Please select a file before clicking 'Load'");
    }
    else {
        file = input.files[0];
        fr = new FileReader();
        fr.onload = receivedText;
        fr.readAsText(file);
    }

    function receivedText(e) {
        lines = e.target.result;
        persistent_geo = JSON.parse(lines); 
        reloadMap();
    }
}
// Save to JSON
function download() {
    persistent_geo.viewpoint = ol.proj.toLonLat(map.getView().getCenter());
    persistent_geo.zoom = map.getView().getZoom();
    
    var file = new Blob([JSON.stringify(persistent_geo)], {'text/plain': 'text/plain'});
    
    var name = window.prompt("Filename:", "MapData");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = ( name.indexOf('.json') >= 0 ? name : name+'.json' );
    a.click();
}


/*
*   Tooltip
*/
var tooltip = document.getElementById('tooltip');
var overlay = new ol.Overlay({
  element: tooltip,
  offset: [10, 0],
  positioning: 'bottom-left'
});
map.addOverlay(overlay);
function displayTooltip(evt) {
    if(draw_active) {
        return;
    }
    var pixel = evt.pixel;
    var feature = map.forEachFeatureAtPixel(pixel, function(feature) {
        return feature;
    });
    tooltip.style.display = feature ? '' : 'none';
    if (feature) {
        overlay.setPosition(evt.coordinate);
        tooltip.innerHTML = feature.get('details');
    }
};
/*
* Modal Management
*/
var modal = document.getElementById('modal-detail');
var modalFeature = {};
map.on('click', displayModal);
function displayModal(evt) {
    if(draw_active) {
        return;
    }
    var pixel = evt.pixel;
    modalFeature = map.forEachFeatureAtPixel(pixel, function(feature) {
        return feature;
    });
    if (modalFeature) {
        $(modal).find('.modal-body').html(retrieveDetailHTML(modalFeature.get('details')));
        var openModal = $(modal).modal()
        openModal.on('hide.bs.modal', function (e) {
            // Persist data to Feature
            modalFeature.set('details', saveDetails(this));
            // Persist To Stored Data Model
            persistent_geo.collection = JSON.parse((new ol.format.GeoJSON()).writeFeatures( map.getLayers().getArray()[2].getSource().getFeatures() ));
            // Reset & Close Modal
            $(this).find('.modal-body').html('');
            openModal.unbind();
        });
    }
}
// Load Data From Data Model
function retrieveDetailHTML(details) {
    var html = '';
    for(var key in details) {
        html += generateFieldHTML( key, details[key]);
    }
    return html;
}
// Generate Field
function generateFieldHTML(key, data) {
    return '<div class="form-group col-xs-12" data-key="'+key+'">\
        <label class="form-label">'+data.title+'</label>\
        <button class="btn btn-danger btn-xs pull-right" onclick="removeDataField(\''+key+'\')">X</button>\
        <textarea class="form-control" data-title="'+data.title+'" data-saveto="'+key+'">'+data.value+'</textarea>\
    </div>';
}



/*
*   Modal Interaction For Adding Fields and saving data
*/
// Add Field
function addDataField() {
    var title = window.prompt("Field Title", '');
    var key = toSnakeCase(title);
    $(modal).find('.modal-body').append(generateFieldHTML(key,{title:title, value: ''}));
}
// Remove Field
function removeDataField(key) {
    var details = modalFeature.get('details');
    if( typeof details[key] !== 'undefined')
    {
        delete details[key];
        modalFeature.set('details', details);
        $(modal).find('.modal-body').find('[data-key="'+key+'"]').remove();
    }
}
// Save Details To Persistent Data Model
function saveDetails(elem) {
    var data = {};
    $(elem).find('textarea[data-saveto]').each(function(idx, el){
        console.log(el);
        data[$(el).attr('data-saveto')] = {
            title:$(el).attr('data-title'),
            value:$(el).val()
        };
    });
    return data;
}





/*
*   Util Functions
*/
function toSnakeCase(string) {
    return string.toLowerCase().replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
}



