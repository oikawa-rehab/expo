export const MyUtils = {
    /**
     * フォームデータ(Object)を【タグ】形式の文字列に変換
     * @param {Object} formData - { day: "あり", talk: ["Cloud"], ... }
     * @param {Array} fields - config.jsのFIELDS
     */
    serializeMemo: (formData, fields) => {
        // すべてのフィールドを出力するが、値が空のときは空文字として出力する
        return fields
            .map(field => {
                const value = formData[field.id];

                // 配列（checkbox）の場合はカンマ区切り、文字列の場合はそのまま。空の場合は空文字にする
                const displayValue = Array.isArray(value)
                    ? (value.length ? value.join(", ") : "")
                    : (value !== undefined && value !== null ? String(value) : "");

                // メモ欄の改行はCSV破壊を防ぐためスペースに置換
                const cleanValue = String(displayValue).replace(/\n/g, " ");

                return `【${field.tag}】${cleanValue}`;
            })
            .join(" ");      // 半角スペースで繋ぐ
    },

    /**
     * 【タグ】形式の文字列をオブジェクトに復元
     * @param {string} text - "【通所】あり 【内容】Cloud ..."
     * @param {Array} fields - config.jsのFIELDS
     */
    parseMemo: (text, fields) => {
        const result = {};
        fields.forEach(field => {
            // 正規表現：【タグ名】の後の、次の【 または 終端までの文字を抽出
            const regex = new RegExp(`【${field.tag}】(.*?)(?=【|$)`);
            const match = text.match(regex);
            const value = match ? match[1].trim() : "";

            // configの定義がcheckboxなら、復元時も配列に戻す
            if (field.type === 'checkbox') {
                result[field.id] = value ? value.split(", ") : [];
            } else {
                result[field.id] = value;
            }
        });
        return result;
    }
};