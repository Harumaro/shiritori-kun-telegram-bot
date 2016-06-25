const EventEmitter = require('events');

const Player = require('./player');

class Channel extends EventEmitter {
  constructor (id, timeout) {
    super();
    this._id = id;
    this._timeout = timeout;
    this._timer = null;
    this._currentWord = '';
    this._currentPlayer = 0;
    this._queue = [];
    this._players = {};
  }

  getId () {
    return this._id;
  }

  static get states () {
    return Player.states;
  }

  _handlePlayerJoin (player) {
    if (this._queue.length == 1) {
      player.setState(Player.states.ownTurn);
    } else {
      player.setState(Player.states.start);
    }

    this.emit(Player.states.join, this);
  }

  _handlePlayerOwnTurn (player) {
    if (this._timeout > 0) {
      this._timer = setTimeout(() => {
        player.setState(Player.states.turnOver);
      }, this._timeout);
    }
    player.setState(Player.states.start);

    this.emit(Player.states.ownTurn, this);
  }

  _handlePlayerTurnOver (player) {
    if (this._timeout > 0) clearTimeout(this._timer);
    if (this._queue.length == 1) {
      this.emit('game_over', this);
    } else {
      player.addPoints(1);
      player.setState(Player.states.start);
      var currentPlayer = this.advanceQueue();
      this.getPlayer(this._queue[currentPlayer]).setState(Player.states.ownTurn);
    }

    this.emit(Player.states.turnOver, this);
  }

  _handlePlayerTurnSkipped (player) {
    player.addPoints(-1);
    player.setState(Player.states.start);
    var currentPlayer = this.advanceQueue();
    this.getPlayer(this._queue[currentPlayer]).setState(Player.states.ownTurn);

    this.emit(Player.states.turnSkipped, this);
  }

  _handlePlayerWrongWord (player) {
    player.addPoints(-1);
    player.setState(Player.states.turnOver);

    this.emit(Player.states.wrongWord, this);
  }

  _handlePlayerLost (player) {
    player.setScore(0);
    this.resetQueue();
    player.setState(Player.states.start);

    this.emit(Player.states.lost, this, player);
  }

  addPlayer (uId, uName) {
    if (!this.getPlayer()) {
      var player = new Player(uId, uName);
      this.addToQueue(uId);

      player.on(Player.states.join, this._handlePlayerJoin.bind(this));
      player.on(Player.states.ownTurn, this._handlePlayerOwnTurn.bind(this));
      player.on(Player.states.turnOver, this._handlePlayerTurnOver.bind(this));
      player.on(Player.states.turnSkipped, this._handlePlayerTurnSkipped.bind(this));
      player.on(Player.states.wrongWord, this._handlePlayerWrongWord.bind(this));
      player.on(Player.states.lost, this._handlePlayerLost.bind(this));

      this._players[uId] = player;
      player.setState(Player.states.join);
    }
  }

  removePlayer (uId) {
    this.removeFromQueue(uId);
    delete this._players[uId];
  }

  getPlayer (uId) {
    return this._players[uId];
  }

  setState (uId, state) {
    this.getPlayer(uId).setState(states[state]);
  }

  getState (uId) {
    return this._players[uId].getState();
  }

  setScore (uId, score) {
    this._players[uId].score = score || 0;
  }

  getScore (uId) {
    return this._players[uId].score;
  }

  setCurrentWord (word) {
    this._currentWord = word;
  }

  getCurrentWord () {
    return this._currentWord;
  }

  addToQueue (uId) {
    this._queue.push(uId);
  }

  removeFromQueue (uId) {
    this._queue.splice(this._queue.indexOf(uId), 1);
    if (this._queue.length == 1) {
      this.emit('game_over', this);
    }
  }

  resetQueue () {
    this._currentPlayer = 0;
  }

  advanceQueue () {
    return this._currentPlayer = this._queue[++this._currentPlayer] && this._currentPlayer || 0;
  }

  getQueue () {
    return this._queue;
  }

  getCurrentPlayer () {
    return this._currentPlayer;
  }

  isPlaying (uId) {
    return this._players[uId];
  }
}

module.exports = Channel;
