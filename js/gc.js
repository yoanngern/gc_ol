var style = [new ol.style.Style({
    image: new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Stroke({color: 'rgba(0, 0, 0, 0.2)'}),
        stroke: new ol.style.Stroke({color: 'rgba(0, 0, 0, 0.7)', width: 1})
    })
})];
var selected_style = [new ol.style.Style({
    image: new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Stroke({color: 'rgba(255, 190, 0, 0.2)'}),
        stroke: new ol.style.Stroke({color: 'rgba(255, 190, 0, 0.7)', width: 1})
    })
})];
var selected_feature = null;
var styleFunction = function(feature, resolution) {
    return feature == selected_feature ? selected_style : style;
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
    show(feature);

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
}

function show(feature) {
    selected_feature = feature;
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
    selected_feature = null;
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

    var features = bases.getAllFeatures();
    var feature = null;
    var dist = +Infinity;
    $.each(features, function() {
        var candidate_dist = Math.sqrt(
            Math.pow(geolocation.getPosition()[0] - this.getGeometry().getCoordinates()[0], 2),
            Math.pow(geolocation.getPosition()[1] - this.getGeometry().getCoordinates()[1], 2)
        );
        if (candidate_dist < dist) {
            dist = candidate_dist;
            feature = this;
        }
    });
    if (feature) {
        show(feature);
    }
});

geolocation.setTracking(true);
