var styles = {
    'Point': [new ol.style.Style({
        image: new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Stroke({color: 'rgba(0, 0, 0, 0.2)'}),
            stroke: new ol.style.Stroke({color: 'rgba(0, 0, 0, 0.7)', width: 1})
        })
    })]
};
var styleFunction = function(feature, resolution) {
    return styles[feature.getGeometry().getType()];
};

var bases = new ol.source.GeoJSON({
    url: 'map.geojson'
});
var waypoint_layer = new ol.layer.Vector({
    source: bases,
    styleFunction: styleFunction
});

var map = new ol.Map({
//    interactions: ol.interaction.defaults().extend([select]),
    renderer: ol.RendererHint.CANVAS,
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.MapQuestOSM()
        }),
        waypoint_layer
    ],
    view: new ol.View2D({
        center: ol.proj.transform([6.629, 46.517], 'EPSG:4326', 'EPSG:3857'),
        zoom: 14
    }),
    controls: ol.control.defaults().extend([
    ])
});
var view = map.getView();

$.urlParam = function(key) {
    var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search);
    return result && unescape(result[1]) || "";
}

function select(feature) {
    map.beforeRender(ol.animation.zoom({
        duration: 500,
        resolution: view.getResolution()
    }));
    view.setZoom(16);

    map.beforeRender(ol.animation.pan({
        duration: 500,
        source: view.getCenter()
    }));
    view.setCenter(feature.getGeometry().getCoordinates());

    show(feature);
}

function show(feature) {
    $("#result").html("<h5>" + feature.get('name') + "</h5><p>" + feature.get('tel') + "</p>");
    $("#result").addClass('selected');
}

var first = true;
bases.addEventListener(goog.events.EventType.CHANGE, function() {
    if (first && bases.getState() == ol.source.State.READY) {
        first = false;
        $("#search").autocomplete({
            source: $.map(bases.getAllFeatures(), function(feature) {
                return {
                    label: feature.get('name'),
                    value: feature.get('name'),
                    feature: feature
                }
            }),
            select: function(event, element) {
                select(element.item.feature);
            }
        });
    }
})
$("#result").click(function() {
    $("#result").removeClass('selected');
});



var geolocation = new ol.Geolocation();
geolocation.setProjection(view.getProjection());
geolocation.on('change:position', function(event) {
        geolocation.setTracking(false);

    map.beforeRender(ol.animation.zoom({
        duration: 500,
        resolution: view.getResolution()
    }));
    view.setZoom(14);

    map.beforeRender(ol.animation.pan({
        duration: 500,
        source: view.getCenter()
    }));
    view.setCenter(geolocation.getPosition());


    //TODO
});

geolocation.setTracking(true);
