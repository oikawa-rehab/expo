export const FIELDS = [
    { id: 'day', label: '通所関与', type: 'radio', options: ['あり', 'なし'], tag: '通所' },
    { id: 'talk', label: '説明内容', type: 'checkbox', options: ['Cloud', 'Studio', 'モーション'], tag: '内容' },
    { id: 'probability', label: '確度', type: 'radio', options: ['高角度', '中角度', '低角度'], tag: '確度' },
    { id: 'user', label: '担当者', type: 'checkbox', options: ['田中', '伊藤', '佐藤'], tag: '担当' },
    { id: 'comment', label: '自由メモ', type: 'textarea', tag: 'メモ' }
];