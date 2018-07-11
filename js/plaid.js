//Setup
var scene, camera, renderer;
var directionalLight;
var backgroundMusic;

var zoom = 0.1;

//change map size here, camera will update automatically
const MAP_SIZE = 4;
const MAX_SPEED = 5;

var tree;
var trees = [];

var jackModel;

var lumberjack; //to store our character object

var vel = [0, 0, 0]; //store our chars movement, might want to move this into object later

var isGrounded; //storing our chars status
var isFalling;

var money = 0;
var wood = 0;
var environment = 0;

var map = [];

var prevtime = 0;

//trying to make man move in both directions at once
//will write a keymap so we can detect whats happening at what time;
var keymap = {};

var mute = true;

var loadingCounter = 0;

const LOAD_MAX = 2; //change for how many objects we have to load 


//var levels = [3, 5, 10, 20];

init();


//might want to split init into scene setup and model loading etc 
//Scene setup
function init()
{
	//Create a scene
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0xffffff, 10, 1000 );

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
	info.innerHTML = 'O: Orthographic P: Perspective 0: Toggle Music';
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

			map[j * MAP_SIZE + i] = val;

			layTile(i,j,val);

		}
	}


	//adding our character to the left most tile

	var geometry = new THREE.BoxGeometry( 5, 5, 5 );
	var material = new THREE.MeshToonMaterial( { color: 0xff0000 } );

	lumberjack = jackModel.clone();

	lumberjack.position.set(0, 4.5, ( MAP_SIZE/2 - 1 )* 10);
	isGrounded = true;
	isFalling = false;
	scene.add( lumberjack );

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

		var newTree = tree.clone();
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

	//perform loop here

	//update position of light?

	//check keycodes and update postion of char, maybe use callbacks?


	//should just have to use char.position.set to change the characters position, this can be done down below i think, might want to use callbacks later idk.

	//simple dt calculation
	var dt = 0;
	var time = performance.now();

    if (prevtime) {
        dt = (time - prevtime)/1000;
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
	
	JackControls();

	//movement is a bit jerky, fix this up
	//needs to be precise

	//check if on the map
	if (lumberjack.position.x > MAP_SIZE * 5 || lumberjack.position.x < -MAP_SIZE * 5 || lumberjack.position.z > MAP_SIZE * 5 || lumberjack.position.z < -MAP_SIZE * 5)
	{
		isGrounded = false;
		isFalling = true;
	}

	//dampen movement

	if (vel[0] > 0) {
		vel[0] -= 0.5;
	}
	
	if (vel[0] < 0) {
		vel[0] += 0.5;
	}


	if (vel[2] > 0) {
		vel[2] -= 0.5;
	}
	
	if (vel[2] < 0) {
		vel[2] += 0.5; 
	}

	//assume + is movement upwards
	if (!isGrounded) {
		vel[1] -= 10 * dt; 
	}

	//place constraints

	if (vel[0] > MAX_SPEED)
		vel[0] = MAX_SPEED;

	if (vel[0] < - MAX_SPEED)
		vel[0] = -MAX_SPEED;

	if (vel[2] > MAX_SPEED)
		vel[2] = MAX_SPEED;

	if (vel[2] < - MAX_SPEED)
		vel[2] = -MAX_SPEED;

	moveLumberJack(vel[0] * dt, vel[1] * dt, vel[2] * dt);


	//checkiing ground collisions

	if (lumberjack.position.y < 4.5 && !isFalling) {

		vel[1] = 0;

		isGrounded = true;

		lumberjack.position.y = 4.5;

	}

	if (isFalling && lumberjack.position.y < -1000) {

		isFalling = false;
		lumberjack.position.set(0, 4.5, ( MAP_SIZE/2 - 1 )* 10);
	}

}

function moveLumberJack(x, y, z) {

	//get map coordinates

	//console.log (mx + ':' + mz)


	//check collisions with neighbouring boxes


	var newx = MAP_SIZE/2 + Math.floor((lumberjack.position.x + x)/10);
	var newz = MAP_SIZE/2 + Math.floor((lumberjack.position.z + z)/10);

	console.log (map[newz * MAP_SIZE + newx]);

	if (!map[newz * MAP_SIZE + newx]) {
		
		lumberjack.position.x += x;
		lumberjack.position.z += z;
	}

	//apply velocities
	lumberjack.position.y += y;


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
    else if(keyCode == 48 && mute == true ) 
    {
    	backgroundMusic.play();
    	mute = false;
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
        vel[2] -= speed;
    } 
    
    //Push A
	if (keymap[65]) 
    {
        lumberjack.rotation.y = - Math.PI / 2;
        vel[0] -= speed;
    } 

    //Push S
	if (keymap[83]) 
    {
    	lumberjack.rotation.y = 0;
        vel[2] += speed;
    } 

    //Push D
	if (keymap[68]) 
    {
    	lumberjack.rotation.y = + Math.PI / 2;
        vel[0] += speed;
    } 

	//Push SPACE
	if (keymap[32]) 
    {    	
    	//check if double jump
    	if (isGrounded) {
    		vel[1] = 10;
    		isGrounded = false;
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