(function() {
    'use strict';
    console.log("GitHubからのスクリプトが読み込まれました！");
    
    // サンプル：ページ左上にボタンを追加
    const btn = document.createElement('button');
    btn.innerText = "GitHub Update Test";
    btn.className = "my-custom-button";
    document.body.appendChild(btn);
    
    btn.onclick = () => alert("GitHubから更新されました！");
})();