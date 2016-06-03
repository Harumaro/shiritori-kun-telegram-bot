const EventEmitter = require('events');

const Player = require('./player');

class Channel {
  constructor (id, e) {
    this._id = id;
    this._e = e;
    this._currentWord = '';
    this._currentPlayer = 0;
    this._queue = [];
    this._players = {};
  }

  getId () {
    return this._id;
  }

  addPlayer (uId, uName) {
    this._players[uId] = new Player(uId, uName);
  }

  removePlayer (uId) {
    delete this._players[uId];
  }

  getPlayer (uId) {
    return this._players[uId];
  }

  setState (uId, state) {
    this.getPlayer(uId).setState(states[state] || null);
    this._e.emit('user_state_changed', this._id, uId, state);
  }

  getState (uId) {
    return this._players[uId].getState();
  }

  setScore (uId, score) {
    this._players[uId].score = score || 0;
    this._e.emit('user_score_changed', this._id, uId, state);
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
      this._e.emit('game_over', this._id);
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
