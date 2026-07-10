(function () {
  "use strict";

  firebase.initializeApp(FIREBASE_CONFIG);

  var auth = firebase.auth();
  var db = firebase.firestore();

  if (typeof USE_FIREBASE_EMULATOR !== "undefined" && USE_FIREBASE_EMULATOR) {
    auth.useEmulator("http://localhost:9099");
    db.useEmulator("localhost", 8080);
  }

  window.kankojiAuth = auth;
  window.kankojiDb = db;
})();
