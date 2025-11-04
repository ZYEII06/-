let quizTable;
let allQuestions = [];
let selectedQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let quizState = 'loading'; // 初始狀態：'loading', 'error', 'start', 'quiz', 'result'

// 全域常數
const MAX_QUIZ_QUESTIONS = 3; 
const MAX_SCORE = 100;

// 按鈕物件陣列
let optionButtons = [];

// ------------------- 數據載入 -------------------

function preload() {
  try {
    // 嘗試載入 CSV 檔案。
    quizTable = loadTable('questions.csv', 'csv', 'header');
  } catch (error) {
    console.error("CSV 檔案載入失敗:", error);
    quizTable = null;
  }
}

// ------------------- 設置與錯誤檢查 -------------------

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 設定文字對齊方式為置中 (CENTER)，但分數需要特別處理
  textAlign(CENTER, CENTER); 
  updateTextSize();

  // 檢查 CSV 載入狀態
  if (quizTable && quizTable.getRowCount() >= MAX_QUIZ_QUESTIONS) {
    parseQuestions();
    selectRandomQuestions();
    quizState = 'start'; 
  } else if (quizTable && quizTable.getRowCount() > 0) {
    console.warn(`題庫不足 ${MAX_QUIZ_QUESTIONS} 題，實際選取 ${quizTable.getRowCount()} 題。`);
    parseQuestions();
    selectRandomQuestions();
    quizState = 'start'; 
  } else {
    console.error("【嚴重錯誤】: CSV 檔案不存在或內容為空。請檢查 'questions.csv'。");
    quizState = 'error'; 
  }

  // 建立選項按鈕 (固定 3 個選項)
  for (let i = 0; i < 3; i++) {
    let button = createButton('');
    button.mousePressed(() => handleAnswer(String.fromCharCode(65 + i)));
    optionButtons.push(button);
  }

  updateButtons();
  hideButtons();
}

// ------------------- 響應式處理 -------------------

function updateTextSize() {
  let newSize = windowWidth * 0.035;
  if (newSize < 16) newSize = 16; 
  if (newSize > 25) newSize = 25; 
  textSize(newSize);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateTextSize();
  updateButtons();
}

function updateButtons() {
  let buttonW = min(windowWidth * 0.7, 400); 
  let buttonH = 50; 
  const startY = windowHeight * 0.55; 
  const spacing = buttonH + 15; 

  for (let i = 0; i < optionButtons.length; i++) {
    let button = optionButtons[i];
    
    button.size(buttonW, buttonH);
    
    let buttonFontSize = min(buttonW * 0.045, 18);
    button.style('font-size', `${buttonFontSize}px`);

    button.position(
      windowWidth / 2 - buttonW / 2, 
      startY + i * spacing 
    );
  }
}

// ------------------- 核心邏輯 -------------------

function draw() {
  // 使用莫蘭迪色系的米色作為背景
  background(240, 235, 227); 

  // 設定文字顏色為柔和的深灰棕色
  fill(90, 80, 75);

  if (quizState === 'loading') {
    text('正在載入中...', windowWidth / 2, windowHeight / 2);
  } else if (quizState === 'error') {
    displayErrorScreen();
  } else if (quizState === 'start') {
    displayStartScreen();
  } else if (quizState === 'quiz') {
    displayQuestion();
    displayScore(); 
  } else if (quizState === 'result') {
    displayResultScreen(); // 顯示結束畫面和最終分數
  }
}

function displayScore() {
  // 設置文字對齊方式為右對齊 (RIGHT)
  textAlign(RIGHT, TOP); 
  
  const totalQuestions = selectedQuestions.length > 0 ? selectedQuestions.length : 3;
  const currentTotalScore = floor((score / totalQuestions) * MAX_SCORE); 

  // 顯示在畫面的右上角 (僅在測驗進行中顯示)
  if (quizState === 'quiz') {
      text(`分數：${currentTotalScore} / ${MAX_SCORE}`, windowWidth - 20, 20);
  }
  
  // 恢復文字對齊方式為置中 (CENTER)
  textAlign(CENTER, CENTER);
}

function handleAnswer(selectedOption) {
  if (quizState !== 'quiz') return;

  let currentQ = selectedQuestions[currentQuestionIndex];
  
  if (currentQ && selectedOption === currentQ.correct) {
    score++;
  }

  currentQuestionIndex++;

  if (currentQuestionIndex >= selectedQuestions.length) {
    quizState = 'result'; // 結束測驗
    hideButtons();
  } else {
    updateButtonsText();
  }
}

function mousePressed() {
  if (quizState === 'start') {
    quizState = 'quiz';
    updateButtonsText();
  } 
  // 移除 result 狀態下的點擊重新開始功能，讓測驗在此結束。
}

// ------------------- 輔助數據與顯示 -------------------

function parseQuestions() {
  let rowCount = quizTable.getRowCount();
  for (let i = 0; i < rowCount; i++) {
    let row = quizTable.getRow(i);
    allQuestions.push({
      question: row.getString('question'),
      optionA: row.getString('optionA'),
      optionB: row.getString('optionB'),
      optionC: row.getString('optionC'),
      correct: row.getString('correct')
    });
  }
}

function selectRandomQuestions() {
  const numToSelect = min(MAX_QUIZ_QUESTIONS, allQuestions.length); 
  let tempQuestions = [...allQuestions]; 
  selectedQuestions = [];

  for (let i = 0; i < numToSelect; i++) {
    let randomIndex = floor(random(tempQuestions.length));
    selectedQuestions.push(tempQuestions[randomIndex]);
    tempQuestions.splice(randomIndex, 1);
  }
}

function displayErrorScreen() {
    text('測驗載入失敗！', windowWidth / 2, windowHeight / 2 - 50);
    text('請檢查 "questions.csv" 檔案是否遺失或格式錯誤。', windowWidth / 2, windowHeight / 2);
    hideButtons();
}

function displayStartScreen() {
  text('歡迎參加測驗！', windowWidth / 2, windowHeight / 2 - windowHeight * 0.1);
  text('點擊畫面任何地方開始', windowWidth / 2, windowHeight / 2);
  hideButtons();
}

function displayQuestion() {
  let currentQ = selectedQuestions[currentQuestionIndex];

  text(`第 ${currentQuestionIndex + 1} 題 / 共 ${selectedQuestions.length} 題`, windowWidth / 2, windowHeight * 0.1);
  text(currentQ ? currentQ.question : "載入錯誤：題目遺失", windowWidth / 2, windowHeight * 0.3);

  updateButtonsText();
  showButtons();
}

// *** 關鍵修改：簡化結束畫面 ***
function displayResultScreen() {
  // 測驗結束時，隱藏按鈕 (已在 handleAnswer 中執行，但再次確保)
  hideButtons(); 
  
  const totalQuestions = selectedQuestions.length;
  // 計算最終的 100 分制成績
  const finalTotalScore = floor((score / totalQuestions) * MAX_SCORE);
  
  // 1. 顯示 "結束測驗"
  textSize(windowWidth * 0.05 > 35 ? 35 : windowWidth * 0.05); // 放大標題字體
  text('結束測驗', windowWidth / 2, windowHeight / 2 - windowHeight * 0.1);
  
  // 恢復字體大小
  updateTextSize(); 
  
  // 2. 顯示最終分數
  text(`最終分數： ${finalTotalScore} / ${MAX_SCORE}`, windowWidth / 2, windowHeight / 2);
  
  // 移除重新開始的提示文字，因為測驗將在此結束。
  // 如果需要重新整理頁面才能再次測驗，可以加入提示文字：
  // text('請重新整理頁面以再次測驗', windowWidth / 2, windowHeight / 2 + windowHeight * 0.1);
}
// ----------------------------------------------------

function updateButtonsText() {
  if (quizState !== 'quiz' || currentQuestionIndex >= selectedQuestions.length) return; 

  let currentQ = selectedQuestions[currentQuestionIndex];
  
  optionButtons[0].html(`A: ${currentQ.optionA || '選項A遺失'}`);
  optionButtons[1].html(`B: ${currentQ.optionB || '選項B遺失'}`);
  optionButtons[2].html(`C: ${currentQ.optionC || '選項C遺失'}`);
}

function hideButtons() {
  for (let button of optionButtons) {
    button.hide();
  }
}

function showButtons() {
  for (let button of optionButtons) {
    button.show();
  }
}