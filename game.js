var canvas;
var main_loop;
var GRID_SIZE = 50;
var GRID_W = 24;
var GRID_H = 12;

var aqueduct_supply = 20;
var random_pieces_range = 4;

var DIRS = {
    'right': 0,
    'down': 1,
    'left': 2,
    'up': 3
};

var keys = {};

function adjust_supply (amount) {
    aqueduct_supply += amount;
    $("#supply").text (aqueduct_supply);
}

function victory () {
    game_messages.push (new Game_Msg ("You win!", "rgb(255, 0, 0)"));
}

function loss (){
    game_messages.push (new Game_Msg ("You lose!", "rgb(255, 0,0)"));
}

var cursor_aqueduct;
var aqueduct_path = [];
Aqueduct.prototype = new Game_Object;
function Aqueduct (x, y, dir) {
    Game_Object.call (this, ["aqueduct_cap.png", "aqueduct.png", "corner.png"],
		      1, 0, 0, DIRS[dir] * Math.PI / 2, "rect");
    this.grid_x = x;
    this.grid_y = y;
    this.dir = dir;
    this.update_pos ();
}
Aqueduct.prototype.update_pos = function () {
    this.x = this.grid_x * GRID_SIZE + GRID_SIZE / 2;
    this.y = this.grid_y * GRID_SIZE + GRID_SIZE / 2;
}
Aqueduct.try_add = function (x, y) {
    if (aqueduct_path.length == 0) {
	if (x < 2) {
	    if (y == 3) {
		return "up";
	    }
	    if (y == 8) {
		return "down";
	    }
	}
	if (x == 2) {
	    if (y < 8 && y > 3) {
		return "right";
	    }
	}
	return false;
    }

    for (a in aqueduct_path) {
	if (x == aqueduct_path[a].grid_x && y == aqueduct_path[a].grid_y) {
	    return false;
	}
    }

    var last_piece = aqueduct_path[aqueduct_path.length - 1];

    if (x == last_piece.grid_x) {
	if (y == last_piece.grid_y - 1) {
	    return "up";
	}
	if (y == last_piece.grid_y + 1) {
	    return "down";
	}
    }
    if (y == last_piece.grid_y) {
	if (x == last_piece.grid_x - 1) {
	    return "left";
	}
	if (x == last_piece.grid_x + 1) {
	    return "right";
	}
    }

    return false;
};
Aqueduct.add_piece = function (x, y, dir) {
    adjust_supply (-1);    

    if (aqueduct_path.length > 0) {
	var last_piece = aqueduct_path[aqueduct_path.length - 1];
	last_piece.current_frame = 1;
	if (dir != last_piece.dir) {
	    last_piece.current_frame = 2;
	    switch (last_piece.dir) {
	    case "right":
		if (dir == "down") {
		    last_piece.theta = 0;
		} else if (dir == "up") {
		    last_piece.theta = Math.PI / 2;
		}
		break;
	    case "left":
		if (dir == "down") {
		    last_piece.theta = 3 * Math.PI / 2;
		} else if (dir == "up") {
		    last_piece.theta = Math.PI;
		}
		break;
	    case "up":
		if (dir == "left") {
		    last_piece.theta = 0;
		} else if (dir == "right") {
		    last_piece.theta = 3 * Math.PI / 2;
		}
		break;	
	    case "down":
		if (dir == "left") {
		    last_piece.theta = Math.PI / 2;
		} else if (dir == "right") {
		    last_piece.theta = Math.PI;
		}
		break;	
	    }
	}
    }

    aqueduct_path.push (new Aqueduct (x, y, dir));

    if (x == GRID_W - 3) {
	if (y == Math.floor (GRID_H / 2) - 1 || y == Math.floor (GRID_H / 2)) {
	    victory ();
	}
    } else if (x > GRID_W - 3) {
	if (y == Math.floor (GRID_H / 2) - 2
	    || y == Math.floor (GRID_H / 2) + 1) {
	    victory ();
	}
    } else if (aqueduct_supply == 0){
            loss();
    }
};

function grid_val (coord) {
    return Math.floor (coord / GRID_SIZE);
}

function draw_grid (ctx) {
    ctx.save ();

    ctx.strokeStyle = "rgb(160, 160, 160)";
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
    ctx.save ();
    ctx.fillStyle = "rgb(0, 0, 255)";
    ctx.fillRect (0 * GRID_SIZE, 4 * GRID_SIZE, 2 * GRID_SIZE, 4 * GRID_SIZE);
    ctx.restore ();

    // Draw city
    ctx.save ();
    safe_draw_image(ctx, goal_city, (GRID_W - 2) * GRID_SIZE, 5 * GRID_SIZE,
		    2 * GRID_SIZE, 2 * GRID_SIZE);
    ctx.restore ();

    if (cursor_aqueduct.visible) {
	ctx.save ();
	ctx.globalAlpha = .5;
	cursor_aqueduct.draw (ctx);
	ctx.restore ();
    }

    for (a in aqueduct_path) {
	aqueduct_path[a].draw (ctx);
    }

    draw_game_message (ctx, canvas);
}

function update () {
    draw ();
}

function trigger_update () {
    setTimeout (update, 100);
}

function mouse_down (event) {
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

function init () {
    canvas = document.getElementById("canvas");

    aqueduct_supply = 20;
    adjust_supply (0);

    cursor_aqueduct = new Aqueduct (0, 0, "right");
    cursor_aqueduct.visible = false;
    goal_city = load_image("goal_city.png");
    
    background = load_image("background.png");

    $(canvas).mousedown (mouse_down);
    $(canvas).mousemove (mouse_motion);

    trigger_update ();
}

$(document).ready (init);
$(document).keydown (key_press);
$(document).keyup (key_release);
