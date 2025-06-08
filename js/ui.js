/**
 * テトリスゲームのUI管理クラス
 */
class TetrisUI {
    /**
     * UIの初期化
     * @param {TetrisGame} game - テトリスゲームのインスタンス
     */
    constructor(game) {
        this.game = game;
        
        // キャンバスの取得
        this.gameCanvas = document.getElementById('game-canvas');
        this.nextCanvas = document.getElementById('next-canvas');
        this.holdCanvas = document.getElementById('hold-canvas');
        
        // コンテキストの取得
        this.gameCtx = this.gameCanvas.getContext('2d');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        // ブロックサイズの計算
        this.blockSize = this.gameCanvas.width / this.game.options.width;
        
        // 画面の取得
        this.screens = {
            title: document.getElementById('title-screen'),
            game: document.getElementById('game-screen'),
            pause: document.getElementById('pause-screen'),
            gameOver: document.getElementById('gameover-screen'),
            settings: document.getElementById('settings-screen'),
            highscore: document.getElementById('highscore-screen')
        };
        
        // 表示要素の取得
        this.elements = {
            score: document.getElementById('score'),
            level: document.getElementById('level'),
            lines: document.getElementById('lines'),
            finalScore: document.getElementById('final-score'),
            highscoreEntry: document.getElementById('highscore-entry'),
            playerName: document.getElementById('player-name'),
            highscoreList: document.getElementById('highscore-list')
        };
        
        // ボタンの取得
        this.buttons = {
            start: document.getElementById('start-button'),
            settings: document.getElementById('settings-button'),
            highscore: document.getElementById('highscore-button'),
            pause: document.getElementById('pause-button'),
            resume: document.getElementById('resume-button'),
            restart: document.getElementById('restart-button'),
            exit: document.getElementById('exit-button'),
            retry: document.getElementById('retry-button'),
            backToTitle: document.getElementById('back-to-title'),
            saveScore: document.getElementById('save-score'),
            backFromSettings: document.getElementById('back-from-settings'),
            backFromHighscore: document.getElementById('back-from-highscore')
        };
        
        // 設定項目の取得
        this.settings = {
            bgmVolume: document.getElementById('bgm-volume'),
            seVolume: document.getElementById('se-volume'),
            difficulty: document.getElementById('difficulty'),
            controls: {
                left: document.getElementById('control-left'),
                right: document.getElementById('control-right'),
                softDrop: document.getElementById('control-soft-drop'),
                hardDrop: document.getElementById('control-hard-drop'),
                rotateCW: document.getElementById('control-rotate-cw'),
                rotateCCW: document.getElementById('control-rotate-ccw'),
                hold: document.getElementById('control-hold')
            }
        };
        
        // キー操作のマッピング
        this.keyMap = {
            'ArrowLeft': 'moveLeft',
            'ArrowRight': 'moveRight',
            'ArrowDown': 'softDrop',
            ' ': 'hardDrop',  // スペースキー
            'x': 'rotateCW',
            'z': 'rotateCCW',
            'c': 'holdTetromino',
            'Escape': 'togglePause'
        };
        
        // キーの状態
        this.keyState = {};
        
        // 音声エフェクト
        this.sounds = {
            bgm: null,
            move: null,
            rotate: null,
            drop: null,
            lineClear: null,
            levelUp: null,
            gameOver: null
        };
        
        // 高得点リスト
        this.highscores = this.loadHighscores();
        
        // イベントリスナーの初期化
        this.initEventListeners();
        
        // ゲームイベントの登録
        this.registerGameEvents();
        
        // サウンドの初期化
        this.initSounds();
        
        // 最初の画面を表示
        this.showScreen('title');
    }
    
    /**
     * イベントリスナーを初期化
     */
    initEventListeners() {
        // キーボードイベント
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // ボタンイベント
        this.buttons.start.addEventListener('click', () => this.startGame());
        this.buttons.settings.addEventListener('click', () => this.showScreen('settings'));
        this.buttons.highscore.addEventListener('click', () => this.showHighscores());
        this.buttons.pause.addEventListener('click', () => this.togglePause());
        this.buttons.resume.addEventListener('click', () => this.resumeGame());
        this.buttons.restart.addEventListener('click', () => this.startGame());
        this.buttons.exit.addEventListener('click', () => this.exitGame());
        this.buttons.retry.addEventListener('click', () => this.startGame());
        this.buttons.backToTitle.addEventListener('click', () => this.showScreen('title'));
        this.buttons.saveScore.addEventListener('click', () => this.saveHighscore());
        this.buttons.backFromSettings.addEventListener('click', () => this.showScreen('title'));
        this.buttons.backFromHighscore.addEventListener('click', () => this.showScreen('title'));
        
        // 設定変更イベント
        this.settings.bgmVolume.addEventListener('input', () => {
            const volume = parseInt(this.settings.bgmVolume.value) / 100;
            this.game.setBgmVolume(volume);
            this.updateBgmVolume();
        });
        
        this.settings.seVolume.addEventListener('input', () => {
            const volume = parseInt(this.settings.seVolume.value) / 100;
            this.game.setSeVolume(volume);
        });
        
        this.settings.difficulty.addEventListener('change', () => {
            const difficulty = this.settings.difficulty.value;
            this.game.setDifficulty(difficulty);
        });
    }
    
    /**
     * ゲームイベントを登録
     */
    registerGameEvents() {
        this.game.addEventListener('scoreUpdate', (data) => {
            this.elements.score.textContent = data.score;
        });
        
        this.game.addEventListener('levelUp', (data) => {
            this.elements.level.textContent = data.level;
            this.playSoundEffect('levelUp');
        });
        
        this.game.addEventListener('lineClear', (data) => {
            this.elements.lines.textContent = this.game.state.lines;
            this.playSoundEffect('lineClear');
        });
        
        this.game.addEventListener('gameOver', (data) => {
            this.elements.finalScore.textContent = data.score;
            this.showGameOver(data.score);
            this.playSoundEffect('gameOver');
        });
    }
    
    /**
     * サウンドを初期化
     */
    initSounds() {
        // BGMの設定（実際のプロジェクトではファイルを用意する必要あり）
        this.sounds.bgm = new Audio();
        this.sounds.bgm.loop = true;
        
        // 効果音の設定
        this.sounds.move = new Audio();
        this.sounds.rotate = new Audio();
        this.sounds.drop = new Audio();
        this.sounds.lineClear = new Audio();
        this.sounds.levelUp = new Audio();
        this.sounds.gameOver = new Audio();
    }
    
    /**
     * BGM音量を更新
     */
    updateBgmVolume() {
        if (this.sounds.bgm) {
            this.sounds.bgm.volume = this.game.soundVolume.bgm;
        }
    }
    
    /**
     * 効果音を再生
     * @param {string} type - 効果音の種類
     */
    playSoundEffect(type) {
        if (this.sounds[type]) {
            const sound = this.sounds[type];
            sound.volume = this.game.soundVolume.se;
            sound.currentTime = 0;
            sound.play().catch(() => {
                // ブラウザの自動再生ポリシーによりエラーが発生する場合があるため、
                // エラー処理を追加しておく
            });
        }
    }
    
    /**
     * 画面を表示
     * @param {string} screenName - 表示する画面の名前
     */
    showScreen(screenName) {
        // すべての画面を非表示
        for (const screen in this.screens) {
            this.screens[screen].classList.remove('active');
        }
        
        // 指定した画面を表示
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }
    
    /**
     * ゲームを開始
     */
    startGame() {
        this.showScreen('game');
        this.game.start();
        this.startRendering();
        
        // BGMを再生
        if (this.sounds.bgm) {
            this.sounds.bgm.currentTime = 0;
            this.sounds.bgm.play().catch(() => {
                // ブラウザの自動再生ポリシーによりエラーが発生する場合があるため、
                // エラー処理を追加しておく
            });
        }
    }
    
    /**
     * ゲームを一時停止/再開
     */
    togglePause() {
        if (this.game.state.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }
    
    /**
     * ゲームを一時停止
     */
    pauseGame() {
        if (!this.game.state.isPlaying || this.game.state.isGameOver) return;
        
        this.game.pause();
        this.showScreen('pause');
        
        // BGMを一時停止
        if (this.sounds.bgm) {
            this.sounds.bgm.pause();
        }
    }
    
    /**
     * ゲームを再開
     */
    resumeGame() {
        if (!this.game.state.isPlaying || this.game.state.isGameOver) return;
        
        this.game.resume();
        this.showScreen('game');
        
        // BGMを再開
        if (this.sounds.bgm) {
            this.sounds.bgm.play().catch(() => {});
        }
    }
    
    /**
     * ゲームを終了
     */
    exitGame() {
        this.game.pause();
        this.showScreen('title');
        
        // BGMを停止
        if (this.sounds.bgm) {
            this.sounds.bgm.pause();
            this.sounds.bgm.currentTime = 0;
        }
    }
    
    /**
     * ゲームオーバー画面を表示
     * @param {number} score - 最終スコア
     */
    showGameOver(score) {
        this.showScreen('gameOver');
        
        // ハイスコアかどうかをチェック
        const isHighscore = this.isHighscore(score);
        
        if (isHighscore) {
            this.elements.highscoreEntry.classList.remove('hidden');
            this.elements.playerName.focus();
        } else {
            this.elements.highscoreEntry.classList.add('hidden');
        }
        
        // BGMを停止
        if (this.sounds.bgm) {
            this.sounds.bgm.pause();
            this.sounds.bgm.currentTime = 0;
        }
    }
    
    /**
     * ハイスコアを表示
     */
    showHighscores() {
        this.showScreen('highscore');
        
        // ハイスコアリストをクリア
        this.elements.highscoreList.innerHTML = '';
        
        // ハイスコアを表示
        this.highscores.forEach((entry, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<span>${index + 1}. ${entry.name}</span><span>${entry.score}</span>`;
            this.elements.highscoreList.appendChild(listItem);
        });
    }
    
    /**
     * スコアがハイスコアかどうかをチェック
     * @param {number} score - チェックするスコア
     * @returns {boolean} ハイスコアの場合はtrue
     */
    isHighscore(score) {
        // ハイスコアが10個未満の場合は常にハイスコア
        if (this.highscores.length < 10) return true;
        
        // 最低スコアよりも高い場合はハイスコア
        const lowestScore = this.highscores[this.highscores.length - 1].score;
        return score > lowestScore;
    }
    
    /**
     * ハイスコアを保存
     */
    saveHighscore() {
        const name = this.elements.playerName.value.trim() || 'Player';
        const score = this.game.state.score;
        
        // ハイスコアに追加
        this.highscores.push({ name, score });
        
        // スコア順にソート
        this.highscores.sort((a, b) => b.score - a.score);
        
        // 10個以上ある場合は余分を削除
        if (this.highscores.length > 10) {
            this.highscores = this.highscores.slice(0, 10);
        }
        
        // ローカルストレージに保存
        this.saveHighscoresToStorage();
        
        // ハイスコア入力欄を非表示
        this.elements.highscoreEntry.classList.add('hidden');
        
        // ハイスコア画面を表示
        this.showHighscores();
    }
    
    /**
     * ハイスコアをローカルストレージから読み込み
     * @returns {Array} ハイスコアのリスト
     */
    loadHighscores() {
        const storedHighscores = localStorage.getItem('tetrisHighscores');
        
        if (storedHighscores) {
            try {
                return JSON.parse(storedHighscores);
            } catch (e) {
                console.error('ハイスコアの読み込みに失敗しました:', e);
                return [];
            }
        }
        
        return [];
    }
    
    /**
     * ハイスコアをローカルストレージに保存
     */
    saveHighscoresToStorage() {
        try {
            localStorage.setItem('tetrisHighscores', JSON.stringify(this.highscores));
        } catch (e) {
            console.error('ハイスコアの保存に失敗しました:', e);
        }
    }
    
    /**
     * キーダウンイベントを処理
     * @param {KeyboardEvent} e - キーボードイベント
     */
    handleKeyDown(e) {
        const key = e.key;
        
        // ゲームプレイ中のみキー操作を受け付ける
        if (this.game.state.isPlaying && !this.game.state.isPaused && !this.game.state.isGameOver) {
            if (this.keyMap[key] && !this.keyState[key]) {
                this.keyState[key] = true;
                
                // 対応するゲームアクションを実行
                const action = this.keyMap[key];
                
                if (action === 'togglePause') {
                    this.togglePause();
                } else if (typeof this.game[action] === 'function') {
                    this.game[action]();
                    
                    // 移動と回転の効果音を再生
                    if (action === 'moveLeft' || action === 'moveRight') {
                        this.playSoundEffect('move');
                    } else if (action === 'rotateCW' || action === 'rotateCCW') {
                        this.playSoundEffect('rotate');
                    } else if (action === 'hardDrop') {
                        this.playSoundEffect('drop');
                    }
                }
                
                // デフォルトのキー動作を防止（スクロールなど）
                if (key === ' ' || key === 'ArrowUp' || key === 'ArrowDown' || 
                    key === 'ArrowLeft' || key === 'ArrowRight') {
                    e.preventDefault();
                }
            }
        } else if (key === 'Escape') {
            // ポーズ中はESCキーでゲームを再開
            if (this.game.state.isPaused) {
                this.resumeGame();
                e.preventDefault();
            }
        }
    }
    
    /**
     * キーアップイベントを処理
     * @param {KeyboardEvent} e - キーボードイベント
     */
    handleKeyUp(e) {
        const key = e.key;
        this.keyState[key] = false;
    }
    
    /**
     * レンダリングを開始
     */
    startRendering() {
        this.renderGame();
    }
    
    /**
     * ゲームをレンダリング
     */
    renderGame() {
        if (!this.game.state.isPlaying) return;
        
        // ゲームフィールドをクリア
        this.clearCanvas(this.gameCtx, this.gameCanvas.width, this.gameCanvas.height);
        
        // フィールドをレンダリング
        this.renderField();
        
        // 現在のテトリミノをレンダリング
        this.renderCurrentTetromino();
        
        // ゴーストテトリミノをレンダリング
        this.renderGhostTetromino();
        
        // 次のテトリミノをレンダリング
        this.renderNextTetromino();
        
        // ホールドテトリミノをレンダリング
        this.renderHoldTetromino();
        
        // 次のフレームを要求
        if (!this.game.state.isPaused && !this.game.state.isGameOver) {
            requestAnimationFrame(() => this.renderGame());
        }
    }
    
    /**
     * キャンバスをクリア
     * @param {CanvasRenderingContext2D} ctx - キャンバスコンテキスト
     * @param {number} width - キャンバスの幅
     * @param {number} height - キャンバスの高さ
     */
    clearCanvas(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
    }
    
    /**
     * フィールドをレンダリング
     */
    renderField() {
        const field = this.game.state.field;
        
        for (let y = 0; y < field.length; y++) {
            for (let x = 0; x < field[y].length; x++) {
                const color = field[y][x];
                
                if (color) {
                    this.drawBlock(this.gameCtx, x, y, color);
                }
            }
        }
    }
    
    /**
     * 現在のテトリミノをレンダリング
     */
    renderCurrentTetromino() {
        if (!this.game.currentTetromino) return;
        
        const tetromino = this.game.currentTetromino;
        const shape = tetromino.getShape();
        const color = tetromino.getColor();
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const fieldX = tetromino.x + x;
                    const fieldY = tetromino.y + y;
                    
                    // フィールド内のブロックのみ描画
                    if (fieldY >= 0) {
                        this.drawBlock(this.gameCtx, fieldX, fieldY, color);
                    }
                }
            }
        }
    }
    
    /**
     * ゴーストテトリミノをレンダリング
     */
    renderGhostTetromino() {
        if (!this.game.state.ghostEnabled || !this.game.currentTetromino) return;
        
        const ghost = this.game.getGhostPosition();
        
        if (!ghost) return;
        
        const shape = ghost.shape;
        const color = ghost.color;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const fieldX = ghost.x + x;
                    const fieldY = ghost.y + y;
                    
                    // フィールド内のブロックのみ描画（半透明）
                    if (fieldY >= 0) {
                        this.drawGhostBlock(this.gameCtx, fieldX, fieldY, color);
                    }
                }
            }
        }
    }
    
    /**
     * 次のテトリミノをレンダリング
     */
    renderNextTetromino() {
        this.clearCanvas(this.nextCtx, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.game.nextTetromino) return;
        
        const tetromino = this.game.nextTetromino;
        const shape = tetromino.getShape();
        const color = tetromino.getColor();
        
        // 中央に配置するための計算
        const blockSize = Math.min(
            this.nextCanvas.width / shape[0].length,
            this.nextCanvas.height / shape.length
        ) * 0.8;
        
        const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    this.drawPreviewBlock(this.nextCtx, x, y, color, blockSize, offsetX, offsetY);
                }
            }
        }
    }
    
    /**
     * ホールドテトリミノをレンダリング
     */
    renderHoldTetromino() {
        this.clearCanvas(this.holdCtx, this.holdCanvas.width, this.holdCanvas.height);
        
        if (!this.game.holdTetromino) return;
        
        const tetromino = this.game.holdTetromino;
        const shape = tetromino.getShape();
        const color = tetromino.getColor();
        
        // 中央に配置するための計算
        const blockSize = Math.min(
            this.holdCanvas.width / shape[0].length,
            this.holdCanvas.height / shape.length
        ) * 0.8;
        
        const offsetX = (this.holdCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.holdCanvas.height - shape.length * blockSize) / 2;
        
        // ホールドが使用できない場合は半透明に
        const alpha = this.game.canHold ? 1.0 : 0.5;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    this.drawPreviewBlock(this.holdCtx, x, y, color, blockSize, offsetX, offsetY, alpha);
                }
            }
        }
    }
    
    /**
     * ブロックを描画
     * @param {CanvasRenderingContext2D} ctx - キャンバスコンテキスト
     * @param {number} x - X座標（フィールド上の位置）
     * @param {number} y - Y座標（フィールド上の位置）
     * @param {string} color - ブロックの色
     */
    drawBlock(ctx, x, y, color) {
        const blockSize = this.blockSize;
        const pixelX = x * blockSize;
        const pixelY = y * blockSize;
        
        // ブロックの背景
        ctx.fillStyle = color;
        ctx.fillRect(pixelX, pixelY, blockSize, blockSize);
        
        // ブロックの淵（立体的に見せる）
        ctx.fillStyle = this.lightenColor(color, 30);
        ctx.fillRect(pixelX, pixelY, blockSize, blockSize / 10);
        ctx.fillRect(pixelX, pixelY, blockSize / 10, blockSize);
        
        ctx.fillStyle = this.darkenColor(color, 30);
        ctx.fillRect(pixelX, pixelY + blockSize - blockSize / 10, blockSize, blockSize / 10);
        ctx.fillRect(pixelX + blockSize - blockSize / 10, pixelY, blockSize / 10, blockSize);
        
        // ブロックの枠線
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(pixelX, pixelY, blockSize, blockSize);
    }
    
    /**
     * ゴーストブロックを描画（半透明）
     * @param {CanvasRenderingContext2D} ctx - キャンバスコンテキスト
     * @param {number} x - X座標（フィールド上の位置）
     * @param {number} y - Y座標（フィールド上の位置）
     * @param {string} color - ブロックの色
     */
    drawGhostBlock(ctx, x, y, color) {
        const blockSize = this.blockSize;
        const pixelX = x * blockSize;
        const pixelY = y * blockSize;
        
        // 半透明のブロック
        ctx.fillStyle = this.hexToRgba(color, 0.3);
        ctx.fillRect(pixelX, pixelY, blockSize, blockSize);
        
        // ブロックの枠線
        ctx.strokeStyle = this.hexToRgba(color, 0.7);
        ctx.lineWidth = 1;
        ctx.strokeRect(pixelX, pixelY, blockSize, blockSize);
    }
    
    /**
     * プレビュー用のブロックを描画
     * @param {CanvasRenderingContext2D} ctx - キャンバスコンテキスト
     * @param {number} x - X座標（テトリミノ上の位置）
     * @param {number} y - Y座標（テトリミノ上の位置）
     * @param {string} color - ブロックの色
     * @param {number} blockSize - ブロックのサイズ
     * @param {number} offsetX - X方向のオフセット
     * @param {number} offsetY - Y方向のオフセット
     * @param {number} alpha - 透明度（オプション、デフォルトは1.0）
     */
    drawPreviewBlock(ctx, x, y, color, blockSize, offsetX, offsetY, alpha = 1.0) {
        const pixelX = offsetX + x * blockSize;
        const pixelY = offsetY + y * blockSize;
        
        // ブロックの背景
        ctx.fillStyle = alpha < 1.0 ? this.hexToRgba(color, alpha) : color;
        ctx.fillRect(pixelX, pixelY, blockSize, blockSize);
        
        // ブロックの淵（立体的に見せる）
        ctx.fillStyle = alpha < 1.0 ? 
            this.hexToRgba(this.lightenColor(color, 30), alpha) : 
            this.lightenColor(color, 30);
        ctx.fillRect(pixelX, pixelY, blockSize, blockSize / 10);
        ctx.fillRect(pixelX, pixelY, blockSize / 10, blockSize);
        
        ctx.fillStyle = alpha < 1.0 ? 
            this.hexToRgba(this.darkenColor(color, 30), alpha) : 
            this.darkenColor(color, 30);
        ctx.fillRect(pixelX, pixelY + blockSize - blockSize / 10, blockSize, blockSize / 10);
        ctx.fillRect(pixelX + blockSize - blockSize / 10, pixelY, blockSize / 10, blockSize);
        
        // ブロックの枠線
        ctx.strokeStyle = alpha < 1.0 ? 'rgba(0, 0, 0, ' + alpha + ')' : '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(pixelX, pixelY, blockSize, blockSize);
    }
    
    /**
     * 色を明るくする
     * @param {string} hex - 16進数の色コード
     * @param {number} percent - 明るくする割合（%）
     * @returns {string} 明るくした色コード
     */
    lightenColor(hex, percent) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const nr = Math.min(255, Math.floor(r + (255 - r) * percent / 100));
        const ng = Math.min(255, Math.floor(g + (255 - g) * percent / 100));
        const nb = Math.min(255, Math.floor(b + (255 - b) * percent / 100));
        
        return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
    }
    
    /**
     * 色を暗くする
     * @param {string} hex - 16進数の色コード
     * @param {number} percent - 暗くする割合（%）
     * @returns {string} 暗くした色コード
     */
    darkenColor(hex, percent) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const nr = Math.max(0, Math.floor(r * (100 - percent) / 100));
        const ng = Math.max(0, Math.floor(g * (100 - percent) / 100));
        const nb = Math.max(0, Math.floor(b * (100 - percent) / 100));
        
        return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
    }
    
    /**
     * 16進数の色コードをRGBA形式に変換
     * @param {string} hex - 16進数の色コード
     * @param {number} alpha - アルファ値（透明度）
     * @returns {string} RGBA形式の色コード
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
} 
