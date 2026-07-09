(function () {
  "use strict";

  var STORAGE_KEY = "kankoji1_quiz_progress_v1";
  var TOTAL = QUESTIONS.length;

  var QUESTIONS_BY_ID = {};
  QUESTIONS.forEach(function (q) { QUESTIONS_BY_ID[q.id] = q; });

  var state = {
    index: 0,
    correct: 0,
    answered: 0,
    answeredIds: {},   // id -> {picked, correct}
    finished: false,
    mode: "normal",    // "normal" | "review"
    reviewQueue: [],   // ids of wrong-answered questions, snapshot at review start
    reviewIndex: 0
  };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && typeof saved.index === "number") {
        state = saved;
        if (state.mode !== "review") state.mode = "normal";
        if (!Array.isArray(state.reviewQueue)) state.reviewQueue = [];
        if (typeof state.reviewIndex !== "number") state.reviewIndex = 0;
      }
    } catch (e) { /* ignore corrupt storage */ }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* storage unavailable, fail silently */ }
  }

  // Elements
  var els = {
    tag: document.getElementById("questionTag"),
    question: document.getElementById("questionText"),
    answerRow: document.getElementById("answerRow"),
    btnTrue: document.getElementById("btnTrue"),
    btnFalse: document.getElementById("btnFalse"),
    result: document.getElementById("result"),
    resultBanner: document.getElementById("resultBanner"),
    resultExp: document.getElementById("resultExp"),
    btnNext: document.getElementById("btnNext"),
    progressFill: document.getElementById("progressFill"),
    progressText: document.getElementById("progressText"),
    quizCard: document.getElementById("quizCard"),
    summaryCard: document.getElementById("summaryCard"),
    summaryCorrect: document.getElementById("summaryCorrect"),
    summaryTotal: document.getElementById("summaryTotal"),
    summaryRate: document.getElementById("summaryRate"),
    btnRestart: document.getElementById("btnRestart"),
    btnReset: document.getElementById("btnReset"),
    gaugeFill: document.getElementById("gaugeFill"),
    gaugeNeedle: document.getElementById("gaugeNeedle"),
    gaugePct: document.getElementById("gaugePct"),
    modeBanner: document.getElementById("modeBanner"),
    btnExitReview: document.getElementById("btnExitReview"),
    mainControls: document.getElementById("mainControls"),
    btnReviewWrong: document.getElementById("btnReviewWrong"),
    wrongCount: document.getElementById("wrongCount"),
    btnReviewFromSummary: document.getElementById("btnReviewFromSummary"),
    summaryWrongCount: document.getElementById("summaryWrongCount"),
    reviewSummaryCard: document.getElementById("reviewSummaryCard"),
    reviewSummaryText: document.getElementById("reviewSummaryText"),
    btnReviewAgain: document.getElementById("btnReviewAgain"),
    btnExitReviewFromSummary: document.getElementById("btnExitReviewFromSummary")
  };

  var gaugeLen = els.gaugeFill.getTotalLength ? els.gaugeFill.getTotalLength() : 157;
  els.gaugeFill.style.strokeDasharray = gaugeLen;
  els.gaugeFill.style.strokeDashoffset = gaugeLen;

  function updateGauge() {
    var rate = state.answered > 0 ? state.correct / state.answered : 0;
    var offset = gaugeLen * (1 - rate);
    els.gaugeFill.style.strokeDashoffset = offset;
    var angle = -90 + rate * 180;
    els.gaugeNeedle.style.transform = "rotate(" + angle + "deg)";
    els.gaugePct.textContent = Math.round(rate * 100) + "%";
  }

  function countWrong() {
    var n = 0;
    for (var id in state.answeredIds) {
      if (state.answeredIds.hasOwnProperty(id) && !state.answeredIds[id].correct) n++;
    }
    return n;
  }

  function updateReviewButtons() {
    var n = countWrong();
    els.wrongCount.textContent = n;
    els.summaryWrongCount.textContent = n;
    els.btnReviewWrong.disabled = n === 0;
    els.btnReviewFromSummary.disabled = n === 0;
  }

  function currentQuestion() {
    if (state.mode === "review") {
      return QUESTIONS_BY_ID[state.reviewQueue[state.reviewIndex]];
    }
    return QUESTIONS[state.index];
  }

  function updateProgress() {
    if (state.mode === "review") {
      els.progressText.textContent = "復習 " + (state.reviewIndex + 1) + " / " + state.reviewQueue.length;
      els.progressFill.style.width = (state.reviewIndex / state.reviewQueue.length * 100) + "%";
      return;
    }
    var shown = Math.min(state.index + 1, TOTAL);
    els.progressText.textContent = "問題 " + shown + " / " + TOTAL;
    els.progressFill.style.width = (state.index / TOTAL * 100) + "%";
  }

  function renderQuestion() {
    els.modeBanner.hidden = state.mode !== "review";
    els.mainControls.hidden = state.mode === "review";

    if (state.mode === "review") {
      if (state.reviewIndex >= state.reviewQueue.length) {
        showReviewSummary();
        return;
      }
      els.reviewSummaryCard.hidden = true;
      els.summaryCard.hidden = true;
      els.quizCard.hidden = false;
      showQuestionCard(currentQuestion());
      return;
    }

    if (state.index >= TOTAL) {
      showSummary();
      return;
    }
    els.reviewSummaryCard.hidden = true;
    els.summaryCard.hidden = true;
    els.quizCard.hidden = false;
    showQuestionCard(currentQuestion());
  }

  function showQuestionCard(q) {
    els.tag.textContent = "Q-" + String(q.id).padStart(3, "0");
    els.question.textContent = q.q;
    els.result.hidden = true;
    els.answerRow.hidden = false;
    els.btnTrue.disabled = false;
    els.btnFalse.disabled = false;
    els.btnTrue.classList.remove("answer-btn--picked");
    els.btnFalse.classList.remove("answer-btn--picked");
    updateProgress();
  }

  function recordAnswer(qid, picked, isCorrect) {
    var prev = state.answeredIds[qid];
    if (!prev) {
      state.answered += 1;
      if (isCorrect) state.correct += 1;
    } else if (prev.correct !== isCorrect) {
      state.correct += isCorrect ? 1 : -1;
    }
    state.answeredIds[qid] = { picked: picked, correct: isCorrect };
  }

  function handleAnswer(picked) {
    var q = currentQuestion();
    var isCorrect = picked === q.answer;

    els.btnTrue.disabled = true;
    els.btnFalse.disabled = true;
    (picked ? els.btnTrue : els.btnFalse).classList.add("answer-btn--picked");

    els.resultBanner.className = "result__banner " + (isCorrect ? "result__banner--correct" : "result__banner--wrong");
    els.resultBanner.textContent = isCorrect ? "正解です" : "不正解 — 正解は「" + (q.answer ? "○ 正しい" : "× 誤り") + "」";
    els.resultExp.textContent = q.exp || "(解説なし)";
    els.result.hidden = false;

    recordAnswer(q.id, picked, isCorrect);
    updateGauge();
    updateReviewButtons();
    saveState();
  }

  function next() {
    if (state.mode === "review") {
      state.reviewIndex += 1;
    } else {
      state.index += 1;
      if (state.index >= TOTAL) state.finished = true;
    }
    saveState();
    renderQuestion();
  }

  function showSummary() {
    els.quizCard.hidden = true;
    els.reviewSummaryCard.hidden = true;
    els.summaryCard.hidden = false;
    els.progressText.textContent = "問題 " + TOTAL + " / " + TOTAL;
    els.progressFill.style.width = "100%";
    els.summaryCorrect.textContent = state.correct;
    els.summaryTotal.textContent = TOTAL;
    var rate = state.answered > 0 ? Math.round((state.correct / state.answered) * 100) : 0;
    els.summaryRate.textContent = "正答率 " + rate + "%";
  }

  function showReviewSummary() {
    els.quizCard.hidden = true;
    els.summaryCard.hidden = true;
    els.reviewSummaryCard.hidden = false;
    els.progressText.textContent = "復習 " + state.reviewQueue.length + " / " + state.reviewQueue.length;
    els.progressFill.style.width = "100%";
    var remaining = countWrong();
    els.reviewSummaryText.textContent = remaining > 0
      ? "まだ " + remaining + " 問、間違えたままです。"
      : "すべて正解できました！";
    els.btnReviewAgain.hidden = remaining === 0;
  }

  function startReview() {
    var ids = [];
    for (var id in state.answeredIds) {
      if (state.answeredIds.hasOwnProperty(id) && !state.answeredIds[id].correct) ids.push(id);
    }
    if (ids.length === 0) return;
    state.mode = "review";
    state.reviewQueue = ids;
    state.reviewIndex = 0;
    saveState();
    renderQuestion();
  }

  function exitReview() {
    state.mode = "normal";
    saveState();
    renderQuestion();
  }

  function restart() {
    if (!confirm("最初から解き直します。よろしいですか？")) return;
    state = {
      index: 0, correct: 0, answered: 0, answeredIds: {}, finished: false,
      mode: "normal", reviewQueue: [], reviewIndex: 0
    };
    saveState();
    updateGauge();
    updateReviewButtons();
    renderQuestion();
  }

  els.btnTrue.addEventListener("click", function () { handleAnswer(true); });
  els.btnFalse.addEventListener("click", function () { handleAnswer(false); });
  els.btnNext.addEventListener("click", next);
  els.btnRestart.addEventListener("click", restart);
  els.btnReset.addEventListener("click", restart);
  els.btnReviewWrong.addEventListener("click", startReview);
  els.btnReviewFromSummary.addEventListener("click", startReview);
  els.btnReviewAgain.addEventListener("click", startReview);
  els.btnExitReview.addEventListener("click", exitReview);
  els.btnExitReviewFromSummary.addEventListener("click", exitReview);

  loadState();
  updateGauge();
  updateReviewButtons();
  renderQuestion();
})();
