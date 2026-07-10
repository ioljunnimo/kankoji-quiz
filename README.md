# 管工事1級 学科試験 一問一答アプリ（社内向け）

「管工事１級_筆記試験.xlsx」の388問(○×形式)を使った、1問ずつ順番に出題→答え合わせ型のWebアプリです。
社員番号＋パスワードでログインし、各自の学習進捗はFirebaseに保存されます。管理者アカウントは全社員の学習状況（進捗・正答率・間違えた問題数など）を一覧で確認できます。

## 構成

```
kankoji-quiz/
├── index.html          # クイズ画面本体（ログイン画面を含む）
├── admin.html           # 管理者用ダッシュボード
├── css/style.css        # デザイン(ブループリント風)
├── js/questions.js      # 問題データ(388問、自動生成)
├── js/app.js            # 出題・採点ロジック（進捗はFirestoreに保存）
├── js/auth.js           # ログイン・新規登録・ログアウト
├── js/admin.js          # 管理者ダッシュボードのロジック
├── js/firebase-config.js # Firebaseプロジェクトの接続情報（要編集）
├── js/firebase-init.js  # Firebase初期化
├── firestore.rules      # Firestoreセキュリティルール
└── firebase.json        # Firebase Hosting / Firestore設定
```

## 機能

- 388問を順番に出題 → ○/×を選択 → 正誤と解説を表示 → 次の問題へ
- 正答率をゲージ(圧力計モチーフ)でリアルタイム表示
- 社員番号＋パスワードでログイン（Firebase Authentication）。進捗はアカウントに紐づいてFirestoreに自動保存され、別の端末からログインしても続きから再開できます
- 間違えた問題だけを解き直す「復習モード」
- セーブポイント機能（N問ごとの自動セーブ、手動セーブ、次回起動時に確認して再開）
- 「進捗をリセット」でいつでも最初からやり直し可能
- 管理者アカウントは `admin.html` で全社員の進捗・正答率・間違えた問題数・最終更新日時を一覧表示し、他の社員を管理者に昇格/降格できます

## 除外した問題について

元データのうち3問(No.18, 19, 156)は「選ぶ」形式の穴埋め問題で、○×形式と合わないため今回は含めていません。将来的に穴埋め問題用の別モードを追加することも可能です。

## Firebaseプロジェクトのセットアップ（初回のみ）

1. [Firebase console](https://console.firebase.google.com/) で新規プロジェクトを作成
2. 左メニュー「Authentication」→「Sign-in method」→「メール/パスワード」を有効化
3. 左メニュー「Firestore Database」→「データベースの作成」（本番モードでOK。ルールは後述の`firestore.rules`をデプロイします）
4. 「プロジェクトの設定」（歯車アイコン）→「全般」→「マイアプリ」で「ウェブアプリを追加」し、表示された設定オブジェクトを `js/firebase-config.js` の `FIREBASE_CONFIG` に貼り付ける（`USE_FIREBASE_EMULATOR` は `false` のまま）

## ローカルで動作確認する方法

Firebaseと通信するため、`index.html` を直接開くだけでは動きません。以下のいずれかで確認してください。

- **Firebase Local Emulator Suiteを使う（本番のFirebaseに触れずに試せる）**
  ```bash
  npm install -g firebase-tools
  firebase emulators:start --project demo-kankoji-quiz
  ```
  `js/firebase-config.js` の `USE_FIREBASE_EMULATOR` を一時的に `true` にすると、ローカルのAuth/Firestoreエミュレータに接続されます（本番用にpushする際は `false` に戻してください）。
- **実際にFirebaseへデプロイして確認する**（下記手順）

## Firebaseへのデプロイ手順

```bash
# 1. Firebase CLIをインストール（初回のみ）
npm install -g firebase-tools

# 2. Googleアカウントでログイン
firebase login

# 3. このフォルダに移動
cd kankoji-quiz

# 4. Firebaseプロジェクトを初期化（初回のみ）
#    「Hosting」「Firestore」を選択し、公開ディレクトリは「.」（このフォルダ自体）を指定
#    firebase.json・firestore.rulesは既にあるので上書き確認が出たら「いいえ」でOK
firebase init

# 5. セキュリティルールとサイトをデプロイ
firebase deploy
```

デプロイが完了すると `https://（プロジェクト名）.web.app` のようなURLが発行され、そこで公開されます。

## 最初の管理者を設定する

新規登録した社員は全員「一般」権限で始まります（自己申告で管理者になることはできない設計です）。最初の管理者だけは、Firebaseコンソールで手動設定してください。

1. アプリで社員番号＋パスワードを登録（例：`admin001`）
2. Firebaseコンソール →「Firestore Database」→ `users` コレクション → 該当ユーザーのドキュメントを開く
3. `role` フィールドの値を `"employee"` から `"admin"` に変更して保存

これでそのアカウントでログインすると「管理者画面」へのリンクが表示され、以降は管理者ダッシュボードから他の社員を管理者に昇格/降格できます。

## 今後の拡張アイデア(必要なら)

- ランダム出題モード
- 分野別(法規/施工/設備 等)フィルタ
- 穴埋め問題(3問)専用モード
- 部署・グループ単位での進捗集計
