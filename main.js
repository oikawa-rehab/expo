(function() {
    'use strict';

    // --- Helpers -------------------------------------------------
    const q = (sel, root = document) => root.querySelector(sel);
    const qAll = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    const addStyle = cssText => {
        const s = document.createElement('style');
        s.type = 'text/css';
        s.appendChild(document.createTextNode(cssText));
        document.head.appendChild(s);
    };

    // --- Config / constants -------------------------------------
    const HEADER_COLUMN_MOVE_INDICES_HIDE = [7, 8, 9];
    const HEADER_COLUMN_MOVE_INDICES_SHOW = [7, 8, 9, 10, 11, 12, 13, 14, 15];
    const BODY_COLUMN_MOVE_INDICES_HIDE = [9, 10, 11];
    const BODY_COLUMN_MOVE_INDICES_SHOW = [9, 10, 11, 12, 13, 14, 15, 16, 17];
    const PATH_TO_REMOVE = '/s/log/real-event-visit-history';

    // --- Elements ------------------------------------------------
    const main = q('main');
    const table = q('section.table-no-responsive > table');
    const sidebarContainer = q('article > aside.real-event');
    const headerInsertTarget = q('main > header#qr_on > section:nth-child(2)');

    if (!sidebarContainer) {
        console.error('Sidebar container (article > aside.real-event) not found.');
        return;
    }
    if (!headerInsertTarget) {
        console.error('Header target (main > header#qr_on > section:nth-child(2)) not found.');
        return;
    }
    if (!table) {
        console.warn('Table not found: some features will be disabled.');
    }

    const targetColspan = table ? q('thead > tr:first-child > th:nth-child(4)', table) : null;

    // --- Functions -----------------------------------------------
    // Remove PATH_TO_REMOVE from any <a href> inside thead > th
    function removePathFromHeaderLinks() {
        if (!table) return;
        const links = qAll('thead th a[href]', table);
        links.forEach(a => {
            const orig = a.getAttribute('href') || '';
            let next = orig.replace(PATH_TO_REMOVE, '');
            next = next.replace(/sort_order=updated_at/g, 'sort_order=created_at');

            // If current page URL is sorted by created_at ascending, prefer header links to use desc
            const search = window.location.search || window.location.href;
            const pageHasCreatedAsc = /[?&]sort_order=created_at\b/.test(search) && /[?&]asc_desc=asc\b/.test(search);
            if (pageHasCreatedAsc) {
                next = next.replace(/asc_desc=asc/g, 'asc_desc=desc');
            }

            if (next !== orig) {
                a.setAttribute('href', next);
            }
        });
    }

    // Move header th elements to the end of the first header row.
    // indices are 1-based positions in the original header row.
    function moveHeaderThsToEnd(hide) {
        if (!table) return;
        const firstHeaderRow = q('thead > tr:first-child', table);
        if (!firstHeaderRow) return;

        const ths = qAll('th', firstHeaderRow); // live snapshot turned to array
        const indices = hide ? HEADER_COLUMN_MOVE_INDICES_HIDE : HEADER_COLUMN_MOVE_INDICES_SHOW;
        // collect in original order then append
        const toMove = indices.map(i => ths[i - 1]).filter(Boolean);
        toMove.forEach(th => firstHeaderRow.appendChild(th));
    }

    // For each tbody row, move specified td cells to end, preserving order
    function moveBodyTdsToEnd(hide) {
        if (!table) return;
        const trs = qAll('tbody tr', table);
        const indices = hide ? BODY_COLUMN_MOVE_INDICES_HIDE : BODY_COLUMN_MOVE_INDICES_SHOW;
        trs.forEach(tr => {
            const tds = qAll('td', tr);
            const toMove = indices.map(i => tds[i - 1]).filter(Boolean);
            toMove.forEach(td => tr.appendChild(td));
        });
    }

    // Insert CSS used by the script
    function addCustomStyles() {
        const css = `
            .sidebar-content-hidden { display: none !important; }
            .hidden { display: none !important; }
            .focus section.table-no-responsive { width: 100%; min-width: 100%; max-width: 1250px; }
            .td-pararaph { white-space: break-spaces !important; }
            .focus h2, .focus h3 { display: none; }
            .focus .login-info-area { display: none !important; }
            .focus .event-info-area { display: none !important; }
            .focus .breadcrumbs { display: none; }
            .focus .area-notification { display: none; }
            .focus table.table thead tr:first-child th:nth-child(3) { display: none; }
            .focus table.table thead tr:nth-child(2) { display: none; }
            .focus table.table tbody tr td:nth-child(3),
            .focus table.table tbody tr td:nth-child(4),
            .focus table.table tbody tr td:nth-child(6) { display: none; }
            .focus table.table tbody tr td:nth-child(9),
            .focus table.table tbody tr td:nth-child(10),
            .focus table.table tbody tr td:nth-child(11)
            {
                white-space: break-spaces;
                min-width: 150px;
            }

        `;
        addStyle(css);
    }

    // --- Init ----------------------------------------------------
    // create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'フォーカスモード切り替え';
    toggleBtn.style.width = '100%';
    toggleBtn.style.marginBottom = '10px';
    headerInsertTarget.appendChild(toggleBtn);
    removePathFromHeaderLinks();
    addCustomStyles();
    (function initializeFocusMode() {
        const isFocus = localStorage.getItem('focusMode') === 'true';
        if (isFocus) {
            focus(); // 初期状態を適用
        }
    })();

    toggleBtn.addEventListener('click', () => {
        focus();
    });

    function focus() {
        sidebarContainer.classList.toggle('sidebar-content-hidden');
        if (main) main.classList.toggle('focus');

        const focus = sidebarContainer.classList.contains('sidebar-content-hidden');

        if (targetColspan) {
            targetColspan.setAttribute('colspan', focus ? '1' : '3');
        }

        moveHeaderThsToEnd(focus);
        moveBodyTdsToEnd(focus);
        localStorage.setItem('focusMode', focus);
    }

})();