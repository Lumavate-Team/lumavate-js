var BaseTracker = require('./base-tracker');
var FrameTracker = require('frametrack');


var CameraTracker = (function (){
  var CameraTracker = function(type, properties){
    BaseTracker.call(this, type, properties);
  }
  CameraTracker.prototype = Object.create(BaseTracker.prototype);
  CameraTracker.prototype.constructor = CameraTracker;

  CameraTracker.prototype.init = function(videoId, canvas, context){
    context = canvas.getContext("2d");
    context.strokeStyle = "#ff0000";
    context.lineJoin = "round";
    context.lineWidth = 5;
    this.canvas = canvas;
    this.context = context;
    this.tracker = new FrameTracker({x:canvas.width,y:canvas.height},60,3);
    this.videoId = videoId;
    window.addEventListener('devicemotion',      this.tracker.handleDeviceMotionEvent.bind(this));
    window.addEventListener('orientationchange', this.tracker.handleScreenOrientationEvent.bind(this));
    window.setInterval(function(){
      this.context.lineTo(crossx(this.tracker.p.elements[0]+Math.random()*0.01),crossy(this.tracker.p.elements[1]+Math.random()*0.01));
      this.context.stroke();
    }.bind(this),20);
    this.context.moveTo(crossx(this.tracker.p[0]),crossy(this.tracker.p[1]));
    console.log(this.tracker);
    function crossx(x) {return Math.floor(x*canvas.width/2+canvas.width/2)}
    function crossy(y) {return Math.floor(y*canvas.width/2+canvas.height/2)}
  }

  CameraTracker.prototype.onTrack = function(event){

  }

  return CameraTracker;
})();
module.exports = CameraTracker;



































