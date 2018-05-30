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
    this.started = false
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

    // botのtileを選択する
    this.bot_tiles = this.distributeTiles(HAND_TILE_COUNT)
    // console.log(this.bot_tiles)

    // プレイヤーのtileを選択する
    this.player_tiles = this.distributeTiles(HAND_TILE_COUNT)
    // console.log(this.player_tiles)

    // 場のtileを選択する
    this.field_tiles = this.distributeTiles(FIELD_TILE_COUNT)
    // console.log(this.field_tiles)

    // 余り=除外
    // console.log(this.all_tiles)

    this.started = true
  }

  // 札を配る
  distributeTiles(tile_count) {
    let tiles = []
    if (this.all_tiles.length < tile_count) {
      // tile残り枚数が手札枚数以下:配れない
      return tiles
    }
    while (tiles.length < tile_count) {
      let selected_num = Math.floor(Math.random() * MAX_TILE_NUMBER) + 1
      let num_tile_index = this.all_tiles.indexOf(selected_num)
      if (num_tile_index >= 0) {
        tiles.push(this.all_tiles[num_tile_index])
        this.all_tiles.splice(num_tile_index, 1)
      }
    }
    return tiles
  }

  // botのtileを公開する
  openBotTiles() {
    return this.bot_tiles
  }

  // プレイヤーのtile枚数を公開する
  openPlayerTilesCount() {
    return this.player_tiles.length
  }

  // 場のtileを公開する
  openFieldTiles() {
    return this.field_tiles
  }

  // 当たり外れを判定する

  // プレイヤーに回答権があるかを判定する

  // ゲーム終了か判定する
}
