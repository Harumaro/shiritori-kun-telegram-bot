# shiritori-kun-telegram-bot
### A node.js bot for Telegram to play the Shiritori game.

**Configuration**:

You need to add your telegram bot token in [index.js#1](https://github.com/Harumaro/shiritori-kun-telegram-bot/blob/master/index.js#L1)
```
var tg = require('telegram-node-bot')('insert-telegram-bot-token-here');
```

**Usage**:
- /word **word-in-kanji[i.e.: 漢字]** **word-in-kana[i.e.: かんじ]**: sends a word to the game, accepts both half-width and full-width space between characters.
- (alt. version) **word-in-kana[i.e.: サマー]** *translation[i.e.: summer]*
- .remove **word-in-kanji**: removes a word from the database
- .reset: cleans the whole database of words

**Customization**:

You can set some optional parameters to be used in the game [index.js#4](https://github.com/Harumaro/shiritori-kun-telegram-bot/blob/master/index.js#L2)
```
var game = require('./lib/game')({
  timeout: -1, // set to -1 for no timeout, or set timeout in milliseconds
  optionalRules: {
    longVowelFallbackToPreviousKanaIsValid: true|false,
    allowNKana: true|false,
    smallKanaFallbackToPreviousKanaIsValid: true|false
  }
});
```

As for optional rules, so far you can choose to:
- when words end in the long vowel sign, allow also words starting with the previous syllable by setting the _longVowelFallbackToPreviousKanaIsValid_ flag to true; alternatively disallow this behaviour by setting it to false, in this case only words starting by vowels will be allowed.
- when words end in N, allow the game to continue with a custom rule falling back on the な行 by setting the _allowNKana_ flag to true. This might be useful if you plan to use your game for learning purposes.
- when words end in a 拗音 (contracted sound), allow the next word whether it starts with the entire contracted sound or with や,ゆ or よ by setting the _smallKanaFallbackToPreviousKanaIsValid_ flag to true; alternatively set it to false to only accept や,ゆ or よ as the next word starting syllable.

**Future developments**:

Store words on a database and check whether duplicates are present.
