# lumavate-js


webar_tracker provides ar-capable position and orientation tracking.


device = PhoneTracker();

var coords = device.getPosition();//coords is a THREE.js Vector2 representing displacement in meters from the first gps coordinate recieved.

var frame = device.getReferenceFrame();//this gets the first gps coordinate recieved. It is a Coordinates object.

device.forceReferenceFrame(frame);//this changes the reference frame so that coordinate systems can be synced across sessions.


var rotationquat = device.getOrientationQuat();//these get the orientation of the device as a THREE.js quaternion or a THREE.js Vector3 of euler angles.
var rotationeuler = device.getOrientationEuler();//These currently give the orientation of the world with respect to the camera but this will change at some point so don't use them yet.

this library requires:

https://cdnjs.cloudflare.com/ajax/libs/three.js/r71/three.min.js
https://cdnjs.cloudflare.com/ajax/libs/sylvester/0.1.3/sylvester.min.js

the three.js dependancy will dissapear at some point.



