// modules/qrInfo.js

export async function initGetQR(BASE_URL) {
    // 1. 必要なファイルを並列で一気に読み込む（高速化）
    const [
        { MyUtils },
        { FIELDS },
        { UIEngine }
    ] = await Promise.all([
        import(`${BASE_URL}/utils.js`),
        import(`${BASE_URL}/config.js`),
        import(`${BASE_URL}/ui.js`)
    ]);

    const originalMemo = document.querySelector('#memo');
    const mainContainer = document.querySelector('div.container div:first-child');
    if (!originalMemo || !mainContainer) return;
    if (document.getElementById('tm-custom-form')) return; // 重複防止

    // 2. UIの描画
    const customForm = UIEngine.renderForm(FIELDS);
    
    const syncBtn = document.createElement('button');
    syncBtn.type = "button";
    syncBtn.innerText = "内容をメモ欄に同期";
    syncBtn.className = "w-full bg-blue-500 text-white p-3 rounded-lg font-bold mt-4 shadow-md transition";
    customForm.appendChild(syncBtn);

    mainContainer.insertBefore(customForm, mainContainer.children[1]);

    // 3. 同期イベント
    syncBtn.addEventListener('click', () => {
        // UIエンジンで画面の値を収集
        const currentData = UIEngine.getValues(customForm, FIELDS);
        
        // 汎用化したUtilsで文字列へ変換
        const taggedText = MyUtils.serializeMemo(currentData, FIELDS);
        
        // 既存システムへ流し込み
        originalMemo.value = taggedText;
        originalMemo.dispatchEvent(new Event('input', { bubbles: true }));
        
        console.log("Synced String:", taggedText);
    });
}