const EventEmitter = require('events');

const request = require('request');

const utils = require('./utils');
const Channel = require('./channel');

const areWordsShiritoriCompliant = require('./shiritori-compliance.js');

const reJapaneseWord = /^([\u3040-\u309f\u30a0-\u30ff]+)[\u3000-\u3004\u3006-\u303f ]*|([\u3005\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]+)[\u3000-\u3004\u3006-\u303f ]+([\u3040-\u309f\u30a0-\u30ff]+)[\u3000-\u3004\u3006-\u303f ]*/;

const defaults = {
  timeout: 5000
};

var timer;

class Game extends EventEmitter {
  constructor (options) {
    super();
    this._options = utils.extend(true, defaults, options);
    this._channels = {};
    this.areWordsShiritoriCompliant = areWordsShiritoriCompliant;
  }

  get states () {
    return Channel.states;
  }

  _handlePlayerJoin (channel) {
    this.emit(Channel.states.join, channel);
  }

  _handlePlayerOwnTurn (channel) {
    this.emit(Channel.states.ownTurn, channel);
  }

  _handlePlayerTurnOver (channel) {
    this.emit(Channel.states.turnOver, channel);
  }

  _handlePlayerTurnSkipped (channel) {
    this.emit(Channel.states.turnSkipped, channel);
  }

  _handlePlayerWrongWord (channel) {
    this.emit(Channel.states.wrongWord, channel);
  }

  _handlePlayerLost (channel) {
    this.emit(Channel.states.lost, channel);
  }

  _handleGameOver (channel) {
    console.log('game over');
    var queue = channel.getQueue();
    this.leave(queue[0], channel.getId());
    this.emit('game_over', channel);
  }

  getOptions () {
    return this._options;
  }

  newPlayer (uId, uName, chId) {
    this.getChannel(chId).addPlayer(uId, uName);
  }

  getChannel (chId) {
    return this._channels[chId] = this._channels[chId] || this.createChannel(chId, this.getOptions().timeout);
  }

  createChannel (chId, timeout) {
    var channel = new Channel(chId, timeout);

    channel.on(Channel.states.join, this._handlePlayerJoin.bind(this));
    channel.on(Channel.states.ownTurn, this._handlePlayerOwnTurn.bind(this));
    channel.on(Channel.states.turnOver, this._handlePlayerTurnOver.bind(this));
    channel.on(Channel.states.turnSkipped, this._handlePlayerTurnSkipped.bind(this));
    channel.on(Channel.states.wrongWord, this._handlePlayerWrongWord.bind(this));
    channel.on(Channel.states.lost, this._handlePlayerLost);
    channel.on('game_over', this._handleGameOver.bind(this));

    return channel;
  }

  leave (uId, chId) {
    this._channels[chId].removePlayer(uId);
  }

  analyseWord (text, uId, chId) {
    var channel = this.getChannel(chId);
    var detectedWord = text.match(reJapaneseWord);
    if (detectedWord) {
      var word = detectedWord[2] || detectedWord[1];
      if (channel.getCurrentWord() == '' || areWordsShiritoriCompliant(channel.getCurrentWord(), word, this._options.optionalRules)) {
        request.get({url: 'https://glosbe.com/gapi/translate', qs: {from: 'ja', dest: 'en', phrase: word, format: 'json'}}, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var _body = JSON.parse(body);
            if (_body.tuc.length) {
              channel.setCurrentWord(word);
              channel.getPlayer(uId).setState(Channel.states.turnOver);
            } else {
              channel.getPlayer(uId).setState(Channel.states.wrongWord);
            }
          }
        });
      } else {
        if (['ン', 'ん'].indexOf(word[word.length - 1]) !== -1) {
          channel.getPlayer(uId).setState(Channel.states.lost);
        } else {
          channel.getPlayer(uId).setState(Channel.states.wrongWord);
        }
      }
    }
    ''.match(reJapaneseWord); // clean matches array
  }
}

module.exports = function (options) {
  return new Game(options);
};
