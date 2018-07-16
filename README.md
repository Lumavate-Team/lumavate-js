# lumavate-js


webar_tracker provides ar-capable orientation tracking.


device = new PhoneTracker();

var rotationquat = device.getOrientationQuaternion();//these get the orientation of the device as a THREE.js quaternion or a THREE.js Vector3 of euler angles.
var rotationeuler = device.getOrientationEuler();//These currently give the orientation of the world with respect to the camera.
var accellerationworld = device.getAccellerationWorld();


window.addEventListener('devicemotion', this.handleDeviceMotionEvent.bind(this));
window.addEventListener('orientationchange', this.handleScreenOrientationEvent.bind(this));

this library requires:

https://cdnjs.cloudflare.com/ajax/libs/three.js/r71/three.min.js
https://cdnjs.cloudflare.com/ajax/libs/sylvester/0.1.3/sylvester.min.js




