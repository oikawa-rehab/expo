export const FIELDS = [
    // デフォルト値を指定可能にする（例: 通所関与は「なし」をデフォルトにする）
    { id: 'day', label: '通所関与', type: 'checkbox', options: ['あり'], tag: '通所'},
    { id: 'talk', label: '説明内容', type: 'checkbox', options: ['Cloud', 'Studio', 'モーション'], tag: '内容' },
    { id: 'probability', label: '対応', type: 'checkbox', options: ['高角度', '資料渡し'], tag: '対応' },
    { id: 'user', label: '担当者', type: 'checkbox', optionsByGroup: [
        { label: 'キャッチ', options: ['吉武', '真野', '三嶽', 'SH1', 'SH2'] },
        { label: '説明・SV', options: ['坂口', '田川', 'SH3', 'SH4', 'SH5', '佐鳥'] },
        { label: 'RS・他', options: ['國光', '佐藤', '及川'] }
    ], tag: '担当' },
    { id: 'comment', label: '自由メモ', type: 'textarea', tag: 'メモ' }
];