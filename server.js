'use strict';

const express = require('express');
const line    = require('@line/bot-sdk');
const Domemo = require('./domemo.js')

const PORT = process.env.PORT || 3000;

const config = {
  channelAccessToken: 'fugafuga',
  channelSecret: 'hogehoge'
};

const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
  console.log(req.body.events);
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

const client = new line.Client(config);
let domemo = new Domemo();

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  if (!domemo.started) {
    if (event.message.text === 'スタート' || event.message.text === 'start') {
      domemo.start();
      return client.replyMessage(event.replyToken,
        createTextMessages(
          'ゲームスタート！',
          `私の手札は${domemo.openBotTiles().map(n => `「${convertToTwoBytesChar(String(n))}」`).join('')}`,
          `場の札は${domemo.openFieldTiles().map(n => `「${convertToTwoBytesChar(String(n))}」`).join('')}`,
          `あなたの手札は残り${domemo.openPlayerTilesCount()}枚です`,
        )
      );
    }
  }
  else {
    // 宣言した数があっているか判定

  }

}

// メッセージオブジェクトの配列を作成
// LINE BOTの仕様上、最大数は5つまで。
// 6つ以上のメッセージ文字列が指定された場合、最初の5つのみを返す。
function createTextMessages() {
  let messages = []
  for (let i = 0; i < arguments.length && i < 5; i++) {
    messages.push({
      type: 'text',
      text: arguments[i]
    })
  }
  return messages
}

// 半角→全角変換
function convertToTwoBytesChar(str) {
  return str.replace(/./g, (c) => {
    return String.fromCharCode(c.charCodeAt(0) + 65248)
  })
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);
