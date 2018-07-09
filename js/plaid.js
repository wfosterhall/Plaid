//Setup
var scene, camera, renderer;
var zoom = 0.1;

//change map size here, camera will update automatically
const MAPSIZE = 20;
const MAXSPEED = 5;

var tree;
var trees = [];

var lumberjack; //to store our character object

var vel = [0, 0, 0]; //store our chars movement, might want to move this into object later

var isGrounded; //storing our chars status
var isFalling;

var money = 0;
var wood = 0;
var environment = 0;

var prevtime = 0;

//trying to make man move in both directions at once
//will write a keymap so we can detect whats happening at what time;
var keymap = {};


//var levels = [3, 5, 10, 20];

init();


//might want to split init into scene setup and model loading etc 
//Scene setup
function init()
{
	//Create a scene
	scene = new THREE.Scene();

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
	var camDist = MAPSIZE * 10;

	cameraP.position.set( camDist, camDist, camDist ); //Camera equal distance away
	cameraP.lookAt( scene.position ); //Camera always looks at origin


	//Adjust Pcamera, set up isometric view
	var camDist = MAPSIZE * 10;

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
	info.innerHTML = 'O: Orthographic P: Perspective';
	container.appendChild( info );


////////////////////////////////////////////
/*                 LIGHTS                 */
////////////////////////////////////////////


	//Add some ambient light
	var ambient = new THREE.AmbientLight( 0x404040, 5 );
	scene.add( ambient );

	//add directional light
	var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
	directionalLight.position.set( 0, 10, 10 );
	scene.add( directionalLight );



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

		//this is messy i dont like this, replace with counter and loop until loaded
		createMap();
	},

	// onProgress callback
	function ( xhr ) {
		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
	},

	// onError callback
	function( err ) {
		console.log( 'An error occured' );
	}
	);

	//finally start render loop after everything is done

	render();

}

function createMap() {

	//Lay tiles for an n*n game board 

	var n = MAPSIZE;

	for (var i = - n/2 * 10; i < n/2 * 10; i += 10)
	{
		for (var j = - n/2 * 10; j < n/2 * 10; j += 10 )
		{

			layTile(i,j);

		}
	}


	//adding our character to the left most tile

	var geometry = new THREE.BoxGeometry( 5, 5, 5 );
	var material = new THREE.MeshLambertMaterial( { color: 0xff0000 } );

	lumberjack = new THREE.Mesh( geometry, material );

	lumberjack.position.set(0, 4.5, ( n/2 - 1 )* 10);
	isGrounded = true;
	isFalling = false;
	scene.add( lumberjack );

}

//Lay down base tiles 
function layTile(x,y)
{

	var val = Math.floor( Math.random() * 2 );

	//Randomly pick a colour 
	var col = [ 0x228b22, 0x016c02 ];

	//add a tree
	if ( val > 0.7) {

		var newTree = tree.clone();

		newTree.position.set( x, 2, y );

		scene.add(newTree);

		trees.push(newTree);

	}

	//Create a tile 
	var geometry = new THREE.BoxGeometry( 10, 2, 10 );

	//Make the tile 
	var material = new THREE.MeshLambertMaterial( { color: col[val] } );
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
	update(0.1);

};


function update(dt) {

	//console.log(dt);

	//easier to have an update function to manage movement independently of keystrokes
	
	JackControls();

	//movement is a bit jerky, fix this up
	//needs to be precise

	//check if on the map
	if (lumberjack.position.x > MAPSIZE * 5 || lumberjack.position.x < -MAPSIZE * 5 || lumberjack.position.z > MAPSIZE * 5 || lumberjack.position.z < -MAPSIZE * 5)
	{
		isGrounded = false;
		isFalling = true;
	}

	//apply velocities
	lumberjack.position.x += vel[0] * dt;
	lumberjack.position.y += vel[1] * dt;
	lumberjack.position.z += vel[2] * dt;

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

	if (vel[0] > MAXSPEED) {

		vel[0] = MAXSPEED;

	}

	if (vel[0] < - MAXSPEED) {

		vel[0] = -MAXSPEED;
	}

	if (vel[2] > MAXSPEED) {

		vel[2] = MAXSPEED;

	}

	if (vel[2] < - MAXSPEED) {
	
		vel[2] = -MAXSPEED;

	}


	//remove small error amount

	//2 is our ground plane, maybe change to 0?
	if (lumberjack.position.y < 4.5 && !isFalling) {

		vel[1] = 0;

		isGrounded = true;

		lumberjack.position.y = 4.5;

	}

	if (isFalling && lumberjack.position.y < -1000) {

		isFalling = false;
		lumberjack.position.set(0, 4.5, ( MAPSIZE/2 - 1 )* 10);
	}

}

function onKeyUp(event) 
{

	var keyCode = event.which;

	console.log(keyCode);

	keymap[keyCode] = false;

}
	
function onKeyDown(event) 
{
	console.log(keymap);
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

    //Lumberjack Controls 

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

}

function JackControls () {

	//Lumberjack movement speed 
	var speed = 2;

	//Lumberjack Controls 

    //Push W
	if (keymap[87]) 
    {
        vel[2] -= speed;
    } 
    
    //Push A
	if (keymap[65]) 
    {
        vel[0] -= speed;
    } 

    //Push S
	if (keymap[83]) 
    {
        vel[2] += speed;
    } 

    //Push D
	if (keymap[68]) 
    {
        vel[0] += speed;
    } 

	//Push SPACE
	//what goes up must come down, but this doesn't....
	if (keymap[32]) 
    {    	
    	//check if double jump
    	if (isGrounded) {
    		vel[1] = 10;
    		isGrounded = false;
    	}
    }

}