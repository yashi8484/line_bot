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
let turn_count = 0;

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  let reply_messages = []

  if (!domemo.started) {
    switch(event.message.text) {
      case 'スタート':
      case 'start':
      case 'すたーと':
        turn_count = 0;
        domemo.start();
        initBotAI();
        reply_messages.push(
          'ゲームスタート！',
          `botの手札は${domemo.openBotTiles().map(n => `[${convertToTwoBytesChar(String(n))}]`).join(' ')}`,
          `場の札は${domemo.openFieldTiles().map(n => `[${convertToTwoBytesChar(String(n))}]`).join(' ')}`,
          `playerの手札は残り${domemo.openPlayerTilesCount()}枚です`,
          '数字を1つ宣言してください'
        )
        break
    }
  }
  else {
    switch(event.message.text) {
      case '確認':
      case 'かくにん':
      case 'カクニン':
        // 状況確認
        reply_messages.push(
          `botの手札は${domemo.openBotTiles().map(n => `[${convertToTwoBytesChar(String(n))}]`).join(' ')}`,
          `場の札は${domemo.openFieldTiles().map(n => `[${convertToTwoBytesChar(String(n))}]`).join(' ')}`,
          `playerの手札は残り${domemo.openPlayerTilesCount()}枚です`,
        )
        break
      default:
        // 数字宣言されたとき
        // バリデーション
        if (event.message.text.length !== 1 || !isFinite(convertToOneBytesChar(event.message.text))) {
          return Promise.resolve(null);
        }
        let is_correct_answer = false

        // 宣言した数をプレイヤーのtileから1つ取り除く
        if (domemo.removeFromPlayerTiles(+convertToOneBytesChar(event.message.text)) > 0) {
          // 取り除けた場合
          is_correct_answer = true
          reply_messages.push(`正解！`)
        }
        else {
          // 取り除けなかった場合
          reply_messages.push(`不正解`)
        }
        reply_messages.push(`あなたの手札は残り${domemo.openPlayerTilesCount()}枚です`)

        // 正解したら連続でもう一回
        if (!domemo.isGameEnd() && is_correct_answer) {
          reply_messages.push(`正解したのでもう1つ数字を宣言できます`)
        }
        else if (!is_correct_answer) {
          // botの手番を行う
          reply_messages.push(playBotTurn())
        }
        turn_count++

        if (domemo.isGameEnd()) {
          reply_messages.push(`ゲーム終了！${turn_count}ターンで${domemo.getGameResult()}`)
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

let bot_ai_candidate_tiles

// botのAI初期化
// 全tile - プレイヤーのtile - 場のtile = AIが選択するtileの候補
function initBotAI() {
  bot_ai_candidate_tiles = domemo.openAllTiles()
  let player_tiles = domemo.openPlayerTiles()
  let field_tiles = domemo.openFieldTiles()
  player_tiles.forEach((num) => {
    bot_ai_candidate_tiles.splice(bot_ai_candidate_tiles.indexOf(num), 1)
  })
  field_tiles.forEach((num) => {
    bot_ai_candidate_tiles.splice(bot_ai_candidate_tiles.indexOf(num), 1)
  })
}

// botの順番を一回行う
// 1. 選択候補の中からランダムで1つ選ぶ
// 2. 選んだ数を選択候補から除く
function playBotTurn() {
  let bot_play_log_message = ''
  let is_correct_answer = false
  let select_num_index = Math.floor(Math.random() * bot_ai_candidate_tiles.length)

  bot_play_log_message += 'botのターンを行います...'

  let select_num = bot_ai_candidate_tiles[select_num_index]
  bot_play_log_message += `\n数字を宣言：${convertToTwoBytesChar(String(select_num))}`

  if (domemo.removeFromBotTiles(bot_ai_candidate_tiles[select_num_index]) > 0) {
    // 取り除けた場合
    is_correct_answer = true
    bot_play_log_message += '\n正解！'
  }
  else {
    // 取り除けなかった場合
    bot_play_log_message += '\n不正解'
  }
  bot_ai_candidate_tiles.splice(select_num_index, 1)
  bot_play_log_message += `botの手札は残り${domemo.openBotTilesCount()}枚です`

  // 正解したら連続でもう一回
  if (!domemo.isGameEnd() && is_correct_answer) {
    bot_play_log_message += `\n正解したのでもう一回`
    bot_play_log_message += playBotTurn()
  }

  return bot_play_log_message
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);
