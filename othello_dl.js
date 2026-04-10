let session;
let board = Array(8).fill().map(() => Array(8).fill(0));
let currentTurn = 1; // 1:黒(あなた), 2:白(AI)
let isThinking = false;

const DIRS = [
    [-1,-1], [-1,0], [-1,1],
    [ 0,-1],         [ 0,1],
    [ 1,-1], [ 1,0], [ 1,1]
];

// 1. AIモデルのロード
async function loadModel() {
    try {
        // 同じフォルダにある onnx ファイルを読み込む
        session = await ort.InferenceSession.create('./othello_model.onnx');
        document.getElementById('status').innerText = "AIエンジン始動（PyTorch学習済み）";
        initGame();
    } catch (e) {
        document.getElementById('status').innerText = "モデルのロード失敗。ファイルを確認してください。";
        console.error(e);
    }
}

// 2. ゲーム初期化
function initGame() {
    board = Array(8).fill().map(() => Array(8).fill(0));
    board[3][3] = 2; board[3][4] = 1;
    board[4][3] = 1; board[4][4] = 2;
    currentTurn = 1;
    isThinking = false;
    renderBoard();
}

// 3. 盤面の描画
function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    let bCount = 0, wCount = 0;
    const validMoves = getValidMoves(currentTurn);

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (board[r][c] === 1) {
                cell.innerHTML = '<div class="disc black"></div>'; bCount++;
            } else if (board[r][c] === 2) {
                cell.innerHTML = '<div class="disc white"></div>'; wCount++;
            } else {
                // 置ける場所にガイドを表示
                const move = validMoves.find(m => m.r === r && m.c === c);
                if (move && !isThinking && currentTurn === 1) {
                    cell.classList.add('hint');
                    cell.onclick = () => handleMove(r, c, move.flippable);
                }
            }
            boardEl.appendChild(cell);
        }
    }
    document.getElementById('black-score').innerText = `黒: ${bCount}`;
    document.getElementById('white-score').innerText = `白: ${wCount}`;
    document.getElementById('turn-display').innerText = currentTurn === 1 ? "あなたの番" : "AI思考中...";

    // パス判定
    if (validMoves.length === 0) {
        checkPass();
    } else if (currentTurn === 2 && !isThinking) {
        makeAIMove();
    }
}

// 4. 石を置く処理
function handleMove(r, c, flippable) {
    applyMove(board, r, c, flippable, currentTurn);
    currentTurn = 2;
    renderBoard();
}

function applyMove(targetBoard, r, c, flippable, player) {
    targetBoard[r][c] = player;
    flippable.forEach(pos => { targetBoard[pos.r][pos.c] = player; });
}

// 5. 合法手とひっくり返せる石の計算
function getValidMoves(player) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const flippable = getFlippable(r, c, player);
            if (flippable.length > 0) moves.push({r, c, flippable});
        }
    }
    return moves;
}

function getFlippable(r, c, player) {
    if (board[r][c] !== 0) return [];
    const opponent = 3 - player;
    let flippable = [];
    for (const [dr, dc] of DIRS) {
        let nr = r + dr, nc = c + dc;
        let temp = [];
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === opponent) {
            temp.push({r: nr, c: nc});
            nr += dr; nc += dc;
        }
        if (temp.length > 0 && nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === player) {
            flippable = flippable.concat(temp);
        }
    }
    return flippable;
}

// 6. AIの思考（ONNXモデルを使用）
async function makeAIMove() {
    isThinking = true;
    const moves = getValidMoves(2);
    if (moves.length === 0) { isThinking = false; checkPass(); return; }

    let bestMove = moves[0];
    let minScore = Infinity;

    // 全ての合法手について、打った後の盤面をAIに評価させる
    for (const move of moves) {
        const tempBoard = JSON.parse(JSON.stringify(board));
        applyMove(tempBoard, move.r, move.c, move.flippable, 2);

        // テンソル作成 (1, 3, 8, 8)
        const data = new Float32Array(3 * 64);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (tempBoard[r][c] === 1) data[0 * 64 + r * 8 + c] = 1.0;
                if (tempBoard[r][c] === 2) data[1 * 64 + r * 8 + c] = 1.0;
                if (tempBoard[r][c] === 0) data[2 * 64 + r * 8 + c] = 1.0;
            }
        }
        const tensor = new ort.Tensor('float32', data, [1, 3, 8, 8]);
        const output = await session.run({ input: tensor });
        const score = output.output.data[0];

        if (score < minScore) {
            minScore = score;
            bestMove = move;
        }
    }

    setTimeout(() => {
        applyMove(board, bestMove.r, bestMove.c, bestMove.flippable, 2);
        currentTurn = 1;
        isThinking = false;
        renderBoard();
    }, 800);
}

function checkPass() {
    const myMoves = getValidMoves(currentTurn);
    const opMoves = getValidMoves(3 - currentTurn);
    if (myMoves.length === 0 && opMoves.length === 0) {
        alert("ゲーム終了！");
    } else if (myMoves.length === 0) {
        alert("パスします");
        currentTurn = 3 - currentTurn;
        renderBoard();
    }
}

loadModel();
