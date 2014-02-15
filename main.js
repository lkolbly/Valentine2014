var $j = jQuery.noConflict();

var SERVER_HOSTNAME = "pillow.rscheme.org";
var SERVER_PORT = "1414";

function formatSeconds(seconds) {
    var timer = seconds;
    minutes = Math.floor(timer / 60);
    if (minutes < 10) minutes = "0"+minutes;
    seconds = Math.floor(timer - minutes*60);
    if (seconds < 10) seconds = "0"+seconds;
    hundreths = Math.floor((timer - minutes*60 - seconds)*1000);
    //if (hundreths < 1) hundreths = "000"+hundreths;
    if (hundreths < 10) hundreths = "00"+hundreths;
    else if (hundreths < 100) hundreths = "0"+hundreths;
    return ""+minutes+":"+seconds+":"+hundreths;
}

var Renderer = Class.create({
    initialize: function() {
	this.scene = new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1.0, 10000);
	this.renderer = new THREE.WebGLRenderer({});
	this.renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(this.renderer.domElement);

	//var controls = new THREE.OrbitControls(this.camera);
	//controls.addEventListener("change", this.render);

	var ambient = new THREE.AmbientLight(0x301010);
	this.scene.add(ambient);

        var directionalLight = new THREE.DirectionalLight( 0xffeeee );
        directionalLight.position.set( 0.5, 0.7, 1 ).normalize();
        this.scene.add( directionalLight );

        var directionalLight = new THREE.DirectionalLight( 0xffeeee );
        directionalLight.position.set( 0.5, 0.7, -1 ).normalize();
        this.scene.add( directionalLight );

        var directionalLight = new THREE.DirectionalLight( 0xffeeee );
        directionalLight.position.set( -0.5, -0.7, -1 ).normalize();
        this.scene.add( directionalLight );

	this.camera.position.z = -5;

	/* Load a heart shape */

	var self = this;
	this.loadingMgr = new THREE.LoadingManager();
	//this.loadObj("heart");

	this.was_paused = false;
	//this.timer = 0.0;

	var s = "<div id='timer' style='position:fixed;top:0;right:0;color:white;font-size:18px'></div>";
	$j("body").append(s);
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

    loadX3D: function(name, cb) {
	var self = this;
	var loader = new THREE.X3DLoader();
	loader.load(name+".x3d", function(obj) {
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

    render: function(dt, paused, timer) {
	if (paused===true && this.was_paused===false) {
	    var source = $j("#pause-overlay-tpl").html();
	    var template = Handlebars.compile(source);
	    $j("body").append(template());
	} else if (paused===false && this.was_paused===false) {
	    $j("#pause-overlay").remove();
	}
	this.was_paused = paused;

	//console.log(timer);
	/*minutes = Math.floor(timer / 60);
	if (minutes < 10) minutes = "0"+minutes;
	seconds = Math.floor(timer - minutes*60);
	if (seconds < 10) seconds = "0"+seconds;
	hundreths = Math.floor((timer - minutes*60 - seconds)*100);
	if (hundreths < 10) hundreths = "0"+hundreths;
	else if (hundreths < 100) hundreths = ""+hundreths;
	$j("#timer").html(""+minutes+":"+seconds+":"+hundreths);*/
	$j("#timer").html(formatSeconds(timer));

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

	this.next_point = null;

	var self = this;
	this.renderer.loadObj("heart-outline", function(obj) {
            obj.traverse( function( node ) {
                if( node.material ) {
                    //node.material.side = THREE.DoubleSide;
                    //node.material.shading = THREE.FlatShading;
		    node.material = new THREE.MeshBasicMaterial({wireframe:true, color:"#ff0000"});
                }
            });
	    //renderer.scene.add(obj);
	    console.log("Loaded model");
	    self.model = obj;
	});
    },

    nextPointPos: function() {
	return this.points[this.next_point].pos.clone();
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
	    obj.scale.copy(new THREE.Vector3(10,10,10));

	    if (i > 0 && i+1<points.length) {
		var at = points[i+1].pos.clone().sub(points[i-1].pos).add(points[i].pos);
		//at = new THREE.Vector3(1,1,1);
		console.log("At: "+printvec(at)+" from "+printvec(points[i-1].pos)+" to "+printvec(points[i+1].pos));
		obj.lookAt(at);
	    } else if (i === 0) {
		var at = points[i+1].pos.clone();
		obj.lookAt(at);
	    } else if (i === points.length-1) {
		var at = points[i-1].pos.clone();
		obj.lookAt(at);
	    }

	    this.renderer.scene.add(obj);
	}
	self.points = points;
	this.next_point = 0;
    },

    update: function(dt, player_pos) {
	// Check to see if they've finished
	/*if (player_pos.z > 40.0) {
	  console.log("They're done!");
	  return true;
	  }*/

	// See where the next point is
	if (player_pos.distanceTo(this.nextPointPos()) < 60.0) {
	    this.next_point++;
	    if (this.next_point >= this.points.length) {
		this.next_point = 0;
	    }
	} else {
	    // Let's check all of the remaining points, maybe the player jumped
	    // ahead.
	    for (var i=this.next_point; i<this.next_point+5; i++) {
		if (i < this.points.length) {
		    if (player_pos.distanceTo(this.points[i].pos) < 60.0) {
			this.next_point = i;
			break;
		    }
		}
	    }
	}

	// Check the distance to the last one
	var last_dist = player_pos.distanceTo(this.points[this.points.length-1].pos);
	if (!this.has_entered_last) {
	    if (last_dist < 50.0) {
		this.has_entered_last = true;
	    }
	} else {
	    if (last_dist > 60.0) {
		return true;
	    }
	}

	// Check the distance to all points, make sure we're at least *near* points
	for (var i=0; i<this.points.length; i++) {
	    var dist = player_pos.distanceTo(this.points[i].pos);
	    if (dist < 1000.0) break;
	}
	if (i == this.points.length) return true;
	return false;
    }
});

// Recursive!
function getChildByName(obj, name) {
    var kids = obj.getDescendants();
    for (var i=0; i<kids.length; i++) {
	if (kids[i].name === name) {
	    return kids[i];
	}
    }
}

var Plane = Class.create({
    initialize: function(renderer, path) {
	this.path = path;
	this.renderer = renderer;
	this.renderer.loadX3D("plane", function(obj) {
	    obj.name = "plane";
	    renderer.scene.add(obj);

	    getChildByName(obj, "airbrake_ifs_TRANSFORM").parent.rotateOnAxis(new THREE.Vector3(1,0,0), -0.5);
	});

	this.heart = null;
	var self = this;
	this.renderer.loadObj("heart", function(obj) {
	    var m = new THREE.Matrix4();
	    m.makeScale(0.25,0.25,0.25);
	    obj.applyMatrix(m);
	    self.heart = obj;
	});

	this.cone = null;
	this.renderer.loadObj("cone", function(obj) {
	    var m = new THREE.Matrix4();
	    //m.makeScale(0.25,0.25,0.25);
	    obj.applyMatrix(m);
	    self.cone = obj;
	    self.cone.name = "direction_cone";
	    renderer.scene.add(self.cone);
	});

	this.trailcount = 0;
	this.trailcountdown = 0.25;

	this.log_trail = [];
	this.log_countdown = 0.25;

	this.roll = 0.0;
	this.elevator = 0.0;
	this.yaw = 0.0;
	this.throttle = 0.0;

	this.vel = new THREE.Vector3(0,0,60);
	this.airbrake_pos = 0.0;

	this.MIN_THROTTLE = 30.0;
	this.MAX_THROTTLE = 240.0;
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

    applyThrottle: function(amt) {
	this.throttle += amt;
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

	if (this.vel.length() > this.MAX_THROTTLE)
	    this.throttle = Math.min(this.throttle, 0.0);
	if (this.vel.length() < this.MIN_THROTTLE)
	    this.throttle = Math.max(this.throttle, 0.0);
	this.vel.multiplyScalar(1.0+this.throttle*1.0*dt);

	//console.log(this.getObj().children[0].getObjectById("exhaust_ifs_TRANSFORM"));
	//console.log(getChildByName(this.getObj(), "exhaust_ifs_TRANSFORM"));
	//debugger;
	var s = this.vel.length() / 60.0;
	getChildByName(this.getObj(), "exhaust_ifs_TRANSFORM").scale.copy(new THREE.Vector3(1-Math.pow(0.5,s),1-Math.pow(0.5,s),s));
	//console.log(s);

	var d_airbrake = 0.0;
	if (this.throttle < -0.01) {
	    if (this.airbrake_pos > -0.3) {
		d_airbrake += this.throttle*dt;
	    }
	} else if (this.throttle*this.throttle < 0.1) {
	    if (dt*dt > this.airbrake_pos*this.airbrake_pos) {
		d_airbrake = -this.airbrake_pos;
	    } else {
		d_airbrake += (this.airbrake_pos<0)?dt:-dt;
	    }
	}
	//console.log(this.airbrake_pos+" "+d_airbrake+" "+this.throttle);
	this.airbrake_pos += d_airbrake;
	getChildByName(this.getObj(), "airbrake_ifs_TRANSFORM").parent.rotateOnAxis(new THREE.Vector3(1,0,0), -d_airbrake);

	this.throttle = 0.0;
	//this.getObj().matrix.extractRotation(m)
	m.extractRotation(this.getObj().matrix);
	var global_vel = this.vel.clone().applyMatrix4(m);
	//.localToWorld(this.vel).clone().sub(this.getObj().position);
	//console.log(global_vel);

	//this.elevator = 0.0;
	this.elevator += -this.elevator*dt*5.0;
	this.roll += -this.roll*dt*7.0;
	this.yaw += -this.yaw*dt*5.0;
	//this.roll = 0.0;
	//this.yaw = 0.0;

	this.setPos(this.getPos().add(global_vel.clone().multiplyScalar(dt)));

	var offset = new THREE.Vector3(0,2,-20);
	offset.applyMatrix4(m);
	offset.add(this.getPos());
	//offset = this.getObj().localToWorld(offset);
	var at = new THREE.Vector3(0,2,100);
	at.applyMatrix4(m);//this.getObj().localToWorld(at);
	at.add(this.getPos());
	this.renderer.camera.position.copy(offset);
	this.renderer.camera.lookAt(at);
	this.renderer.camera.updateMatrixWorld();
	//this.renderer.camera.matrixWorld.extractRotation(m);
	//this.renderer.camera.updateMatrixWorld();

	offset = this.renderer.camera.localToWorld(new THREE.Vector3(0,2,-10));
	this.renderer.scene.getObjectByName("direction_cone").position.copy(offset);
	this.renderer.scene.getObjectByName("direction_cone").lookAt(this.path.nextPointPos());
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
	    if (e.keyCode === self.PAUSE_KEY) {
		self.is_paused = !self.is_paused;
	    }
	});

	this.ELEVATE_UP_KEY = 83; // S
	this.ELEVATE_DOWN_KEY = 87; // W
	this.ROLL_LEFT_KEY = 65; // A
	this.ROLL_RIGHT_KEY = 68; // D
	this.YAW_LEFT_KEY = 90; // Z
	this.YAW_RIGHT_KEY = 88; // X
	this.THROTTLE_UP_KEY = 82; // R
	this.THROTTLE_DOWN_KEY = 70; // F
	this.PAUSE_KEY = 80; // P

	this.is_paused = false;
    },

    update: function(dt) {
	if (this.downkeys.indexOf(this.ROLL_LEFT_KEY) !== -1)
	    this.plane.applyRoll(-15.0*dt);
	if (this.downkeys.indexOf(this.ROLL_RIGHT_KEY) !== -1)
	    this.plane.applyRoll(15.0*dt);
	if (this.downkeys.indexOf(this.YAW_LEFT_KEY) !== -1)
	    this.plane.applyYaw(3.0*dt);
	if (this.downkeys.indexOf(this.YAW_RIGHT_KEY) !== -1)
	    this.plane.applyYaw(-3.0*dt);
	if (this.downkeys.indexOf(this.ELEVATE_UP_KEY) !== -1)
	    this.plane.applyElevator(6.0*dt);
	if (this.downkeys.indexOf(this.ELEVATE_DOWN_KEY) !== -1)
	    this.plane.applyElevator(-6.0*dt);
	if (this.downkeys.indexOf(this.THROTTLE_DOWN_KEY) !== -1)
	    this.plane.applyThrottle(-1.0);
	if (this.downkeys.indexOf(this.THROTTLE_UP_KEY) !== -1)
	    this.plane.applyThrottle(1.0);
    }
});

// success gets passed the 1-time token to pass to the server as proof
function pillow_require_captcha(n, success, fail) {
    $j.ajax({
	url: "http://pillow.rscheme.org/captcha/captcha.php?n="+n
    }).done(function(token) {
	var s = "<div id='pillow-captcha-popup'>Check the cats:";
	s += "<table>";
	for (var i=0; i<n; i++) {
	    s += "<tr><td><input type='checkbox' id='pillow-captcha-check-"+i+"'/></td>";
	    s += "<td><img src='http://pillow.rscheme.org/captcha/captcha-image.php?token="+token+"&n="+i+"' width='128px' height='128px'/></td></tr>";
	}
	s += "</table>";
	s += "<button id='pillow-captcha-submit'>Submit!</button>";
	s += "</div>";
	$j("body").append(s);
	$j("#pillow-captcha-popup").dialog();
	$j("#pillow-captcha-submit").click(function() {
	    var guess = "";
	    for (var i=0; i<n; i++) {
		if ($j("#pillow-captcha-check-"+i).is(":checked")) {
		    guess += "c";
		} else {
		    guess += "d";
		}
	    }
	    $j.ajax({
		url: "http://pillow.rscheme.org/captcha/submit.php?token="+token+"&answer="+guess
	    }).done(function(msg) {
		$j("#pillow-captcha-popup").dialog("close");
		$j("#pillow-captcha-popup").remove();
		if (msg === "yes") {
		    if (success) success(token);
		} else {
		    if (fail) fail();
		}
	    });
	});
    });
}

function startGame(chosen_name) {
    console.log("Ready to roll");

    var renderer = new Renderer();
    var path = new Path(renderer);
    var plane = new Plane(renderer, path);
    var flightcontrols = new FlightControls(plane);
    function onLoad() {
	points = [];
	var debug_pnts = [];
	var s = chosen_name;
	var dp = new THREE.Vector3(0,0,0);
	for (var j=0; j<s.length; j++) {
	    var i=0;
	    if (j > 0) i = 1;
	    for (; i<letter_Definitions[s.charAt(j)].length; i++) {
		p = letter_Definitions[s.charAt(j)][i];
		var v = new THREE.Vector3(10*p.z,-p.y*10,-p.x*10);
		v.add(dp);
		points.push({pos: v});
		debug_pnts.push(v);
	    }
	    dp.copy(points[points.length-1].pos);
	    console.log(dp);
	}

	for (var i=1; i<letter_Definitions.heart.length; i++) {
	    p = letter_Definitions.heart[i];
	    var v = new THREE.Vector3(10*p.z,-p.y*10,-p.x*10);
	    v.multiplyScalar(s.length/6);
	    v.add(dp);
	    points.push({pos: v});
	    debug_pnts.push(v);
	}
	dp.copy(points[points.length-1].pos);
	console.log(dp);

	path.setPath(points);
	//path.setPath([{pos:new THREE.Vector3(0,0,10)}, {pos:new THREE.Vector3(0,0,20)}, {pos:new THREE.Vector3(0,0,30)}]);

	// Configure the aeroplane with the starting location
	plane.setPos(points[0].pos.clone());
	var at = points[0].pos.clone().sub(points[1].pos);
	console.log("At vector:");
	console.log(at);
	plane.setAt(at);

	function gotImageURL(img_url, total_tm) {
	    //alert("Got: "+msg);
	    var source = $j("#email-dialog-tpl").html();
	    var template = Handlebars.compile(source);
	    var ctx = {url: img_url, time: formatSeconds(total_tm)};
	    var s = template(ctx);
	    $j("body").append(s);
	    $j("#email-dialog").dialog({
		width: 600,
		height: 600,
		resizeable: false
	    });
	    $j("#send-email").click(function() {
		function captcha_success(token) {
		    var source = $j("#send-email-tpl").html();
		    var template = Handlebars.compile(source);
		    var s = template();
		    $j("body").append(s);
		    $j("#send-email-dialog").dialog({
			width: 500
		    });
		    $j("#send-email-submit").click(function() {
			var d = {};
			d.captcha_token = token;
			d.to_email = $j("#email-address").val();//prompt("To what email address?");
			d.img_hash = img_url;
			d.time = formatSeconds(total_tm);
			d.fullname = $j("#fromname").val();//prompt("What is your name (to sign the message)?");
			d.toname = $j("#toname").val();//prompt("What name should the message be to?");
			d.message = $j("#message").val();
			$j.ajax({type: "POST",
				 url: "http://"+SERVER_HOSTNAME+":"+SERVER_PORT+"/email",
				 processData: false,
				 data: JSON.stringify(d)});

			$j("#send-email-dialog").remove();
		    });
		}
		function captcha_error() {
		    pillow_require_captcha(4, captcha_success,
					   captcha_error);
		}
		pillow_require_captcha(4, captcha_success,
				       captcha_error);
	    });
	}

	// To test our setup, uncomment this
	/*$j.ajax({ type: "POST",
	  url: "http://localhost:1415/image",
	  processData: false,
	  data: JSON.stringify({points: debug_pnts})
	  }).done(function(msg) {
	  gotImageURL(msg, 360000.0);
	  });
	  return;*/

	function getTime() {
	    var d = new Date();
	    return d.getTime();
	}

	var has_finished = false;
	var start_tm = getTime();
	var dt = 0.02;
	var last_tm = getTime();
	var total_tm = 0.0;
	function render() {
	    if (plane.getObj() === undefined) {
		setTimeout(render, 20);
		return;
	    }

	    //console.log(getTime()-last_tm);
	    dt = (getTime()-last_tm)/1000.0;
	    last_tm = getTime();
	    //console.log(total_tm+" "+dt);

	    if (flightcontrols.is_paused === false) {

	    if (has_finished === false) {
		total_tm += dt;
		flightcontrols.update(dt);
		plane.update(dt);
		if (path.update(dt, plane.getPos()) === true) {
		    renderer.setupOrbitControls();
		    has_finished = true;

		    renderer.controls.enabled = false;
		    //var total_tm = new Date();
		    //total_tm = total_tm.getTime() - start_tm;
		    if (true) {//confirm("Do you want to make a picture?")) {
			$j.ajax({ type: "POST",
				  url: "http://"+SERVER_HOSTNAME+":"+SERVER_PORT+"/image",
				  processData: false,
				  data: JSON.stringify({points: plane.getTrailLog()})
				}).done(function(msg) {
				    $j("#loading-spinner").hide();
				    gotImageURL(msg, total_tm);
				}).fail(function() {
				    alert("There was an error connecting to the main server >:(");
				});
		    }
		    alert("You finished in: "+formatSeconds(total_tm)+" seconds!");
		    $j("canvas").hide();
		    $j("#loading-spinner").show();
		}
	    }
	    }
	    renderer.render(dt, flightcontrols.is_paused, total_tm);
	    setTimeout(render, 20);
	}
	render();
    }

    var source = $j("#loading-screen-tpl").html();
    var template = Handlebars.compile(source);
    var s = template();
    $j("body").append(s);

    var opts = {
	lines: 11, // The number of lines to draw
	length: 0, // The length of each line
	width: 13, // The line thickness
	radius: 30, // The radius of the inner circle
	corners: 1, // Corner roundness (0..1)
	rotate: 0, // The rotation offset
	direction: 1, // 1: clockwise, -1: counterclockwise
	color: '#fff', // #rgb or #rrggbb or array of colors
	speed: 0.8, // Rounds per second
	trail: 50, // Afterglow percentage
	shadow: false, // Whether to render a shadow
	hwaccel: false, // Whether to use hardware acceleration
	className: 'spinner', // The CSS class to assign to the spinner
	zIndex: 2e9, // The z-index (defaults to 2000000000)
	top: 'auto', // Top position relative to parent in px
	left: 'auto' // Left position relative to parent in px
    };
    var target = document.getElementById('loading-spinner');
    var spinner = new Spinner(opts).spin(target);

    function checkLoaded() {
	// Check to see if we've loaded
	var has_loaded = true;
	console.log("Checking for loaded...");
	if (path.model === null) has_loaded = false;
	if (plane.heart === null) has_loaded = false;
	if (plane.cone === null) has_loaded = false;
	if (plane.getObj() === undefined) has_loaded = false;
	//has_loaded = false;

	if (has_loaded === true) {
	    $j("#loading-spinner").hide();
	    onLoad();
	} else {
	    setTimeout(checkLoaded, 100);
	}
    }

    setTimeout(checkLoaded, 100);
}

$j(function() {
    /*pillow_require_captcha(4, function(token) {
      alert("success: "+token);
      }, function() {
      alert("failure");
      });
      return;*/

    var chosen_name = "";

    function showPage(n) {
	var source = $j("#welcome-page-"+n).html();
	if (source === undefined) {
	    // Go for gold
	    $j("body").html("");

	    if (!Detector.webgl) {
		alert("Your browser doesn't support WebGL!");
		window.location = "http://get.webgl.com/";
		return;
	    }

	    startGame(chosen_name);
	    return;
	}
	var template = Handlebars.compile(source);
	var ctx = {};
	var s = template(ctx);
	$j("#content").html(s);
	$j("#back").off("click");
	$j("#next").off("click");
	$j("#goto").off("click");

	if ($j("#welcome-page-"+(n+1)).html() === undefined) {
	    $j("#goto").remove();
	    $j("#next").html("Play");
	} else {
	    $j("#goto").click(function(e) {
		console.log(e.target.attributes.getNamedItem("n"));
		showPage(e.target.attributes.getNamedItem("n").value);
	    });
	}
	$j("#back").click(function() {
	    if (n-1 < 0)
		showPage(0);
	    else
		showPage(n-1);
	});
	$j("#next").click(function() {
	    var inp = $j("#name-input");
	    if (inp.val() !== undefined) {
		chosen_name = inp.val();

		function validate(name) {
		    var is_valid = true;
		    var valid_letters = "abcdefghijklmnopqrstuvwxyz";
		    name = name.toLowerCase();
		    //console.log(chosen_name);
		    if (name.length === 0) is_valid = false;
		    for (var i=0; i<name.length; i++) {
			if (valid_letters.indexOf(name.charAt(i)) === -1) {
			    is_valid = false; break;
			}
		    }
		    return is_valid;
		}

		if (validate(chosen_name) === false) {
		    alert("'"+chosen_name+"' is not valid");
		    showPage(n);
		    return;
		}

		// Validate the name...
		/*while (validate(chosen_name) === false) {
		  console.log(chosen_name);
		  chosen_name = prompt("Warning: '"+chosen_name+"' is not valid");
		  }*/
		//showPage(n);
		//has_error = true;
		//return;
	    }

	    showPage(n+1);
	});
    }

    var source = $j("#welcome-page").html();
    var template = Handlebars.compile(source);
    $j("body").html(template());
    showPage(1);

    return;
});
