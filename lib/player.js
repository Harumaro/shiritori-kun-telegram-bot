const EventEmitter = require('events');

const states = {
  join: 'join',
  start: 'start',
  ownTurn: 'ownTurn',
  turnOver: 'turnOver',
  turnSkipped: 'turnSkipped',
  wrongWord: 'wrongWord',
  lost: 'lost'
};

class Player extends EventEmitter {
  constructor (id, name) {
    super();
    this._id = id;
    this._name = name;
    this._state = null;
    this._score = 0;
  }

  static get states () {
    return states;
  }

  getId () {
    return this._id;
  }

  getName () {
    return this._name;
  }

  setState (state) {
    this._state = state;
    this.emit(this._state, this);
  }

  getState (chId) {
    return this._state;
  }

  addPoints (points) {
    this._score += points;
  }

  setScore (score) {
    this._score = score;
  }

  getScore (chId) {
    return this._score;
  }
}

module.exports = Player;
