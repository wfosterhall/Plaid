//Setup
var scene, camera, renderer;

init();

//Scene setup
function init()
{
	//Create a scene
	scene = new THREE.Scene();


	//Renderer
	var width = window.innerWidth;
	var height = window.innerHeight;
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( width, height );
	document.body.appendChild( renderer.domElement );

	//Camera
	camera = new THREE.PerspectiveCamera( 45, width/height, 0.1, 500 );
	scene.add( camera );

	//Adjust camera
	var camDist = 100;
	camera.position.set( camDist, camDist, camDist ); //Camera equal distance away
	camera.lookAt( scene.position ); //Camera always looks at origin

	//Add some ambient light
	var ambient = new THREE.AmbientLight( 0x404040 );
	scene.add( ambient );

	render();
}



	var n = 10;

	for(var i = -n/2 * 10; i < n/2*10; i += 10)
	{
		for(var j = -n/2*10; j < n/2*10; j +=10 )
		{

			layTile(i,j);

		}
	}





//Lay down base tiles 
function layTile(x,y)
{

	//Create a tile 
	var geometry = new THREE.BoxGeometry( 10, 2, 10 );

	var col = [0x00ff00, 0x00fff0];

	var thiscol = Math.floor(Math.random() * 2);

	var material = new THREE.MeshLambertMaterial( {color:col[thiscol] } );
	var baseTile = new THREE.Mesh( geometry, material );
	
	//Place it in the scene 
	scene.add( baseTile );
	baseTile.position.set(x,0,y);
}


//Draw/render the scene on the canvas 
function render()
{
	//requestAnimationFrame(render);
	renderer.render( scene, camera );
};

var mainLoop = function()
{

	render();
}

mainLoop();