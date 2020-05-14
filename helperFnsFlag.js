// INIT FUNCTION

function init() {
	mtot = 0.1;
	g = 9.81;
	ks = 2;
	kd = 0.1;
	repulsionFactor = Math.pow(10,-1);
	
	continuityRatio = 1
	vent = 10
	directionVent = new THREE.Vector3(0,1,1).normalize();
	deltaT_acc = 0.01
	clothWidth = 10;
	clothHeight = 10;
	densityPerMeter = 2;
	l0Edge = 1/densityPerMeter;
	l0Diag = l0Edge*Math.sqrt(2);
	N = clothWidth*clothHeight*densityPerMeter
	m = 0.001;
	

	// Build scene
	container = document.getElementById( 'container' );

	view.camera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, view.near, view.far );
	view.camera.position.fromArray( view.eye );
	view.camera.up.fromArray( view.up );

	scene = new THREE.Scene();

	// create cloth
	cloth = createCloth(clothWidth,clothHeight,densityPerMeter);

	// renderer settings
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );

	container.appendChild( renderer.domElement );

	mesh = drawMesh(cloth);
	scene.add(mesh)
	animate();

}

// ANIMATE AND UPDATE FUNCTIONS

function animate(){

	animateCloth();
	render();
	requestAnimationFrame( animate );

	
}


function render() {

	updateSize();

	var dToL = Math.floor( windowWidth * view.dToL );
	var top = Math.floor( windowHeight * view.top );
	var width = Math.floor( windowWidth * view.width );
	var height = Math.floor( windowHeight * view.height );

	renderer.setViewport( dToL, top, width, height );
	renderer.setScissor( dToL, top, width, height );
	renderer.setScissorTest( true );
	renderer.setClearColor( view.background );

	view.camera.aspect = width / height;
	view.camera.updateProjectionMatrix();
	view.updateCamera(view.camera,scene,cloth);

	renderer.render( scene, view.camera );
}

function updateSize() {

	if ( windowWidth != window.innerWidth ) {

		windowWidth = window.innerWidth;
		windowHeight = window.innerHeight;

		renderer.setSize( windowWidth, windowHeight );

	}

}

function animateCloth(){

	var height = cloth.children.length
	var currentLine, nextLine;
	var currentPointPosition,currentSpeed;
	var F1,F2,F3,F4,F5,F6,F7,F8;
	//var F,a;
	var dToL,dToR,dToT,dToB,dToTL,dToTR,dToBL,dToBR;
	var width = cloth.children[0].children.length;
	vent = (1-continuityRatio)*Math.random(vent)+vent*continuityRatio

	// FIRST LINE 

	currentLine = cloth.children[0]
	nextLine = cloth.children[1]

	// CENTRAL PARTICULES

	for (let j=1;j<width-1;j++){

		currentPointPosition = currentLine.children[j].position
		currentSpeed = currentLine.children[j].speed

		dToL = currentPointPosition.distanceTo( currentLine.children[j-1].position )
		dToR = currentPointPosition.distanceTo( currentLine.children[j+1].position )
		dToT = currentPointPosition.distanceTo( nextLine.children[j].position )
		dToTL = currentPointPosition.distanceTo( nextLine.children[j-1].position )
		dToTR = currentPointPosition.distanceTo( nextLine.children[j+1].position )

		F1 = ( currentPointPosition.clone().sub( currentLine.children[j-1].position ).normalize() ).multiplyScalar( -ks*(dToL-l0Edge)+repulsionFactor/dToL );
		F2 = ( currentPointPosition.clone().sub( currentLine.children[j+1].position ).normalize() ).multiplyScalar( -ks*(dToR-l0Edge)+repulsionFactor/dToR );
		F3 = ( currentPointPosition.clone().sub( nextLine.children[j].position ).normalize() ).multiplyScalar( -ks*(dToT-l0Edge)+repulsionFactor/dToT );
		F4 = ( currentPointPosition.clone().sub( nextLine.children[j-1].position ).normalize() ).multiplyScalar( -ks*(dToTL-l0Diag)+repulsionFactor/dToTL );
		F5 = ( currentPointPosition.clone().sub( nextLine.children[j+1].position ).normalize() ).multiplyScalar( -ks*(dToTR-l0Diag)+repulsionFactor/dToTR );

		F = F1.clone().add(F2).add(F3).add(F4).add(F5);


		a = F.clone().multiplyScalar(1/m).add(new THREE.Vector3(vent*directionVent.x,vent*directionVent.y,vent*directionVent.z-g));

		currentSpeed.addScaledVector(a,deltaT_acc);
	}

	// RIGHT PARTICULE
	currentPointPosition = currentLine.children[width-1].position
	currentSpeed = currentLine.children[width-1].speed

	dToL = currentPointPosition.distanceTo( currentLine.children[width-2].position )
	dToT = currentPointPosition.distanceTo( nextLine.children[width-1].position )
	dToTL = currentPointPosition.distanceTo( nextLine.children[width-2].position )

	F1 = ( currentPointPosition.clone().sub( currentLine.children[width-2].position ).normalize() ).multiplyScalar( -ks*(dToL-l0Edge)+repulsionFactor/dToL );
	F3 = ( currentPointPosition.clone().sub( nextLine.children[width-1].position ).normalize() ).multiplyScalar( -ks*(dToT-l0Edge)+repulsionFactor/dToT );
	F4 = ( currentPointPosition.clone().sub( nextLine.children[width-2].position ).normalize() ).multiplyScalar( -ks*(dToTL-l0Diag)+repulsionFactor/dToTL );

	F = F1.clone().add(F3).add(F4);

	a = F.clone().multiplyScalar(1/m).add(new THREE.Vector3(vent*directionVent.x,vent*directionVent.y,vent*directionVent.z-g));

	currentSpeed.addScaledVector(a,deltaT_acc);

	// FOR EACH CENTRAL LINE

	for (let i=1; i<height-1;i++){

		previousLine = cloth.children[i-1]
		currentLine = cloth.children[i]
		nextLine = cloth.children[i+1]

		// ALL CENTER PARTICULES

		for (let j=1;j<width-1;j++){

			currentPointPosition = currentLine.children[j].position
			currentSpeed = currentLine.children[j].speed

			dToL = currentPointPosition.distanceTo( currentLine.children[j-1].position )
			dToR = currentPointPosition.distanceTo( currentLine.children[j+1].position )
			dToT = currentPointPosition.distanceTo( nextLine.children[j].position )
			dToTL = currentPointPosition.distanceTo( nextLine.children[j-1].position )
			dToTR = currentPointPosition.distanceTo( nextLine.children[j+1].position )
			dToB = currentPointPosition.distanceTo( previousLine.children[j].position )
			dToBL = currentPointPosition.distanceTo( previousLine.children[j-1].position )
			dToBR = currentPointPosition.distanceTo( previousLine.children[j+1].position )

			F1 = ( currentPointPosition.clone().sub( currentLine.children[j-1].position ).normalize() ).multiplyScalar( -ks*(dToL-l0Edge)+repulsionFactor/dToL );
			F2 = ( currentPointPosition.clone().sub( currentLine.children[j+1].position ).normalize() ).multiplyScalar( -ks*(dToR-l0Edge)+repulsionFactor/dToR );
			F3 = ( currentPointPosition.clone().sub( nextLine.children[j].position ).normalize() ).multiplyScalar( -ks*(dToT-l0Edge)+repulsionFactor/dToT );
			F4 = ( currentPointPosition.clone().sub( nextLine.children[j-1].position ).normalize() ).multiplyScalar( -ks*(dToTL-l0Diag)+repulsionFactor/dToTL );
			F5 = ( currentPointPosition.clone().sub( nextLine.children[j+1].position ).normalize() ).multiplyScalar( -ks*(dToTR-l0Diag)+repulsionFactor/dToTR );
			F6 = ( currentPointPosition.clone().sub( previousLine.children[j].position ).normalize() ).multiplyScalar( -ks*(dToB-l0Edge)+repulsionFactor/dToB );
			F7 = ( currentPointPosition.clone().sub( previousLine.children[j-1].position ).normalize() ).multiplyScalar( -ks*(dToBL-l0Diag)+repulsionFactor/dToBL );
			F8 = ( currentPointPosition.clone().sub( previousLine.children[j+1].position ).normalize() ).multiplyScalar( -ks*(dToBR-l0Diag)+repulsionFactor/dToBR );

			F = F1.clone().add(F2).add(F3).add(F4).add(F5).add(F6).add(F7).add(F8);

			a = F.clone().multiplyScalar(1/m).add(new THREE.Vector3(vent*directionVent.x,vent*directionVent.y,vent*directionVent.z-g));

			currentSpeed.addScaledVector(a,deltaT_acc);
		}

		// RIGHT PARTICULE
		currentPointPosition = currentLine.children[width-1].position
		currentSpeed = currentLine.children[width-1].speed

		dToL = currentPointPosition.distanceTo( currentLine.children[width-2].position )
		dToT = currentPointPosition.distanceTo( nextLine.children[width-1].position )
		dToTL = currentPointPosition.distanceTo( nextLine.children[width-2].position )
		dToB = currentPointPosition.distanceTo( previousLine.children[width-1].position )
		dToBL = currentPointPosition.distanceTo( previousLine.children[width-2].position )

		F1 = ( currentPointPosition.clone().sub( currentLine.children[width-2].position ).normalize() ).multiplyScalar( -ks*(dToL-l0Edge)+repulsionFactor/dToL );
		F3 = ( currentPointPosition.clone().sub( nextLine.children[width-1].position ).normalize() ).multiplyScalar( -ks*(dToT-l0Edge)+repulsionFactor/dToT );
		F4 = ( currentPointPosition.clone().sub( nextLine.children[width-2].position ).normalize() ).multiplyScalar( -ks*(dToTL-l0Diag)+repulsionFactor/dToTL );
		F6 = ( currentPointPosition.clone().sub( previousLine.children[width-1].position ).normalize() ).multiplyScalar( -ks*(dToB-l0Edge)+repulsionFactor/dToB );
		F7 = ( currentPointPosition.clone().sub( previousLine.children[width-2].position ).normalize() ).multiplyScalar( -ks*(dToBL-l0Diag)+repulsionFactor/dToBL );

		F = F1.clone().add(F3).add(F4).add(F6).add(F7);

		a = F.clone().multiplyScalar(1/m).add(new THREE.Vector3(vent*directionVent.x,vent*directionVent.y,vent*directionVent.z-g));

		currentSpeed.addScaledVector(a,deltaT_acc);
	}
	

	// LAST LINE
	currentLine = cloth.children[height-1]
	previousLine = cloth.children[height-2]

	for (let j=1;j<width-1;j++){

		currentPointPosition = currentLine.children[j].position

		dToL = currentPointPosition.distanceTo( currentLine.children[j-1].position )
		dToR = currentPointPosition.distanceTo( currentLine.children[j+1].position )
		dToB = currentPointPosition.distanceTo( previousLine.children[j].position )
		dToBL = currentPointPosition.distanceTo( previousLine.children[j-1].position )
		dToBR = currentPointPosition.distanceTo( previousLine.children[j+1].position )

		F1 = ( currentPointPosition.clone().sub( currentLine.children[j-1].position ).normalize() ).multiplyScalar( -ks*(dToL-l0Edge)+repulsionFactor/dToL );
		F2 = ( currentPointPosition.clone().sub( currentLine.children[j+1].position ).normalize() ).multiplyScalar( -ks*(dToR-l0Edge)+repulsionFactor/dToR );
		F6 = ( currentPointPosition.clone().sub( previousLine.children[j].position ).normalize() ).multiplyScalar( -ks*(dToB-l0Edge)+repulsionFactor/dToB );
		F7 = ( currentPointPosition.clone().sub( previousLine.children[j-1].position ).normalize() ).multiplyScalar( -ks*(dToBL-l0Diag)+repulsionFactor/dToBL );
		F8 = ( currentPointPosition.clone().sub( previousLine.children[j+1].position ).normalize() ).multiplyScalar( -ks*(dToBR-l0Diag)+repulsionFactor/dToBR );

		F = F1.clone().add(F2).add(F6).add(F7).add(F8);

		a = F.clone().multiplyScalar(1/m).add(new THREE.Vector3(vent*directionVent.x,vent*directionVent.y,vent*directionVent.z-g));

		currentLine.children[j].speed.addScaledVector(a,deltaT_acc);
	}

	// RIGHT PARTICULE
	currentPointPosition = currentLine.children[width-1].position
	currentSpeed = currentLine.children[width-1].speed

	dToL = currentPointPosition.distanceTo( currentLine.children[width-2].position )
	dToB = currentPointPosition.distanceTo( previousLine.children[width-1].position )
	dToTBL = currentPointPosition.distanceTo( previousLine.children[width-2].position )

	F1 = ( currentPointPosition.clone().sub( currentLine.children[width-2].position ).normalize() ).multiplyScalar( -ks*(dToL-l0Edge)+repulsionFactor/dToL );
	F6 = ( currentPointPosition.clone().sub( previousLine.children[width-1].position ).normalize() ).multiplyScalar( -ks*(dToB-l0Edge)+repulsionFactor/dToB );
	F7 = ( currentPointPosition.clone().sub( previousLine.children[width-2].position ).normalize() ).multiplyScalar( -ks*(dToBL-l0Diag)+repulsionFactor/dToBL );

	F = F1.clone().add(F6).add(F7);

	a = F.clone().multiplyScalar(1/m).add(new THREE.Vector3(vent*directionVent.x,vent*directionVent.y,vent*directionVent.z-g));

	currentSpeed.addScaledVector(a,deltaT_acc);

	updatePosition(cloth);
	scene.children[0] = drawMesh(cloth);
}

function updatePosition(cloth){
	var height = cloth.children.length
	var width = cloth.children[0].children.length;
	for (let i=0;i<height;i++){
		currentLine = cloth.children[i];
		for (let j=0;j<width;j++){
			currentPoint = currentLine.children[j];
			currentPoint.position.addScaledVector(currentPoint.speed,deltaT_acc);
		}
	}
}

// FUNCTIONS TO BUILD OBJECTS

// Build a Sphere and add it to parentNode
function addASphere(size,clr,position,parentNode,shadows=true){
	let geometry = new THREE.SphereGeometry( size, 32, 32 );
	let material = new THREE. MeshPhongMaterial({color:clr});
	if (shadows == false) {
		material = new THREE. MeshBasicMaterial({color:clr});
	}
	let sphere = new THREE.Mesh( geometry, material );
	sphere.position.set(position.x,position.y,position.z);
	parentNode.add(sphere);
	return sphere; //only for other use, if needed
}

function createCloth(clothWidth,clothHeight,densityPerMeter){
	var cloth = new THREE.Group();
	var clothRow;
	var widthNumber = clothWidth*densityPerMeter;
	var heightNumber = clothHeight*densityPerMeter;
	var particule;
	var height,width;
	for (let i=0;i<heightNumber;i++){
		clothRow = new THREE.Group();
		height = i/densityPerMeter;
		for (let j=0;j<widthNumber;j++){
			width = j/densityPerMeter;
			particule = new THREE.Object3D();
			particule.position.set(0,width,height);
			particule.speed = new THREE.Vector3();
			clothRow.add(particule);
		}
		cloth.add(clothRow);
	}
	return cloth;
}

function drawMesh(cloth){
	let clothGeometry = new THREE.Geometry();

	var height = cloth.children.length
	var currentLine, nextLine;
	var currentPointPosition;
	var width = cloth.children[0].children.length;

	for (let i=0; i<height-1;i++){
		currentLine = cloth.children[i]
		nextLine = cloth.children[i+1]
		currentPointPosition = currentLine.children[0].position

		clothGeometry.vertices.push(
				currentPointPosition,currentLine.children[1].position,
				currentPointPosition,nextLine.children[0].position,
				currentPointPosition,nextLine.children[1].position
			)

		for (let j=1;j<width-1;j++){
			currentPointPosition = currentLine.children[j].position

			clothGeometry.vertices.push(
				currentPointPosition,currentLine.children[j+1].position,
				currentPointPosition,nextLine.children[j-1].position,
				currentPointPosition,nextLine.children[j].position,
				currentPointPosition,nextLine.children[j+1].position
			)
		}

		currentPointPosition = currentLine.children[width-1].position

		clothGeometry.vertices.push(
			currentPointPosition,nextLine.children[width-2].position,
			currentPointPosition,nextLine.children[width-1].position
			)
	}
	currentLine = cloth.children[height-1]

	for (let j=0;j<width-1;j++){
		currentPointPosition = currentLine.children[j].position

		clothGeometry.vertices.push(
			currentPointPosition,currentLine.children[j+1].position
		)
	}

	let material = new THREE.LineBasicMaterial();
	return new THREE.LineSegments(clothGeometry,material);


}
















console.log("DBG: helperFns.js loaded");
