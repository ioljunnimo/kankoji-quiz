# 管工事1級 学科試験 一問一答アプリ

「管工事１級_筆記試験.xlsx」の388問(○×形式)を使った、1問ずつ順番に出題→答え合わせ型のWebアプリです。
ビルド不要の静的サイト(HTML/CSS/JS)なので、Firebase Hostingにそのままデプロイできます。

## 構成

```
kankoji-quiz/
├── index.html        # 画面本体
├── css/style.css      # デザイン(ブループリント風)
├── js/questions.js    # 問題データ(388問、自動生成)
├── js/app.js          # 出題・採点ロジック
└── firebase.json      # Firebase Hosting設定
```

## 機能

- 388問を順番に出題 → ○/×を選択 → 正誤と解説を表示 → 次の問題へ
- 正答率をゲージ(圧力計モチーフ)でリアルタイム表示
- 進捗はブラウザのlocalStorageに自動保存(同じ端末なら閉じても続きから)
- 「進捗をリセット」でいつでも最初からやり直し可能
- 広告枠を2箇所に確保済み(ページ上部・下部)。AdSenseやアフィリエイトのタグを埋め込むだけで使えます

### 広告枠の場所

`index.html` 内の以下の箇所です。実際の広告コード(AdSenseのscriptタグなど)に差し替えてください。

```html
<div class="ad-slot ad-slot--top" id="ad-top">
  <span class="ad-slot__tag">広告枠 / 300x100</span>
</div>
```
```html
<div class="ad-slot ad-slot--bottom" id="ad-bottom">
  <span class="ad-slot__tag">広告枠 / 320x50</span>
</div>
```

## 除外した問題について

元データのうち3問(No.18, 19, 156)は「選ぶ」形式の穴埋め問題で、○×形式と合わないため今回は含めていません。将来的に穴埋め問題用の別モードを追加することも可能です。

## ローカルで動作確認する方法

ブラウザで `index.html` を直接開くだけで動作します。二重クリックでOKです。

## Firebaseへのデプロイ手順

初めての場合、下記をターミナルで順番に実行してください。

```bash
# 1. Firebase CLIをインストール（初回のみ）
npm install -g firebase-tools

# 2. Googleアカウントでログイン
firebase login

# 3. このフォルダに移動
cd kankoji-quiz

# 4. Firebaseプロジェクトを初期化（初回のみ）
#    「Hosting」を選択し、公開ディレクトリは「.」（このフォルダ自体）を指定
#    firebase.jsonは既にあるので上書き確認が出たら「いいえ」でOK
firebase init hosting

# 5. デプロイ
firebase deploy
```

デプロイが完了すると `https://（プロジェクト名）.web.app` のようなURLが発行され、そこで公開されます。

## 今後の拡張アイデア(必要なら)

- 苦手な問題だけ復習するモード
- ランダム出題モード
- 分野別(法規/施工/設備 等)フィルタ
- 穴埋め問題(3問)専用モード
