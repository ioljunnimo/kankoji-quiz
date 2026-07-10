(function () {
  "use strict";

  var EMAIL_DOMAIN = "kankoji-quiz.local";
  var EMPLOYEE_ID_PATTERN = /^[A-Za-z0-9_-]{2,30}$/;

  var mode = "login"; // "login" | "signup"
  var appStarted = false;

  var els = {
    userBar: document.getElementById("userBar"),
    userLabel: document.getElementById("userLabel"),
    adminLink: document.getElementById("adminLink"),
    btnLogout: document.getElementById("btnLogout"),
    authGate: document.getElementById("authGate"),
    appContent: document.getElementById("appContent"),
    authForm: document.getElementById("authForm"),
    authTitle: document.getElementById("authTitle"),
    authEmployeeId: document.getElementById("authEmployeeId"),
    authPassword: document.getElementById("authPassword"),
    authError: document.getElementById("authError"),
    authSubmit: document.getElementById("authSubmit"),
    authToggleMode: document.getElementById("authToggleMode")
  };

  function employeeIdToEmail(employeeId) {
    return employeeId.trim().toLowerCase() + "@" + EMAIL_DOMAIN;
  }

  function showError(message) {
    els.authError.textContent = message;
    els.authError.hidden = false;
  }

  function clearError() {
    els.authError.hidden = true;
    els.authError.textContent = "";
  }

  function setMode(next) {
    mode = next;
    clearError();
    if (mode === "signup") {
      els.authTitle.textContent = "新規登録";
      els.authSubmit.textContent = "登録する";
      els.authToggleMode.textContent = "アカウントをお持ちの方はこちら（ログイン）";
    } else {
      els.authTitle.textContent = "ログイン";
      els.authSubmit.textContent = "ログイン";
      els.authToggleMode.textContent = "アカウントをお持ちでない方はこちら（新規登録）";
    }
  }

  function translateAuthError(err) {
    switch (err.code) {
      case "auth/email-already-in-use": return "その社員番号は既に登録されています。";
      case "auth/weak-password": return "パスワードは6文字以上にしてください。";
      case "auth/wrong-password":
      case "auth/user-not-found":
      case "auth/invalid-credential": return "社員番号またはパスワードが違います。";
      case "auth/invalid-email": return "社員番号の形式が正しくありません。";
      default: return "エラーが発生しました（" + err.code + "）。";
    }
  }

  els.authToggleMode.addEventListener("click", function () {
    setMode(mode === "login" ? "signup" : "login");
  });

  els.authForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearError();

    var employeeId = els.authEmployeeId.value.trim();
    var password = els.authPassword.value;

    if (!EMPLOYEE_ID_PATTERN.test(employeeId)) {
      showError("社員番号は半角英数字（2〜30文字、- や _ も使用可）で入力してください。");
      return;
    }

    els.authSubmit.disabled = true;
    var email = employeeIdToEmail(employeeId);

    var task = mode === "signup"
      ? window.kankojiAuth.createUserWithEmailAndPassword(email, password).then(function (cred) {
          return window.kankojiDb.collection("users").doc(cred.user.uid).set({
            employeeId: employeeId,
            role: "employee",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        })
      : window.kankojiAuth.signInWithEmailAndPassword(email, password);

    task.catch(function (err) {
      showError(translateAuthError(err));
    }).finally(function () {
      els.authSubmit.disabled = false;
    });
  });

  els.btnLogout.addEventListener("click", function () {
    window.kankojiAuth.signOut();
  });

  window.kankojiAuth.onAuthStateChanged(function (user) {
    if (!user) {
      appStarted = false;
      els.userBar.hidden = true;
      els.appContent.hidden = true;
      els.authGate.hidden = false;
      setMode("login");
      els.authForm.reset();
      return;
    }

    window.kankojiDb.collection("users").doc(user.uid).get().then(function (doc) {
      var data = (doc.exists && doc.data()) || {};
      els.userLabel.textContent = "社員番号：" + (data.employeeId || "?");
      els.adminLink.hidden = data.role !== "admin";
      els.userBar.hidden = false;
      els.authGate.hidden = true;
      els.appContent.hidden = false;

      if (!appStarted) {
        appStarted = true;
        window.startKankojiApp(user.uid);
      }
    }).catch(function (err) {
      console.error("ユーザー情報の取得に失敗しました", err);
    });
  });
})();
