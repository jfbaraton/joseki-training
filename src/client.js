import Game from "./game";

const Client = function(options = {}) {
  this._boardElement = options["element"];
  this._setup(options);
};

Client.prototype = {
  _setup: function({ player, gameOptions, hooks }) {
    this._player = player;
    this._hooks = hooks;

    if (this._player !== "black" && this._player !== "white") {
      throw new Error("Player must be either black or white, but was given: " + this._player);
    }

    gameOptions["_hooks"] = {
      handleClick: (y, x) => {
        if (this._busy) {
          return;
        }

        this._busy = true;

        if (this.isOver()) {
          const stonesToBeMarkedDead = this._game.currentState().groupAt(y, x).map(i => {
            return {
              y: i.y,
              x: i.x,
              color: i.color
            };
          });

          this._hooks.submitMarkDeadAt(y, x, stonesToBeMarkedDead, result => {
            if (result) {
              this._game.toggleDeadAt(y, x);
            }

            this._busy = false;
          });
        } else {
          if (this._player !== this.currentPlayer() || this._game.isIllegalAt(y, x)) {
            this._busy = false;

            return;
          }

          this._hooks.submitPlay(y, x, result => {
            if (result) {
              this._game.playAt(y, x);
            }

            this._busy = false;
          });
        }
      },

      hoverValue: (y, x) => {
        if (!this._busy && this._player === this.currentPlayer() && !this.isOver() && !this._game.isIllegalAt(y, x)) {
          return this._player;
        }
      },

      gameIsOver: () => {
        return this.isOver();
      }
    };

    if (this._boardElement) {
      this._game = new Game(Object.assign({ element: this._boardElement }, gameOptions));
    } else {
      this._game = new Game(...gameOptions);
    }
  },

  isOver: function() {
    return this._game.isOver();
  },

  currentPlayer: function() {
    return this._game.currentPlayer();
  },

  receivePlay: function(y, x) {
    if (this._player === this.currentPlayer()) {
      return;
    }

    this._game.playAt(y, x);
  },
	
  sgfCoordToPoint:function(_18a){
	if(!_18a||_18a=="tt"){
		return {x:null,y:null};
	}
	var _18b={a:0,b:1,c:2,d:3,e:4,f:5,g:6,h:7,i:8,j:9,k:10,l:11,m:12,n:13,o:14,p:15,q:16,r:17,s:18};
	return {x:_18b[_18a.charAt(0)],y:_18b[_18a.charAt(1)]};
  },
  
  pointToSgfCoord:function(pt){
	if(!pt||(this.board&&!this.boundsCheck(pt.x,pt.y,[0,this.board.boardSize-1]))){
		return null;
	}
	var pts={0:"a",1:"b",2:"c",3:"d",4:"e",5:"f",6:"g",7:"h",8:"i",9:"j",10:"k",11:"l",12:"m",13:"n",14:"o",15:"p",16:"q",17:"r",18:"s"};
	return pts[pt.x]+pts[pt.y];
  },

  moveNumber: function() {
    return this._game.moveNumber();
  },

  receivePass: function() {
    if (this._player === this.currentPlayer()) {
      return;
    }

    this._game.pass();
  },

  receiveMarkDeadAt: function(y, x) {
    this._game.toggleDeadAt(y, x);
  },

  deadStones: function() {
    return this._game.deadStones();
  },

  setDeadStones: function(points) {
    this._game._deadPoints = points.map(i => {
      return {
        y: i.y,
        x: i.x
      };
    });

    this._game.render();
  },

  pass: function() {
    if (this._busy || this._player !== this.currentPlayer() || this.isOver()) {
      return;
    }

    this._busy = true;

    this._hooks.submitPass(result => {
      if (result) {
        this._game.pass();
      }

      this._busy = false;
    });
  }
};

export default Client;
