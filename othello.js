const boardElement = document.getElementById('board');
const turnMessage = document.getElementById('turn-message');
const blackScoreEl = document.getElementById('black-score');
const whiteScoreEl = document.getElementById('white-score');
const blackStatus = document.getElementById('black-status');
const whiteStatus = document.getElementById('white-status');

// 0:空, 1:黒, 2:白
let board = [];
let currentTurn = 1;
let isPlayVsAI = true;
let isAIsTurn = false;

const directions = [ [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1] ];

// AIの評価関数
const positionWeights = [
    [120, -20,  20,   5,   5,  20, -20, 120],
    [-20, -40,  -5,  -5,  -5,  -5, -40, -20],
    [ 20,  -5,  15,   3,   3,  15,  -5,  20],
    [  5,  -5,   3,   3,   3,   3,  -5,   5],
    [  5,  -5,   3,   3,   3,   3,  -5,   5],
    [ 20,  -5,  15,   3,   3,  15,  -5,  20],
    [-20, -40,  -5,  -5,  -5,  -5, -40, -20],
    [120, -20,  20,   5,   5,  20, -20, 120]
];

function setMode(vsAI) {
    isPlayVsAI = vsAI;
    document.getElementById('btn-1p').classList.toggle('active', vsAI);
    document.getElementById('btn-2p').classList.toggle('active', !vsAI);
    initGame();
}

function initGame() {
    board = Array(8).fill().map(() => Array(8).fill(0));
    board[3][3] = 2; board[3][4] = 1; board[4][3] = 1; board[4][4] = 2;
    currentTurn = 1; isAIsTurn = false;
    updateBoard();
}

function updateBoard() {
    boardElement.innerHTML = '';
    let blackCount = 0; let whiteCount = 0; let validMovesCount = 0;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            if (board[row][col] !== 0) {
                const disc = document.createElement('div');
                disc.className = 'disc ' + (board[row][col] === 1 ? 'black' : 'white');
                cell.appendChild(disc);
                board[row][col] === 1 ? blackCount++ : whiteCount++;
            } else {
                const flippable = getFlippableDiscs(row, col, currentTurn);
                if (flippable.length > 0) {
                    if (!(currentTurn === 2 && isPlayVsAI)) {
                        cell.classList.add('hint');
                        cell.onclick = () => placeDisc(row, col, flippable);
                    }
                    validMovesCount++;
                }
            }
            boardElement.appendChild(cell);
        }
    }

    blackScoreEl.textContent = blackCount; whiteScoreEl.textContent = whiteCount;
    
    if (currentTurn === 1) {
        blackStatus.classList.add('active'); whiteStatus.classList.remove('active');
        turnMessage.textContent = "黒の番です"; turnMessage.style.color = "#ff2800";
    } else {
        whiteStatus.classList.add('active'); blackStatus.classList.remove('active');
        turnMessage.textContent = "白の番です"; turnMessage.style.color = "#fff";
    }

    setTimeout(() => checkGameState(blackCount, whiteCount, validMovesCount), 100);

    if (currentTurn === 2 && isPlayVsAI && validMovesCount > 0) {
        isAIsTurn = true;
        turnMessage.textContent = "🤖 AIが思考中...";
        setTimeout(makeAIMove, 1000);
    }
}

function placeDisc(row, col, flippable) {
    if (isAIsTurn && currentTurn === 1) return;
    board[row][col] = currentTurn;
    flippable.forEach(([r, c]) => { board[r][c] = currentTurn; });
    currentTurn = currentTurn === 1 ? 2 : 1;
    updateBoard();
}

function getFlippableDiscs(row, col, player) {
    if (board[row][col] !== 0) return [];
    const opponent = player === 1 ? 2 : 1;
    let flippable = [];
    directions.forEach(([dRow, dCol]) => {
        let r = row + dRow, c = col + dCol; let tempFlippable = [];
        while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === opponent) {
            tempFlippable.push([r, c]); r += dRow; c += dCol;
        }
        if (tempFlippable.length > 0 && r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === player) {
            flippable.push(...tempFlippable);
        }
    });
    return flippable;
}

function makeAIMove() {
    let bestMove = null; let maxScore = -Infinity;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            let flippable = getFlippableDiscs(r, c, 2);
            if (flippable.length > 0) {
                let score = positionWeights[r][c] + flippable.length + (Math.random() * 2);
                if (score > maxScore) { maxScore = score; bestMove = { r, c, flippable }; }
            }
        }
    }
    if (bestMove) placeDisc(bestMove.r, bestMove.c, bestMove.flippable);
}

function checkGameState(blackCount, whiteCount, validMovesCount) {
    if (blackCount + whiteCount === 64 || blackCount === 0 || whiteCount === 0) {
        finishGame(blackCount, whiteCount); return;
    }
    if (validMovesCount === 0) {
        const opponent = currentTurn === 1 ? 2 : 1;
        let opponentHasMove = false;
        for(let r=0; r<8; r++) { for(let c=0; c<8; c++) { if(getFlippableDiscs(r, c, opponent).length > 0) opponentHasMove = true; } }

        if (opponentHasMove) {
            let msg = (currentTurn === 1 ? "黒" : "白") + "は置ける場所がありません。パスします。";
            if (!isPlayVsAI || currentTurn === 1) alert(msg);
            currentTurn = opponent; updateBoard();
        } else {
            finishGame(blackCount, whiteCount);
        }
    }
}

function finishGame(black, white) {
    let msg = `ゲーム終了！\n黒: ${black} / 白: ${white}\n\n`;
    if (black > white) msg += "黒（あなた）の勝ち！🎉";
    else if (white > black) msg += isPlayVsAI ? "白（AI）の勝ち！🤖" : "白の勝ち！🎉";
    else msg += "引き分け！";
    
    turnMessage.textContent = "ゲーム終了"; turnMessage.style.color = "#66fcf1";
    isAIsTurn = false;
    setTimeout(() => alert(msg), 200);
}

initGame();
