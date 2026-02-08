const BASE_URL = window.MY_SCRIPT_CONFIG.baseUrl;

(async function() {
    'use strict';

    const currentUrl = window.location.href;

    // URLパターンの定義（正規表現）
    const patternVisitHistory = /https:\/\/dxpo\.jp\/s\/tex\/[^/]+\/real-event-visit-history/;
    const patternGetQR = /https:\/\/dxpo\.jp\/s\/getqrinfo/;

    console.log("Checking page: " + currentUrl);

    if (patternVisitHistory.test(currentUrl)) {
        // --- 来場履歴ページの処理 ---
        const { initVisitHistory } = await import(`${BASE_URL}/modules/visitHistory.js`);
        initVisitHistory();

    } else if (patternGetQR.test(currentUrl)) {
        // --- QR情報取得ページの処理 ---
        const { initGetQR } = await import(`${BASE_URL}/modules/qrInfo.js`);
        initGetQR(BASE_URL);
    }
})();