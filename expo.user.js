// ==UserScript==
// @name         DXPO Helper (Public Remote)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @match        https://dxpo.jp/s/tex/hokuriku25/real-event-visit-history*
// @match        https://dxpo.jp/s/tex/tokyo26/real-event-visit-history*
// @match        https://dxpo.jp/s/getqrinfo*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      raw.githubusercontent.com
// @connect      8fadf9ca1439.ngrok-free.app
// @connect      localhost
// @connect      localhost:8080
// ==/UserScript==

(function() {
    'use strict';

    // --- 設定項目 ---
    // Publicリポジトリなのでトークン不要
   const BASE_URL = "https://oikawa-rehab.github.io/expo/"
   //const BASE_URL = "http://localhost:8080";
    unsafeWindow.MY_SCRIPT_CONFIG = {
        baseUrl: BASE_URL
    };


    const date = Date.now();
    const JS_URL = `${BASE_URL}/main.js?v=${date}`;
    const CSS_URL = `${BASE_URL}/style.css?v=${date}`;

    // --- JSの読み込み ---
    import(JS_URL);

    // ヘッダーからAuthorizationを削除
    const headers = {
        "Cache-Control": "no-cache"
    };

    console.log("DXPO Helper: Publicリポジトリから読込中...");

    // --- CSSの読み込み ---
    GM_xmlhttpRequest({
        method: "GET",
        url: CSS_URL,
        headers: headers,
        onload: function(response) {
            if (response.status === 200) {
                GM_addStyle(response.responseText);
                console.log("DXPO Helper: CSSを適用しました");
            } else {
                console.error("DXPO Helper: CSSの取得失敗", response.status);
            }
        }
    });


})();