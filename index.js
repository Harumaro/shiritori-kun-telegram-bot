require('dotenv').config({path: __dirname + '/.env'});

var tg = require('telegram-node-bot')(process.env.BOT_TOKEN);
var game = require('./lib/game')({
  timeout: 10000,
  optionalRules: {
    longVowelFallbackToPreviousKanaIsValid: true,
    smallKanaFallbackToPreviousKanaIsValid: true
  }
});

tg.router
  .when(['/ping', '/quit', '/play'], 'MainController')
  .when(['/word :word'], 'GameController')
  .otherwise('GameController');

tg.controller('MainController', ($) => {
  tg.for('/play', ($) => {
    if (!game.getChannel($.message.chat.id).isPlaying($.user.id)) {
      $.runInlineMenu('sendMessage', 'Wanna play Shiritori?', {}, [
        {
          text: 'Join',
          callback: ($) => {
            game.newPlayer($.from.id, $.from.first_name, $.message.chat.id);
          }
        }
      ], [1]);
    } else {
      $.sendMessage('You are already playing.');
    }
  });

  tg.for('/quit', ($) => {
    if (game.getChannel($.message.chat.id).isPlaying($.user.id)) {
      $.runInlineMenu('sendMessage', 'Quit the game?', {}, [
        {
          text: 'Yes',
          callback: ($) => {
            game.leave($.from.id, $.message.chat.id);
          }
        },
        {
          text: 'No',
          callback: ($) => {
          }
        }
      ], [2]);
    } else {
      $.sendMessage('You are not playing.');
    }
  });

  tg.for('/ping', ($) => {
    $.sendMessage('pong');
  });
});

tg.controller('GameController', ($) => {
  tg.for('/word :word', ($) => {
    var channel = game.getChannel($.message.chat.id);
    if (channel.isPlaying($.user.id)) {
      if ($.user.id == channel.getQueue()[channel.getCurrentPlayer()]) {
        game.analyseWord($.query.word, $.user.id, $.message.chat.id);
      } else {
        $.sendMessage('Not your turn.');
      }
    }
  });
});

game.on('game_over', function (chId) {
  var channel = game.getChannel(chId);
  tg.sendMessage(channel.getId(), "Cannot play alone, game's over! Start a new one perhaps?");
});

game.on(game.states.join, function (channel) {
  tg.sendMessage(channel.getId(), 'A new challenger joined the game!');
});

game.on(game.states.ownTurn, function (channel) {
  var queue = channel.getQueue();
  var currentPlayer = channel.getCurrentPlayer();
  tg.sendMessage(channel.getId(), "It's " + channel.getPlayer(queue[currentPlayer]).getName() + "'s turn.");
});

game.on(game.states.turnOver, function (channel) {});

game.on(game.states.turnSkipped, function (channel) {
  var queue = channel.getQueue();
  var currentPlayer = channel.getCurrentPlayer();
  var previousPlayer = --currentPlayer >= 0 ? currentPlayer : queue.length - 1;
  tg.sendMessage(channel.getId(), channel.getPlayer(queue[previousPlayer]).getName() + ' skipped the turn!');
});
game.on(game.states.wrongWord, function (channel) {
  tg.sendMessage(channel.getId(), 'Word not allowed or not found on dictionaries.');
});

game.on(game.states.lost, function (channel, player) {
  tg.sendMessage(channel.getId(), player.getName() + ' lost!');
});

game.on('game_over', function (channel) {
  tg.sendMessage(channel.getId(), "Cannot play alone, game's over! Start a new one perhaps?");
});

process.on('SIGINT', function () {
  process.exit();
});
