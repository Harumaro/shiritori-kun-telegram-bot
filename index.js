var tg = require('telegram-node-bot')('insert-telegram-bot-token-here');
var game = require('./lib/game')({
  timeout: 10000,
  optionalRules: {
    longVowelFallbackToPreviousKanaIsValid: true,
    smallKanaFallbackToPreviousKanaIsValid: true
  }
});
var GameStates = game.e;

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

GameStates.on('game_over', function (chId) {
  var channel = game.getChannel(chId);
  tg.sendMessage(channel.getId(), "Cannot play alone, game's over! Start a new one perhaps?");
});

GameStates.on('user_state_changed', function (chId, uId, state) {
  console.log('INDEX Triggered state: ' + state + ' for user: ' + uId);
  var channel = game.getChannel(chId);

  if (state == game.states.join) {
    tg.sendMessage(channel.getId(), 'A new challenger joined the game!');
  }
  if (state == game.states.ownTurn) {
    tg.sendMessage(channel.getId(), "It's " + channel.getPlayer(uId).getName() + "'s turn.");
  }
  if (state == game.states.lost) {
    tg.sendMessage(channel.getId(), channel.getPlayer(uId).getName() + ' lost!');
  }
  if (state == game.states.turnSkipped) {
    tg.sendMessage(channel.getId(), 'Turn skipped!');
  }
  if (state == game.states.wrongWord) {
    tg.sendMessage(channel.getId(), 'Word not allowed or not found on dictionaries.');
  }
  if (state == game.states.turnOver) {
  }
  if (!state) {
    console.log('Unknown State');
  }
});
