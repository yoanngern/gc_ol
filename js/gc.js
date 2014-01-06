/*var style = {
    image: ol.shape.renderCircle(
        5,
        new ol.style.Fill({
            color: 'rgba(0,0,0,0.2)'
        }),
        new ol.style.Stroke({
            color: 'rgba(0,0,0,0.7)'
        })
    )
};*/
var styles = {
    'Point': [new ol.style.Style({
        image: new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Stroke({color: 'rgba(0,0,0,0.2)'}),
            stroke: new ol.style.Stroke({color: 'rgba(0,0,0,0.7)', width: 1})
        })
    })]
};
var styleFunction = function(feature, resolution) {
    return styles[feature.getGeometry().getType()];
};

var waypoint_layer = new ol.layer.Vector({
    source: new ol.source.GeoJSON({
        url: 'map.geojson'
    }),
    styleFunction: styleFunction
});

var map = new ol.Map({
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
/*
var animation = ol.animation.zoom({
    duration: 400,
//    resolution: view.getResolution()
});
map.beforeRender(animation);

var animation = ol.animation.pan({
    duration: 400,
//    source: view.getCenter()
});
map.beforeRender(animation);*/
$.urlParam = function(key) {
    var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search);
    return result && unescape(result[1]) || "";
}

$("#search").autocomplete({
    source: function(request, responce) {
        $.ajax({
            url: 'http://nominatim.openstreetmap.org/search',
            dataType: "jsonp",
            jsonp: 'json_callback',
            data: {
                format: 'jsonv2',
                q: request.term,
                countrycodes: 'ch',
                state: 'Vaud',
//                viewbox: '45,5,48,8',
                limit: 20,
                polygon_geojson: 1,
            },
            success: function(data) {
                responce($.map(data, function(item) {
                    return {
                        label: item.display_name,
                        value: item
                    }
                }));
            }
        })
    },
    select: function(event, ui) {
        //TODO
    }
});
