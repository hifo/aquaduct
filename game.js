var canvas;
var main_loop;
var GRID_SIZE = 50;
var max_aqueduct_pieces = 20;

var keys = {};

var cursor_aqueduct;
var aqueduct_path = [];
Aqueduct.prototype = new Game_Object;
function Aqueduct (x, y) {
    Game_Object.call (this, "aqueduct.png", 1, x * GRID_SIZE + GRID_SIZE / 2,
		      y * GRID_SIZE + GRID_SIZE / 2, 0,
		      "rect");

    this.grid_x = x;
    this.grid_y = y;
}
Aqueduct.try_add = function (x, y) {
    if (aqueduct_path.length == 0) {
    }

    return  false;
}

function grid_val (coord) {
    return Math.floor (coord / GRID_SIZE);
}

function draw_grid (ctx) {
    ctx.save ();

    ctx.strokeStyle = "rgb(128, 128, 128)";
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

    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect (0, 0, canvas.width, canvas.height);

    ctx.restore ();

    draw_grid (ctx);

    ctx.save ();
    ctx.fillStyle = "rgb(0, 0, 255)";
    ctx.fillRect (0 * GRID_SIZE, 4 * GRID_SIZE, 2 * GRID_SIZE, 4 * GRID_SIZE);
    ctx.restore ();

    ctx.save ();
    ctx.globalAlpha = .5;
    cursor_aqueduct.draw (ctx);
    ctx.restore ();

    for (a in aqueduct_path) {
	aqueduct_path[a].draw (ctx);
    }
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

    if (Aqueduct.try_add (x, y)) {
	trigger_update ();
    }
}

function mouse_motion (event) {
    var mouse_x = event.offsetX - 5;
    var mouse_y = event.offsetY - 5;

    cursor_aqueduct.x = grid_val (mouse_x) * GRID_SIZE + GRID_SIZE / 2;
    cursor_aqueduct.y = grid_val (mouse_y) * GRID_SIZE + GRID_SIZE / 2;

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
    }
}

function init () {
    canvas = document.getElementById("canvas");

    cursor_aqueduct = new Aqueduct (0, 0);

    $(canvas).mousedown (mouse_down);
    $(canvas).mousemove (mouse_motion);

    trigger_update ();
}

$(document).ready (init);
$(document).keydown (key_press);
$(document).keyup (key_release);
