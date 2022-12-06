// An example setup showing how buttons could be set to board/game functionality.
ExampleGameControls = function(element, game) {
  this.element = element;
  this.game = game;
  this.textInfo = element.querySelector(".text-info p");
  this.gameInfo = element.querySelector(".game-info p");
  this.branchInfo = element.querySelector(".branch-info p");

  this.setText = function(str) {
    this.textInfo.innerText = str;
  };

  this.updateStats = function() {
    var newGameInfo = "";
    //newGameInfo += "Black stones captured: " + this.game.currentState().blackStonesCaptured;
    //newGameInfo += "\n\n";
    //newGameInfo +=  "White stones captured: " + this.game.currentState().whiteStonesCaptured;
    //newGameInfo += "\n\n";

    newGameInfo += "Move " + this.game.currentState().moveNumber;

    if (this.game.currentState().playedPoint) {
      newGameInfo += " (" + this.game.coordinatesFor(this.game.currentState().playedPoint.y, this.game.currentState().playedPoint.x) + ")";
    }

    newGameInfo += "\n";

    var currentState = this.game.currentState();

    if (currentState.pass) {
      var player = currentState.color[0].toUpperCase() + currentState.color.substr(1);
      newGameInfo += player + " passed."
    }
    let nextMoveOptions = this.game._getNextMoveOptions();
    if(nextMoveOptions && nextMoveOptions.length) {
        this.element.classList.remove("notInSequence");
        this.element.classList.remove("win");
    } else {
        if(nextMoveOptions === null) {
            this.element.classList.add("notInSequence");
        } else {
            this.element.classList.add("win");
        }
    }
    console.log('current options:',nextMoveOptions);
    newGameInfo += "\n current options: "+nextMoveOptions.map(oneMove => oneMove.pass ? "Tenuki" : this.game.coordinatesFor(oneMove.y,oneMove.x)).join(" or ");
    newGameInfo += "\n"+this.game._getPathComment();

    this.gameInfo.innerText = newGameInfo;

    if (currentState.pass) {
      var str = "";

      if (this.game.isOver()) {
        str += "Game over.";
        str += "\n"
        str += "Black's score is " + this.game.score().black;
        str += "\n";
        str += "White's score is " + this.game.score().white;
      }

      this.setText(str)
    } else {
      this.setText("");
    }
  };

  this.reset = function(e) {
    e.preventDefault();
    var startPath = JSON.parse(localStorage.getItem("startPath"));
    while (controls.game.currentState().moveNumber /*&& controls.game.currentState().moveNumber != startPath.length*/) {
      controls.game.undo();
    }
    startPath.forEach(oneMove => {
      if (oneMove.pass) {
          controls.game.pass();
      } else {
          controls.game.playAt(oneMove.y, oneMove.x);
      }

    });

  };

  this.setup = function() {
    var controls = this;

    var passButton = document.querySelector(".pass");
    var undoButton = document.querySelector(".undo");
    var resetButton = document.querySelector(".reset");
    var setPathButton = document.querySelector(".setPath");
    var playAsWhite = document.querySelector("#isPlayAsWhite");

    playAsWhite.onclick = function(e) {
      console.log('playAsWhite clickedz ', playAsWhite, e);
      if(e.srcElement.checked) {
        controls.game.setAutoplay("white");
      } else {
        controls.game.setAutoplay("black");
      }
      //controls.game.pass();
    };

    passButton.addEventListener("click", function(e) {
      e.preventDefault();

      controls.game.pass();
    });

    undoButton.addEventListener("click", function(e) {
      e.preventDefault();

      controls.game.undo();
    });

    setPathButton.addEventListener("click", function(e) {
        localStorage.setItem("startPath", JSON.stringify(controls.game.getPath()));
        controls.setText("Position saved! From now on, you can click on RESET to come back to the same variation");
    });

    resetButton.addEventListener("click", this.reset);
  }
};
