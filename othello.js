const boardElement = document.getElementById('board');
const turnMessage = document.getElementById('turn-message');
const blackScoreEl = document.getElementById('black-score');
const whiteScoreEl = document.getElementById('white-score');
const blackStatus = document.getElementById('black-status');
const whiteStatus = document.getElementById('white-status');

// 0:空, 1:黒, 2:白
let board = [];
let currentTurn = 1; // 黒からスタート

// 8方向の座標変化
const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
];

// 1. ゲーム初期化
function initGame() {
    board = Array(8).fill().map(() => Array(8).fill(0));
    board[3][3] = 2; board[3][4] = 1;
    board[4][3] = 1; board[4][4] = 2;
    currentTurn = 1;
    updateBoard();
}

// 2. 盤面の描画とスコア計算
function updateBoard() {
    boardElement.innerHTML = '';
    let blackCount = 0;
    let whiteCount = 0;
    let validMovesCount = 0;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            // 石がある場合
            if (board[row][col] !== 0) {
                const disc = document.createElement('div');
                disc.className = 'disc ' + (board[row][col] === 1 ? 'black' : 'white');
                cell.appendChild(disc);
                board[row][col] === 1 ? blackCount++ : whiteCount++;
            } else {
                // 空のマスの場合、置けるかチェック
                const flippable = getFlippableDiscs(row, col, currentTurn);
                if (flippable.length > 0) {
                    cell.classList.add('hint'); // 置ける場所をハイライト
                    cell.onclick = () => placeDisc(row, col, flippable);
                    validMovesCount++;
                }
            }
            boardElement.appendChild(cell);
        }
    }

    // スコアとUIの更新
    blackScoreEl.textContent = blackCount;
    whiteScoreEl.textContent = whiteCount;
    
    if (currentTurn === 1) {
        blackStatus.classList.add('active');
        whiteStatus.classList.remove('active');
        turnMessage.textContent = "黒の番です";
        turnMessage.style.color = "#ff2800";
    } else {
        whiteStatus.classList.add('active');
        blackStatus.classList.remove('active');
        turnMessage.textContent = "白の番です";
        turnMessage.style.color = "#fff";
    }

    // ゲーム終了 または パス の判定
    setTimeout(() => checkGameState(blackCount, whiteCount, validMovesCount), 100);
}

// 3. 石を置く処理
function placeDisc(row, col, flippable) {
    board[row][col] = currentTurn;
    flippable.forEach(([r, c]) => {
        board[r][c] = currentTurn;
    });
    
    currentTurn = currentTurn === 1 ? 2 : 1; // ターン交代
    updateBoard();
}

// 4. ひっくり返せる石を探す
function getFlippableDiscs(row, col, player) {
    if (board[row][col] !== 0) return [];
    const opponent = player === 1 ? 2 : 1;
    let flippable = [];

    directions.forEach(([dRow, dCol]) => {
        let r = row + dRow, c = col + dCol;
        let tempFlippable = [];

        while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === opponent) {
            tempFlippable.push([r, c]);
            r += dRow; c += dCol;
        }

        if (tempFlippable.length > 0 && r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === player) {
            flippable.push(...tempFlippable);
        }
    });
    return flippable;
}

// 5. ゲームの進行状態をチェック（パス・終了判定）
function checkGameState(blackCount, whiteCount, validMovesCount) {
    if (blackCount + whiteCount === 64 || blackCount === 0 || whiteCount === 0) {
        // 盤面が埋まった、または全滅した場合
        finishGame(blackCount, whiteCount);
        return;
    }

    if (validMovesCount === 0) {
        // 現在のプレイヤーが置ける場所がない場合
        const opponent = currentTurn === 1 ? 2 : 1;
        // 相手も置ける場所があるかチェック
        let opponentHasMove = false;
        for(let r=0; r<8; r++) {
            for(let c=0; c<8; c++) {
                if(getFlippableDiscs(r, c, opponent).length > 0) opponentHasMove = true;
            }
        }

        if (opponentHasMove) {
            alert((currentTurn === 1 ? "黒" : "白") + "は置ける場所がありません。パスします。");
            currentTurn = opponent;
            updateBoard();
        } else {
            // お互い置けない場合はゲーム終了
            finishGame(blackCount, whiteCount);
        }
    }
}

// 6. 勝敗結果の表示
function finishGame(black, white) {
    let msg = `ゲーム終了！\n黒: ${black} / 白: ${white}\n\n`;
    if (black > white) msg += "黒の勝ち！";
    else if (white > black) msg += "白の勝ち！";
    else msg += "引き分け！";
    
    turnMessage.textContent = "ゲーム終了";
    turnMessage.style.color = "#66fcf1";
    setTimeout(() => alert(msg), 200);
}

// 起動
initGame();
