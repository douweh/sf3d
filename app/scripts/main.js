window.start=null;
window.end=null;
window.elevator = null;

function googleReady() {
  var map = new google.maps.Map(document.getElementById('map2d'), {
    zoom: 12,
    center: {lat: 37.7833, lng: -122.4167},  // SF.
    mapTypeId: 'terrain'
  });

  window.elevator = new google.maps.ElevationService;

  // Add a listener for the click event. Display the elevation for the LatLng of
  // the click inside the infowindow.
  map.addListener('click', clickOnMap);
}

function clickOnMap(event){
  var instructie = $('#instructie');
  if (window.start === null) {
    instructie.html('Klik nog een keer om het eindpunt te bepalen');
    window.start=event.latLng;
  } else if (window.end === null) {
    instructie.html('Klik om opnieuw te beginnen');
    window.end=event.latLng;
    doHeightQuery({lat: window.start.lat(), lng: window.start.lng()}, {lat: window.end.lat(), lng: window.end.lng()}, 0, 0);
  } else if (window.end !== null && window.start !== null) {
    instructie.html('Klik om het startpunt te bepalen');
    window.start=null;
    window.end=null;
  }
}

function doHeightQuery(start, stop, offset, callCount) {
  var delta = start.lng - stop.lng;
  delta = delta / 200;
  start.lat -= delta;
  stop.lat -= delta;
  if (callCount<199) {
      elevator.getElevationAlongPath({
        path: [start, stop],
        samples: 200
      },
      function(values, status){
        var heights = values.map(function(item){
          return item.elevation > 0 ? item.elevation / 1000 : 0;
        });
        console.log(status, heights);
        setHeight(heights, 200*callCount);
      });
    callCount++;
    setTimeout(function(){
      doHeightQuery(start, stop, offset, callCount);
    }, 2000);
  }
}

function setHeight(heights, offset) {
  offset = offset || 0;
  var realOffset = 40000 - (200 + offset);

  var h = 0;
  for (var i = realOffset; i < realOffset+heights.length; i++) {
      geometry.vertices[i].z = heights[h++] * 10;
  }
  geometry.verticesNeedUpdate=true;
}

function normalize(arr) {
    // find the min and max value
    var max = 0;
    var min = 100000;
    for(var x=0; x<arr.length; x++) {
      max = Math.max(max, arr[x]);
      min = Math.min(min, arr[x]);
    }

    var diff = max-min;
    var r = 1 / diff;
    
    // normalize the array
    for(var x=0; x<arr.length; x++) arr[x] = (arr[x]-min) * r;
    return arr;
}

$(function(){
  // Render in this element
  var el = document.getElementById('map3d');

  // Get width and height
  var width = el.clientWidth;
  var height = el.clientHeight;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 1000 );

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize( width, height );
  
  el.appendChild( renderer.domElement );
  var controls = new THREE.TrackballControls(camera, renderer.domElement); 

  console.log(width, height);

  window.geometry = new THREE.PlaneGeometry(60, 60, 199, 199);
  geometry.dynamic = true;

  var material = new THREE.MeshBasicMaterial( { color: 0xdddddd, wireframe: true} );

  var plane = new THREE.Mesh(geometry, material);
  var axes = new THREE.AxisHelper(200);
  scene.add(axes);
  scene.add(plane);

  camera.position.set(0, -50, 50);

  function render() {
    controls.update();
    requestAnimationFrame(render);
    renderer.render( scene, camera );
  }
  render();

});