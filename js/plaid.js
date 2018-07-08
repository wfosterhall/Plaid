//Setup
var scene, camera, renderer;
var zoom = 0.1;

//change map size here, camera will update automatically
var mapsize = 10;

var tree;

var trees = [];

var char; //to store our character object

var money = 0;
var wood = 0;
var environment = 0;


	init();

	render();


//might want to split init into scene setup and model loading etc 
//Scene setup
function init()
{
	//Create a scene
	scene = new THREE.Scene();

	//add in a scene loader at some point, or just list of scene sizes for game

	//Renderer
	var width = window.innerWidth;
	var height = window.innerHeight;
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( width, height );

	//set background
	renderer.setClearColor (0x0077be, 1);
	document.body.appendChild( renderer.domElement );

	//Camera
	camera = new THREE.PerspectiveCamera( 45, width/height, 0.1, 500 );
	//camera = new THREE.OrthographicCamera( zoom * width / - 2, zoom * width / 2, zoom * height / 2, zoom * height / - 2, 1, 1000 );
	scene.add( camera );

	//Adjust camera, set up isometric view
	var camDist = mapsize * 10;

	camera.position.set( camDist, camDist, camDist ); //Camera equal distance away
	camera.lookAt( scene.position ); //Camera always looks at origin

	//Add some ambient light
	var ambient = new THREE.AmbientLight( 0x404040, 5 );
	scene.add( ambient );

	//add directional light
	var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
	directionalLight.position.set(0, 10, 10);
	scene.add( directionalLight );


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

}

function createMap() {

	//Lay tiles for an n*n game board 

	var n = mapsize;

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

	char = new THREE.Mesh( geometry, material );
	char.position.set(0, 2, ( n/2 - 1 )* 10);
	scene.add(char);

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

		console.log(newTree);

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

	renderer.render( scene, camera );

	//perform loop here

	//update position of light?

	//check keycodes and update postion of char, maybe use callbacks?


	//should just have to use char.position.set to change the characters position, this can be done down below i think, might want to use callbacks later idk.

};