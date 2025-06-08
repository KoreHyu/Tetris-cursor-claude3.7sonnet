/**
 * テトリスゲームのメインロジッククラス
 */
class TetrisGame {
    /**
     * ゲームの初期化
     * @param {Object} options - ゲームオプション
     */
    constructor(options = {}) {
        // ゲームの設定
        this.options = Object.assign({
            width: 10,          // フィールドの幅
            height: 20,         // フィールドの高さ
            initialLevel: 1,    // 初期レベル
            difficulty: 'normal' // 難易度 (easy, normal, hard)
        }, options);
        
        // 難易度による速度の調整係数
        this.difficultyFactor = {
            'easy': 1.5,
            'normal': 1.0,
            'hard': 0.6
        };
        
        // ゲームの状態
        this.state = {
            isPlaying: false,
            isPaused: false,
            isGameOver: false,
            score: 0,
            level: this.options.initialLevel,
            lines: 0,
            field: this.createEmptyField(),
            dropSpeed: 1000,    // ミリ秒単位の落下速度（レベルに応じて変化）
            lockDelay: 500,     // ミリ秒単位のロック遅延
            lastMoveTime: 0,    // 最後に移動した時間
            ghostEnabled: true  // ゴーストピースの表示
        };
        
        // テトリミノファクトリーの作成
        this.tetrominoFactory = new TetrominoFactory();
        
        // 現在のテトリミノ、次のテトリミノ、ホールドテトリミノの初期化
        this.currentTetromino = null;
        this.nextTetromino = null;
        this.holdTetromino = null;
        this.canHold = true; // ホールドが可能かどうか
        
        // タイマーの初期化
        this.dropTimer = null;
        this.lockTimer = null;
        
        // イベントリスナーの初期化
        this.eventListeners = {
            'gameOver': [],
            'scoreUpdate': [],
            'levelUp': [],
            'lineClear': []
        };
        
        // 音声エフェクトの音量設定
        this.soundVolume = {
            bgm: 0.5,
            se: 0.5
        };
        
        // ゲームループの設定
        this.lastFrameTime = 0;
        this.requestAnimationId = null;
    }
    
    /**
     * 空のフィールドを作成
     * @returns {Array<Array<number>>} 空のフィールド
     */
    createEmptyField() {
        const field = [];
        for (let y = 0; y < this.options.height; y++) {
            field[y] = [];
            for (let x = 0; x < this.options.width; x++) {
                field[y][x] = null; // null は空のセル
            }
        }
        return field;
    }
    
    /**
     * ゲームを開始
     */
    start() {
        // ゲーム状態をリセット
        this.state.isPlaying = true;
        this.state.isPaused = false;
        this.state.isGameOver = false;
        this.state.score = 0;
        this.state.level = this.options.initialLevel;
        this.state.lines = 0;
        this.state.field = this.createEmptyField();
        this.state.dropSpeed = this.calculateDropSpeed();
        
        // テトリミノをリセット
        this.currentTetromino = null;
        this.nextTetromino = null;
        this.holdTetromino = null;
        this.canHold = true;
        
        // 最初のテトリミノを生成
        this.generateNextTetromino();
        this.spawnTetromino();
        
        // ゲームループを開始
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }
    
    /**
     * ゲームを一時停止
     */
    pause() {
        if (!this.state.isPlaying || this.state.isGameOver) return;
        
        this.state.isPaused = true;
        this.stopDropTimer();
        this.stopLockTimer();
        
        if (this.requestAnimationId) {
            cancelAnimationFrame(this.requestAnimationId);
            this.requestAnimationId = null;
        }
    }
    
    /**
     * ゲームを再開
     */
    resume() {
        if (!this.state.isPlaying || this.state.isGameOver || !this.state.isPaused) return;
        
        this.state.isPaused = false;
        this.startDropTimer();
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }
    
    /**
     * ゲームオーバー処理
     */
    gameOver() {
        this.state.isPlaying = false;
        this.state.isGameOver = true;
        this.stopDropTimer();
        this.stopLockTimer();
        
        if (this.requestAnimationId) {
            cancelAnimationFrame(this.requestAnimationId);
            this.requestAnimationId = null;
        }
        
        // ゲームオーバーイベントを発火
        this.fireEvent('gameOver', { score: this.state.score });
    }
    
    /**
     * テトリミノを生成
     */
    generateNextTetromino() {
        // 次のテトリミノを生成
        this.nextTetromino = this.tetrominoFactory.createRandomTetromino(0, 0);
    }
    
    /**
     * テトリミノをフィールドに配置
     */
    spawnTetromino() {
        if (this.nextTetromino === null) {
            this.generateNextTetromino();
        }
        
        // 現在のテトリミノを設定
        this.currentTetromino = this.nextTetromino;
        
        // テトリミノの初期位置を設定
        this.currentTetromino.x = Math.floor(this.options.width / 2) - Math.floor(this.currentTetromino.getShape()[0].length / 2);
        this.currentTetromino.y = 0;
        
        // 次のテトリミノを生成
        this.generateNextTetromino();
        
        // 衝突チェック（配置できない場合はゲームオーバー）
        if (this.checkCollision(this.currentTetromino)) {
            this.gameOver();
            return;
        }
        
        // ドロップタイマーを開始
        this.startDropTimer();
    }
    
    /**
     * ドロップタイマーを開始
     */
    startDropTimer() {
        this.stopDropTimer();
        this.dropTimer = setTimeout(() => this.dropTetromino(), this.state.dropSpeed);
    }
    
    /**
     * ドロップタイマーを停止
     */
    stopDropTimer() {
        if (this.dropTimer) {
            clearTimeout(this.dropTimer);
            this.dropTimer = null;
        }
    }
    
    /**
     * ロックタイマーを開始
     */
    startLockTimer() {
        this.stopLockTimer();
        this.lockTimer = setTimeout(() => this.lockTetromino(), this.state.lockDelay);
    }
    
    /**
     * ロックタイマーを停止
     */
    stopLockTimer() {
        if (this.lockTimer) {
            clearTimeout(this.lockTimer);
            this.lockTimer = null;
        }
    }
    
    /**
     * テトリミノを下に移動
     */
    dropTetromino() {
        if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver) return;
        
        // テトリミノを下に移動
        this.currentTetromino.move(0, 1);
        
        // 衝突チェック
        if (this.checkCollision(this.currentTetromino)) {
            // 衝突した場合は位置を戻し、ロックタイマーを開始
            this.currentTetromino.move(0, -1);
            this.startLockTimer();
        } else {
            // 衝突しなかった場合は次のドロップタイマーを開始
            this.startDropTimer();
        }
    }
    
    /**
     * テトリミノを左に移動
     */
    moveLeft() {
        if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver) return;
        
        this.currentTetromino.move(-1, 0);
        
        if (this.checkCollision(this.currentTetromino)) {
            this.currentTetromino.move(1, 0);
        } else {
            this.state.lastMoveTime = performance.now();
            this.resetLockTimerIfAtBottom();
        }
    }
    
    /**
     * テトリミノを右に移動
     */
    moveRight() {
        if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver) return;
        
        this.currentTetromino.move(1, 0);
        
        if (this.checkCollision(this.currentTetromino)) {
            this.currentTetromino.move(-1, 0);
        } else {
            this.state.lastMoveTime = performance.now();
            this.resetLockTimerIfAtBottom();
        }
    }
    
    /**
     * テトリミノを時計回りに回転
     */
    rotateCW() {
        if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver) return;
        
        const originalRotation = this.currentTetromino.rotation;
        this.currentTetromino.rotateClockwise();
        
        // 回転後に衝突する場合は壁蹴りを試みる
        if (this.checkCollision(this.currentTetromino)) {
            // 基本的な壁蹴り（左右1マス）
            const kicks = [
                { dx: -1, dy: 0 }, // 左に1マス
                { dx: 1, dy: 0 },  // 右に1マス
                { dx: 0, dy: -1 }, // 上に1マス
                { dx: -2, dy: 0 }, // 左に2マス
                { dx: 2, dy: 0 }   // 右に2マス
            ];
            
            let kickSucceeded = false;
            
            for (const kick of kicks) {
                this.currentTetromino.move(kick.dx, kick.dy);
                
                if (!this.checkCollision(this.currentTetromino)) {
                    kickSucceeded = true;
                    break;
                }
                
                // キックに失敗したら位置を戻す
                this.currentTetromino.move(-kick.dx, -kick.dy);
            }
            
            // すべてのキックに失敗した場合は回転をキャンセル
            if (!kickSucceeded) {
                this.currentTetromino.rotation = originalRotation;
            } else {
                this.state.lastMoveTime = performance.now();
                this.resetLockTimerIfAtBottom();
            }
        } else {
            this.state.lastMoveTime = performance.now();
            this.resetLockTimerIfAtBottom();
        }
    }
    
    /**
     * テトリミノを反時計回りに回転
     */
    rotateCCW() {
        if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver) return;
        
        const originalRotation = this.currentTetromino.rotation;
        this.currentTetromino.rotateCounterClockwise();
        
        // 回転後に衝突する場合は壁蹴りを試みる
        if (this.checkCollision(this.currentTetromino)) {
            // 基本的な壁蹴り（左右1マス）
            const kicks = [
                { dx: -1, dy: 0 }, // 左に1マス
                { dx: 1, dy: 0 },  // 右に1マス
                { dx: 0, dy: -1 }, // 上に1マス
                { dx: -2, dy: 0 }, // 左に2マス
                { dx: 2, dy: 0 }   // 右に2マス
            ];
            
            let kickSucceeded = false;
            
            for (const kick of kicks) {
                this.currentTetromino.move(kick.dx, kick.dy);
                
                if (!this.checkCollision(this.currentTetromino)) {
                    kickSucceeded = true;
                    break;
                }
                
                // キックに失敗したら位置を戻す
                this.currentTetromino.move(-kick.dx, -kick.dy);
            }
            
            // すべてのキックに失敗した場合は回転をキャンセル
            if (!kickSucceeded) {
                this.currentTetromino.rotation = originalRotation;
            } else {
                this.state.lastMoveTime = performance.now();
                this.resetLockTimerIfAtBottom();
            }
        } else {
            this.state.lastMoveTime = performance.now();
            this.resetLockTimerIfAtBottom();
        }
    }
    
    /**
     * ソフトドロップ（テトリミノを早く落下させる）
     */
    softDrop() {
        if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver) return;
        
        this.stopDropTimer();
        
        this.currentTetromino.move(0, 1);
        
        if (this.checkCollision(this.currentTetromino)) {
            this.currentTetromino.move(0, -1);
            this.startLockTimer();
        } else {
            // ソフトドロップは1ラインあたり1点追加
            this.addScore(1);
            this.startDropTimer();
        }
    }
    
    /**
     * ハードドロップ（テトリミノを即座に最下部まで落下させる）
     */
    hardDrop() {
        if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver) return;
        
        this.stopDropTimer();
        this.stopLockTimer();
        
        let dropDistance = 0;
        
        // 衝突するまで下に移動
        while (!this.checkCollision(this.currentTetromino)) {
            this.currentTetromino.move(0, 1);
            dropDistance++;
        }
        
        // 最後の移動を戻す
        this.currentTetromino.move(0, -1);
        dropDistance--;
        
        // ハードドロップは2ライン落下あたり1点追加
        this.addScore(dropDistance * 2);
        
        // テトリミノを即座にロック
        this.lockTetromino();
    }
    
    /**
     * テトリミノをホールド
     */
    holdTetromino() {
        if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver || !this.canHold) return;
        
        this.stopDropTimer();
        this.stopLockTimer();
        
        if (this.holdTetromino === null) {
            // 初めてのホールド
            this.holdTetromino = this.currentTetromino;
            this.spawnTetromino();
        } else {
            // ホールドの交換
            const temp = this.holdTetromino;
            this.holdTetromino = this.currentTetromino;
            this.currentTetromino = temp;
            
            // テトリミノの位置を初期化
            this.currentTetromino.x = Math.floor(this.options.width / 2) - Math.floor(this.currentTetromino.getShape()[0].length / 2);
            this.currentTetromino.y = 0;
            
            // 配置できない場合はゲームオーバー
            if (this.checkCollision(this.currentTetromino)) {
                this.gameOver();
                return;
            }
        }
        
        // ホールドしたテトリミノの回転を初期化
        this.holdTetromino.rotation = 0;
        
        // ホールドフラグを無効化（次のテトリミノが配置されるまでホールド不可）
        this.canHold = false;
        
        // ドロップタイマーを再開
        this.startDropTimer();
    }
    
    /**
     * テトリミノをフィールドに固定
     */
    lockTetromino() {
        if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver) return;
        
        this.stopDropTimer();
        this.stopLockTimer();
        
        // 現在のテトリミノをフィールドに固定
        const shape = this.currentTetromino.getShape();
        const color = this.currentTetromino.getColor();
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const fieldX = this.currentTetromino.x + x;
                    const fieldY = this.currentTetromino.y + y;
                    
                    if (fieldY >= 0 && fieldY < this.options.height && 
                        fieldX >= 0 && fieldX < this.options.width) {
                        this.state.field[fieldY][fieldX] = color;
                    }
                }
            }
        }
        
        // ラインクリアをチェック
        const clearedLines = this.checkLineClear();
        
        if (clearedLines > 0) {
            // スコア加算
            this.addScore(this.calculateLineClearScore(clearedLines));
            
            // ライン数を更新
            this.state.lines += clearedLines;
            
            // レベルアップをチェック
            this.checkLevelUp();
            
            // ラインクリアイベントを発火
            this.fireEvent('lineClear', { lines: clearedLines });
        }
        
        // ホールドフラグをリセット
        this.canHold = true;
        
        // 次のテトリミノを配置
        this.spawnTetromino();
    }
    
    /**
     * テトリミノと壁/フィールドの衝突をチェック
     * @param {Tetromino} tetromino - チェックするテトリミノ
     * @returns {boolean} 衝突する場合はtrue
     */
    checkCollision(tetromino) {
        const shape = tetromino.getShape();
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const fieldX = tetromino.x + x;
                    const fieldY = tetromino.y + y;
                    
                    // 壁との衝突チェック
                    if (fieldX < 0 || fieldX >= this.options.width || fieldY >= this.options.height) {
                        return true;
                    }
                    
                    // 既存のブロックとの衝突チェック（フィールドの上部は無視）
                    if (fieldY >= 0 && this.state.field[fieldY][fieldX] !== null) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    /**
     * テトリミノが底に着地しているかチェック
     * @returns {boolean} 底に着地している場合はtrue
     */
    isAtBottom() {
        const testTetromino = this.currentTetromino.clone();
        testTetromino.move(0, 1);
        return this.checkCollision(testTetromino);
    }
    
    /**
     * 底に着地している場合にロックタイマーをリセット
     */
    resetLockTimerIfAtBottom() {
        if (this.isAtBottom()) {
            this.startLockTimer();
        }
    }
    
    /**
     * ラインクリアをチェックして消去
     * @returns {number} 消去したライン数
     */
    checkLineClear() {
        let clearedLines = 0;
        
        for (let y = this.options.height - 1; y >= 0; y--) {
            let lineFilled = true;
            
            for (let x = 0; x < this.options.width; x++) {
                if (this.state.field[y][x] === null) {
                    lineFilled = false;
                    break;
                }
            }
            
            if (lineFilled) {
                // ラインを消去し、上のラインを下に移動
                for (let yy = y; yy > 0; yy--) {
                    for (let x = 0; x < this.options.width; x++) {
                        this.state.field[yy][x] = this.state.field[yy-1][x];
                    }
                }
                
                // 最上段を空にする
                for (let x = 0; x < this.options.width; x++) {
                    this.state.field[0][x] = null;
                }
                
                clearedLines++;
                
                // 同じラインを再チェック（連続消去の場合）
                y++;
            }
        }
        
        return clearedLines;
    }
    
    /**
     * ラインクリアによるスコア計算
     * @param {number} lines - 消去したライン数
     * @returns {number} 獲得スコア
     */
    calculateLineClearScore(lines) {
        // 基本スコア（1ライン: 100, 2ライン: 300, 3ライン: 500, 4ライン: 800）
        const baseScores = [0, 100, 300, 500, 800];
        // レベルによる倍率
        const levelMultiplier = this.state.level;
        
        return baseScores[lines] * levelMultiplier;
    }
    
    /**
     * スコアを加算
     * @param {number} points - 追加するポイント
     */
    addScore(points) {
        this.state.score += points;
        this.fireEvent('scoreUpdate', { score: this.state.score });
    }
    
    /**
     * レベルアップをチェック
     */
    checkLevelUp() {
        // 10ラインごとにレベルアップ
        const newLevel = Math.floor(this.state.lines / 10) + this.options.initialLevel;
        
        if (newLevel > this.state.level) {
            this.state.level = newLevel;
            this.state.dropSpeed = this.calculateDropSpeed();
            this.fireEvent('levelUp', { level: this.state.level });
        }
    }
    
    /**
     * レベルに応じた落下速度を計算
     * @returns {number} ミリ秒単位の落下速度
     */
    calculateDropSpeed() {
        // レベルに応じて落下速度を増加（800ms→最小200ms）
        const baseSpeed = Math.max(800 - (this.state.level - 1) * 60, 200);
        return baseSpeed * this.difficultyFactor[this.options.difficulty];
    }
    
    /**
     * ゴーストピースの位置を計算
     * @returns {Object} ゴーストピースの位置 { x, y, shape }
     */
    getGhostPosition() {
        if (!this.state.ghostEnabled || !this.currentTetromino) return null;
        
        const ghost = this.currentTetromino.clone();
        
        // 衝突するまで下に移動
        while (!this.checkCollision(ghost)) {
            ghost.move(0, 1);
        }
        
        // 最後の移動を戻す
        ghost.move(0, -1);
        
        return {
            x: ghost.x,
            y: ghost.y,
            shape: ghost.getShape(),
            color: ghost.getColor()
        };
    }
    
    /**
     * ゲームループ
     * @param {number} timestamp - 現在のタイムスタンプ
     */
    gameLoop(timestamp = performance.now()) {
        if (!this.state.isPlaying || this.state.isPaused || this.state.isGameOver) return;
        
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        // レンダリングなどの処理は外部で行うため、ここではフレーム更新のみ
        
        this.requestAnimationId = requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * イベントリスナーを追加
     * @param {string} event - イベント名
     * @param {Function} callback - コールバック関数
     */
    addEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }
    
    /**
     * イベントリスナーを削除
     * @param {string} event - イベント名
     * @param {Function} callback - コールバック関数
     */
    removeEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }
    
    /**
     * イベントを発火
     * @param {string} event - イベント名
     * @param {Object} data - イベントデータ
     */
    fireEvent(event, data) {
        if (this.eventListeners[event]) {
            for (const callback of this.eventListeners[event]) {
                callback(data);
            }
        }
    }
    
    /**
     * 難易度を設定
     * @param {string} difficulty - 難易度 (easy, normal, hard)
     */
    setDifficulty(difficulty) {
        if (this.difficultyFactor[difficulty]) {
            this.options.difficulty = difficulty;
            this.state.dropSpeed = this.calculateDropSpeed();
        }
    }
    
    /**
     * BGM音量を設定
     * @param {number} volume - 音量（0.0～1.0）
     */
    setBgmVolume(volume) {
        this.soundVolume.bgm = Math.max(0, Math.min(1, volume));
    }
    
    /**
     * SE音量を設定
     * @param {number} volume - 音量（0.0～1.0）
     */
    setSeVolume(volume) {
        this.soundVolume.se = Math.max(0, Math.min(1, volume));
    }
    
    /**
     * ゴーストピースの表示設定
     * @param {boolean} enabled - 表示するかどうか
     */
    setGhostEnabled(enabled) {
        this.state.ghostEnabled = enabled;
    }
} 
