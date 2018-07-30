var BaseTracker = (function(){
  var BaseTracker = function(component){
    this.trackerType = component.componentType;
    this.properties = component.componentData;
    this.tracker = null;
    this.trackerTask = null;
    this.canvasContext = null;
    this.videoId = '';
  }


  BaseTracker.prototype.init = function(videoId, canvas, context){
    this.canvas = canvas;
    this.context = context;
    this.videoId = videoId;

    this.tracker = this.getTracker();
  };

  BaseTracker.prototype.track = function(){

    this.tracker.on('track', this.onTrack.bind(this));

//    this.trackerTask = tracking.track(this.videoId, this.tracker, {camera: true});
    this.trackerTask = tracking.track(this.videoId, this.tracker);
    return this.trackerTask;
  }
  BaseTracker.prototype.getTracker = function(){
    throw new Error("getTracker is not implemented.");
  }

  BaseTracker.prototype.onTrack = function(event){
    throw new Error("onTrack is not implemented.");
  }

  BaseTracker.prototype.stopTracking = function(){
    this.trackerTask.stop();
  }

  BaseTracker.prototype.resumeTracking = function(){
    this.trackerTask.run();
  }

  // perhaps a canvas class should be made....
  BaseTracker.prototype.clearCanvas = function(){
    // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  return BaseTracker;

})();

module.exports = BaseTracker;
