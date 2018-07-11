//Setup
var scene, camera, renderer;
var directionalLight;
var backgroundMusic;
var newTree;
var menuSprite;

var zoom = 0.1;

//change map size here, camera will update automatically
const MAP_SIZE = 4;
const MAX_SPEED = 3;

var tree;
var trees = [];

var jackModel;

var lumberjack; //to store our character object

var vel = [0, 0, 0]; //store our chars movement, might want to move this into object later

var money = 0;
var wood = 0;
var environment = 0;

var map = [];

var prevtime = 0;

var keymap = {};

var mute = true;

var menu = true;
var menuPositionOn = 39.2;
var menuPositionOff = 0;
var menuSprite;


var loadingCounter = 0;

const LOAD_MAX = 2; //change for how many objects we have to load

var debugLines;

//var levels = [3, 5, 10, 20];

init();


//might want to split init into scene setup and model loading etc 
//Scene setup
function init()
{
	//Create a scene
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0xffffff, 0.5, 1000 );

	document.addEventListener("keydown", onKeyDown, false);
	document.addEventListener("keyup", onKeyUp, false);


	//add in a scene loader at some point, or just list of scene sizes for game

	//Renderer
	var width = window.innerWidth;
	var height = window.innerHeight;
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( width, height );

	//set background
	renderer.setClearColor (0x0077be, 1);
	document.body.appendChild( renderer.domElement );


////////////////////////////////////////////
/*                CAMERAS                 */
////////////////////////////////////////////

	//Camera
	cameraP = new THREE.PerspectiveCamera( 45, width/height, 0.1, 1000 );
	cameraO = new THREE.OrthographicCamera( zoom * width / - 1.5, zoom * width / 1.5, zoom * height / 1.5, zoom * height / - 1.5, 1, 1000 );
	

	//Adjust Ocamera, set up isometric view
	var camDist = MAP_SIZE * 10;

	cameraP.position.set( camDist, camDist, camDist ); //Camera equal distance away
	cameraP.lookAt( scene.position ); //Camera always looks at origin


	//Adjust Pcamera, set up isometric view
	var camDist = MAP_SIZE * 10;

	cameraO.position.set( camDist, camDist, camDist ); //Camera equal distance away
	cameraO.lookAt( scene.position ); //Camera always looks at origin

	camera = cameraP;
	scene.add( camera ); 

	//Add camera toggle instructions
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	var info = document.createElement( 'div' );
	info.style.position = 'absolute';
	info.style.top = '30px';
	info.style.width = '100%';
	info.style.textAlign = 'center';
	info.innerHTML = 'O: Orthographic P: Perspective 0: Toggle Music M: Toggle Menu';
	container.appendChild( info );


////////////////////////////////////////////
/*                 LIGHTS                 */
////////////////////////////////////////////


	//Add some ambient light
	var ambient = new THREE.AmbientLight( 0x404040, 5 );
	scene.add( ambient );

	//add directional light
	directionalLight = new THREE.DirectionalLight( 0xffff00, 0.5 );
	directionalLight.position.set( 0, 10, 10 );
	scene.add( directionalLight );

////////////////////////////////////////////
/*                 AUDIO                  */
////////////////////////////////////////////

	// instantiate a listener
	var audioListener = new THREE.AudioListener();

	// add the listener to the camera
	camera.add( audioListener );

	// instantiate audio object
	backgroundMusic = new THREE.Audio( audioListener );

	// add the audio object to the scene
	scene.add( backgroundMusic );

	// instantiate a loader
	var loader = new THREE.AudioLoader();

	//load a resource
	loader.load(
		// resource URL
		'resources/backgroundMusic.mp3',

		// onLoad callback
		function ( audioBuffer ) {
			// set the audio object buffer to the loaded object
			backgroundMusic.setBuffer( audioBuffer );
			loadingCounter++;
		},

		// onProgress callback
		function ( xhr ) {
			console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
		},

		// onError callback
		function ( err ) {
			console.log( 'An error happened' );
			loadingCounter = -1;
		}
		);

////////////////////////////////////////////
/*                  MENU                  */
////////////////////////////////////////////

	//Make a new sprite and texture with intro
	var spriteMap = new THREE.TextureLoader().load( "resources/axe.png" );
	var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
	
	//Add sprite to scene 
	menuSprite = new THREE.Sprite( spriteMaterial );
	scene.add( menuSprite );

	//Position on intro page 
	menu = true;
	menuSprite.position.x = 39;
	menuSprite.position.y = menuPositionOn;
	menuSprite.position.z = 39;

////////////////////////////////////////////
/*                OBJECTS                 */
////////////////////////////////////////////

	//load our objects
	var loader = new THREE.GLTFLoader();

	loader.load(
	// resource URL
	'resources/tree.gltf',

	// onLoad callback
	function ( gltf ) {

		console.log(gltf.scene.children);
		tree = gltf.scene.children[0];
		loadingCounter++;
	},

	// onProgress callback
	function ( xhr ) {
		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
	},

	// onError callback
	function( err ) {
		console.log( 'An error occured' );
		loadingCounter = -1;
	}
	);

	loader.load(
	// resource URL
	'resources/jack.gltf',

	// onLoad callback
	function ( gltf ) {

		console.log(gltf.scene.children);
		jackModel = gltf.scene.children[0];
		loadingCounter++;
	},

	// onProgress callback
	function ( xhr ) {
		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
	},

	// onError callback
	function( err ) {
		console.log( 'An error occured' );
		loadingCounter = -1;
	}
	);

	//wait until loaded

	var loadingHandle = setInterval(function() {

		console.log("Loading...")

		if (loadingCounter >= LOAD_MAX) {

			console.log("LOADING COMPLETE!")
			clearInterval(loadingHandle);

			createMap();
			render();
		}


		if (loadingCounter < 0) {
			console.log("Error Loading");
		}


	}, 50);
}

function createMap() {

	//Lay tiles for an n*n game board 

	for (var j = 0; j < MAP_SIZE; j++)
	{
		for (var i = 0; i < MAP_SIZE; i++ )
		{

			var val = Math.floor( Math.random() * 2 );

			//MAKE THIS 1 UNIT BIGGER IN ALL DIRECTIONS
			map[j * MAP_SIZE + i] = val;

			layTile(i,j,val);

		}
	}


	//adding our character to the left most tile

	lumberjack = jackModel.clone();

	lumberjack.position.set(0, 4.5, ( MAP_SIZE/2 - 1 )* 10);

	lumberjack.vel = [0, 0, 0];

	lumberjack.isGrounded = true;
	lumberjack.isFalling = false;
	lumberjack.radius = 2;
	scene.add( lumberjack );

	//circle for debugging collisions

	var curve = new THREE.EllipseCurve(
	0,  0,            // ax, aY
	2, 2,           // xRadius, yRadius
	0,  2 * Math.PI,  // aStartAngle, aEndAngle
	false,            // aClockwise
	0                 // aRotation
	);

	var points = curve.getPoints( 50 );
	var geometry = new THREE.BufferGeometry().setFromPoints( points );

	var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );

	// Create the final object to add to the scene
	debugLines = new THREE.Line( geometry, material );

	debugLines.position = lumberjack.position;

	debugLines.rotation.x = Math.PI/2;

	scene.add(debugLines);

}

//Lay down base tiles 
function layTile(x, y, val)
{

	x = (x - MAP_SIZE/2 ) * 10;
	y = (y - MAP_SIZE/2 ) * 10;

	//Randomly pick a colour 
	var col = [ 0x228b22, 0x016c02 ];

	//add a tree
	if ( val > 0.7) {

		newTree = tree.clone();
		newTree.scale.y = 2;

		newTree.position.set( x, 2, y );

		scene.add(newTree);

		trees.push(newTree);

	}

	//Create a tile 
	var geometry = new THREE.BoxGeometry( 10, 2, 10 );

	//Make the tile 
	var material = new THREE.MeshToonMaterial( { color: col[val] } );
	var baseTile = new THREE.Mesh( geometry, material );
	
	//Place it in the scene 
	scene.add( baseTile );
	baseTile.position.set( x, 0, y );
}


//Draw/render the scene on the canvas 
function render()
{
	requestAnimationFrame(render);

	//User input 
	renderer.render( scene, camera );

	//newTree.scale.y += 0.0001;

	//perform loop here

	//update position of light?

	//check keycodes and update postion of char, maybe use callbacks?


	//should just have to use char.position.set to change the characters position, this can be done down below i think, might want to use callbacks later idk.

	//simple dt calculation
	var dt = 0;
	var time = performance.now();

    if (prevtime) {
        dt = ( time - prevtime ) / 1000;
    }

    prevtime = time;


    //have temporarily changed this to debug
	update( 0.1 );

};

function update(dt) {

	//light movement ( daytime / nighttime )
	var timeStamp = Date.now() / 10000;

	var lightx = 0;
	var lighty = Math.cos( timeStamp );
	var lightz = Math.sin( timeStamp ); //Change to cos for on/off night/day

	directionalLight.position.set( MAP_SIZE*lightx, MAP_SIZE*lighty, MAP_SIZE*lightz );

	//console.log(dt);

	//easier to have an update function to manage movement independently of keystrokes
	


	//movement is a bit jerky, fix this up
	//needs to be precise



	moveLumberJack(dt);

	debugLines.position.set(lumberjack.position.x, lumberjack.position.y, lumberjack.position.z  );

	//checkiing ground collisions



}

function moveLumberJack(dt) {

	//get map coordinates

	//console.log (mx + ':' + mz)

	JackControls();

		//check if on the map
	if (lumberjack.position.x + lumberjack.radius > MAP_SIZE * 5 || lumberjack.position.x + 2 * lumberjack.radius < - MAP_SIZE * 5 || lumberjack.position.z + lumberjack.radius > MAP_SIZE * 5 || lumberjack.position.z + 2 * lumberjack.radius < - MAP_SIZE * 5)
	{
		lumberjack.isGrounded = false;
		lumberjack.isFalling = true;
	}

	//dampen movement

	if (lumberjack.vel[0] > 0) {
		lumberjack.vel[0] -= 0.5;
	}
	
	if (lumberjack.vel[0] < 0) {
		lumberjack.vel[0] += 0.5;
	}


	if (lumberjack.vel[2] > 0) {
		lumberjack.vel[2] -= 0.5;
	}
	
	if (lumberjack.vel[2] < 0) {
		lumberjack.vel[2] += 0.5; 
	}

	//assume + is movement upwards
	if (!lumberjack.isGrounded) {
		lumberjack.vel[1] -= 10 * dt; 
	}

	//place constraints

	if (lumberjack.vel[0] > MAX_SPEED)
		lumberjack.vel[0] = MAX_SPEED;

	if (lumberjack.vel[0] < - MAX_SPEED)
		lumberjack.vel[0] = -MAX_SPEED;

	if (lumberjack.vel[2] > MAX_SPEED)
		lumberjack.vel[2] = MAX_SPEED;

	if (lumberjack.vel[2] < - MAX_SPEED)
		lumberjack.vel[2] = -MAX_SPEED;



	//check collisions with neighbouring boxes

	var newx = MAP_SIZE/2 + Math.floor((lumberjack.position.x + lumberjack.radius + lumberjack.vel[0])/10);
	var newz = MAP_SIZE/2 + Math.floor((lumberjack.position.z + lumberjack.radius + lumberjack.vel[2])/10);

	console.log (map[newz * MAP_SIZE + newx]);
	
	//apply velocities
	lumberjack.position.y += lumberjack.vel[1] * dt;

	if (!map[newz * MAP_SIZE + newx]) {
		
		lumberjack.position.x += lumberjack.vel[0] * dt;
		lumberjack.position.z += lumberjack.vel[2] * dt;
	}



	//handle falling
	if (lumberjack.position.y < 4.5 && !lumberjack.isFalling) {

		lumberjack.vel[1] = 0;

		lumberjack.isGrounded = true;

		lumberjack.position.y = 4.5;

	}

	if (lumberjack.isFalling && lumberjack.position.y < -1000) {

		lumberjack.isFalling = false;
		lumberjack.position.set(0, 4.5, ( MAP_SIZE/2 - 1 )* 10);
	}


}

function onKeyUp(event) 
{

	var keyCode = event.which;

	//console.log(keyCode);

	keymap[keyCode] = false;

}
	
function onKeyDown(event) 
{
	//console.log(keymap);
	var keyCode = event.which;

	//Toggle view 

    //Push O for orthographic 
    if (keyCode == 79) 
    {
        camera = cameraO;
    } 

    //Push P for perspective 
    if (keyCode == 80) 
    {
        camera = cameraP;
    } 

    //lumberjack Controls 

    //Push W
	if (keyCode == 87) 
    {
    	keymap[87] = true;
    } 
    
    //Push A
	if (keyCode == 65) 
    {
    	keymap[65] = true;
    } 

    //Push S
	if (keyCode == 83) 
    {
    	keymap[83] = true;
    } 

    //Push D
	if (keyCode == 68) 
    {
    	keymap[68] = true;
    } 

	//Push SPACE
	if (keyCode == 32) 
    {
    	keymap[32] = true;
    }


    //Toggle sound 

	//Push 0
	if (keyCode == 48 && mute == false) 
    {
    	backgroundMusic.pause();
    	mute = true;
    } 
    else if(keyCode == 48 && mute == true) 
    {
    	backgroundMusic.play();
    	mute = false;
    }

    //Toggle Menu 

    //Push M
	if (keyCode == 77 && menu == true) 
    {
    	menu = false;
    	menuSprite.position.y = menuPositionOff;

    } 
    else if(keyCode == 77 && menu == false) 
    {
    	menu = true;
    	menuSprite.position.y = menuPositionOn;
    }

}

function JackControls () {

	//Lumberjack movement speed 
	var speed = 2;

	//Lumberjack Controls 

    //Push W
	if (keymap[87]) 
    {
    	lumberjack.rotation.y = - Math.PI;
        lumberjack.vel[2] -= speed;
    } 
    
    //Push A
	if (keymap[65]) 
    {
        lumberjack.rotation.y = - Math.PI / 2;
        lumberjack.vel[0] -= speed;
    } 

    //Push S
	if (keymap[83]) 
    {
    	lumberjack.rotation.y = 0;
        lumberjack.vel[2] += speed;
    } 

    //Push D
	if (keymap[68]) 
    {
    	lumberjack.rotation.y = + Math.PI / 2;
        lumberjack.vel[0] += speed;
    } 

	//Push SPACE
	if (keymap[32]) 
    {    	
    	//check if double jump
    	if (lumberjack.isGrounded) {
    		lumberjack.vel[1] = 10;
    		lumberjack.isGrounded = false;
    	}
    }
}

function cutTree(tree) {

	//get a tree

	//play animation

	//wait until finished

	//change trees model/remove tree

	//add wood

	//update map


}