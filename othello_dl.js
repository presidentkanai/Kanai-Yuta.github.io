let session;
let board = Array(8).fill().map(() => Array(8).fill(0));
let currentTurn = 1; // 1:黒(人), 2:白(AI)

// 1. AIモデルのロード
async function loadModel() {
    try {
        session = await ort.InferenceSession.create('./othello_model.onnx');
        document.getElementById('status').innerText = "AIエンジン始動（PyTorch学習済みモデル）";
        initGame();
    } catch (e) {
        document.getElementById('status').innerText = "モデルの読み込みに失敗しました。";
        console.error(e);
    }
}

// 2. AIの思考プロセス（ディープラーニング）
async function makeAIMove() {
    const validMoves = getValidMoves(2);
    if (validMoves.length === 0) { skipTurn(); return; }

    let bestMove = null;
    let minScore = Infinity; // 今回のモデルは黒(1)寄りだと+、白(2)寄りだと-になるため

    for (const move of validMoves) {
        // 仮に石を置いた盤面を作成
        const tempBoard = JSON.parse(JSON.stringify(board));
        applyMove(tempBoard, move.r, move.c, 2);

        // 盤面をAIが理解できるテンソル形式(1, 3, 8, 8)に変換
        const inputData = new Float32Array(1 * 3 * 8 * 8);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (tempBoard[r][c] === 1) inputData[0 * 64 + r * 8 + c] = 1.0; // 黒
                if (tempBoard[r][c] === 2) inputData[1 * 64 + r * 8 + c] = 1.0; // 白
                if (tempBoard[r][c] === 0) inputData[2 * 64 + r * 8 + c] = 1.0; // 空
            }
        }

        const inputTensor = new ort.Tensor('float32', inputData, [1, 3, 8, 8]);
        const output = await session.run({ input: inputTensor });
        const score = output.output.data[0];

        if (score < minScore) {
            minScore = score;
            bestMove = move;
        }
    }

    if (bestMove) {
        setTimeout(() => {
            applyMove(board, bestMove.r, bestMove.c, 2);
            currentTurn = 1;
            renderBoard();
        }, 600);
    }
}

// (以下、オセロの基本ルール処理は前回のJSと同様ですが、モデル対応用に調整が必要です)
// 省略：applyMove, getValidMoves, renderBoard などの基本関数
loadModel();
