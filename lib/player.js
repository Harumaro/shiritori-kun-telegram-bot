class Player {
  constructor (id, name) {
    this._id = id;
    this._name = name;
    this._state = null;
    this._score = 0;
  }

  getId () {
    return this._id;
  }

  getName () {
    return this._name;
  }

  setState (state) {
    this._state = state;
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
