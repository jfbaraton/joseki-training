import DOMRenderer from "./dom-renderer";
import SVGRenderer from "./svg-renderer";
import NullRenderer from "./null-renderer";
import BoardState from "./board-state";
import Ruleset from "./ruleset";
import Scorer from "./scorer";
import exampleSGF from "./baseSGF";
import utils from "./utils";

var sgf = require('smartgame');

var collection = sgf.parse(exampleSGF);
//console.log('parsed SGF: ', collection);

const VALID_GAME_OPTIONS = [
  "element",
  "boardSize",
  "scoring",
  "handicapStones",
  "koRule",
  "komi",
  "_hooks",
  "fuzzyStonePlacement",
  "renderer",
  "freeHandicapPlacement"
];

const Game = function(options = {}, localStorage) {
  this._validateOptions(options);
  this.localStorage =localStorage;
  this._defaultBoardSize = 19;
  this.boardSize = null;
  this._moves = [];
  this._learnBranchStart = [];
  this.isAutoplay =false;
  this.callbacks = {
    postRender: function() {}
  };
  this._boardElement = options["element"];
  this._defaultScoring = "territory";
  this._defaultKoRule = "simple";
  this._defaultRenderer = "svg";
  this._deadPoints = [];

  this._setup(options);
};

Game.prototype = {
  _validateOptions: function(options) {
    for (let key in options) {
      if (Object.prototype.hasOwnProperty.call(options, key)) {
        if (VALID_GAME_OPTIONS.indexOf(key) < 0) {
          throw new Error("Unrecognized game option: " + key);
        }

        if (typeof options[key] === "undefined" || options[key] === null) {
          throw new Error(`Game option ${key} must not be set as null or undefined`);
        }
      }
    }
  },

  _configureOptions: function({ boardSize = this._defaultBoardSize, komi = 0, handicapStones = 0, freeHandicapPlacement = false, scoring = this._defaultScoring, koRule = this._defaultKoRule, renderer = this._defaultRenderer } = {}) {
    if (typeof boardSize !== "number") {
      throw new Error("Board size must be a number, but was: " + typeof boardSize);
    }

    if (typeof handicapStones !== "number") {
      throw new Error("Handicap stones must be a number, but was: " + typeof boardSize);
    }

    if (handicapStones > 0 && boardSize !== 9 && boardSize !== 13 && boardSize !== 19) {
      throw new Error("Handicap stones not supported on sizes other than 9x9, 13x13 and 19x19");
    }

    if (handicapStones < 0 || handicapStones === 1 || handicapStones > 9) {
      throw new Error("Only 2 to 9 handicap stones are supported");
    }

    if (boardSize > 19) {
      throw new Error("cannot generate a board size greater than 19");
    }

    this.boardSize = boardSize;
    this.handicapStones = handicapStones;
    this._freeHandicapPlacement = freeHandicapPlacement;

    this._scorer = new Scorer({
      scoreBy: scoring,
      komi: komi
    });

    this._rendererChoice = {
      "dom": DOMRenderer,
      "svg": SVGRenderer
    }[renderer];

    if (!this._rendererChoice) {
      throw new Error("Unknown renderer: " + renderer);
    }

    this._ruleset = new Ruleset({
      koRule: koRule
    });

    if (this._freeHandicapPlacement) {
      this._initialState = BoardState._initialFor(boardSize, 0);
    } else {
      this._initialState = BoardState._initialFor(boardSize, handicapStones);
    }
  },

  _stillPlayingHandicapStones: function() {
    return this._freeHandicapPlacement && this.handicapStones > 0 && this._moves.length < this.handicapStones;
  },

  getPath: function() {
    let result = [];
    for (let moveIdx = 0 ; moveIdx < this._moves.length ; moveIdx++) {
        let oneMove =  this._moves[moveIdx];

        if(oneMove.pass) {
            result.push({pass:true});
        } else {
            result.push({y:oneMove.playedPoint.y, x:oneMove.playedPoint.x});
        }
    }
    return result;
  },

  _getPathComment: function() {
    let pathComment = "path: ";
    let sgfPosition = collection.gameTrees[0];
    let pathCommentExtra = "extra";
    let availableTransforms = utils.getAllPossibleTransform();
    let isInSequence = Boolean(availableTransforms) && Boolean(availableTransforms.length);
    let nodeIdx = 0;
    for (let moveIdx = 0 ; moveIdx < this._moves.length ; moveIdx++) {
        let oneMove =  this._moves[moveIdx];
        if(oneMove.pass) {
            pathComment += "PASS - ";
        } else {
            pathComment += " " + this.coordinatesFor(oneMove.playedPoint.y, oneMove.playedPoint.x) + " - ";
            pathComment += " (" + utils.pointToSgfCoord({y:oneMove.playedPoint.y, x:oneMove.playedPoint.x}) + ") - ";
        }
        if (isInSequence) {
            let newsgfPosition = this._isInSequence(oneMove, nodeIdx+1, sgfPosition, availableTransforms);
            if (newsgfPosition) {
                if(newsgfPosition === sgfPosition) {
                    nodeIdx ++; // sgfPosition.nodes[] is the one way street that we have to follow before reaching the sequences
                } else {
                    nodeIdx = 0; // sgfPosition.nodes[] was completed, so we continue with the sgfPosition.sequences (that iss newsgfPosition)
                    sgfPosition = newsgfPosition;
                }
                //console.log('CORRECT PATH '+pathComment,newsgfPosition);
                pathCommentExtra = " correct!";
            } else {
                //console.log('WROOONG ',pathComment);
                pathCommentExtra = "instead of ";
                if(oneMove.pass) {
                    pathCommentExtra += "PASS ";
                } else {
                    pathCommentExtra += " " + this.coordinatesFor(oneMove.playedPoint.y, oneMove.playedPoint.x) + " ";
                    pathCommentExtra += " (" + utils.pointToSgfCoord({y:oneMove.playedPoint.y, x:oneMove.playedPoint.x}) + ") ";
                }
                pathCommentExtra += "it was better to play one of ["+this._childrenOptionsAsString(sgfPosition, nodeIdx+1, oneMove.color === "black" ? "white" : "black", availableTransforms)+"]";
                isInSequence = false;
            }
        }
    }
    let result = pathComment+ "\n\n" +pathCommentExtra+ "\n\n" +isInSequence ? sgfPosition.nodes[nodeIdx].C : "WROOOOOONG";
    //console.log('final pathComment ',result);
    return result;
  },

  _getNextMoveOptions: function() {
    let sgfPosition = collection.gameTrees[0];
    const availableTransforms = utils.getAllPossibleTransform();
    let isInSequence = Boolean(availableTransforms) && Boolean(availableTransforms.length);
    let nodeIdx = 0;
    let oneMove = null;
    for (let moveIdx = 0 ; moveIdx < this._moves.length ; moveIdx++) {
        oneMove =  this._moves[moveIdx];
        if (isInSequence) {
            //console.log('_getNextMoveOptions mv',moveIdx, ' transforms ', availableTransforms);
            let newsgfPosition = this._isInSequence(oneMove, nodeIdx+1, sgfPosition, availableTransforms);
            //console.log('AAAA                mv',newsgfPosition, ' transforms ', availableTransforms);
            if (newsgfPosition) {
                if(newsgfPosition === sgfPosition) {
                    nodeIdx ++; // sgfPosition.nodes[] is the one way street that we have to follow before reaching the sequences
                } else {
                    nodeIdx = 0; // sgfPosition.nodes[] was completed, so we continue with the sgfPosition.sequences (that iss newsgfPosition)
                    sgfPosition = newsgfPosition;
                }
            } else {
                isInSequence = false;
            }
        }
    }
    //console.log('_getNextMoveOptions finished in sequence ',isInSequence);
    return isInSequence? this._childrenOptions(sgfPosition, nodeIdx+1, oneMove && oneMove.color === "black" ? "white" : "black", availableTransforms) : null;
  },

    // is oneMove one of the allowed children of gameTreeSequenceNode
    // if so, returns the matching sequences.X object
  _isInSequence: function(oneMove, nodeIdx, gameTreeSequenceNode, availableTransforms) {
    //console.log('_isInSequence ? '+availableTransforms.length+' move '+nodeIdx+':',oneMove);
    if(nodeIdx< gameTreeSequenceNode.nodes.length) {
        //console.log('_isInSequence NODES '+nodeIdx,gameTreeSequenceNode.nodes[nodeIdx]);
        const oneChildMoves = gameTreeSequenceNode.nodes.
            filter( (childNode, sequenceIdx) => sequenceIdx === nodeIdx). // we only consider the "nodeIdx" move of the nodes
            filter(childNode => typeof (oneMove.color === "black" ? childNode.B : childNode.W) !== "undefined").
            filter(childNode => !oneMove.pass || (childNode.B || childNode.W) === "").
            filter(childNode => oneMove.pass || utils.getPossibleTransforms(
                utils.sgfCoordToPoint(childNode.B || childNode.W) ,
                {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                availableTransforms));

        //console.log('_isInSequence NODES '+nodeIdx,oneChildMoves);
        if(oneChildMoves && oneChildMoves.length) {
            if(!oneMove.pass) {
                let childNode = oneChildMoves[0];
                let newAvailableTransforms = utils.getPossibleTransforms(
                     utils.sgfCoordToPoint(childNode.B || childNode.W) ,
                     {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                     availableTransforms);
                let idx = availableTransforms.length;
                while (idx--) {
                    if (newAvailableTransforms.indexOf(availableTransforms[idx]) <0) {
                        availableTransforms.splice(idx, 1);
                    }
                }
            }
            return gameTreeSequenceNode; // in sequence according to gameTreeSequenceNode.nodes
        } else {
            return false; // not in sequence
        }
    }

    //console.log('_isInSequence end of nodes ?',nodeIdx);
    for (let sequencesIdx = 0 ; gameTreeSequenceNode.sequences && sequencesIdx < gameTreeSequenceNode.sequences.length ; sequencesIdx++) {
        let oneChild = gameTreeSequenceNode.sequences[sequencesIdx];
        const oneChildMoves = oneChild.nodes && oneChild.nodes.
            filter( (childNode, sequenceIdx) => sequenceIdx === 0). // we only consider the first move of the sequence
            filter(childNode => typeof (oneMove.color === "black" ? childNode.B : childNode.W) !== "undefined").
            filter(childNode => !oneMove.pass || (childNode.B || childNode.W) === "").
            filter(childNode => oneMove.pass || utils.getPossibleTransforms(
                 utils.sgfCoordToPoint(childNode.B || childNode.W) ,
                 {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                 availableTransforms));

        //console.log('_isInSequence '+i,oneChild);
        //console.log('_isInSequence '+i,oneChildMoves);
        if(oneChildMoves && oneChildMoves.length) {
            if(!oneMove.pass) {
                let childNode = oneChildMoves [0];
                let newAvailableTransforms = utils.getPossibleTransforms(
                     utils.sgfCoordToPoint(childNode.B || childNode.W) ,
                     {y:oneMove.playedPoint.y, x:oneMove.playedPoint.x},
                     availableTransforms);
                let idx = availableTransforms.length;
                while (idx--) {
                    if (newAvailableTransforms.indexOf(availableTransforms[idx]) <0) {
                        availableTransforms.splice(idx, 1);
                    }
                }
            }
            return oneChild;// in sequence according to sequences.
        }
    }
    return false;
  },

  _childrenOptionsAsString: function(gameTreeSequenceNode, nodeIdx, moveColor) {
    //console.log('DEBUG ',gameTreeSequenceNode);
    let childAsPoint;
    let resultString = "";
    let oneChildMoves;

    if(gameTreeSequenceNode.nodes && nodeIdx< gameTreeSequenceNode.nodes.length) {
        // we have only one option, because we are in the gameTreeSequenceNode.nodes[] one way street
        oneChildMoves = gameTreeSequenceNode.nodes.
            filter( (childNode, sequenceIdx) => sequenceIdx === nodeIdx). // we only consider the first move of the sequence
            filter(childNode => typeof (moveColor === "black" ? childNode.B : childNode.W)!== "undefined");

        if (oneChildMoves && oneChildMoves.length) {
            if (typeof oneChildMoves[0].B !== "undefined" || typeof oneChildMoves[0].W !== "undefined") {
                childAsPoint = utils.sgfCoordToPoint(oneChildMoves[0].B || oneChildMoves[0].W);
                resultString += String(this.coordinatesFor(childAsPoint.y, childAsPoint.x));
            } else {
                resultString += "Tenuki (play away)";
            }
        }
    } else {
        // we consider sequences
        oneChildMoves = gameTreeSequenceNode.sequences && gameTreeSequenceNode.sequences[0].nodes.
                filter( (childNode, sequenceIdx) => sequenceIdx === 0). // we only consider the first move of the sequence
                filter(childNode => typeof (moveColor === "black" ? childNode.B : childNode.W) !== "undefined");
        if (oneChildMoves && oneChildMoves.length) {
            childAsPoint = utils.sgfCoordToPoint(oneChildMoves[0].B || oneChildMoves[0].W);
            resultString += String(this.coordinatesFor(childAsPoint.y, childAsPoint.x));
        }
        for (let sequencesIdx = 1 ; gameTreeSequenceNode.sequences && sequencesIdx < gameTreeSequenceNode.sequences.length ; sequencesIdx++) {
            //console.log('DEBUG '+i,gameTreeSequenceNode.sequences[sequencesIdx]);
            let oneChild = gameTreeSequenceNode.sequences[sequencesIdx];

            oneChildMoves = oneChild.nodes.
                filter( (childNode, sequenceIdx) => sequenceIdx === 0). // we only consider the first move of the sequence
                filter(childNode => typeof (moveColor === "black" ? childNode.B : childNode.W)!== "undefined");

            if (oneChildMoves && oneChildMoves.length) {
                childAsPoint = utils.sgfCoordToPoint(oneChildMoves[0].B || oneChildMoves[0].W);
                resultString += " or "+this.coordinatesFor(childAsPoint.y, childAsPoint.x);
            }
        }
    }
    return resultString;
  },

  _childrenOptions: function(gameTreeSequenceNode, nodeIdx, moveColor, availableTransforms) {
    let childAsPoint;
    let result = [];
    let oneChildMoves;
    if(!availableTransforms || !availableTransforms.length) {return [];}
    //console.log('DEBUG ',gameTreeSequenceNode, nodeIdx);
    if(nodeIdx< gameTreeSequenceNode.nodes.length) {
        //console.log('_childrenOptions goes to nodes: only one option ',gameTreeSequenceNode.nodes);
        // we have only one option, because we are in the gameTreeSequenceNode.nodes[] one way street
        oneChildMoves = gameTreeSequenceNode.nodes.
            filter( (childNode, sequenceIdx) => sequenceIdx === nodeIdx). // we only consider the first move of the sequence
            filter(childNode => typeof (moveColor === "black" ? childNode.B : childNode.W)!== "undefined");

        if (oneChildMoves && oneChildMoves.length) {
            if (oneChildMoves[0].B || oneChildMoves[0].W) {
                childAsPoint = utils.sgfCoordToPoint(oneChildMoves[0].B || oneChildMoves[0].W);
                availableTransforms.forEach(oneTransform => {
                    const transformedMove = utils.transformMove(childAsPoint, oneTransform);
                    if (!result.some(oneOption => (oneOption.pass && transformedMove.pass) || typeof transformedMove.x !== "undefined" && oneOption.x === transformedMove.x && oneOption.y === transformedMove.y )) {
                        //console.log('nodes accept move option ',transformedMove);
                        result.push(transformedMove);
                    }
                });
            } else {
                //console.log('nodes accept move option ',transformedMove);
                result.push({pass:true});
            }
        }
    } else {
        //console.log('_childrenOptions goes to sequences: SEVERAL options ',gameTreeSequenceNode.sequences);
        // we consider sequences
        for (let sequencesIdx = 0 ; gameTreeSequenceNode.sequences && sequencesIdx < gameTreeSequenceNode.sequences.length ; sequencesIdx++) {
            //console.log('DEBUG '+sequencesIdx,gameTreeSequenceNode.sequences[sequencesIdx]);
            let oneChild = gameTreeSequenceNode.sequences[sequencesIdx];

            oneChildMoves = oneChild.nodes.
                filter( (childNode, sequenceIdx) => sequenceIdx === 0). // we only consider the first move of the sequence
                filter(childNode => typeof (moveColor === "black" ? childNode.B : childNode.W)!== "undefined");

            //console.log('DEBUG oneChildMoves && oneChildMoves.length ',oneChildMoves && oneChildMoves.length);
            if (oneChildMoves && oneChildMoves.length) {
                //console.log('typeof oneChildMoves[0] defined ',typeof oneChildMoves[0].B !== "undefined" || typeof oneChildMoves[0].W !== "undefined");
                if (oneChildMoves[0].B || oneChildMoves[0].W) {
                    childAsPoint = utils.sgfCoordToPoint(oneChildMoves[0].B || oneChildMoves[0].W);
                    availableTransforms.forEach(oneTransform => {
                        //console.log('Transform seq option ',childAsPoint, ' -- ',oneTransform, transformedMove);
                        const transformedMove = utils.transformMove(childAsPoint, oneTransform);
                        if (!result.some(oneOption => (oneOption.pass && transformedMove.pass) || typeof transformedMove.x !== "undefined" && oneOption.x === transformedMove.x && oneOption.y === transformedMove.y )) {
                            //console.log('seq accept move option ',transformedMove, oneChildMoves[0],' childAsPoint ',childAsPoint );
                            result.push(transformedMove);
                        }
                    });
                } else {
                    //console.log('seq accept PASS option ');
                    result.push({pass:true});
                }
            }
        }
    }
    return result;
  },

  _setup: function(options = {}) {
    this._validateOptions(options);
    this._configureOptions(options);

    if (this._boardElement) {
      const defaultRendererHooks = {
        handleClick: (y, x) => {
          if (this.isOver()) {
            this.toggleDeadAt(y, x);
          } else {
            this.playAt(y, x);
          }
        },

        hoverValue: (y, x) => {
          if (!this.isOver() && !this.isIllegalAt(y, x)) {
            return this.currentPlayer();
          }
        },

        gameIsOver: () => {
          return this.isOver();
        }
      };

      this.renderer = new this._rendererChoice(this._boardElement, {
        hooks: options["_hooks"] || defaultRendererHooks,
        options: {
          fuzzyStonePlacement: options["fuzzyStonePlacement"]
        }
      });
    } else {
      this.renderer = new NullRenderer();
    }

    this.render();
  },

  intersectionAt: function(y, x) {
    return this.currentState().intersectionAt(y, x);
  },

  intersections: function() {
    return this.currentState().intersections;
  },

  deadStones: function() {
    return this._deadPoints;
  },

  coordinatesFor: function(y, x) {
    return this.currentState().xCoordinateFor(x) + this.currentState().yCoordinateFor(y);
  },

  currentPlayer: function() {
    if (this._stillPlayingHandicapStones()) {
      return "black";
    }

    return this.currentState().nextColor();
  },

  isWhitePlaying: function() {
    return this.currentPlayer() === "white";
  },

  isBlackPlaying: function() {
    return this.currentPlayer() === "black";
  },

  score: function() {
    return this._scorer.score(this);
  },

  currentState: function() {
    return this._moves[this._moves.length - 1] || this._initialState;
  },

  autoPlay: function() {
    let startPath = JSON.parse(this.localStorage && this.localStorage.getItem("startPath") || "[]");
    if(this.isAutoplay && this.currentState().moveNumber >= startPath.length && this.currentState().color === this.isAutoplay) {
        let nextMoveOptions = this._getNextMoveOptions();
        // check if the next move should be played automatically
        if(nextMoveOptions && nextMoveOptions.length) {
            let nextMoveIdx = Math.floor(nextMoveOptions.length * Math.random());
            //if(nextMoveOptions[nextMoveIdx].pass || typeof nextMoveOptions[nextMoveIdx].x === "undefined" || nextMoveOptions[nextMoveIdx].x === null) {
            if(nextMoveOptions[nextMoveIdx].pass) {
                this.pass();
            } else {
                this.playAt(nextMoveOptions[nextMoveIdx].y, nextMoveOptions[nextMoveIdx].x);
            }
        }
    }
  },


  playAt: function(y, x, { render = true } = {}) {
    if (this.isIllegalAt(y, x)) {
      return false;
    }

    let newState = this.currentState().playAt(y, x, this.currentPlayer());
    const { koPoint } = newState;

    if (koPoint && !this._ruleset._isKoViolation(koPoint.y, koPoint.x, newState, this._moves.concat(newState))) {
      newState = newState.copyWithAttributes({ koPoint: null });
    }

    this._moves.push(newState);

    if (render) {
      this.render();
    }
    this.autoPlay();
    return true;
  },

  pass: function({ render = true } = {}) {
    if (this.isOver()) {
      return false;
    }

    const newState = this.currentState().playPass(this.currentPlayer());
    this._moves.push(newState);

    if (render) {
      this.render();
    }

    this.autoPlay();
    return true;
  },

  isOver: function() {
    if (this._moves.length < 2) {
      return false;
    }

    const finalMove = this._moves[this._moves.length - 1];
    const previousMove = this._moves[this._moves.length - 2];

    return finalMove.pass && previousMove.pass;
  },

  markDeadAt: function(y, x, { render = true } = {}) {
    if (this._isDeadAt(y, x)) {
      return true;
    }

    return this._setDeadStatus(y, x, true, { render });
  },

  unmarkDeadAt: function(y, x, { render = true } = {}) {
    if (!this._isDeadAt(y, x)) {
      return true;
    }

    return this._setDeadStatus(y, x, false, { render });
  },

  toggleDeadAt: function(y, x, { render = true } = {}) {
    return this._setDeadStatus(y, x, !this._isDeadAt(y, x), { render });
  },

  _setDeadStatus: function(y, x, markingDead, { render = true } = {}) {
    const selectedIntersection = this.intersectionAt(y, x);

    if (selectedIntersection.isEmpty()) {
      return;
    }

    const chosenDead = [];

    const [candidates] = this.currentState().partitionTraverse(selectedIntersection, intersection => {
      return intersection.isEmpty() || intersection.sameColorAs(selectedIntersection);
    });

    candidates.forEach(sameColorOrEmpty => {
      if (!sameColorOrEmpty.isEmpty()) {
        chosenDead.push(sameColorOrEmpty);
      }
    });

    chosenDead.forEach(intersection => {
      if (markingDead) {
        this._deadPoints.push({ y: intersection.y, x: intersection.x });
      } else {
        this._deadPoints = this._deadPoints.filter(dead => !(dead.y === intersection.y && dead.x === intersection.x));
      }
    });

    if (render) {
      this.render();
    }

    return true;
  },

  _isDeadAt: function(y, x) {
    return this._deadPoints.some(dead => dead.y === y && dead.x === x);
  },

  isIllegalAt: function(y, x) {
    return this._ruleset.isIllegal(y, x, this);
  },

  territory: function() {
    if (!this.isOver()) {
      return {
        black: [],
        white: []
      };
    }

    return this._scorer.territory(this);
  },

  undo: function() {
    this._moves.pop();
    this.render();
  },

  render: function() {
    if (!this.isOver()) {
      this._deadPoints = [];
    }

    this.renderer.render(this.currentState(), {
      territory: this.territory(),
      deadStones: this.deadStones()
    });

    this.callbacks.postRender(this);
  },

  setAutoplay: function(newIsAutoplay) {
    this.isAutoplay =newIsAutoplay;
  }


};

export default Game;
