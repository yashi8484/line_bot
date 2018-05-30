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
let answer_count = 0;

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  let reply_messages = []

  if (!domemo.started) {
    if (event.message.text === 'スタート' || event.message.text === 'start') {
      answer_count = 0;
      domemo.start();
      reply_messages.push(
        'ゲームスタート！',
        `私の手札は${domemo.openBotTiles().map(n => `[${convertToTwoBytesChar(String(n))}]`).join(' ')}`,
        `場の札は${domemo.openFieldTiles().map(n => `[${convertToTwoBytesChar(String(n))}]`).join(' ')}`,
        `あなたの手札は残り${domemo.openPlayerTilesCount()}枚です`,
        '数字を1つ宣言してください'
      )
    }
  }
  else {
    switch(event.message.text) {
      case '確認':
      case 'かくにん':
      case 'カクニン':
        // 状況確認
        reply_messages.push(
          `私の手札は${domemo.openBotTiles().map(n => `[${convertToTwoBytesChar(String(n))}]`).join(' ')}`,
          `場の札は${domemo.openFieldTiles().map(n => `[${convertToTwoBytesChar(String(n))}]`).join(' ')}`,
          `あなたの手札は残り${domemo.openPlayerTilesCount()}枚です`,
        )
        break
      default:
        // 数字宣言されたとき
        // バリデーション
        if (event.message.text.length !== 1 || !isFinite(convertToOneBytesChar(event.message.text))) {
          return Promise.resolve(null);
        }
        answer_count++

        // 宣言した数をプレイヤーのtileから1つ取り除く
        if (domemo.removeFromPlayerTiles(+convertToOneBytesChar(event.message.text)) > 0) {
          // 取り除けた場合
          reply_messages.push(`正解！`)
        }
        else {
          // 取り除けなかった場合
          reply_messages.push(`不正解`)
        }
        reply_messages.push(`あなたの手札は残り${domemo.openPlayerTilesCount()}枚です`)

        if (domemo.isGameEnd()) {
          reply_messages.push(`ゲーム終了！回答回数：${answer_count}回`)
        }
        break
    }
  }
  return client.replyMessage(event.replyToken, createTextMessages(...reply_messages))
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
  return str.replace(/[0-9A-Za-z]/g, (c) => {
    return String.fromCharCode(c.charCodeAt(0) + 0xFEE0)
  })
}

// 全角→半角変換
function convertToOneBytesChar(str) {
  return str.replace(/[０-９Ａ-Ｚａ-ｚ]/g, (c) => {
    return String.fromCharCode(c.charCodeAt(0) - 0xFEE0)
  })
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);
