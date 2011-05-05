var canvas;

var keys = {};

var GRID_SIZE = 50;
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

}

function update () {
    draw ();
}

function mouse_down (event) {
    var mouse_x = event.offsetX - 5;
    var mouse_y = event.offsetY - 5;
}

function mouse_motion (event) {
    var mouse_x = event.offsetX - 5;
    var mouse_y = event.offsetY - 5;
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

    update ();
}

$(document).ready (init);
$(document).keydown (key_press);
$(document).keyup (key_release);
$(document).mousedown (mouse_down);
$(document).mousemove (mouse_motion);
