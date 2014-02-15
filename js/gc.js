GC = {};

GC.Map = function(options) {

    this.options = options;

    this.map = new ol.Map({
        renderer: ol.RendererHint.CANVAS,
        target: options.map,
        controls: ol.control.defaults({
            attribution: false,
            logo: false
        }),
        layers: [
            new ol.layer.Tile({
                source: new ol.source.XYZ({
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
            maxResolution: 156543.03392804097 / 1024,
            maxZoom: 8,
            center: ol.proj.transform([6.629, 46.517], 'EPSG:4326', 'EPSG:3857'),
            zoom: 3
        })
    });
    this.view = this.map.getView();

    var bases = new ol.source.GeoJSON({
        url: options.data_url,
        defaultProjection: 'EPSG:4326',
        projection: 'EPSG:3857'
    });
    var style = [new ol.style.Style({
        image: new ol.style.Circle({
            radius: options.mobile ? 16 : 10,
            fill: new ol.style.Fill({color: 'rgba(0, 0, 0, 0.2)'}),
            stroke: new ol.style.Stroke({color: 'rgba(0, 0, 0, 0.7)', width: 1})
        })
    })];

    var vector_layer = new ol.layer.Vector({
        source: bases,
        styleFunction: function(feature, resolution) {
            return style;
        }
    });
    this.map.addLayer(vector_layer);

    var self = this;

    this.selectedOverlay = new ol.FeatureOverlay({
        map: this.map,
        styleFunction: function() {
            return [new ol.style.Style({
                image: new ol.style.Circle({
                    radius: options.mobile ? 32 : 10, // 16
                    stroke: new ol.style.Stroke({color: 'rgba(255, 190, 0, 1)', width: 4})
                })
            })];
        }
    });

    var icon = new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        size: options.mobile ? [52, 74] : [17, 24], // [26, 37]
        src: options.mobile ? "image/location74.png" : "image/location24.png"
    }));
    icon.load();
    this.positionOverlay = new ol.FeatureOverlay({
        map: this.map,
        styleFunction: function() {
            return [new ol.style.Style({
                image: icon
            })];
        }
    });

    this.map.on(ol.MapBrowserEvent.EventType.SINGLECLICK, function(evt) {
        var feature = null;
        var squaredDist = options.mobile ? 600 : 150;
        $.each(bases.getAllFeatures(), function() {
            var candidatePixel = self.map.getPixelFromCoordinate(this.getGeometry().getCoordinates());
            var candidateSquaredDist =
                Math.pow(evt.pixel[0] - candidatePixel[0], 2) +
                Math.pow(evt.pixel[1] - candidatePixel[1], 2);
            if (candidateSquaredDist < squaredDist) {
                squaredDist = candidateSquaredDist;
                feature = this;
            }
        });

        self.show(feature);
    });

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
                self.positionOverlay.setFeatures(new ol.Collection([
                    new ol.Feature(new ol.geom.Point(geolocation.getPosition()))
                ]));


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
    if (options.north) {
        var view = this.view;
        $(options.north).hide();
        $(options.north).click(function() {
            view.setRotation(0);
            $(options.north).hide();
        });
        view.on('propertychange', function(event) {
            if (event.key == "rotation") {
                $(options.north).show();
            }
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
    if (this.result && this.result_template) {
        if (feature) {
            this.selectedOverlay.setFeatures(new ol.Collection([feature]));
            this.result.html(this.result_template(feature.getProperties()));
            this.result.addClass('selected');
        }
        else {
            this.selectedOverlay.setFeatures(new ol.Collection([]));
            this.result.removeClass('selected');
        }
    }
};
