"use strict"
//---------------------------------------------------------------------------------------------
// PARAMS 
//---------------------------------------------------------------------------------------------
	var $container 		= $('#container');
	
	$container.height(window.innerHeight);
	
	var DEBUG_ON 		= false;
	
	var WIDTH 			= $container.outerWidth(),	
		HEIGHT 			= $container.outerHeight();

	var CAMERA_DIST		= 475,
		VIEW_ANGLE 		= 45,
	    ASPECT 			= WIDTH / HEIGHT,
	    NEAR 			= 10,
	    FAR 			= 10000;
	    
	var PHYS_FPS 		= 31,
		ANIM_FPS		= 31;

	var TAP_HEIGHT		= 50;

	//----------------------------------------------------------------------------------------	
	// GEOMETRY
	//----------------------------------------------------------------------------------------
	var WALL_WIDTH		= 150, 
		WALL_HEIGHT		= 300 - TAP_HEIGHT, 
		WALL_DEPTH		= 1,
		WALL_STARTY		= TAP_HEIGHT/2,
		WALL_SEGS		= 1,
		CEIL_HEIGHT		= 150, 
		FLR_HEIGHT		= -150+TAP_HEIGHT,
		TILE_WIDTH		= 50, 
		TILE_HEIGHT		= 7,
		TILE_DEPTH		= 50,
		TILE_SEGS		= 1,
		TILES_X			= 3,
		TILES_Y			= 3, 
		TILES_Z			= 3,
		TILE_GAP_X		= 1, 
		TILE_GAP_Y		= 15, 
		TILE_GAP_Z		= 1,
		BAT_WIDTH		= 75, 
		BAT_DEPTH		= 75, 
		BAT_HEIGHT		= 5,
		BAT_SEGS		= 1,
		BALL_RADIUS		= 5,
		BALL_SEGS		= 3; 
	//----------------------------------------------------------------------------------------	
	// MATERIALS
	//----------------------------------------------------------------------------------------
	var WALL_COLOUR		= 0x333333,
		BACKWALL_COLOUR	= 0x777777, 
		CEILING_COLOUR	= 0xcccccc, 
		TILE_COLOURS	= new Array( 0xddee33, 0x33eedd, 0xdd33ee ),
		TILE_ALPHA		= 1,
		BAT_COLOUR		= 0x33dd33,
		BALL_COLOUR		= 0xdddddd;
		
	//----------------------------------------------------------------------------------------	
	// MOVEMENT
	//----------------------------------------------------------------------------------------
	var BALL_SPEED		= 5,
		BALL_MAXSPEED	= 7,
		BALL_VECTOR 	= new THREE.Vector3( 0,-1*BALL_SPEED, 0), 
		BALL_STARTX		= 0,
		BALL_STARTY		= 0,
		BALL_STARTZ		= TILE_DEPTH*0.5,
		BAT_VECTOR 		= new THREE.Vector3( 0, 0, 0),
		BAT_STARTX		= 0, 
		BAT_STARTY		= FLR_HEIGHT-(BAT_HEIGHT/2), 
		BAT_STARTZ		= TILE_DEPTH*0.5, 
		BAT_SPEED		= 5.75,
		BAT_MAXSPEED	= 6.25,
		ACCEL_LOOP		= (1/30), // ms sample rate for accelerometer
		FILTER_FACTOR 	= 0.1,
		BAT_DAMP		= 0.1,
		CANMOVE_LEFT	= true, 
		CANMOVE_UP		= true,
		CANMOVE_RIGHT	= true,
		CANMOVE_DOWN	= true;
		
	//----------------------------------------------------------------------------------------	
	// INTERACTION
	//----------------------------------------------------------------------------------------
	var LTOUCH_X	 	= WIDTH/2, 
		LTOUCH_Y		= HEIGHT;
//---------------------------------------------------------------------------------------------
// SETUP  
//---------------------------------------------------------------------------------------------
	var renderer 	= new THREE.WebGLRenderer();
	var camera 		= new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	var scene 		= new THREE.Scene();

	renderer.setSize(WIDTH, HEIGHT);
	camera.position.z = CAMERA_DIST;
	scene.add(camera);

	var pointLight = new THREE.PointLight( 0xFFFFFF );
	pointLight.position.x = 0;
	pointLight.position.y = 0;
	pointLight.position.z = 300;

	scene.add(pointLight);	

	var tile = new Array();
	var bat, ball, ballmarker;	

	$container.append(renderer.domElement);

//---------------------------------------------------------------------------------------------
// WALLS 
//---------------------------------------------------------------------------------------------
	var wallMaterial = new THREE.MeshBasicMaterial(
	{
	    color: WALL_COLOUR
	});
	var ceilingMaterial = new THREE.MeshBasicMaterial(
	{
	    color: CEILING_COLOUR
	});
	var backwallMaterial = new THREE.MeshBasicMaterial(
	{
	    color: BACKWALL_COLOUR
	});

	var frontWallMaterial = new THREE.MeshBasicMaterial(
	{
	    opacity: 0
	});
	var floorMaterial = new THREE.MeshBasicMaterial(
	{
	    opacity: 0
	});

	var frontwall = new THREE.Mesh(
	   new THREE.CubeGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH, WALL_SEGS, WALL_SEGS, WALL_SEGS),
	   frontWallMaterial);
	var backwall = new THREE.Mesh(
	   new THREE.CubeGeometry(WALL_WIDTH, WALL_HEIGHT, WALL_DEPTH, WALL_SEGS, WALL_SEGS, WALL_SEGS),
	   backwallMaterial);
	var leftwall = new THREE.Mesh(
	   new THREE.CubeGeometry(WALL_DEPTH, WALL_HEIGHT, WALL_WIDTH, WALL_SEGS, WALL_SEGS, WALL_SEGS),
	   wallMaterial);
	var rightwall = new THREE.Mesh(
	   new THREE.CubeGeometry(WALL_DEPTH, WALL_HEIGHT, WALL_WIDTH, WALL_SEGS, WALL_SEGS, WALL_SEGS),
	   wallMaterial);
	var ceiling = new THREE.Mesh(
	   new THREE.CubeGeometry(WALL_WIDTH, WALL_DEPTH, WALL_WIDTH, WALL_SEGS, WALL_SEGS, WALL_SEGS),
	   ceilingMaterial);
	var floor = new THREE.Mesh(
	   new THREE.CubeGeometry(WALL_WIDTH, WALL_DEPTH, WALL_WIDTH, WALL_SEGS, WALL_SEGS, WALL_SEGS),
	   floorMaterial);

	frontwall.position 	= new THREE.Vector3(0,WALL_STARTY,WALL_WIDTH/2);	   
	backwall.position 	= new THREE.Vector3(0,WALL_STARTY,-1*WALL_WIDTH/2);	   
	leftwall.position 	= new THREE.Vector3(-1*WALL_WIDTH/2,WALL_STARTY,0);	   
	rightwall.position	= new THREE.Vector3(WALL_WIDTH/2,WALL_STARTY,0);	   
	ceiling.position 	= new THREE.Vector3(0,CEIL_HEIGHT,0);
	floor.position 		= new THREE.Vector3(0,FLR_HEIGHT,0);

	scene.add(frontwall);
	scene.add(backwall);
	scene.add(leftwall);
	scene.add(rightwall);
	scene.add(ceiling);
	scene.add(floor);

//---------------------------------------------------------------------------------------------
// TILES 
//---------------------------------------------------------------------------------------------
	// create the sphere's material
	var tileMaterials = new Array(new THREE.MeshBasicMaterial(
		{
	    	color: TILE_COLOURS[0],
	    	opacity: TILE_ALPHA
		}), 
		new THREE.MeshBasicMaterial(
		{
	    	color: TILE_COLOURS[1],
	    	opacity: TILE_ALPHA
		}), 
		new THREE.MeshBasicMaterial(
		{
	    	color: TILE_COLOURS[2],
	    	opacity: TILE_ALPHA
		})); 	

	var t, ml = tileMaterials.length;
	for (var x=0; x<TILES_X; x++) { 
		tile[x] = new Array();
		for (var y=0; y<TILES_Y; y++) { 
			tile[x][y] = new Array();
			for (var z=0; z<TILES_Z; z++) { 
				t = new THREE.Mesh(
				   new THREE.CubeGeometry(TILE_WIDTH, TILE_HEIGHT, TILE_DEPTH, TILE_SEGS, TILE_SEGS, TILE_SEGS),
				   tileMaterials[y%ml]);
				t.position.x = (TILE_WIDTH+TILE_GAP_X)*(x-1);
				t.position.y = CEIL_HEIGHT-(TILE_GAP_Y*(y+1));
				t.position.z = (TILE_DEPTH+TILE_GAP_Z)*(z-1);
				tile[x][y][z] = t;
				scene.add(t);
			}
		}
	}


//---------------------------------------------------------------------------------------------
// BAT 
//---------------------------------------------------------------------------------------------
	var batMaterial = new THREE.MeshBasicMaterial(
	{
	    color: BAT_COLOUR
	});

	var cube = new THREE.CubeGeometry(BAT_WIDTH, BAT_HEIGHT, BAT_DEPTH, BAT_SEGS, BAT_SEGS, BAT_SEGS);

	bat = new THREE.Mesh( cube,
	   batMaterial);
	scene.add(bat);
	
	bat.position.y = BAT_STARTY;
	bat.position.z = BAT_STARTZ;

//---------------------------------------------------------------------------------------------
// BALL 
//---------------------------------------------------------------------------------------------
	var ballMaterial = new THREE.MeshBasicMaterial(
	{
	    color: BALL_COLOUR
	});

	ball = new THREE.Mesh(
	   new THREE.SphereGeometry(BALL_RADIUS, BALL_RADIUS, BALL_SEGS, BALL_SEGS),
	   ballMaterial);
	scene.add(ball);

	ball.position.y = BALL_STARTY;
	ball.position.z = BALL_STARTZ;
	
	var ballmarkerMaterial = new THREE.MeshBasicMaterial(
	{
	    color: BALL_COLOUR
	});
	
	
	ballmarker = new THREE.Mesh(
	   new THREE.CubeGeometry(WALL_WIDTH, 1, 1, 1, 1, 1),
	   ballmarkerMaterial);
	scene.add(ballmarker);


	ballmarker.position.y = BAT_STARTY+BAT_HEIGHT/2;

	
//---------------------------------------------------------------------------------------------
// ACTION  
//---------------------------------------------------------------------------------------------
	//---------------------------------------------------------------------------------------------
	// CONTROL
	//---------------------------------------------------------------------------------------------
		//---------------------------------------------------------------------------------------------
		// KEYBOARD
		//---------------------------------------------------------------------------------------------

	function keyDownHandler(e) {
		var keycaught = false;	    
	    if ((e.keyCode==37)&&(CANMOVE_LEFT)) { 
	    	moveBat(1);
	    	keycaught = true;
	    }
	    if ((e.keyCode==38)&&(CANMOVE_UP)) { 
	    	moveBat(2);
	    	keycaught = true;
	    }
	    if ((e.keyCode==39)&&(CANMOVE_RIGHT)) { 
	    	moveBat(3);
	    	keycaught = true;
	    }
	    if ((e.keyCode==40)&&(CANMOVE_DOWN)) { 
	    	moveBat(4);
	    	keycaught = true;
	    }
		return !keycaught;
	}
	function keyUpHandler(e) {
		var keycaught = false;	    
	    if ((e.keyCode == 37)||(e.keyCode == 39)) { 
	    	BAT_VECTOR.x = 0;
	    	keycaught = true;
	    }
	    if ((e.keyCode == 38)||(e.keyCode == 40)) { 
	    	BAT_VECTOR.z = 0;
	    	keycaught = true;
	    }
		return !keycaught;
	};
	$(document).bind('keydown', keyDownHandler); 
	$(document).bind('keyup', keyUpHandler);
	
		//---------------------------------------------------------------------------------------------
		// MOUSE
		//---------------------------------------------------------------------------------------------
	$(document).mousemove(function(event) {
	});	 
		//---------------------------------------------------------------------------------------------
		// TOUCH
		//---------------------------------------------------------------------------------------------
	$(document).bind('touchstart', function(e) {	});
	$(document).bind('touchend', function(e) {
		BAT_VECTOR.x = 0;
		BAT_VECTOR.z = 0;
	});
	$(document).bind('touchmove', function(e) {
		var touch = e.originalEvent.touches[0];
		var touchx = touch.pageX, touchy = touch.pageY;
		var t = 1;
		if ((LTOUCH_X!=0)&&(LTOUCH_Y!=0)) { 
			if (touchx<LTOUCH_X-t) { 
				moveBat(1);
			}
			if (touchy<LTOUCH_Y-t) { 
				moveBat(2);
			}
			if (touchx>LTOUCH_X+t) { 
				moveBat(3);
			}
			if (touchy>LTOUCH_Y+t) { 
				moveBat(4);
			}
		}
		LTOUCH_X = touchx;
		LTOUCH_Y = touchy;
	});	 
	
	
		//---------------------------------------------------------------------------------------------
		// ACCELEROMETER
		//---------------------------------------------------------------------------------------------
    var watchID = null;

    document.addEventListener("deviceready", onDeviceReady, false);

    function onDeviceReady() {
        startWatch();
    }

    function startWatch() {
        var options = { frequency: ACCEL_LOOP };  
        watchID = navigator.accelerometer.watchAcceleration(onSuccess, onError, options);
    }

    function stopWatch() {
        if (watchID) {
            navigator.accelerometer.clearWatch(watchID);
            watchID = null;
        }
    }

    function onSuccess(acceleration) {

    var nx = acceleration.x * FILTER_FACTOR + BAT_VECTOR.x * (1.0 - FILTER_FACTOR) * BAT_SPEED;
    var nz = acceleration.z * FILTER_FACTOR + BAT_VECTOR.z * (1.0 - FILTER_FACTOR) * BAT_SPEED;
	
	BAT_VECTOR.x = Math.min(BAT_MAXSPEED, nx);
	BAT_VECTOR.z = Math.min(BAT_MAXSPEED, nz);

/*	if (acceleration.x<0) { 
			moveBat(1); 
		} 
		if (acceleration.z<0) { 
			moveBat(2); 
		} 
		if (acceleration.x>0) { 
			moveBat(3); 
		} 
		if (acceleration.z>0) { 
			moveBat(4); 
		} 
*/		
    }

    // onError: Failed to get the acceleration
    //
    function onError() {
        alert('onError!');
    }
	
	//---------------------------------------------------------------------------------------------
	// MOVEMENT
	//---------------------------------------------------------------------------------------------
	function moveBat(d) { 
		switch (d) { 
			case 1: // LEFT
	    		BAT_VECTOR.x = -1*BAT_SPEED;
				break;
			case 2: // UP
		    	BAT_VECTOR.z = -1*BAT_SPEED;
				break;
			case 3: // RIGHT
		    	BAT_VECTOR.x = 1*BAT_SPEED;
				break;
			case 4: // DOWN
				BAT_VECTOR.z = 1*BAT_SPEED;
				break;
			default: 
				BAT_VECTOR.x = 0;
				BAT_VECTOR.z = 0;
				break;
		}
	}
	//---------------------------------------------------------------------------------------------
	// PHYSICS
	//---------------------------------------------------------------------------------------------
    window.requestPhysFrame = (function(){
      return function( callback ){
                window.setTimeout(callback, 1000 / PHYS_FPS);
              };
    })(); 
    
    (function physloop(){
      	requestPhysFrame(physloop);
      	
      	//----------------------------------------------------------------------
      	// BAT-WALL COLLISION
      	//----------------------------------------------------------------------
      	var tilehit;      	
      	var batwidthh = BAT_WIDTH/2;
      	var batdepthh = BAT_DEPTH/2;
      	var walldepthh = WALL_DEPTH/2;

      	CANMOVE_LEFT = (bat.position.x > leftwall.position.x+batwidthh+walldepthh);
      	CANMOVE_UP = (bat.position.z > backwall.position.z+batwidthh-walldepthh);
      	CANMOVE_RIGHT = (bat.position.x < rightwall.position.x-batwidthh-walldepthh);
      	CANMOVE_DOWN = (bat.position.z < frontwall.position.z-batwidthh+walldepthh);
      		
      	if (!CANMOVE_LEFT) { 
      		BAT_VECTOR.x = 0;
      		++bat.position.x;
      	}
      	if (!CANMOVE_RIGHT) { 
      		BAT_VECTOR.x = 0;
      		--bat.position.x;
      	}
      	if (!CANMOVE_UP) { 
      		BAT_VECTOR.z = 0;
      		++bat.position.z;
      	}
      	if (!CANMOVE_DOWN) { 
      		BAT_VECTOR.z = 0;
      		--bat.position.z;
      	}
      	
      	//----------------------------------------------------------------------
      	// BALL-TILE COLLISION
      	//----------------------------------------------------------------------
		function findTileHit() { 
			var tilehw = TILE_WIDTH/2;
			var tilehh = TILE_HEIGHT/2;
			var tilehd = TILE_DEPTH/2;
			var hitx, hity, hitz;
			
		    for (var x=0; x<TILES_X; x++) {
			    for (var y=0; y<TILES_Y; y++) {		    
				    for (var z=0; z<TILES_Z; z++) {
				    	if (tile[x][y][z]!=null) {
					    	hitx = ((ball.position.x+BALL_RADIUS)>(tile[x][y][z].position.x-tilehw))
					    		&& ((ball.position.x-BALL_RADIUS)<(tile[x][y][z].position.x+tilehw));
					    	hity = ((ball.position.y+BALL_RADIUS)>(tile[x][y][z].position.y-tilehh))
					    		&& ((ball.position.y-BALL_RADIUS)<(tile[x][y][z].position.y+tilehh));
					    	hitz = ((ball.position.z+BALL_RADIUS)>(tile[x][y][z].position.z-tilehd))
					    		&& ((ball.position.z-BALL_RADIUS)<(tile[x][y][z].position.z+tilehd));
					    		
					    	if (hitx&&hity&&hitz) { 
					    		var r = tile[x][y][z];
					    		tile[x][y][z] = null; 
					    		return r;
					    	} 
					    }
				    }
			    }
		    }
		    return null;
		}
		
      	if (ball.position.y>0) { // OPTIMISATION HACK
      		tilehit = findTileHit();
      		if (tilehit!=null) { 
      			scene.remove(tilehit);
      			BALL_VECTOR.y *= -1;
      		}
      	}
      	//----------------------------------------------------------------------
      	// BAT-BALL COLLISION
      	//----------------------------------------------------------------------
      	var bathit;
      	var batx = (ball.position.x<=bat.position.x+batwidthh+BALL_RADIUS)
      		&& (ball.position.x>=bat.position.x-batwidthh-BALL_RADIUS);
      	var baty = (ball.position.y<=bat.position.y+BAT_HEIGHT+BALL_RADIUS);
      	var batz = (ball.position.z<=bat.position.z+batdepthh+BALL_RADIUS)
      		&& (ball.position.z>=bat.position.z-batdepthh-BALL_RADIUS);
      	bathit=batx&&baty&&batz;
      	if (bathit) { 
      		var xvec = ball.position.x - bat.position.x;
      		var zvec = ball.position.z - bat.position.z;
      		BALL_VECTOR.x = Math.min(BALL_MAXSPEED, xvec * BAT_DAMP);
      		BALL_VECTOR.z = Math.min(BALL_MAXSPEED, zvec * BAT_DAMP);
      		
      	}
      	
      	//----------------------------------------------------------------------
      	// BALL-WALL COLLISION
      	//----------------------------------------------------------------------
      	var ballx = (ball.position.x<=leftwall.position.x+walldepthh+BALL_RADIUS) 
      		|| (ball.position.x>=rightwall.position.x-walldepthh-BALL_RADIUS); 
      	var ballz = (ball.position.z>=frontwall.position.z-walldepthh-BALL_RADIUS) 
      		|| (ball.position.z<=backwall.position.z+walldepthh+BALL_RADIUS);

      	if (ballx) { 
      		BALL_VECTOR.x *= -1;
      	}
      	if ((ball.position.y>=ceiling.position.y) || bathit) { 
      		BALL_VECTOR.y *= -1;
      	}
      	if (ballz) { 
      		BALL_VECTOR.z *= -1;
      	}
      	
      	//----------------------------------------------------------------------
      	// BALL-FLOOR COLLISION
      	//----------------------------------------------------------------------
      	if (ball.position.y<=floor.position.y) { 
			BALL_VECTOR.x = 0;
			BALL_VECTOR.y = -1*BALL_SPEED;
			BALL_VECTOR.z = 0;
			BAT_VECTOR.x = BAT_VECTOR.y = BAT_VECTOR.z = 0;
			ball.position.x = BALL_STARTX;
			ball.position.y = BALL_STARTY;
			ball.position.z = BALL_STARTZ;
			bat.position.x = BAT_STARTX;
			bat.position.y = BAT_STARTY;
			bat.position.z = BAT_STARTZ;
			LTOUCH_X = WIDTH/2; 
			LTOUCH_Y = HEIGHT;
      	}
    })();

//---------------------------------------------------------------------------------------------
// DEBUG  
//---------------------------------------------------------------------------------------------
		if (DEBUG_ON) { 
			var container = document.getElementById('container');
			
			var debugCanvas = document.createElement( 'canvas' );
			debugCanvas.width = 74;
			debugCanvas.height = 30;
			debugCanvas.style.position = 'absolute';
			debugCanvas.style.top = '0px';
			debugCanvas.style.left = '320px';
	
			container.appendChild( debugCanvas );
	
			var debugContext = debugCanvas.getContext( '2d' );
			debugContext.setTransform( 1, 0, 0, 1, 256, 256 );
			debugContext.strokeStyle = '#000000';
	
			var stats = new Stats();
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0px';
			container.appendChild(stats.domElement);
		}
//---------------------------------------------------------------------------------------------
// ANIMATION 
//---------------------------------------------------------------------------------------------
	window.requestAnimFrame = (function(){
		return function( callback ){
			window.setTimeout(callback, 1000 / ANIM_FPS);
		};
	})();
 
    (function animloop(){
      	requestAnimFrame(animloop);
      	bat.position.addSelf(BAT_VECTOR);
      	ball.position.addSelf(BALL_VECTOR);
	    ballmarker.position.z = ball.position.z;
   		renderer.render(scene, camera);
		if (DEBUG_ON) { 
			stats.update();
		}
    })();