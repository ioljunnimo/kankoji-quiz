(function () {
  "use strict";

  var TOTAL = QUESTIONS.length;
  var currentUid = null;

  var els = {
    userBar: document.getElementById("userBar"),
    userLabel: document.getElementById("userLabel"),
    btnLogout: document.getElementById("btnLogout"),
    statusCard: document.getElementById("statusCard"),
    statusText: document.getElementById("statusText"),
    statusLink: document.getElementById("statusLink"),
    adminPanel: document.getElementById("adminPanel"),
    tableBody: document.getElementById("adminTableBody")
  };

  els.btnLogout.addEventListener("click", function () {
    window.kankojiAuth.signOut();
  });

  function showStatus(message, linkText) {
    els.statusText.textContent = message;
    els.statusCard.hidden = false;
    els.adminPanel.hidden = true;
    if (linkText) {
      els.statusLink.textContent = linkText;
      els.statusLink.hidden = false;
    } else {
      els.statusLink.hidden = true;
    }
  }

  function formatTimestamp(ts) {
    if (!ts || typeof ts.toDate !== "function") return "—";
    return ts.toDate().toLocaleString("ja-JP");
  }

  function countWrong(answeredIds) {
    var n = 0;
    for (var id in answeredIds) {
      if (answeredIds.hasOwnProperty(id) && !answeredIds[id].correct) n++;
    }
    return n;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderRow(uid, userData, progressData) {
    var tr = document.createElement("tr");
    var progress = progressData || {};
    var answered = progress.answered || 0;
    var correct = progress.correct || 0;
    var rate = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    var wrong = countWrong(progress.answeredIds || {});
    var isAdminRow = userData.role === "admin";

    tr.innerHTML =
      "<td>" + escapeHtml(userData.employeeId || "?") + "</td>" +
      "<td>" + (isAdminRow ? "管理者" : "一般") + "</td>" +
      "<td>" + answered + " / " + TOTAL + "</td>" +
      "<td>" + rate + "%</td>" +
      "<td>" + wrong + "</td>" +
      "<td>" + formatTimestamp(progress.updatedAt) + "</td>" +
      "<td></td>";

    var actionCell = tr.lastElementChild;
    if (uid !== currentUid) {
      var btn = document.createElement("button");
      btn.className = "text-btn";
      btn.textContent = isAdminRow ? "一般に戻す" : "管理者にする";
      btn.addEventListener("click", function () {
        btn.disabled = true;
        window.kankojiDb.collection("users").doc(uid).update({
          role: isAdminRow ? "employee" : "admin"
        }).then(loadDashboard).catch(function (err) {
          alert("更新に失敗しました：" + err.message);
          btn.disabled = false;
        });
      });
      actionCell.appendChild(btn);
    }

    return tr;
  }

  function loadDashboard() {
    window.kankojiDb.collection("users").get().then(function (snapshot) {
      var users = [];
      snapshot.forEach(function (doc) { users.push({ uid: doc.id, data: doc.data() }); });
      users.sort(function (a, b) {
        return String(a.data.employeeId || "").localeCompare(String(b.data.employeeId || ""));
      });

      return Promise.all(users.map(function (u) {
        return window.kankojiDb.collection("progress").doc(u.uid).get().then(function (doc) {
          return { uid: u.uid, userData: u.data, progressData: doc.exists ? doc.data() : null };
        });
      }));
    }).then(function (rows) {
      els.tableBody.innerHTML = "";
      rows.forEach(function (row) {
        els.tableBody.appendChild(renderRow(row.uid, row.userData, row.progressData));
      });
      els.statusCard.hidden = true;
      els.adminPanel.hidden = false;
    }).catch(function (err) {
      console.error(err);
      showStatus("データの取得に失敗しました：" + err.message, null);
    });
  }

  window.kankojiAuth.onAuthStateChanged(function (user) {
    if (!user) {
      els.userBar.hidden = true;
      showStatus("管理者画面を見るにはログインが必要です。", "ログイン画面へ");
      return;
    }

    currentUid = user.uid;

    window.kankojiDb.collection("users").doc(user.uid).get().then(function (doc) {
      var data = (doc.exists && doc.data()) || {};
      els.userLabel.textContent = "社員番号：" + (data.employeeId || "?");
      els.userBar.hidden = false;

      if (data.role !== "admin") {
        showStatus("この画面は管理者のみ閲覧できます。", "クイズ画面へ");
        return;
      }

      loadDashboard();
    }).catch(function (err) {
      console.error(err);
      showStatus("ユーザー情報の取得に失敗しました：" + err.message, null);
    });
  });
})();
