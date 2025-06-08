/**
 * テトリミノの定義と操作に関するクラス
 */
class Tetromino {
    /**
     * テトリミノのタイプと初期位置を指定して初期化
     * @param {string} type - テトリミノのタイプ（I, O, T, S, Z, J, L）
     * @param {number} x - 初期位置のX座標
     * @param {number} y - 初期位置のY座標
     */
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.rotation = 0; // 0, 1, 2, 3 (0, 90, 180, 270度)
        
        // テトリミノの色を定義
        this.colors = {
            'I': '#00FFFF', // シアン
            'O': '#FFFF00', // イエロー
            'T': '#800080', // パープル
            'S': '#00FF00', // グリーン
            'Z': '#FF0000', // レッド
            'J': '#0000FF', // ブルー
            'L': '#FF7F00'  // オレンジ
        };
        
        // テトリミノの形状を定義（各回転状態での形状）
        this.shapes = {
            'I': [
                [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
                [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
                [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
                [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]]
            ],
            'O': [
                [[1, 1], [1, 1]],
                [[1, 1], [1, 1]],
                [[1, 1], [1, 1]],
                [[1, 1], [1, 1]]
            ],
            'T': [
                [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
                [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
                [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
                [[0, 1, 0], [1, 1, 0], [0, 1, 0]]
            ],
            'S': [
                [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
                [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
                [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
                [[1, 0, 0], [1, 1, 0], [0, 1, 0]]
            ],
            'Z': [
                [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
                [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
                [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
                [[0, 1, 0], [1, 1, 0], [1, 0, 0]]
            ],
            'J': [
                [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
                [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
                [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
                [[0, 1, 0], [0, 1, 0], [1, 1, 0]]
            ],
            'L': [
                [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
                [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
                [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
                [[1, 1, 0], [0, 1, 0], [0, 1, 0]]
            ]
        };
    }
    
    /**
     * 現在の回転状態での形状を取得
     * @returns {Array<Array<number>>} 現在の形状
     */
    getShape() {
        return this.shapes[this.type][this.rotation];
    }
    
    /**
     * テトリミノの色を取得
     * @returns {string} テトリミノの色（CSS色文字列）
     */
    getColor() {
        return this.colors[this.type];
    }
    
    /**
     * テトリミノを時計回りに回転
     */
    rotateClockwise() {
        this.rotation = (this.rotation + 1) % 4;
    }
    
    /**
     * テトリミノを反時計回りに回転
     */
    rotateCounterClockwise() {
        this.rotation = (this.rotation + 3) % 4; // +3 は -1 と同じだが、負の数を避ける
    }
    
    /**
     * テトリミノを移動
     * @param {number} dx - X方向の移動量
     * @param {number} dy - Y方向の移動量
     */
    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }
    
    /**
     * テトリミノのコピーを作成
     * @returns {Tetromino} テトリミノのコピー
     */
    clone() {
        const copy = new Tetromino(this.type, this.x, this.y);
        copy.rotation = this.rotation;
        return copy;
    }
}

/**
 * テトリミノを生成するファクトリークラス
 */
class TetrominoFactory {
    constructor() {
        this.types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        this.bag = []; // 7種類のテトリミノを一巡分保持するバッグ
    }
    
    /**
     * 新しいテトリミノをランダムに生成
     * @param {number} x - 初期位置のX座標
     * @param {number} y - 初期位置のY座標
     * @returns {Tetromino} 生成されたテトリミノ
     */
    createRandomTetromino(x, y) {
        // バッグが空の場合、新しく7種類のテトリミノをシャッフルして詰める
        if (this.bag.length === 0) {
            this.bag = [...this.types];
            this.shuffleBag();
        }
        
        // バッグから1つ取り出す
        const type = this.bag.pop();
        
        return new Tetromino(type, x, y);
    }
    
    /**
     * バッグをシャッフル
     */
    shuffleBag() {
        for (let i = this.bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
        }
    }
} 
