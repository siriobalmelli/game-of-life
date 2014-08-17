// mini jQuery beeatch
function $(selector, container) {
	return (container || document).querySelector(selector);
}

// life (the logic)
(function() {
	
var _ = self.life = function(seed) {
	this.seed = seed;
	this.height = seed.length;
	this.width = seed[0].length;
		
	this.board = clone_2d(seed);
	this.prev_board = [];
};
	
_.prototype = {
	next:		function() {
		this.prev_board = clone_2d(this.board);
			
		for (y=0; y < this.height; y++) {
			for (x=0; x < this.width; x++) {
				neigh = alive_neigh(this.prev_board, y, x);
				alive = !!this.prev_board[y][x];
				// dead/alive logic: reads from prev_board but operates on board ;)
				if (alive) {
					if (neigh < 2 || neigh > 3) {
						this.board[y][x] = 0; // kill if over- or underpopulated
					}
				} else if (neigh == 3) {
					this.board[y][x] = 1; // spawn
				}
			}
		}
	},
	
	toString:	function() {
		return this.board.map(function (row) { return row.join(' '); }).join('\n');
	}		
};

//helper functions
function clone_2d(array) {
	return array.slice().map(function (row) { return row.slice(); });
}

function alive_neigh(array, y, x) {

	// wrap up/down
	var p_row;
	if (y > 0) {
		p_row = array[y-1];
	} else {
		p_row = array[array.length-1];
	}
	var n_row; 
	if (y < array.length-1) {
		n_row = array[y+1];
	} else {
		n_row = array[0];
	}
	// wrap side-to-size
	var p_x;
	if (x > 0) {
		p_x = x-1;
	} else {
		p_x = array[0].length-1;
	}
	var n_x;
	if (x < array[0].length-1) {
		n_x = x+1;
	} else {
		n_x = 0;
	}
	
	return [
		p_row[p_x], p_row[x], p_row[n_x],
		array[y][p_x], array[y][n_x],
		n_row[p_x], n_row[x], n_row[n_x]
		].reduce(function (prev, cur) {
			return prev + +!!cur;
		}, 0);
}

})();


// life_view (the "checkbox grid" we're using as a playing field)
(function(){
	
var _ = self.life_view = function (table, size) {
	this.grid = table;
	this.size = size;
		
	this.make_grid();
};
	
_.prototype = {
	make_grid:	function () {
		var me = this; // because this does not always point to this ;)
		
		var fragment = document.createDocumentFragment();
		this.grid.innerHTML = '';
		this.checkboxes = [];
			
		for (y=0; y < this.size; y++) {
			var row = document.createElement('tr');
			this.checkboxes[y] = [];
				
			for (x=0; x < this.size; x++) {
				var cell = document.createElement('td');
				var checkbox = document.createElement('input');
				checkbox.type = 'checkbox';
				checkbox.coords = [y, x]; // so we know who calls an event
				this.checkboxes[y][x] = checkbox;
					
				cell.appendChild(checkbox);
				row.appendChild(cell);
			}
					
			fragment.appendChild(row);
		}
		
		// catch the user changing one of the checkboxes
		this.grid.addEventListener('change', function(evt) {
			if (evt.target.nodeName.toLowerCase() == 'input') {
				me.started = false;
			}
		});
		// catch the user moving around the grid with arrow keys
		this.grid.addEventListener('keyup', function(evt) {
			var box = evt.target;
			
			if (box.nodeName.toLowerCase() == 'input') {
				var y = box.coords[0];
				var x = box.coords[1];
				
				switch (evt.keyCode) {
				case 37:	//left
					if (x > 0) {
						me.checkboxes[y][x-1].focus();
					} else { //wrap around
						me.checkboxes[y][me.checkboxes[0].length-1].focus();
					}
					break;				
				case 38:	//up
					if (y > 0) {
						me.checkboxes[y-1][x].focus();
					} else {
						me.checkboxes[me.checkboxes.length-1][x].focus();
					}
					break;	
				case 39:	//right
					if (x+1 < me.checkboxes[0].length) {
						me.checkboxes[y][x+1].focus();
					} else {
						me.checkboxes[y][0].focus();
					}
					break;	
				case 40:	//down
					if (y+1 < me.checkboxes.length) {
						me.checkboxes[y+1][x].focus();
					} else {
						me.checkboxes[0][x].focus();
					}
					break;	
				}
			}
		});
			
		this.grid.appendChild(fragment);
	},
	
	get chk_array() {
		return this.checkboxes.map(function (row) {
			return row.map(function (checkbox) {
				return +checkbox.checked;
			});
		});
	},
	
	set chk_array(num_array) {
		for (y=0; y < this.checkboxes.length; y++) {
			for (x=0; x < this.checkboxes[0].length; x++) {
				this.checkboxes[y][x].checked = !!num_array[y][x];
			}
		}
	},
	
	next:		function() {
		var me = this;
		// if we are just starting now, reset the board
		if (!this.started || !this.game) {
			this.game = new life(this.chk_array);
			this.started = true;
		}
		// play a turn
		this.game.next();
		this.chk_array = this.game.board;
		// reschedule if autoplaying
		if (this.auto_play) {
			this.timer = setTimeout(function () {
				me.next();
			}, 500);
		}
	}
};
	
})();


// controls
(function () {

var buttons = {
	next: $('button.next'),
	auto: $('#auto_play') // because that's the ID in the HTML file
};

buttons.next.addEventListener('click', function () {
	if (!view.timer) {
		view.next();
		if (view.auto_play) {
			buttons.next.textContent = 'Stop';
		}
	} else {
		stop_game();
	}
});

buttons.auto.addEventListener('change', function() {
	view.auto_play = this.checked;
	stop_game();
});

function stop_game() {
	clearTimeout(view.timer); // stop any turn I/P
	view.timer = undefined;
	buttons.next.textContent = buttons.auto.checked? 'Start' : 'Next';
}

})();


// main code
var view = new life_view(document.getElementById('grid'), 12);