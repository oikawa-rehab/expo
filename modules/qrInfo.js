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

    mainContainer.insertBefore(customForm, mainContainer.children[1]);

    // 3. 自動同期（クリック不要）
    const updateMemo = () => {
        // UIエンジンで画面の値を収集
        const currentData = UIEngine.getValues(customForm, FIELDS);

        // 汎用化したUtilsで文字列へ変換
        const taggedText = MyUtils.serializeMemo(currentData, FIELDS);

        // 既存システムへ流し込み（値のみ更新。保存は既存サイト側の挙動に任せる）
        originalMemo.value = taggedText;
        originalMemo.dispatchEvent(new Event('input', { bubbles: true }));

        console.log("Auto-synced String:", taggedText);
    };

    // ページ読み込み時点で一度変換（空欄状態も出力）
    updateMemo();

    // 以降はフォーム内の変更時に自動で再生成して反映
    customForm.addEventListener('input', updateMemo);
    customForm.addEventListener('change', updateMemo);
}