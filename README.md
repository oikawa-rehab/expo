**Project: DXPO Helper (Ops Optimization Tool)**

## **1\. プロジェクト概要**

展示会来場者記録システム（既存の外部システム）の入力・編集Opsを効率化するための拡張機能のTampermonkeyでカスタマイズするツール。

既存システムの「1つのメモ欄（\#memo）」に対して、構造化されたデータを【タグ】形式で保存・復元する。

## **2\. 技術スタック**

* **Frontend**: Vanilla JavaScript (ES Modules)  
* **Styling**: Tailwind CSS (既存サイトから継承)  
* **Local Server**: npx serve (Port: 8080\)  
* **Injection**: Tampermonkey

## **3\. ディレクトリ構成**

Plaintext
/  
├── tampermonkey.js  \# このファイルをTampermonkeyにコピーペーストで設置する 
├── main.js          \# エントリポイント。URL判定とモジュールの並列ロードを担当  
├── config.js        \# フィールド定義。項目の追加・変更はここが「唯一の正解」  
├── ui.js            \# UIエンジン。configに基づきHTMLフォームを生成・値を取得  
├── utils.js         \# データ変換。Object ↔ 【タグ】形式文字列の相互変換  
├── style.css        \# カスタムUI用の追加スタイル  
└── modules/  
    └── qrInfo.js    \# QR情報取得ページ専用のロジック（DOMインジェクション等）

## **4\. データ仕様（Tagged Text Format）**

CSV出力や人間による可読性を考慮し、以下の形式で \#memo に保存する。

【タグ名】値 【タグ名】値 ... 【メモ】自由記述

* **メリット**: スクリプトがなくても人間が読める、Excelで分割しやすい、正規表現で確実に復元できる。

## **5\. 開発環境のセットアップ**

Cursorで開発を再開する際、以下の手順でローカルサーバーを立てる必要がある。

1. **サーバー起動**:  
   Bash  
   npx serve \-l 8080 \--cors

2. **ブラウザ設定**:  
   https://dxpo.jp において「安全でないコンテンツ」を許可し、http://localhost:8080 へのアクセスを可能にする。

## **6\. Cursorへの指示用メモ**

開発時に以下のようなプロンプトで使用してください。

* 「config.js に新しく『予算』という項目（Radioボタン）を追加して。タグ名は『予算』で。」  
* 「ui.js の renderForm に、各フィールド間の余白を調整するTailwindクラスを追加して。」  
* 「qrInfo.js に、ページ読み込み時に \#memo から既存データをパースして、カスタムフォームに値を復元するロジックを追加して。」

## **7\. 現在のステータス**

* ✅ UIエンジンによる動的フォーム生成の実装完了  
* ✅ Promise.all によるモジュールの高速並列ロード完了  
* ✅ config.js 準拠の serializeMemo（保存用変換）の実装完了  
* ⏳ 保存済みデータからの parseMemo（復元用変換）およびUIへの反映機能の実装（**次のタスク**）

## Tampermonkey + ESM 開発トラブルシューティング・ガイド

### 1. 隔離環境（サンドボックス）の制限

Tampermonkeyは独自の「隔離された窓（Sandbox）」で動いています。

* **エラーの現象**: Tampermonkey側で `window.CONFIG = ...` と定義しても、`import` した先の `main.js` で `window.CONFIG` が `undefined` または `null` になる。
* **原因**: ユーザースクリプトの `window` と、ブラウザ本来の `window` が異なるため。
* **対策**:
* `// @grant unsafeWindow` を宣言する。
* `unsafeWindow.CONFIG = ...` のように、`unsafeWindow` に対して値をセットする。



### 2. ネットワークの壁（CORS & Mixed Content）

HTTPSのサイト（dxpo.jp）からHTTP（localhost）を叩く際の制限です。

* **エラーの現象**: `Access to script at 'http://localhost...' from origin 'https://dxpo.jp' has been blocked by CORS policy`.
* **対策① (CORS)**: ローカルサーバー起動時に `--cors` オプションを付加する（`npx serve -l 8080 --cors`）。
* **対策② (Mixed Content)**: ブラウザのアドレスバーの「鍵アイコン」→「サイトの設定」→「安全でないコンテンツ」を**許可**にする。これをしないとブラウザが静かにリクエストをブロックします。

### 3. ES Modules (import/export) の制限

`import` 文をブラウザで直接動かす際の厳格なルールです。

* **エラーの現象**: `Failed to resolve module specifier...` または `Unexpected token 'export'`.
* **原因**:
* ブラウザでは `from 'utils.js'` のような「裸の指定子」は禁止。必ず `./` や `../` が必要。
* `main.js` 自体を読み込む際は、Tampermonkeyから「動的インポート（ `import('...')` ）」として呼ぶ必要がある。


* **対策**:
* パスは必ず `import { ... } from './utils.js';` と書く。
* `import.meta` はモジュール外（Tampermonkeyエディタ内など）では使えない。



### 4. 404とMIMEタイプの罠（ngrok特有）

ngrokを経由してJSを配信する際に起きる問題です。

* **エラーの現象**: `Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"`.
* **原因**:
* 指定したURLにファイルがない（404エラー）。
* ngrokの「無料プラン警告画面（HTML）」が表示されており、ブラウザがそのHTMLをJSとして読み込もうとした。


* **対策**:
* 一度ブラウザでJSのURLを直接開き、ngrokの「Visit Site」ボタンを押してクッキーを保存させる。
* または `fetch` ヘッダーに `ngrok-skip-browser-warning: true` を入れてダミーリクエストを送る。



### 5. サイト連携の壁（Event Dispatch）

JSで値を書き換えても、既存システムの「保存ボタン」が反応しない問題です。

* **エラーの現象**: `#memo` に値を代入したが、保存ボタンがグレーアウトしたままになる。
* **原因**: ReactやVueなどのフレームワークは、要素の `value` を直接書き換えただけでは変更を検知できない。
* **対策**:
* 値を代入した後、手動でイベントを火花（dispatch）させる。


```javascript
el.value = "text";
el.dispatchEvent(new Event('input', { bubbles: true }));
el.dispatchEvent(new Event('change', { bubbles: true }));

```



### 6. パフォーマンスの壁（直列ロード）

`await import` を多用すると動作が重くなる問題です。

* **エラーの現象**: ページ読み込みからUIが表示されるまで数秒のタイムラグがある。
* **原因**: `await import(A); await import(B);` と書くと、AのDLが終わるまでBが始まらない（ウォーターフォール）。
* **対策**: `Promise.all` で並列化する。
```javascript
const [A, B] = await Promise.all([import(urlA), import(urlB)]);

```

## Tailwind 開発手順（追加）

ローカルで Tailwind をビルドして、Tampermonkey から読み込める `style.css` を出力する手順です。

1. 開発用（ウォッチ）ビルド:

   ```bash
   npm run tailwind:dev
   ```

   これで `src/tailwind.css` を入力に `./style.css` を出力し、変更を監視します。

2. プロダクション（最小化）ビルド:

   ```bash
   npm run tailwind:build
   ```

3. ローカルサーバーで配信（Tampermonkey から読み込み可能にするため）:

   ```bash
   npx serve -l 8080 --cors
   ```

4. Tampermonkey の設定:

- `tampermonkey.js` 内の `BASE_URL` を `http://localhost:8080` のままにしておけば開発中はローカルの `style.css` を参照します（ファイル更新はキャッシュ回避のため `?v=` パラメータ付きで読み込みます）。

5. 注意点:

- ブラウザで `https://dxpo.jp` を開き、サイト設定から「安全でないコンテンツ」を許可してください（Mixed Content によるブロックを回避するため）。
- CORS が問題になる場合は、サーバーを `--cors` オプション付きで立ててください。