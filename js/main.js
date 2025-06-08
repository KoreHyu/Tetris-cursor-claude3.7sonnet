/**
 * テトリスゲームのメインスクリプト
 * ゲームの初期化と開始を担当
 */
document.addEventListener('DOMContentLoaded', () => {
    // ゲームインスタンスを作成
    const game = new TetrisGame({
        width: 10,
        height: 20,
        initialLevel: 1,
        difficulty: 'normal'
    });
    
    // UIインスタンスを作成
    const ui = new TetrisUI(game);
    
    // ロケールに応じた言語設定（オプション）
    // setLanguage(navigator.language);
    
    // サービスワーカーの登録（PWA対応、オプション）
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js').then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            }).catch(error => {
                console.log('Service Worker registration failed:', error);
            });
        });
    }
});

/**
 * 言語設定（国際化対応用、オプション）
 * @param {string} locale - 言語コード（例: ja, en）
 */
function setLanguage(locale) {
    // 言語リソースの読み込みと適用（実装はプロジェクトに応じて）
    // 現在はコメントアウト状態
} 
