const EventEmitter = require('events');

const request = require('request');

const utils = require('./utils');
const Channel = require('./channel');

const areWordsShiritoriCompliant = require('./shiritori-compliance.js');

const reJapaneseWord = /^([\u3040-\u309f\u30a0-\u30ff]+)[\u3000-\u3004\u3006-\u303f ]*|([\u3005\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]+)[\u3000-\u3004\u3006-\u303f ]+([\u3040-\u309f\u30a0-\u30ff]+)[\u3000-\u3004\u3006-\u303f ]*/;

const states = {
  join: 'join',
  start: 'start',
  ownTurn: 'ownTurn',
  turnOver: 'turnOver',
  turnSkipped: 'turnSkipped',
  wrongWord: 'wrongWord',
  lost: 'lost'
};

const defaults = {
  timeout: 5000
};

var timer;

class Game {
  constructor (options) {
    this._options = utils.extend(true, defaults, options);
    this._channels = {};
    this._e = new EventEmitter();
    this.areWordsShiritoriCompliant = areWordsShiritoriCompliant;
  }

  get states () {
    return states;
  }

  get e () {
    return this._e;
  }

  getOptions () {
    return this._options;
  }

  newPlayer (uId, uName, chId) {
    this._channels[chId].addPlayer(uId, uName);
    this._channels[chId].addToQueue(uId);

    this._channels[chId].setState(uId, states.join);
  }

  getChannel (chId) {
    return this._channels[chId] = this._channels[chId] || new Channel(chId, this._e);
  }

  leave (uId, chId) {
    this._channels[chId].removeFromQueue(uId);
    this._channels[chId].removePlayer(uId);
  }

  analyseWord (text, uId, chId) {
    var channel = game.getChannel(chId);
    var detectedWord = text.match(reJapaneseWord);
    if (detectedWord) {
      var word = detectedWord[2] || detectedWord[1];
      if (channel.getCurrentWord() == '' || areWordsShiritoriCompliant(channel.getCurrentWord(), word, this._options.optionalRules)) {
        request.get({url: 'https://glosbe.com/gapi/translate', qs: {from: 'ja', dest: 'en', phrase: word, format: 'json'}}, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var _body = JSON.parse(body);
            if (_body.tuc.length) {
              channel.setCurrentWord(word);
              channel.setState(uId, game.states.turnOver);
            } else {
              channel.setState(uId, game.states.wrongWord);
            }
          }
        });
      } else {
        if (['ン', 'ん'].indexOf(word[word.length - 1]) !== -1) {
          channel.setState(uId, game.states.lost);
        } else {
          channel.setState(uId, game.states.wrongWord);
        }
      }
    }
    ''.match(reJapaneseWord); // clean matches array
  }
}

module.exports = function (options) {
  game = new Game(options);

  game.e.on('game_over', function (chId) {
    console.log('GAME over');
    var channel = game.getChannel(chId);
    var queue = channel.getQueue();
    game.leave(queue[0], chId);
  });

  game.e.on('user_state_changed', function (chId, uId, state) {
    console.log('GAME Triggered state: ' + state + ' for user: ' + uId);

    var channel = game.getChannel(chId);
    var queue = channel.getQueue();
    if (state == states.join) {
      if (queue.length == 1) {
        channel.setState(uId, states.ownTurn);
      } else {
        channel.setState(uId, states.start);
      }
    }
    if (state == states.ownTurn) {
      if (game.getOptions().timeout > 0) {
        timer = setTimeout(() => {
          channel.setState(uId, states.turnOver);
        }, game.getOptions().timeout);
      }
      channel.setState(uId, states.start);
    }
    if (state == states.lost) {
      channel.getPlayer(uId).setScore(0);
      channel.resetQueue();
      channel.setState(uId, states.start);
    }
    if (state == states.turnSkipped) {
      channel.getPlayer(uId).addPoints(-1);
      channel.setState(uId, states.start);
    }
    if (state == states.wrongWord) {
      channel.getPlayer(uId).addPoints(-1);
      channel.setState(uId, states.turnOver);
    }
    if (state == states.turnOver) {
      if (game.getOptions().timeout > 0) clearTimeout(timer);
      if (queue.length == 1) {
        game.e.emit('game_over', chId);
      } else {
        channel.getPlayer(uId).addPoints(1);
        channel.setState(uId, states.start);
        var currentPlayer = channel.advanceQueue();
        channel.setState(queue[currentPlayer], states.ownTurn);
      }
    }
    if (!state) {
      console.log('Unknown State');
    }
  });

  return game;
};
