'use strict';

const MAX_TILE_NUMBER = 7 // 使用する最大の数字
const HAND_TILE_COUNT = 7 // 手札枚数
const FIELD_TILE_COUNT = 7  // 場札枚数

module.exports = class Domemo {
  constructor() {
    this.all_tiles = []
    this.bot_tiles = []
    this.player_tiles = []
    this.field_tiles = []
    this.exclude_tiles = []
    this.started = false
    this.winner = null
  }

  // ゲームスタート
  start() {
    // 全tileを用意
    for (let i = 1; i <= MAX_TILE_NUMBER; i++) {
      for (let j = 1; j <= i; j++) {
        this.all_tiles.push(i);
      }
    }
    // console.log(this.all_tiles)
    // 全tileを除外tileリストに一旦コピー
    // このあと各プレイヤーの手札を配り、余った分が除外分となる
    this.exclude_tiles = this.all_tiles.slice()

    // botのtileを選択する
    this.bot_tiles = this.distributeTiles(HAND_TILE_COUNT)
    this.bot_tiles.sort((x, y) => x - y)
    // console.log(`bot:${this.bot_tiles}`)

    // プレイヤーのtileを選択する
    this.player_tiles = this.distributeTiles(HAND_TILE_COUNT)
    this.player_tiles.sort((x, y) => x - y)
    // console.log(`player:${this.player_tiles}`)

    // 場のtileを選択する
    this.field_tiles = this.distributeTiles(FIELD_TILE_COUNT)
    this.field_tiles.sort((x, y) => x - y)
    // console.log(this.field_tiles)

    // 余り=除外
    // console.log(this.exclude_tiles)

    this.started = true
  }

  // 札を配る
  distributeTiles(tile_count) {
    let tiles = []
    if (this.exclude_tiles.length < tile_count) {
      // tile残り枚数が手札枚数以下:配れない
      return tiles
    }
    while (tiles.length < tile_count) {
      let selected_num = Math.floor(Math.random() * MAX_TILE_NUMBER) + 1
      let num_tile_index = this.exclude_tiles.indexOf(selected_num)
      if (num_tile_index >= 0) {
        tiles.push(this.exclude_tiles[num_tile_index])
        this.exclude_tiles.splice(num_tile_index, 1)
      }
    }
    return tiles
  }

  // 全tileのリストを公開する
  openAllTiles() {
    return this.all_tiles
  }

  // botのtileを公開する
  openBotTiles() {
    return this.bot_tiles
  }

  // botのtile枚数を公開する
  openBotTilesCount() {
    return this.bot_tiles.length
  }

  // プレイヤーのtile枚数を公開する
  openPlayerTilesCount() {
    return this.player_tiles.length
  }

  // プレイヤーのtileを公開する
  openPlayerTiles() {
    return this.player_tiles
  }

  // 場のtileを公開する
  openFieldTiles() {
    return this.field_tiles
  }

  // プレイヤーのtileから取り除く
  // 取り除けた場合は、その数字を返す
  // 取り除いたtileは、場札に移る
  // 取り除けなかった場合は、-1を返す
  removeFromPlayerTiles(num) {
    let num_tile_index = this.player_tiles.indexOf(num)
    if (num_tile_index < 0) {
      return num_tile_index
    }
    this.field_tiles.push(this.player_tiles[num_tile_index])
    this.player_tiles.splice(num_tile_index, 1)
    this.field_tiles.sort((x, y) => x - y)
    return num
  }

  // botのtileから取り除く
  // 取り除けた場合は、その数字を返す
  // 取り除いたtileは、場札に移る
  // 取り除けなかった場合は、-1を返す
  removeFromBotTiles(num) {
    let num_tile_index = this.bot_tiles.indexOf(num)
    if (num_tile_index < 0) {
      return num_tile_index
    }
    this.field_tiles.push(this.bot_tiles[num_tile_index])
    this.bot_tiles.splice(num_tile_index, 1)
    this.field_tiles.sort((x, y) => x - y)
    return num
  }

  // ゲーム終了か判定する
  isGameEnd() {
    if (this.player_tiles.length <= 0) {
      this.started = false
      this.winner = 'player'
      return true
    }
    if (this.bot_tiles.length <= 0) {
      this.started = false
      this.winner = 'bot'
      return true
    }
    return false
  }

  // 結果を取得する
  getGameResult() {
    return `${this.winner}の勝ちです`
  }
}
