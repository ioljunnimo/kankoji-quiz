(function () {
  "use strict";

  var STORAGE_KEY = "kankoji1_quiz_progress_v1";
  var TOTAL = QUESTIONS.length;

  var state = {
    index: 0,
    correct: 0,
    answered: 0,
    answeredIds: {},   // id -> {picked, correct}
    finished: false
  };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && typeof saved.index === "number") {
        state = saved;
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
    gaugePct: document.getElementById("gaugePct")
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

  function updateProgress() {
    var shown = Math.min(state.index + 1, TOTAL);
    els.progressText.textContent = "問題 " + shown + " / " + TOTAL;
    els.progressFill.style.width = (state.index / TOTAL * 100) + "%";
  }

  function renderQuestion() {
    if (state.index >= TOTAL) {
      showSummary();
      return;
    }
    var q = QUESTIONS[state.index];
    els.tag.textContent = "Q-" + String(q.id).padStart(3, "0");
    els.question.textContent = q.q;
    els.result.hidden = true;
    els.answerRow.hidden = false;
    els.btnTrue.disabled = false;
    els.btnFalse.disabled = false;
    els.btnTrue.classList.remove("answer-btn--picked");
    els.btnFalse.classList.remove("answer-btn--picked");
    updateProgress();
    els.quizCard.hidden = false;
    els.summaryCard.hidden = true;
  }

  function handleAnswer(picked) {
    var q = QUESTIONS[state.index];
    var isCorrect = picked === q.answer;

    els.btnTrue.disabled = true;
    els.btnFalse.disabled = true;
    (picked ? els.btnTrue : els.btnFalse).classList.add("answer-btn--picked");

    els.resultBanner.className = "result__banner " + (isCorrect ? "result__banner--correct" : "result__banner--wrong");
    els.resultBanner.textContent = isCorrect ? "正解です" : "不正解 — 正解は「" + (q.answer ? "○ 正しい" : "× 誤り") + "」";
    els.resultExp.textContent = q.exp || "(解説なし)";
    els.result.hidden = false;

    if (!state.answeredIds[q.id]) {
      state.answered += 1;
      if (isCorrect) state.correct += 1;
      state.answeredIds[q.id] = { picked: picked, correct: isCorrect };
    }
    updateGauge();
    saveState();
  }

  function next() {
    state.index += 1;
    if (state.index >= TOTAL) {
      state.finished = true;
    }
    saveState();
    renderQuestion();
  }

  function showSummary() {
    els.quizCard.hidden = true;
    els.summaryCard.hidden = false;
    els.progressText.textContent = "問題 " + TOTAL + " / " + TOTAL;
    els.progressFill.style.width = "100%";
    els.summaryCorrect.textContent = state.correct;
    els.summaryTotal.textContent = TOTAL;
    var rate = state.answered > 0 ? Math.round((state.correct / state.answered) * 100) : 0;
    els.summaryRate.textContent = "正答率 " + rate + "%";
  }

  function restart() {
    if (!confirm("最初から解き直します。よろしいですか？")) return;
    state = { index: 0, correct: 0, answered: 0, answeredIds: {}, finished: false };
    saveState();
    updateGauge();
    renderQuestion();
  }

  els.btnTrue.addEventListener("click", function () { handleAnswer(true); });
  els.btnFalse.addEventListener("click", function () { handleAnswer(false); });
  els.btnNext.addEventListener("click", next);
  els.btnRestart.addEventListener("click", restart);
  els.btnReset.addEventListener("click", restart);

  loadState();
  updateGauge();
  renderQuestion();
})();
