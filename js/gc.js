GC = {};

GC.Select = function(options) {
    goog.base(this);
    
    this.bases = options.bases;
    this.map = options.map;
};
goog.inherits(GC.Select, ol.interaction.Interaction);

GC.Select.prototype.clicked = function(point) {
    var feature = null;
    var squaredDist = squaredTolerance;
    $.each(this.bases.getAllFeatures(), function() {
        var candidatePoint = self.map.getPixelFromCoordinate(this.getGeometry().getCoordinates());
        var candidateSquaredDist =
            Math.pow(point[0] - candidatePoint[0], 2) +
            Math.pow(point[1] - candidatePoint[1], 2);
        if (candidateSquaredDist < squaredDist) {
            squaredDist = candidateSquaredDist;
            feature = this;
        }
    });

    this.map.show(feature);
    return !feature;
};

GC.Select.prototype.handleMapBrowserEvent = function(event) {
    if (event.type === ol.MapBrowserEvent.EventType.CLICK) {
        var downPx = event.map.getEventPixel(event.target.getDown());
        var clickPx = event.getPixel();
        var dx = downPx[0] - clickPx[0];
        var dy = downPx[1] - clickPx[1];
        var squaredDistance = dx * dx + dy * dy;
        var pass = true;
        if (squaredDistance <= squaredClickTolerance) {
            return clicked(clickPx);
        }
    }
    if (event.type === goog.events.EventType.TOUCHEND) {
        return clicked(event.map.getEventPixel(event));
    }
    return true;
};

GC.Map = function(options) {

    this.options = options;

    this.map = new ol.Map({
        renderer: ol.RendererHint.CANVAS,
        target: options.map,
        layers: [
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    attributions: [
                        new ol.Attribution({
                            html: '<a href="https://www.mapbox.com/about/maps/" target="_blank">About map</a>'
                        })
                      //, ol.source.OSM.DATA_ATTRIBUTION
                    ],
                    opaque: true,
                    tileLoadFunction: options.tileLoadFunction,
                    urls: [
                        'https://a.tiles.mapbox.com/v3/gospelcenter.h08fol51/{z}/{x}/{y}.png',
                        'https://b.tiles.mapbox.com/v3/gospelcenter.h08fol51/{z}/{x}/{y}.png',
                        'https://c.tiles.mapbox.com/v3/gospelcenter.h08fol51/{z}/{x}/{y}.png'
                    ]
                })
            })
        ],
        view: new ol.View2D({
            center: ol.proj.transform([6.629, 46.517], 'EPSG:4326', 'EPSG:3857'),
            zoom: 14
        })
    });
    this.view = this.map.getView();

    var style = [new ol.style.Style({
        image: new ol.style.Circle({
            radius: 10,
            fill: new ol.style.Stroke({color: 'rgba(0, 0, 0, 0.2)'}),
            stroke: new ol.style.Stroke({color: 'rgba(0, 0, 0, 0.7)', width: 1})
        })
    })];
    var selected_style = [new ol.style.Style({
        image: new ol.style.Circle({
            radius: 10,
            fill: new ol.style.Stroke({color: 'rgba(255, 190, 0, 0.2)'}),
            stroke: new ol.style.Stroke({color: 'rgba(255, 190, 0, 0.7)', width: 1})
        })
    })];
    this.selected_feature = null;
    var styleFunction = function(feature, resolution) {
        return feature == this.selected_feature ? selected_style : style;
    };

    var bases = new ol.source.GeoJSON({
        url: options.data_url
    });
    var vector_layer = new ol.layer.Vector({
        source: bases,
        styleFunction: styleFunction
    });
    this.map.addLayer(vector_layer);

    var squaredClickTolerance = 20;
    var squaredTolerance = 150;

    this.map.addInteraction(new GC.Select({
        map: this.map,
        bases: bases
    }));
    var self = this;

    if (options.search) {
        var first = true;
        bases.addEventListener(goog.events.EventType.CHANGE, function() {
            if (first && bases.getState() == ol.source.State.READY) {
                first = false;
                $(options.search).autocomplete({
                    source: $.map(bases.getAllFeatures(), function(feature) {
                        return {
                            label: feature.get('name'),
                            value: feature.get('name'),
                            feature: feature
                        };
                    }),
                    select: function(event, element) {
                        self.select(element.item.feature);
                    }
                });
            }
        });
    }
    if (options.result) {
        this.result = $(options.result);
        this.result.click(function() {
            self.show(null);
        });
    }
    if (options.result_template) {
        this.result_template = Handlebars.compile(options.result_template);
    }
    if (options.geolocation) {
        $(options.geolocation).click(function() {

            var geolocation = new ol.Geolocation();
            geolocation.setProjection(self.view.getProjection());
            geolocation.on('change:position', function(event) {
                    geolocation.setTracking(false);

                self.map.beforeRender(ol.animation.zoom({
                    duration: 500,
                    resolution: self.view.getResolution()
                }));
                self.view.setZoom(14);

                self.map.beforeRender(ol.animation.pan({
                    duration: 500,
                    source: self.view.getCenter()
                }));
                self.view.setCenter(geolocation.getPosition());

                var features = bases.getAllFeatures();
                var feature = null;
                var squaredDist = +Infinity;
                $.each(features, function() {
                    var candidateSquaredDist =
                        Math.pow(geolocation.getPosition()[0] - this.getGeometry().getCoordinates()[0], 2) +
                        Math.pow(geolocation.getPosition()[1] - this.getGeometry().getCoordinates()[1], 2);
                    if (candidateSquaredDist < squaredDist) {
                        squaredDist = candidateSquaredDist;
                        feature = this;
                    }
                });
                if (feature) {
                    self.show(feature);
                }
            });
            geolocation.setTracking(true);

            return false;
        });
    }
};

GC.Map.prototype.select = function(feature) {
    this.show(feature);

    this.map.beforeRender(ol.animation.zoom({
        duration: 500,
        resolution: this.view.getResolution()
    }));
    this.view.setZoom(16);

    this.map.beforeRender(ol.animation.pan({
        duration: 500,
        source: this.view.getCenter()
    }));
    this.view.setCenter(feature.getGeometry().getCoordinates());
};

GC.Map.prototype.show = function(feature) {
    this.selected_feature = feature;
    if (this.result && this.result_template) {
        if (feature) {
            this.result.html(this.result_template(feature.getProperties()));
            this.result.addClass('selected');
        }
        else {
            this.result.removeClass('selected');
        }
    }
};
