export function initVisitHistory() {
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

        // --- Memo editor (構造化フォーム対応：check/radio + 自由メモ) -----------
        const MEMO_MODAL_ID = 'tm-memo-modal';
        let currentEditContext = null; // { button, id, td }
        let customFormEl = null;

        const BASE_URL = (window.MY_SCRIPT_CONFIG && window.MY_SCRIPT_CONFIG.baseUrl) ? window.MY_SCRIPT_CONFIG.baseUrl : '';
        
        let MyUtils = null, FIELDS = null, UIEngine = null;
        // Promise that resolves when structured modules are loaded (or null on failure)
        const modulesReady = (async () => {
            try {
                const mods = await Promise.all([
                    import(`${BASE_URL}/utils.js`),
                    import(`${BASE_URL}/config.js`),
                    import(`${BASE_URL}/ui.js`)
                ]);
                MyUtils = mods[0].MyUtils;
                FIELDS = mods[1].FIELDS;
                UIEngine = mods[2].UIEngine;
                return { MyUtils, FIELDS, UIEngine };
            } catch (e) {
                console.warn('Could not load structured form modules:', e);
                return null;
            }
        })();

        function createMemoModal() {
            if (document.getElementById(MEMO_MODAL_ID)) return;
            const overlay = document.createElement('div');
            overlay.id = MEMO_MODAL_ID;
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.right = '0';
            overlay.style.bottom = '0';
            overlay.style.background = 'rgba(0,0,0,0.5)';
            overlay.style.display = 'none';
            overlay.style.zIndex = '9999';

            const box = document.createElement('div');
            box.style.width = '720px';
            box.style.margin = '6% auto';
            box.style.background = '#fff';
            box.style.borderRadius = '6px';
            box.style.padding = '16px';
            box.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)';

            const title = document.createElement('h3');
            title.innerText = 'メモ編集';
            title.style.marginTop = '0';

            // form area: either structured form or fallback textarea
            const formArea = document.createElement('div');
            formArea.id = `${MEMO_MODAL_ID}-formarea`;

            // If UIEngine and FIELDS are available, render structured form
            if (UIEngine && FIELDS) {
                try {
                    customFormEl = UIEngine.renderForm(FIELDS);
                    formArea.appendChild(customFormEl);
                    
                } catch (e) {
                    console.warn('renderForm failed, falling back to textarea', e);
                }
            } else {
                // structured form not available yet — textarea fallback will be used
            }

            // fallback textarea when structured form isn't available
            const textarea = document.createElement('textarea');
            textarea.id = `${MEMO_MODAL_ID}-textarea`;
            textarea.style.width = '100%';
            textarea.style.height = '160px';
            textarea.style.marginTop = '8px';
            if (!customFormEl) {
                formArea.appendChild(textarea);
            }

            const footer = document.createElement('div');
            footer.style.display = 'flex';
            footer.style.justifyContent = 'flex-end';
            footer.style.gap = '8px';
            footer.style.marginTop = '12px';

            const btnCancel = document.createElement('button');
            btnCancel.innerText = 'キャンセル';
            btnCancel.className = 'button';
            btnCancel.addEventListener('click', hideMemoModal);

            const btnSave = document.createElement('button');
            btnSave.innerText = '保存';
            btnSave.className = 'button';
            btnSave.addEventListener('click', onSaveMemo);

            footer.appendChild(btnCancel);
            footer.appendChild(btnSave);

            box.appendChild(title);
            box.appendChild(formArea);
            box.appendChild(footer);
            overlay.appendChild(box);
            document.body.appendChild(overlay);
        }

        function showMemoModal() {
            const overlay = document.getElementById(MEMO_MODAL_ID);
            if (!overlay) return;
            overlay.style.display = 'block';
            const ta = document.getElementById(`${MEMO_MODAL_ID}-textarea`);
            if (ta) ta.focus();
        }

        function hideMemoModal() {
            const overlay = document.getElementById(MEMO_MODAL_ID);
            if (!overlay) return;
            overlay.style.display = 'none';
            currentEditContext = null;
        }

        async function onSaveMemo() {
            if (!currentEditContext) return;
            const { button, id, td } = currentEditContext;
            let newNote = '';

            // If structured form present, serialize values
            if (customFormEl && MyUtils && FIELDS && UIEngine) {
                const values = UIEngine.getValues(customFormEl, FIELDS);
                newNote = MyUtils.serializeMemo(values, FIELDS);
            } else {
                const ta = document.getElementById(`${MEMO_MODAL_ID}-textarea`);
                if (!ta) return;
                newNote = ta.value;
            }

            // UI state
            const saveBtn = Array.from(document.querySelectorAll(`#${MEMO_MODAL_ID} .button`)).find(b => b.innerText === '保存');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerText = '保存中...';
            }

            try {
                const csrf = window.livewire_token || '';
                const res = await fetch(`${location.pathname.replace(/\/+$/, '')}/save-note`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf,
                    },
                    body: JSON.stringify({ id: Number(id), newNote })
                });
                const json = await res.json();
                // 成功したら td を更新
                td.innerHTML = newNote;
            } catch (e) {
                console.error('save memo failed', e);
                alert('保存に失敗しました。再度お試しください。');
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerText = '保存';
                }
                hideMemoModal();
            }
        }

        function openMemoModal(button, id, tdId) {
            const td = document.getElementById(tdId);
            if (!td) return;
            currentEditContext = { button, id, td };

            // If structured form available, parse existing tagged text and populate form fields
            if (customFormEl && MyUtils && FIELDS && UIEngine) {
                // parse memo from existing td text
                const parsed = MyUtils.parseMemo(td.innerText || '', FIELDS);
                // set values into form inputs
                FIELDS.forEach(field => {
                    const name = field.id;
                    if (field.type === 'radio') {
                        const input = customFormEl.querySelector(`input[name="${name}"][value="${parsed[name]}"]`);
                        if (input) input.checked = true;
                    } else if (field.type === 'checkbox') {
                        const vals = parsed[name] || [];
                        Array.from(customFormEl.querySelectorAll(`input[name="${name}"]`)).forEach(inp => {
                            inp.checked = vals.includes(inp.value);
                        });
                    } else if (field.type === 'textarea') {
                        const ta = customFormEl.querySelector(`textarea[name="${name}"]`);
                        if (ta) ta.value = parsed[name] || '';
                    }
                });
            } else {
                const ta = document.getElementById(`${MEMO_MODAL_ID}-textarea`);
                if (ta) ta.value = td.innerText.trim();
            }

            showMemoModal();
        }

        async function attachMemoEditors() {
            // wait for structured modules to be ready so modal can render the form if available
            await modulesReady;
            createMemoModal();
            // find buttons that call editNote(...) in original markup
            const buttons = Array.from(document.querySelectorAll('button[onclick]')).filter(b => {
                const v = b.getAttribute('onclick') || '';
                return v.includes('editNote');
            });
            buttons.forEach(btn => {
                const onclick = btn.getAttribute('onclick');
                const m = onclick && onclick.match(/editNote\s*\(\s*this\s*,\s*([0-9]+)\s*,\s*'([^']+)'\s*\)/);
                if (m) {
                    const id = m[1];
                    const tdId = m[2];
                    btn.removeAttribute('onclick');
                    btn.addEventListener('click', () => openMemoModal(btn, id, tdId));
                }
            });
        }

        // Attach after DOM ready
        if (table) {
            attachMemoEditors();
        } else {
            // if table may be injected later, observe DOM for table
            const obs = new MutationObserver((mutations, observer) => {
                const t = q('section.table-no-responsive > table');
                if (t) {
                    attachMemoEditors();
                    observer.disconnect();
                }
            });
            obs.observe(document.body, { childList: true, subtree: true });
        }

    })();
}