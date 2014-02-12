var $j = jQuery.noConflict();

var Renderer = Class.create({
    initialize: function() {
	this.scene = new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
	this.renderer = new THREE.WebGLRenderer({});
	this.renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(this.renderer.domElement);

	//var controls = new THREE.OrbitControls(this.camera);
	//controls.addEventListener("change", this.render);

	var ambient = new THREE.AmbientLight(0x301010);
	this.scene.add(ambient);

        var directionalLight = new THREE.DirectionalLight( 0xffeedd );
        directionalLight.position.set( 0.5, 0.7, 1 ).normalize();
        this.scene.add( directionalLight );

	this.camera.position.z = -5;

	/* Load a heart shape */

	var self = this;
	this.loadingMgr = new THREE.LoadingManager();
	//this.loadObj("heart");
    },

    setupOrbitControls: function() {
	var controls = new THREE.OrbitControls(this.camera);
	controls.addEventListener("change", this.render);
	this.controls = controls;
    },

    loadObj: function(name, cb) {
	var self = this;
	var loader = new THREE.OBJMTLLoader();
	loader.load(name+".obj", name+".mtl", function(obj) {
            obj.traverse( function( node ) {
                if( node.material ) {
                    node.material.side = THREE.DoubleSide;
                    node.material.shading = THREE.FlatShading;
                    /*if (options.shadeSmooth) {
                        node.material.shading = THREE.SmoothShading;
                    }*/
                }
                if (node.geometry) {
                    node.geometry.computeVertexNormals();
                }
            });
	    //self.scene.add(obj);
	    if (cb) cb(obj);
	    else self.scene.add(obj);
	});
    },

    render: function() {
	if (this.renderer === undefined) return;
	this.renderer.render(this.scene, this.camera);
    }
});

function printvec(v) {
    return "{"+v.x+", "+v.y+", "+v.z+"}";
}

var Path = Class.create({
    initialize: function(renderer) {
	this.renderer = renderer;
	this.model = null;
	this.has_entered_last = false; // Have they gone near the last one?
	var self = this;
	this.renderer.loadObj("heart-outline", function(obj) {
            obj.traverse( function( node ) {
                if( node.material ) {
                    //node.material.side = THREE.DoubleSide;
                    //node.material.shading = THREE.FlatShading;
		    node.material = new THREE.MeshBasicMaterial({wireframe:true});
                }
            });
	    //renderer.scene.add(obj);
	    console.log("Loaded model");
	    self.model = obj;
	});
    },

    setPath: function(points) {
	var self = this;
	//console.log(self.model);
	if (self.model === null) {
	    setTimeout(function() { self.setPath(points); }, 100);
	}
	for (var i=0; i<points.length; i++) {
	    var p = points[i];
	    var obj = self.model.clone();//new THREE.Object3D();
	    //obj.add(self.model);
	    obj.position.copy(p.pos);

	    if (i > 0 && i+1<points.length) {
		var at = points[i+1].pos.clone().sub(points[i-1].pos).add(points[i].pos);
		//at = new THREE.Vector3(1,1,1);
		console.log("At: "+printvec(at)+" from "+printvec(points[i-1].pos)+" to "+printvec(points[i+1].pos));
		obj.lookAt(at);
	    }

	    this.renderer.scene.add(obj);
	}
	self.points = points;
    },

    update: function(dt, player_pos) {
	// Check to see if they've finished
	/*if (player_pos.z > 40.0) {
	    console.log("They're done!");
	    return true;
	}*/

	// Check the distance to the last one
	var last_dist = player_pos.distanceTo(this.points[this.points.length-1].pos);
	if (!this.has_entered_last) {
	    if (last_dist < 5.0) {
		this.has_entered_last = true;
	    }
	} else {
	    if (last_dist > 6.0) {
		return true;
	    }
	}

	// Check the distance to all points, make sure we're at least *near* points
	for (var i=0; i<this.points.length; i++) {
	    var dist = player_pos.distanceTo(this.points[i].pos);
	    if (dist < 100.0) break;
	}
	if (i == this.points.length) return true;
	return false;
    }
});

var Plane = Class.create({
    initialize: function(renderer) {
	this.renderer = renderer;
	this.renderer.loadObj("plane", function(obj) {
	    obj.name = "plane";
	    renderer.scene.add(obj);
	});

	this.heart = null;
	var self = this;
	this.renderer.loadObj("heart", function(obj) {
	    var m = new THREE.Matrix4();
	    m.makeScale(0.25,0.25,0.25);
	    obj.applyMatrix(m);
	    self.heart = obj;
	});

	this.trailcount = 0;
	this.trailcountdown = 0.25;

	this.log_trail = [];
	this.log_countdown = 0.25;

	this.roll = 0.0;
	this.elevator = 0.0;
	this.yaw = 0.0;

	this.vel = new THREE.Vector3(0,0,60);
    },

    getPos: function() {
	return this.renderer.scene.getObjectByName("plane").position.clone();
    },

    setPos: function(v) {
	this.renderer.scene.getObjectByName("plane").position.copy(v);
    },

    setAt: function(at) {
	var m = new THREE.Matrix4();
	m.lookAt(this.getPos(), at, new THREE.Vector3(0,1,0));
	//m.setPosition(this.getPos());
	this.getObj().applyMatrix(m);
	console.log(this.getObj().matrix);
	//this.getObj().updateMatrixWorld();
    },

    getObj: function() {
	return this.renderer.scene.getObjectByName("plane");
    },

    applyRoll: function(amt) {
	this.roll += amt;
    },

    applyYaw: function(amt) {
	this.yaw += amt;
    },

    applyElevator: function(amt) {
	this.elevator += amt;
    },

    getTrailLog: function() {
	return this.log_trail;
    },

    update: function(dt) {
	if (this.renderer.scene.getObjectByName("plane") === undefined) return;
	if (this.heart === null) return;

	this.trailcountdown -= dt;
	if (this.trailcountdown < 0) {
	    this.trailcountdown = 1.0;
	    var obj = this.heart.clone();
	    //obj.position.copy(this.getPos());
	    obj.applyMatrix(this.getObj().matrix);
	    this.renderer.scene.add(obj);
	}

	this.log_countdown -= dt;
	if (this.log_countdown < 0) {
	    this.log_trail.push(this.getPos().clone());
	}

	var m = new THREE.Matrix4();
	//m.makeRotationX(this.elevator*dt);
	this.getObj().rotateOnAxis(new THREE.Vector3(1,0,0), -this.elevator*dt);
	this.getObj().rotateOnAxis(new THREE.Vector3(0,0,1), this.roll*dt);
	this.getObj().rotateOnAxis(new THREE.Vector3(0,1,0), this.yaw*dt);
	//this.getObj().matrix.extractRotation(m)
	m.extractRotation(this.getObj().matrix);
	var global_vel = this.vel.clone().applyMatrix4(m);
//.localToWorld(this.vel).clone().sub(this.getObj().position);
	//console.log(global_vel);

	this.elevator = 0.0;
	this.roll = 0.0;
	this.yaw = 0.0;

	this.setPos(this.getPos().add(global_vel.clone().multiplyScalar(dt)));

	var offset = new THREE.Vector3(0,2,-20);
	offset.applyMatrix4(m);
	offset.add(this.getPos());
	//offset = this.getObj().localToWorld(offset);
	var at = new THREE.Vector3(0,2,100);
	at.applyMatrix4(m);//this.getObj().localToWorld(at);
	at.add(this.getPos());
	this.renderer.camera.lookAt(at);
	//this.renderer.camera.matrixWorld.extractRotation(m);
	//this.renderer.camera.updateMatrixWorld();
	this.renderer.camera.position.copy(offset);
    }
});

var FlightControls = Class.create({
    initialize: function(plane) {
	this.plane = plane;
	this.downkeys = [];
	var self = this;
	$j("body").keydown(function(e) {
	    if (self.downkeys.indexOf(e.keyCode) !== -1) return;
	    self.downkeys.push(e.keyCode);
	});
	$j("body").keyup(function(e) {
	    self.downkeys.splice(self.downkeys.indexOf(e.keyCode), 1);
	});

	this.ELEVATE_UP_KEY = 83; // S
	this.ELEVATE_DOWN_KEY = 87; // W
	this.ROLL_LEFT_KEY = 65; // A
	this.ROLL_RIGHT_KEY = 68; // D
	this.YAW_LEFT_KEY = 90; // Z
	this.YAW_RIGHT_KEY = 88; // X
    },

    update: function(dt) {
	if (this.downkeys.indexOf(this.ROLL_LEFT_KEY) !== -1)
	    this.plane.applyRoll(-2.0);
	if (this.downkeys.indexOf(this.ROLL_RIGHT_KEY) !== -1)
	    this.plane.applyRoll(2.0);
	if (this.downkeys.indexOf(this.YAW_LEFT_KEY) !== -1)
	    this.plane.applyYaw(2.0);
	if (this.downkeys.indexOf(this.YAW_RIGHT_KEY) !== -1)
	    this.plane.applyYaw(-2.0);
	if (this.downkeys.indexOf(this.ELEVATE_UP_KEY) !== -1)
	    this.plane.applyElevator(1.0);
	if (this.downkeys.indexOf(this.ELEVATE_DOWN_KEY) !== -1)
	    this.plane.applyElevator(-1.0);
    }
});

$j(function() {
    console.log("Ready to roll");

    var renderer = new Renderer();
    var path = new Path(renderer);
    var plane = new Plane(renderer);
    var flightcontrols = new FlightControls(plane);
    setTimeout(function() { // TODO: Make this "on loaded"
	points = [];
	var s = "lane"; // TODO: Make this configurable
	var dp = new THREE.Vector3(0,0,0);
	for (var j=0; j<s.length; j++) {
	    for (var i=0; i<letter_Definitions[s.charAt(j)].length; i++) {
		p = letter_Definitions[s.charAt(j)][i];
		var v = new THREE.Vector3(p.z,-p.y,-p.x);
		v.add(dp);
		points.push({pos: v});
	    }
	    dp.copy(points[points.length-1].pos);
	    console.log(dp);
	}
	path.setPath(points);
	//path.setPath([{pos:new THREE.Vector3(0,0,10)}, {pos:new THREE.Vector3(0,0,20)}, {pos:new THREE.Vector3(0,0,30)}]);

	// Configure the aeroplane with the starting location
	plane.setPos(points[0].pos.clone());
	var at = points[0].pos.clone().sub(points[1].pos);
	console.log("At vector:");
	console.log(at);
	plane.setAt(at);

	var has_finished = false;
	var start_tm = new Date();
	start_tm = start_tm.getTime();
	function render() {
	    if (plane.getObj() === undefined) {
		setTimeout(render, 20);
		return;
	    }
	    if (has_finished === false) {
		flightcontrols.update(0.02);
		plane.update(0.02);
		if (path.update(0.02, plane.getPos()) === true) {
		    renderer.setupOrbitControls();
		    has_finished = true;

		    var total_tm = new Date();
		    total_tm = total_tm.getTime() - start_tm;
		    alert("Total time: "+total_tm);
		    if (confirm("Do you want to make a picture?")) {
			function gotImageURL(img_url) {
			    //alert("Got: "+msg);
			    var source = $j("#email-dialog-tpl").html();
			    var template = Handlebars.compile(source);
			    var ctx = {url: img_url, time: total_tm/1000};
			    var s = template(ctx);
			    renderer.controls.enabled = false;
			    $j("body").append(s);
			    $j("#email-dialog").dialog({
				width: 600,
				height: 600,
				resizeable: false
			    });
			    $j("#send-email").click(function() {
				var d = {};
				d.to_email = prompt("To what email address?");
				d.img_hash = img_url;
				d.time = total_tm/1000.0;
				d.fullname = prompt("What is your name (to sign the message)?");
				d.toname = prompt("What name should the message be to?");
				$j.ajax({type: "POST",
					 url: "http://localhost:1415/email",
					 processData: false,
					 data: JSON.stringify(d)});
			    });
			}
			$j.ajax({ type: "POST",
				  url: "http://localhost:1415/image",
				  processData: false,
				  data: JSON.stringify({points: plane.getTrailLog()})
				}).done(function(msg) {
				    gotImageURL(msg);
				});
		    }
		}
	    }
	    renderer.render();
	    setTimeout(render, 20);
	}
	render();
    }, 1000);
});
