export const MyUtils = {
    /**
     * フォームデータ(Object)を【タグ】形式の文字列に変換
     * @param {Object} formData - { day: "あり", talk: ["Cloud"], ... }
     * @param {Array} fields - config.jsのFIELDS
     */
    serializeMemo: (formData, fields) => {
        return fields
            .map(field => {
                const value = formData[field.id];

                // 値が空（空文字、空配列、未定義）ならその項目は出力しない
                if (!value || (Array.isArray(value) && value.length === 0)) {
                    return null;
                }

                // 配列（checkbox）の場合はカンマ区切り、文字列の場合はそのまま
                const displayValue = Array.isArray(value) 
                    ? value.join(", ") 
                    : value;

                // メモ欄の改行はCSV破壊を防ぐためスペースに置換
                const cleanValue = String(displayValue).replace(/\n/g, " ");

                return `【${field.tag}】${cleanValue}`;
            })
            .filter(Boolean) // null（空項目）を除去
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