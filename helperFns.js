// INIT FUNCTION

function init() {
	mtot = 0.1;
	g = 9.81;
	ks = 3;
	kd = 0.1;
	repulsionFactor = 0
	
	continuityRatio = 1
	wind = 3
	windDirection = new THREE.Vector3(0,1,0).normalize();
	deltaT_acc = 0.01;
	clothWidth = 15;
	clothHeight = 20;
	densityPerMeter = 2;
	l0Edge = 1/densityPerMeter;
	l0Diag = l0Edge*Math.sqrt(2);
	N = clothWidth*clothHeight*densityPerMeter
	m = 0.001;
	maxStrecht = 1.5;
	minStrecht = 0.65;
	l0EdgeMax = maxStrecht*l0Edge;
	l0EdgeMin = minStrecht*l0Edge;
	l0DiagMax = maxStrecht*l0Diag;
	l0DiagMin = minStrecht*l0Diag;
	

	// Build scene
	container = document.getElementById( 'container' );

	view.camera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, view.near, view.far );
	view.camera.position.fromArray( view.eye );
	view.camera.up.fromArray( view.up );

	scene = new THREE.Scene();
	var controls = new THREE.OrbitControls( view.camera );

	// create cloth
	cloth = createCloth(clothWidth,clothHeight,densityPerMeter);

	// renderer settings
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );

	container.appendChild( renderer.domElement );

	mesh = drawMesh(cloth);
	scene.add(mesh)

	controls.update();
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
	wind = (1-continuityRatio)*Math.random(wind)+wind*continuityRatio

	// FIRST LINE 

	currentLine = cloth.children[0]
	nextLine = cloth.children[1]

	// LEFT PARTICULE
	currentPointPosition = currentLine.children[0].position
	currentSpeed = currentLine.children[0].speed

	dToR = currentPointPosition.distanceTo( currentLine.children[1].position )
	dToT = currentPointPosition.distanceTo( nextLine.children[0].position )
	dToTR = currentPointPosition.distanceTo( nextLine.children[1].position )

	F2 = ( currentPointPosition.clone().sub( currentLine.children[1].position ).normalize() ).multiplyScalar( -ks*(dToR-l0Edge)*(1+repulsionFactor/dToR));
	F3 = ( currentPointPosition.clone().sub( nextLine.children[0].position ).normalize() ).multiplyScalar( -ks*(dToT-l0Edge)*(1+repulsionFactor/dToT));
	F5 = ( currentPointPosition.clone().sub( nextLine.children[1].position ).normalize() ).multiplyScalar( -ks*(dToTR-l0Diag)*(1+repulsionFactor/dToTR));

	F = F2.clone().add(F3).add(F5);

	a = F.clone().multiplyScalar(1/m).add(new THREE.Vector3(wind*windDirection.x,wind*windDirection.y,wind*windDirection.z-g));

	currentSpeed.addScaledVector(a,deltaT_acc);

	// CENTRAL PARTICULES

	for (let j=1;j<width-1;j++){

		currentPointPosition = currentLine.children[j].position
		currentSpeed = currentLine.children[j].speed

		dToL = currentPointPosition.distanceTo( currentLine.children[j-1].position )
		dToR = currentPointPosition.distanceTo( currentLine.children[j+1].position )
		dToT = currentPointPosition.distanceTo( nextLine.children[j].position )
		dToTL = currentPointPosition.distanceTo( nextLine.children[j-1].position )
		dToTR = currentPointPosition.distanceTo( nextLine.children[j+1].position )

		F1 = ( currentPointPosition.clone().sub( currentLine.children[j-1].position ).normalize() ).multiplyScalar( -ks*(dToL-l0Edge)*(1+repulsionFactor/dToL));
		F2 = ( currentPointPosition.clone().sub( currentLine.children[j+1].position ).normalize() ).multiplyScalar( -ks*(dToR-l0Edge)*(1+repulsionFactor/dToR));
		F3 = ( currentPointPosition.clone().sub( nextLine.children[j].position ).normalize() ).multiplyScalar( -ks*(dToT-l0Edge)*(1+repulsionFactor/dToT));
		F4 = ( currentPointPosition.clone().sub( nextLine.children[j-1].position ).normalize() ).multiplyScalar( -ks*(dToTL-l0Diag)*(1+repulsionFactor/dToTL));
		F5 = ( currentPointPosition.clone().sub( nextLine.children[j+1].position ).normalize() ).multiplyScalar( -ks*(dToTR-l0Diag)*(1+repulsionFactor/dToTR));

		F = F1.clone().add(F2).add(F3).add(F4).add(F5);


		a = F.clone().multiplyScalar(1/m).add(new THREE.Vector3(wind*windDirection.x,wind*windDirection.y,wind*windDirection.z-g));

		currentSpeed.addScaledVector(a,deltaT_acc);
	}

	// RIGHT PARTICULE
	currentPointPosition = currentLine.children[width-1].position
	currentSpeed = currentLine.children[width-1].speed

	dToL = currentPointPosition.distanceTo( currentLine.children[width-2].position )
	dToT = currentPointPosition.distanceTo( nextLine.children[width-1].position )
	dToTL = currentPointPosition.distanceTo( nextLine.children[width-2].position )

	F1 = ( currentPointPosition.clone().sub( currentLine.children[width-2].position ).normalize() ).multiplyScalar( -ks*(dToL-l0Edge)*(1+repulsionFactor/dToL));
	F3 = ( currentPointPosition.clone().sub( nextLine.children[width-1].position ).normalize() ).multiplyScalar( -ks*(dToT-l0Edge)*(1+repulsionFactor/dToT));
	F4 = ( currentPointPosition.clone().sub( nextLine.children[width-2].position ).normalize() ).multiplyScalar( -ks*(dToTL-l0Diag)*(1+repulsionFactor/dToTL));

	F = F1.clone().add(F3).add(F4);

	a = F.clone().multiplyScalar(1/m).add(new THREE.Vector3(wind*windDirection.x,wind*windDirection.y,wind*windDirection.z-g));

	currentSpeed.addScaledVector(a,deltaT_acc);

	// FOR EACH CENTRAL LINE

	for (let i=1; i<height-1;i++){

		previousLine = cloth.children[i-1]
		currentLine = cloth.children[i]
		nextLine = cloth.children[i+1]

		// LEFT PARTICULE
		currentPointPosition = currentLine.children[0].position
		currentSpeed = currentLine.children[0].speed

		dToR = currentPointPosition.distanceTo( currentLine.children[1].position )
		dToT = currentPointPosition.distanceTo( nextLine.children[0].position )
		dToTR = currentPointPosition.distanceTo( nextLine.children[1].position )
		dToB = currentPointPosition.distanceTo( previousLine.children[0].position )
		dToBR = currentPointPosition.distanceTo( previousLine.children[1].position )

		F2 = ( currentPointPosition.clone().sub( currentLine.children[1].position ).normalize() ).multiplyScalar( -ks*(dToR-l0Edge)*(1+repulsionFactor/dToR));
		F3 = ( currentPointPosition.clone().sub( nextLine.children[0].position ).normalize() ).multiplyScalar( -ks*(dToT-l0Edge)*(1+repulsionFactor/dToT));
		F5 = ( currentPointPosition.clone().sub( nextLine.children[1].position ).normalize() ).multiplyScalar( -ks*(dToTR-l0Diag)*(1+repulsionFactor/dToTR));
		F6 = ( currentPointPosition.clone().sub( previousLine.children[0].position ).normalize() ).multiplyScalar( -ks*(dToB-l0Edge)*(1+repulsionFactor/dToB));
		F8 = ( currentPointPosition.clone().sub( previousLine.children[1].position ).normalize() ).multiplyScalar( -ks*(dToBR-l0Diag)*(1+repulsionFactor/dToBR));

		F = F2.clone().add(F3).add(F5).add(F6).add(F8);

		a = F.clone().multiplyScalar(1/m).add(new THREE.Vector3(wind*windDirection.x,wind*windDirection.y,wind*windDirection.z-g));

		currentSpeed.addScaledVector(a,deltaT_acc);

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

			F1 = ( currentPointPosition.clone().sub( currentLine.children[j-1].position ).normalize() ).multiplyScalar( -ks*(dToL-l0Edge)*(1+repulsionFactor/dToL));
			F2 = ( currentPointPosition.clone().sub( currentLine.children[j+1].position ).normalize() ).multiplyScalar( -ks*(dToR-l0Edge)*(1+repulsionFactor/dToR));
			F3 = ( currentPointPosition.clone().sub( nextLine.children[j].position ).normalize() ).multiplyScalar( -ks*(dToT-l0Edge)*(1+repulsionFactor/dToT));
			F4 = ( currentPointPosition.clone().sub( nextLine.children[j-1].position ).normalize() ).multiplyScalar( -ks*(dToTL-l0Diag)*(1+repulsionFactor/dToTL));
			F5 = ( currentPointPosition.clone().sub( nextLine.children[j+1].position ).normalize() ).multiplyScalar( -ks*(dToTR-l0Diag)*(1+repulsionFactor/dToTR));
			F6 = ( currentPointPosition.clone().sub( previousLine.children[j].position ).normalize() ).multiplyScalar( -ks*(dToB-l0Edge)*(1+repulsionFactor/dToB));
			F7 = ( currentPointPosition.clone().sub( previousLine.children[j-1].position ).normalize() ).multiplyScalar( -ks*(dToBL-l0Diag)*(1+repulsionFactor/dToBL));
			F8 = ( currentPointPosition.clone().sub( previousLine.children[j+1].position ).normalize() ).multiplyScalar( -ks*(dToBR-l0Diag)*(1+repulsionFactor/dToBR));

			F = F1.clone().add(F2).add(F3).add(F4).add(F5).add(F6).add(F7).add(F8);

			a = F.clone().multiplyScalar(1/m).add(new THREE.Vector3(wind*windDirection.x,wind*windDirection.y,wind*windDirection.z-g));

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

		F1 = ( currentPointPosition.clone().sub( currentLine.children[width-2].position ).normalize() ).multiplyScalar( -ks*(dToL-l0Edge)*(1+repulsionFactor/dToL));
		F3 = ( currentPointPosition.clone().sub( nextLine.children[width-1].position ).normalize() ).multiplyScalar( -ks*(dToT-l0Edge)*(1+repulsionFactor/dToT));
		F4 = ( currentPointPosition.clone().sub( nextLine.children[width-2].position ).normalize() ).multiplyScalar( -ks*(dToTL-l0Diag)*(1+repulsionFactor/dToTL));
		F6 = ( currentPointPosition.clone().sub( previousLine.children[width-1].position ).normalize() ).multiplyScalar( -ks*(dToB-l0Edge)*(1+repulsionFactor/dToB));
		F7 = ( currentPointPosition.clone().sub( previousLine.children[width-2].position ).normalize() ).multiplyScalar( -ks*(dToBL-l0Diag)*(1+repulsionFactor/dToBL));

		F = F1.clone().add(F3).add(F4).add(F6).add(F7);

		a = F.clone().multiplyScalar(1/m).add(new THREE.Vector3(wind*windDirection.x,wind*windDirection.y,wind*windDirection.z-g));

		currentSpeed.addScaledVector(a,deltaT_acc);
	}
	

	// LAST LINE
	currentLine = cloth.children[height-1]
	previousLine = cloth.children[height-2]

	for (let j=1;j<width-1;j++){

		currentPointPosition = currentLine.children[j].position
		currentSpeed = currentLine.children[j].speed

		dToL = currentPointPosition.distanceTo( currentLine.children[j-1].position )
		dToR = currentPointPosition.distanceTo( currentLine.children[j+1].position )
		dToB = currentPointPosition.distanceTo( previousLine.children[j].position )
		dToBL = currentPointPosition.distanceTo( previousLine.children[j-1].position )
		dToBR = currentPointPosition.distanceTo( previousLine.children[j+1].position )

		F1 = ( currentPointPosition.clone().sub( currentLine.children[j-1].position ).normalize() ).multiplyScalar( -ks*(dToL-l0Edge)*(1+repulsionFactor/dToL));
		F2 = ( currentPointPosition.clone().sub( currentLine.children[j+1].position ).normalize() ).multiplyScalar( -ks*(dToR-l0Edge)*(1+repulsionFactor/dToR));
		F6 = ( currentPointPosition.clone().sub( previousLine.children[j].position ).normalize() ).multiplyScalar( -ks*(dToB-l0Edge)*(1+repulsionFactor/dToB));
		F7 = ( currentPointPosition.clone().sub( previousLine.children[j-1].position ).normalize() ).multiplyScalar( -ks*(dToBL-l0Diag)*(1+repulsionFactor/dToBL));
		F8 = ( currentPointPosition.clone().sub( previousLine.children[j+1].position ).normalize() ).multiplyScalar( -ks*(dToBR-l0Diag)*(1+repulsionFactor/dToBR));

		F = F1.clone().add(F2).add(F6).add(F7).add(F8);

		a = F.clone().multiplyScalar(1/m).add(new THREE.Vector3(wind*windDirection.x,wind*windDirection.y,wind*windDirection.z-g));

		currentSpeed.addScaledVector(a,deltaT_acc);
	}

	updatePosition(cloth);
}

function updatePosition(cloth){
	var dToL,dToR,dToT,dToB,dToTL,dToTR,dToBL,dToBR;
	var currentLine, nextLine;
	var currentPointPosition,currentSpeed;
	var height = cloth.children.length
	var width = cloth.children[0].children.length;

	// FIRST LINE 

	currentLine = cloth.children[0]
	nextLine = cloth.children[1]

	// LEFT PARTICULE
	currentPoint = currentLine.children[0];
	currentPointPosition = currentPoint.position.clone().addScaledVector(currentPoint.speed,deltaT_acc);

	dToR = currentPointPosition.distanceTo( currentLine.children[1].position )
	dToT = currentPointPosition.distanceTo( nextLine.children[0].position )
	dToTR = currentPointPosition.distanceTo( nextLine.children[1].position )
	if (l0EdgeMin <= dToR && dToR <= l0EdgeMax && l0EdgeMin <= dToT && dToT <= l0EdgeMax && l0DiagMin <= dToTR && dToTR <= l0DiagMax){
		currentPoint.position.addScaledVector(currentPoint.speed,deltaT_acc);
	}

	// CENTRAL PARTICULES

	for (let j=1;j<width-1;j++){

		currentPoint = currentLine.children[j];
		currentPointPosition = currentPoint.position.clone().addScaledVector(currentPoint.speed,deltaT_acc);

		dToL = currentPointPosition.distanceTo( currentLine.children[j-1].position )
		dToR = currentPointPosition.distanceTo( currentLine.children[j+1].position )
		dToT = currentPointPosition.distanceTo( nextLine.children[j].position )
		dToTL = currentPointPosition.distanceTo( nextLine.children[j-1].position )
		dToTR = currentPointPosition.distanceTo( nextLine.children[j+1].position )

		if (l0EdgeMin <= dToL && dToL <= l0EdgeMax && l0EdgeMin <= dToR && dToR <= l0EdgeMax && l0EdgeMin <= dToT && dToT <= l0EdgeMax){
			if (l0DiagMin <= dToTL && dToTL <= l0DiagMax && l0DiagMin <= dToTR && dToTR <= l0DiagMax){
				currentPoint.position.addScaledVector(currentPoint.speed,deltaT_acc);
			}
		}
	}

	// RIGHT PARTICULE
	currentPoint = currentLine.children[width-1];
	currentPointPosition = currentPoint.position.clone().addScaledVector(currentPoint.speed,deltaT_acc);

	dToL = currentPointPosition.distanceTo( currentLine.children[width-2].position )
	dToT = currentPointPosition.distanceTo( nextLine.children[width-1].position )
	dToTL = currentPointPosition.distanceTo( nextLine.children[width-2].position )
	if (l0EdgeMin <= dToL && dToL <= l0EdgeMax && l0EdgeMin <= dToR  && dToR <= l0EdgeMax){
		currentPoint.position.addScaledVector(currentPoint.speed,deltaT_acc);
	}

	// FOR EACH CENTRAL LINE

	for (let i=1; i<height-1;i++){

		previousLine = cloth.children[i-1]
		currentLine = cloth.children[i]
		nextLine = cloth.children[i+1]

		// LEFT PARTICULE
		currentPoint = currentLine.children[0];
		currentPointPosition = currentPoint.position.clone().addScaledVector(currentPoint.speed,deltaT_acc);

		dToR = currentPointPosition.distanceTo( currentLine.children[1].position )
		dToT = currentPointPosition.distanceTo( nextLine.children[0].position )
		dToTR = currentPointPosition.distanceTo( nextLine.children[1].position )
		dToB = currentPointPosition.distanceTo( previousLine.children[0].position )
		dToBR = currentPointPosition.distanceTo( previousLine.children[1].position )

		if (l0EdgeMin <= dToR && dToR <= l0EdgeMax && l0EdgeMin <= dToT && dToT <= l0EdgeMax && l0EdgeMin <= dToB && dToB <= l0EdgeMax){
			if (l0DiagMin <= dToTR && dToTR <= l0DiagMax && l0DiagMin <= dToBR && dToBR <= l0DiagMax){
				currentPoint.position.addScaledVector(currentPoint.speed,deltaT_acc);
			}
		}

		// ALL CENTER PARTICULES

		for (let j=1;j<width-1;j++){

			currentPoint = currentLine.children[j];
			currentPointPosition = currentPoint.position.clone().addScaledVector(currentPoint.speed,deltaT_acc);

			dToL = currentPointPosition.distanceTo( currentLine.children[j-1].position )
			dToR = currentPointPosition.distanceTo( currentLine.children[j+1].position )
			dToT = currentPointPosition.distanceTo( nextLine.children[j].position )
			dToTL = currentPointPosition.distanceTo( nextLine.children[j-1].position )
			dToTR = currentPointPosition.distanceTo( nextLine.children[j+1].position )
			dToB = currentPointPosition.distanceTo( previousLine.children[j].position )
			dToBL = currentPointPosition.distanceTo( previousLine.children[j-1].position )
			dToBR = currentPointPosition.distanceTo( previousLine.children[j+1].position )

			if (l0EdgeMin <= dToR && dToR <= l0EdgeMax && l0EdgeMin <= dToT && dToT <= l0EdgeMax 
				&& l0EdgeMin <= dToB && dToB <= l0EdgeMax && l0EdgeMin <= dToL && dToL <= l0EdgeMax){
				if (l0DiagMin <= dToTR && dToTR <= l0DiagMax && l0DiagMin <= dToBR && dToBR <= l0DiagMax 
					&& l0DiagMin <= dToTL && dToTL <= l0DiagMax && l0DiagMin <= dToBL && dToBL <= l0DiagMax){
					currentPoint.position.addScaledVector(currentPoint.speed,deltaT_acc);
				}
			}
		}

		// RIGHT PARTICULE
		currentPoint = currentLine.children[width-1];
		currentPointPosition = currentPoint.position.clone().addScaledVector(currentPoint.speed,deltaT_acc);

		dToL = currentPointPosition.distanceTo( currentLine.children[width-2].position )
		dToT = currentPointPosition.distanceTo( nextLine.children[width-1].position )
		dToTL = currentPointPosition.distanceTo( nextLine.children[width-2].position )
		dToB = currentPointPosition.distanceTo( previousLine.children[width-1].position )
		dToBL = currentPointPosition.distanceTo( previousLine.children[width-2].position )

		if (l0EdgeMin <= dToL && dToL <= l0EdgeMax && l0EdgeMin <= dToT && dToT <= l0EdgeMax && l0EdgeMin <= dToB && dToB <= l0EdgeMax){
			if (l0DiagMin <= dToTL && dToTL <= l0DiagMax && l0DiagMin <= dToBL && dToBL <= l0DiagMax){
				currentPoint.position.addScaledVector(currentPoint.speed,deltaT_acc);
			}
		}
	}
	

	// LAST LINE
	currentLine = cloth.children[height-1]
	previousLine = cloth.children[height-2]

	for (let j=1;j<width-1;j++){

		currentPoint = currentLine.children[j];
		currentPointPosition = currentPoint.position.clone().addScaledVector(currentPoint.speed,deltaT_acc);

		dToL = currentPointPosition.distanceTo( currentLine.children[j-1].position )
		dToR = currentPointPosition.distanceTo( currentLine.children[j+1].position )
		dToB = currentPointPosition.distanceTo( previousLine.children[j].position )
		dToBL = currentPointPosition.distanceTo( previousLine.children[j-1].position )
		dToBR = currentPointPosition.distanceTo( previousLine.children[j+1].position )

		if (l0EdgeMin <= dToL && dToL <= l0EdgeMax && l0EdgeMin <= dToR && dToR <= l0EdgeMax && l0EdgeMin <= dToB && dToB <= l0EdgeMax){
			if (l0DiagMin <= dToBL && dToBL <= l0DiagMax && l0DiagMin <= dToBR && dToBR <= l0DiagMax){
				currentPoint.position.addScaledVector(currentPoint.speed,deltaT_acc);
			}
		}
	}

	scene.children[0] = drawMesh(cloth);
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
