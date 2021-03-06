var canvas;
var main_loop;
var GRID_SIZE = 50;
var GRID_W = 24;
var GRID_H = 12;

var aqueduct_supply = 20;
var random_pieces_range = 4;
var level =1;
var initialized = false;
var level_over = false;
var water_source;
var goal_city;
var random_maps = true;

var DIRS = {
    'right': 0,
    'down': 1,
    'left': 2,
    'up': 3
};

var keys = {};

var music;

function adjust_supply (amount) {
    aqueduct_supply += amount;
    display_supply();
}

function display_supply () {
	$("#supply").text (aqueduct_supply);
}

function victory () {
    game_messages.push (new Game_Msg ("Level Complete!  Click to Continue!", "rgb(255, 0, 0)"));
    level +=1;
    level_over = true;
}

function loss (){
    game_messages.push (new Game_Msg ("You lose! Click to continue!", "rgb(255, 0,0)"));
    level=1;
    level_over = true;
}

Grid_Object.prototype = new Game_Object;
function Grid_Object (x, y, dir, image, xspan, yspan) {
    Game_Object.call (this, image, 1, 0, 0, DIRS[dir] * Math.PI / 2, "rect");
    this.grid_x = x;
    this.grid_y = y;
    this.dir = dir;
    if (typeof(xspan) == "undefined") {
	this.xspan = 1;
    } else {
	this.xspan = xspan;
    }
    if (typeof(yspan) == "undefined") {
	this.yspan = 1;
    } else {
	this.yspan = yspan;
    }
    this.width = this.xspan * GRID_SIZE;
    this.height = this.yspan * GRID_SIZE;
    this.update_pos ();
}
Grid_Object.prototype.update_pos =
    function () {
	this.x = this.grid_x * GRID_SIZE + this.xspan * GRID_SIZE / 2;
	this.y = this.grid_y * GRID_SIZE + this.yspan * GRID_SIZE / 2;
    };
Grid_Object.prototype.grid_touching =
    function (gobj) {
	return (((this.grid_x == gobj.grid_x)
		 && (Math.abs (this.grid_y - gobj.grid_y) == 1))
		|| ((this.grid_y == gobj.grid_y)
		    && (Math.abs (this.grid_x - gobj.grid_x) == 1)));
    };
Grid_Object.prototype.grid_touching_coord =
    function (x, y) {
	if (y >= this.grid_y && y < this.grid_y + this.yspan) {
	    return (x == this.grid_x - 1) || (x == this.grid_x + this.xspan);
	}
	if (x >= this.grid_x && x < this.grid_x + this.xspan) {
	    return (y == this.grid_y - 1) || (y == this.grid_y + this.yspan);
	}
	return false;
    };
Grid_Object.prototype.grid_point_in =
    function (point, other) {
	if (typeof (other) != "undefined") {
	    point = [point, other];
	}
	return this.point_in ([point[0] * GRID_SIZE, point[1] * GRID_SIZE]);
    };

var cursor_aqueduct;
var aqueduct_path = [];
Aqueduct.prototype = new Grid_Object;
function Aqueduct (x, y, dir) {
    Grid_Object.call (this, x, y, dir,
		      ["aqueduct_cap.png", "aqueduct.png", "corner.png",
		       "none.png"]);
    this.extension = false;
}
Aqueduct.try_add = function (x, y) {
    if (aqueduct_path.length == 0) {
	if (x < 2) {
	    if (y === 3) {
		return "up";
	    }
	    if (y === 8) {
		return "down";
	    }
	}
	if (x === 2) {
	    if (y < 8 && y > 3) {
		return "right";
	    }
	}
	return false;
    }

    for (a in aqueduct_path) {
	if (x === aqueduct_path[a].grid_x && y === aqueduct_path[a].grid_y) {
	    return false;
	}
    }

    var last_piece = aqueduct_path[aqueduct_path.length - 1];

    if (x === last_piece.grid_x) {
	if (y === last_piece.grid_y - 1) {
	    return "up";
	}
	if (y === last_piece.grid_y + 1) {
	    return "down";
	}
    }
    if (y === last_piece.grid_y) {
	if (x === last_piece.grid_x - 1) {
	    return "left";
	}
	if (x === last_piece.grid_x + 1) {
	    return "right";
	}
    }

    return false;
};
Aqueduct.add_piece = function (x, y, dir, extension) {
    adjust_supply (-1);    

    if (aqueduct_path.length > 0) {
	var last_piece = aqueduct_path[aqueduct_path.length - 1];
	if (last_piece.extension === false) {
	    last_piece.current_frame = 1;
	}
	if (dir != last_piece.dir) {
	    if (last_piece.extension === false) {
		last_piece.current_frame = 2;
	    }
	    switch (last_piece.dir) {
	    case "right":
		if (dir === "down") {
		    last_piece.theta = 0;
		} else if (dir === "up") {
		    last_piece.theta = Math.PI / 2;
		}
		break;
	    case "left":
		if (dir === "down") {
		    last_piece.theta = 3 * Math.PI / 2;
		} else if (dir === "up") {
		    last_piece.theta = Math.PI;
		}
		break;
	    case "up":
		if (dir === "left") {
		    last_piece.theta = 0;
		} else if (dir == "right") {
		    last_piece.theta = 3 * Math.PI / 2;
		}
		break;	
	    case "down":
		if (dir === "left") {
		    last_piece.theta = Math.PI / 2;
		} else if (dir === "right") {
		    last_piece.theta = Math.PI;
		}
		break;	
	    }
	}
    }

    aqueduct_path.push (new Aqueduct (x, y, dir));
    if (typeof (extension) === "undefined") {
	for (v in villages) {
	    if (villages[v].irrigated) {
		continue;
	    }
	    if (x === villages[v].grid_x) {
		if (y === villages[v].grid_y - 1
		    || y === villages[v].grid_y + 1) {
		    Aqueduct.connect_to_village (villages[v], "up");
		} else if (y === villages[v].grid_y + 1) {
		    Aqueduct.connect_to_village (villages[v], "down");
		}
	    } else if (y === villages[v].grid_y) {
		if (x === villages[v].grid_x - 1) {
		    Aqueduct.connect_to_village (villages[v], "left");
		} else if (x === villages[v].grid_x + 1) {
		    Aqueduct.connect_to_village (villages[v], "right");
		}
	    }
	}
    }
	play_sound_effect("rock1.mp3");
    //victory and loss conditions:
    //  victory: if the the player places a piece adjacent to the goal city
    //  loss: if the player runs out of pieces
    if (x === GRID_W - 3) {
	if (y === Math.floor (GRID_H / 2) - 1 || y == Math.floor (GRID_H / 2)) {
	    victory ();
	}
    } else if (x > GRID_W - 3) {
	if (y === Math.floor (GRID_H / 2) - 2
	    || y === Math.floor (GRID_H / 2) + 1) {
	    victory ();
	}
    } else if (aqueduct_supply === 0){
            loss();
    }
	
	//checks to see if the piece placed is touching a village
	//if it is, it adds that villages supply to the player's supply
	//currently triggers even on diagonals, this might want to change (May 18, 2011)
	for(v in villages){
		if ( aqueduct_path[aqueduct_path.length - 1].grid_touching(villages[v]) ){
			adjust_supply (villages[v].supply);
			villages[v].supply = 0;
		}
	}
};
Aqueduct.connect_to_village = function (village, dir) {
    adjust_supply (1);
    village.irrigated = true;
    Aqueduct.add_piece (village.grid_x, village.grid_y, dir, true);
    aqueduct_path[aqueduct_path.length - 1].current_frame = 3;
    aqueduct_path[aqueduct_path.length - 1].extension = true;
};

function invalid_village (x, y) {
    if (typeof (x) == "undefined" || typeof (y) == "undefined") {
	return true;
    }
    //if the grid square is in or touching the water source, do not make a village there
    if (water_source.grid_point_in (x, y) || water_source.grid_touching_coord (x, y)){
	return true;
    }
    //if the grid square is in or touching the goal city, do not make a village there
    if (goal_city.grid_point_in (x, y) || goal_city.grid_touching_coord (x, y)) {
	return true;
    }
    //make sure all villages are on the map
    for (v in villages) {
	if (Math.abs (x - villages[v].grid_x) <= 1
	    && Math.abs (y - villages[v].grid_y) <= 1) {
	    return true;
	}
    }

    return false;
}    
    

var villages = [];
Village.prototype = new Grid_Object;
function Village (x, y) {
    Grid_Object.call (this, x, y, "right", "village.png");
    this.supply = Math.floor (Math.random() * random_pieces_range) + 1
	+ Math.floor (Math.random() * random_pieces_range) + 1;
    this.irrigated = false;
}
Village.create = function () {
    var x;
    var y;

    while (invalid_village (x, y)) {
	x = Math.floor ( roll(GRID_W));
	y = Math.floor ( roll(GRID_H));
    }

    var v = new Village (x, y);

    villages.push (v);

    return v;
};

var obstacles = [];
Obstacle.prototype = new Grid_Object;
function Obstacle (x,y) {
	//Grid_Object.call (this, x, y, "right", "image src");
}
Obstacle.create = function () {
	var x = Math.floor ( roll(GRID_W));
	var y = Math.floor ( roll(GRID_H));
	
	var o = new Obstacle (x,y);
	
	obstacles.push (o);
	
	return o;
};

function grid_val (coord) {
    return Math.floor (coord / GRID_SIZE);
}

function draw_grid (ctx) {
    ctx.save ();

    ctx.strokeStyle = "rgb(175, 175, 175)";
    ctx.lineWidth = 1;

    for (var row = 0; row < canvas.height; row += GRID_SIZE) {
	ctx.beginPath ();
	ctx.moveTo (0, row);
	ctx.lineTo (canvas.width, row);
	ctx.stroke ();
    }

    for (var col = 0; col < canvas.width; col += GRID_SIZE) {
	ctx.beginPath ();
	ctx.moveTo (col, 0);
	ctx.lineTo (col, canvas.height);
	ctx.stroke ();
    }

    ctx.restore ();
}

function draw () {
    ctx = canvas.getContext ('2d');

    ctx.save ();

    safe_draw_image(ctx, background, 0,0, GRID_SIZE*24, GRID_SIZE*12);

    ctx.restore ();

    draw_grid (ctx);

    // Draw lake
    water_source.draw (ctx);

    // Draw city
    goal_city.draw (ctx);

    if (cursor_aqueduct.visible) {
	ctx.save ();
	ctx.globalAlpha = .5;
	cursor_aqueduct.draw (ctx);
	ctx.restore ();
    }

    for (a in aqueduct_path) {
	aqueduct_path[a].draw (ctx);
    }

    for (v in villages) {
	villages[v].draw (ctx);
    }

	for (o in obstacles){
	obstacle[o].draw (ctx);
	}
    draw_game_message (ctx, canvas);
}

function update () {
    draw ();
}

function trigger_update () {
    setTimeout (update, 100);
}

/*
 * respond to a button press by trying to add a piece
 * OR
 * restart game if game is over
 */
function mouse_down (event) {
	if(level_over){
		level_over = false;
		start_new_level();
		
	}else{
	    var mouse_x = event.offsetX - 5;
	    var mouse_y = event.offsetY - 5;
	
	    x = grid_val (mouse_x);
	    y = grid_val (mouse_y);
	
	    var dir = Aqueduct.try_add (x, y);
	    if (dir) {
		Aqueduct.add_piece (x, y, dir);
	    }
	    trigger_update ();
	}
}

function mouse_motion (event) {
    var mouse_x = event.offsetX - 5;
    var mouse_y = event.offsetY - 5;

    cursor_aqueduct.grid_x = grid_val (mouse_x);
    cursor_aqueduct.grid_y = grid_val (mouse_y);
    
    var dir = Aqueduct.try_add (cursor_aqueduct.grid_x, cursor_aqueduct.grid_y);
    cursor_aqueduct.update_pos ();
    if (dir) {
	cursor_aqueduct.theta = DIRS[dir] * Math.PI / 2;
	cursor_aqueduct.visible = true;
    } else {
	cursor_aqueduct.visible = false;
    }

    trigger_update ();
}

function key_press (event) {
    keys[event.which] = true;
    keys[chr(event.which)] = true;
    switch (event.which) {
    default:
	break;
    }
}
function key_release (event) {
    keys[event.which] = false;
    keys[chr(event.which)] = false;
    switch (event.which) {
    case KEY.ESCAPE:
	clearInterval (main_loop);
	break;
    case ord('6'):
	adjust_supply (20);
	break;
    }
}

function getUrlParams() {
    var params = {};
    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(str,key,value) {
	params[key] = value;
    });
    
    return params;
}

/*
 * SOUND SECTION
 * 
 * The following parts of code is how our sound is handled.
 * 
 * load sound is used to initialize sound
 * 
 * Toggle_mute toggles back and forth from mute using mute and unmute.
 */
function load_sound () {
	if(!initialized)
	{
		music = new Audio ("Blood Begets Blood.mp3");
    }
	else {
		/*
		 * todo: put an else in here to load audio....
		 * possibly:
		 * music.pause()
		 * music = new Audio ("next file here");
		 */
	}
}

function mute () {
    music.volume = 0;
    $("#mute").val ("Unmute");
    sound_fx_muted = true;
}

function unmute () {
    music.volume = 1;
    $("#mute").val ("Mute");
    sound_fx_muted = false;
}

function toggle_mute (event) {
    if (music.volume === 0) {
	unmute ();
    } else {
	mute ();
    }
}

var sound_fx_muted = false;


function play_sound_effect(src){
    var sound_effect = new Audio (src);

    if (sound_fx_muted) {
	sound_effect.volume = 0;
    } else {
	sound_effect.volume = 1;
    }
    sound_effect.play ();
}

/*
 * END SOUND SECTION
 */


/*
 * to be a introduction page
 * TODO: Make this do something
 */
function start_intro () {
    started = true;
    in_intro = true;
    intro_stage = 0;
    game_msg = "";
    tutorial_msg = "Welcome to Aqueduct Builder\n(Press T to continue in tutorial)";
    music = new Audio ("assets/PH_mus_intro_1.ogg");
    run_main_loop ();
}



function set_aqueduct_supply(){
	if (level == 1){
		aqueduct_supply = 20;
	}else{
		aqueduct_supply =21;
	}
	
}

/*
 * sets the background to an image based upon the level
 */
function set_background(){
	var image;
	switch(level){
	case 1:
		image = "background.png";
		break;
	default:
		image = "background.png";
		break;
	}
	
	background = load_image(image);
}

/*
 * destroys all villages on a map
 */
function destroy_villages()
{
	while(villages.length>0){
		villages.pop();
	}
}

function destroy_aqueduct(){
	while(aqueduct_path.length > 0){
		aqueduct_path.pop();
	}
}


/*
 * creates a map to be used at the begining
 * also instanciates the aquaduct
 */
function create_map(){
	if(random_maps){
		if (initialized){
			destroy_villages();
			destroy_aqueduct();
			//TODO: get rid of those messages...here might be a good place
		}
		cursor_aqueduct = new Aqueduct (0, 0, "right");
	    cursor_aqueduct.visible = false;
		
	    water_source = new Grid_Object (0, 4, 0, "source.png", 2, 4);
	    goal_city = new Grid_Object (22, 5, 0, "goal_city.png", 2, 2);
	    for (var i = 0; i < 6; i++) {
	    	Village.create ();
	    }
	}
	
}

/*
 * This creates the conditons for the start of the game
 */
function start_new_level() {
	//starts playing sound
	load_sound();
	
	//sets the aqueduct supply to the appropriate amount for the level.
	set_aqueduct_supply();
	display_supply();
	
	//creates a background for the game.  Needed to see the game
	set_background();
	
	create_map();

    $(canvas).mousedown (mouse_down);
    $(canvas).mousemove (mouse_motion);
        
    music.loop = true;
    music.play ();

    if (params["muted"] == "1") {
    	mute ();
     }
    level_over = false;
   
    
    
}

/*
 * initializes board state
 */
function init () {
    canvas = document.getElementById("canvas");

    params = getUrlParams ();
    
    start_new_level();
    if (!initialized) {
    	initialized = true;
    }

    trigger_update ();
}

$(document).ready (init);
$(document).keydown (key_press);
$(document).keyup (key_release);
