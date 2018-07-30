var BaseTracker = require('./base-tracker');
var ColorTracker = (function (){
  var ColorTracker = function(component){
    BaseTracker.call(this, component);
  }
  ColorTracker.prototype = Object.create(BaseTracker.prototype);
  ColorTracker.prototype.constructor = ColorTracker;

  ColorTracker.prototype.init = function(videoId, canvas, context){
    this.rgb = convertHexToRgb(this.properties.color);

    tracking.ColorTracker.registerColor(this.properties.color, checkColor.bind(this));

    BaseTracker.prototype.init.call(this, videoId, canvas, context);
    this.tracker.setMinDimension(this.properties.minDimension);
    this.tracker.setMinGroupSize(this.properties.minGroupSize);
  }
  ColorTracker.prototype.getTracker = function(){
    return new tracking.ColorTracker([this.properties.color]);
  }

  ColorTracker.prototype.onTrack = function(event){
    this.clearCanvas();

    if (event.data.length === 0) {
      // No colors were detected in this frame.
    } else {
      event.data.forEach(function(rect) {
        drawRect(rect);
      });
    }
  }

  function drawRect(rect){
    this.context.strokeStyle = 'rgb(255,0,255)';
    this.context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    this.context.font = '11px Helvetica';
    this.context.fillStyle = "#fff";
    this.context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
    this.context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
  }

  function checkColor(r,g,b){
    var colorTotal = this.rgb.r + this.rgb.g + this.rgb.b;

    if(colorTotal === 0){
      return r + g + b < 10;
    }

    var rRatio = this.rgb.r / colorTotal;
    var gRatio = this.rgb.g / colorTotal;
    var bRatio = this.rgb.b / colorTotal;
    var colorTotal2 = r + g + b;
    if (colorTotal2 === 0){
      if (colorTotal < 10){
        return true;
      } else {
        return false;
      }
    }

    var rRatio2 = r / colorTotal2;
    var gRatio2 = g / colorTotal2;
    var deltaColorTotal = colorTotal / colorTotal2;
    var deltaR = rRatio / rRatio2;
    var deltaG = gRatio / gRatio2;

    return deltaColorTotal > 0.9 && deltaColorTotal < 1.1 &&
      deltaR > 0.9 && deltaR < 1.1 &&
      deltaG > 0.9 && deltaG < 1.1;
  }

  function convertHexToRgb(hex){
    hex = hex.replace('#','');
    r = parseInt(hex.substring(0,2), 16);
    g = parseInt(hex.substring(2,4), 16);
    b = parseInt(hex.substring(4,6), 16);
    return {r:r, g:g, b:b};
  }

  return ColorTracker;
})();
module.exports = ColorTracker;

