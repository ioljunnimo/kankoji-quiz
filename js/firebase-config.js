// Firebaseコンソール > プロジェクトの設定 > 全般 > マイアプリ(ウェブアプリ) からコピーした設定に置き換えてください。
// Firebase Local Emulator Suite で動かす場合はダミー値のままで構いません。
var FIREBASE_CONFIG = {
  apiKey: "REPLACE_WITH_API_KEY",
  authDomain: "REPLACE_WITH_PROJECT_ID.firebaseapp.com",
  projectId: "REPLACE_WITH_PROJECT_ID",
  storageBucket: "REPLACE_WITH_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_WITH_SENDER_ID",
  appId: "REPLACE_WITH_APP_ID"
};

// ローカルのFirebase Emulator Suiteに接続する場合はtrueにする（本番公開時はfalseのままpushしてください）。
var USE_FIREBASE_EMULATOR = false;
