var imageTracker = require('./trackers/orb-tracker');
var colorTracker = require('./trackers/color-tracker');

var LumavateTracking = (function (){
  var LumavateTracking = function(componentProperties){
    var _this = this;
    _this.options = {
      video:  {
        facingMode: "environment",
        width: {min:320, max: 1280},
        height: {min: 240, max: 720}
      },
      audio: false,
    };

    _this.trackerComponents = {
      colorTracker: colorTracker,
      imageTracker: imageTracker,
      // unfinished
      // cameraTracker: cameraTracker
    };
    _this.tracker = null;
    _this.video = null;
    _this.ratio = {};
    _this.canvas = null;
    _this.context = null;
    _this.videoInterval = null;
    _this.properties = {};
    _this.trackerTask = null;

    init(componentProperties);

    function init(properties){
      _this.properties = properties.trackingType;
      initCamera();
    }
    function initCamera(){
      if(!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)){
        navigator.mediaDevices.getUserMedia(_this.options).then(updateStream).catch(handleVideoError);
      }
    }

    function updateStream(stream){
      var video = document.getElementById('cameraVideo');
      video.srcObject = stream;
      setTimeout(function(){
        video.play();
      },500);

      initTracker();
    }
    function initTracker(){
      _this.canvas = document.getElementById('imageCanvas');
      if (_this.canvas.getContext) {
        _this.context = _this.canvas.getContext('2d');
      }
      _this.tracker = new _this.trackerComponents[_this.properties.componentType](_this.properties);

      _this.tracker.init('#cameraVideo', _this.canvas, _this.context);
      _this.trackerTask = _this.tracker.track();
    }
    function handleVideoError(err){
      // not sure what we want to do
      console.log(err);
    }
  }
  return LumavateTracking;
})();

module.exports = LumavateTracking;
