/**
 * Input Table Manager — טבלת קלט נתונים רב-ערוצית
 * אלון שרייבמן — מורה פרטי
 * 
 * ניהול תור קלט מרכזי עבור Console.ReadLine() ו-Scanner (Java/C#)
 * כולל תמיכה בלולאות, טיפוסי נתונים, הדגשה ויזואלית חיה, הגרלת ערכים והדבקה מהירה.
 */

class InputTableManager {
    constructor(options = {}) {
        this.containerId = options.containerId || 'card-input-table';
        this.tbodyId = options.tbodyId || 'data-input-tbody';
        this.countBadgeId = options.countBadgeId || 'input-count-badge';
        this.statusBadgeId = options.statusBadgeId || 'input-table-status-badge';
        this.onInputsChanged = options.onInputsChanged || (() => {});

        this.inputs = [];
        this.nextId = 1;
        this.activeRowIndex = -1;

        this.initDomReferences();
        this.bindEvents();
    }

    initDomReferences() {
        this.dom = {
            card: document.getElementById(this.containerId),
            tbody: document.getElementById(this.tbodyId),
            countBadge: document.getElementById(this.countBadgeId),
            statusBadge: document.getElementById(this.statusBadgeId),
            btnAddRow: document.getElementById('btn-input-add-row'),
            btnRand: document.getElementById('btn-input-rand-values'),
            btnTogglePaste: document.getElementById('btn-input-toggle-paste'),
            btnDetect: document.getElementById('btn-input-detect-from-code'),
            btnClear: document.getElementById('btn-input-clear-all'),
            btnApply: document.getElementById('btn-input-apply-run'),
            btnToggleTable: document.getElementById('btn-toggle-input-table'),
            btnCloseTable: document.getElementById('btn-close-input-table'),
            pasteBox: document.getElementById('input-quick-paste-box'),
            pasteTextarea: document.getElementById('input-paste-textarea'),
            btnDoPaste: document.getElementById('btn-input-do-paste'),
            btnCancelPaste: document.getElementById('btn-input-cancel-paste')
        };
    }

    bindEvents() {
        if (this.dom.btnToggleTable) {
            this.dom.btnToggleTable.addEventListener('click', () => this.toggleCard());
        }
        if (this.dom.btnCloseTable) {
            this.dom.btnCloseTable.addEventListener('click', () => this.hideCard());
        }
        if (this.dom.btnAddRow) {
            this.dom.btnAddRow.addEventListener('click', () => {
                this.addRow('', 'int', 'קלט ידני');
                this.render();
                this.notifyChange();
            });
        }
        if (this.dom.btnRand) {
            this.dom.btnRand.addEventListener('click', () => {
                this.randomizeValues();
                this.render();
                this.notifyChange();
            });
        }
        if (this.dom.btnTogglePaste) {
            this.dom.btnTogglePaste.addEventListener('click', () => {
                if (this.dom.pasteBox) {
                    const isVisible = this.dom.pasteBox.style.display !== 'none';
                    this.dom.pasteBox.style.display = isVisible ? 'none' : 'block';
                    if (!isVisible && this.dom.pasteTextarea) {
                        this.dom.pasteTextarea.focus();
                    }
                }
            });
        }
        if (this.dom.btnDoPaste) {
            this.dom.btnDoPaste.addEventListener('click', () => {
                const text = this.dom.pasteTextarea ? this.dom.pasteTextarea.value : '';
                this.pasteValues(text);
                if (this.dom.pasteBox) this.dom.pasteBox.style.display = 'none';
                if (this.dom.pasteTextarea) this.dom.pasteTextarea.value = '';
                this.render();
                this.notifyChange();
            });
        }
        if (this.dom.btnCancelPaste) {
            this.dom.btnCancelPaste.addEventListener('click', () => {
                if (this.dom.pasteBox) this.dom.pasteBox.style.display = 'none';
            });
        }
        if (this.dom.btnClear) {
            this.dom.btnClear.addEventListener('click', () => {
                this.inputs = [];
                this.render();
                this.notifyChange();
            });
        }
        if (this.dom.btnApply) {
            this.dom.btnApply.addEventListener('click', () => {
                this.notifyChange();
            });
        }
        if (this.dom.btnDetect) {
            this.dom.btnDetect.addEventListener('click', () => {
                if (typeof this.onDetectRequest === 'function') {
                    this.onDetectRequest();
                }
            });
        }
    }

    toggleCard() {
        if (!this.dom.card) return;
        const isHidden = this.dom.card.style.display === 'none' || !this.dom.card.style.display;
        this.dom.card.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
            this.dom.card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    showCard() {
        if (this.dom.card) {
            this.dom.card.style.display = 'block';
        }
    }

    hideCard() {
        if (this.dom.card) {
            this.dom.card.style.display = 'none';
        }
    }

    addRow(val = '', type = 'int', note = '') {
        const id = this.nextId++;
        this.inputs.push({
            id: id,
            value: String(val !== undefined && val !== null ? val : ''),
            type: type || 'int',
            note: note || '',
            status: 'pending', // 'pending' | 'active' | 'consumed'
            step: null
        });
    }

    removeRow(index) {
        if (index >= 0 && index < this.inputs.length) {
            this.inputs.splice(index, 1);
            this.render();
            this.notifyChange();
        }
    }

    setValues(valuesList) {
        this.inputs = [];
        this.nextId = 1;
        if (Array.isArray(valuesList)) {
            valuesList.forEach((item, idx) => {
                if (typeof item === 'object' && item !== null) {
                    this.addRow(item.value, item.type || 'int', item.note || `קלט #${idx + 1}`);
                } else {
                    const str = String(item);
                    const type = /^-?\d+$/.test(str) ? 'int' : (/^-?\d+\.\d+$/.test(str) ? 'double' : 'string');
                    this.addRow(str, type, `קלט #${idx + 1}`);
                }
            });
        }
        this.render();
    }

    getInputValues() {
        return this.inputs.map(item => item.value);
    }

    randomizeValues(min = 10, max = 99) {
        if (this.inputs.length === 0) {
            // אם אין שורות, נייצר 5 שורות כברירת מחדל ללולאה
            for (let i = 0; i < 5; i++) {
                const randVal = Math.floor(Math.random() * (max - min + 1)) + min;
                this.addRow(randVal, 'int', `איטרציה ${i + 1}`);
            }
        } else {
            this.inputs.forEach((item, idx) => {
                if (item.type === 'int') {
                    item.value = String(Math.floor(Math.random() * (max - min + 1)) + min);
                } else if (item.type === 'double') {
                    const r = (Math.random() * (max - min) + min).toFixed(1);
                    item.value = String(r);
                } else if (item.type === 'char') {
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
                    item.value = chars.charAt(Math.floor(Math.random() * chars.length));
                } else if (item.type === 'bool') {
                    item.value = Math.random() > 0.5 ? 'true' : 'false';
                }
            });
        }
    }

    pasteValues(text) {
        if (!text || typeof text !== 'string') return;
        // פירוק לפי שורות או פסיקים
        const tokens = text
            .split(/[\r\n,]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        if (tokens.length === 0) return;

        // החלפת הרשימה או הוספה
        this.inputs = [];
        this.nextId = 1;

        tokens.forEach((tok, idx) => {
            let type = 'string';
            if (/^-?\d+$/.test(tok)) type = 'int';
            else if (/^-?\d+\.\d+$/.test(tok)) type = 'double';
            else if (tok.toLowerCase() === 'true' || tok.toLowerCase() === 'false') type = 'bool';
            else if (tok.length === 1) type = 'char';

            this.addRow(tok, type, `קלט #${idx + 1}`);
        });
    }

    /**
     * סריקה חכמה של קוד המקור לאיתור דרישות קלט ולולאות
     */
    detectInputsFromCode(code) {
        if (!code || typeof code !== 'string') return [];
        const detected = [];

        // 1. איתור קריאת גודל ולאחר מכן לולאה
        // דוגמה: int count = int.Parse(Console.ReadLine());
        const lines = code.split('\n');
        let currentLoopLimit = 5;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // איתור גודל בלולאת for: for (int i = 0; i < N; i++)
            const forMatch = line.match(/for\s*\(\s*(?:int\s+)?([A-Za-z0-9_]+)\s*=\s*0\s*;\s*\1\s*<\s*([A-Za-z0-9_]+|\d+)\s*;/);
            if (forMatch) {
                const limitStr = forMatch[2];
                if (/^\d+$/.test(limitStr)) {
                    currentLoopLimit = Math.min(20, Math.max(1, parseInt(limitStr, 10)));
                }
            }

            // איתור קריאות קלט
            const hasReadLine = /Console\.ReadLine\s*\(/.test(line);
            const hasScannerInt = /\b(?:in|reader|scanner|sc)\.nextInt\s*\(/.test(line);
            const hasScannerDouble = /\b(?:in|reader|scanner|sc)\.nextDouble\s*\(/.test(line);
            const hasScannerNext = /\b(?:in|reader|scanner|sc)\.(?:next|nextLine)\s*\(/.test(line);
            const hasScannerBool = /\b(?:in|reader|scanner|sc)\.nextBoolean\s*\(/.test(line);

            if (hasReadLine || hasScannerInt || hasScannerDouble || hasScannerNext || hasScannerBool) {
                let type = 'string';
                if (/int\.Parse|Convert\.ToInt32|Integer\.parseInt/.test(line) || hasScannerInt) type = 'int';
                else if (/double\.Parse|Convert\.ToDouble|Double\.parseDouble|float\.Parse/.test(line) || hasScannerDouble) type = 'double';
                else if (/char\.Parse|Convert\.ToChar|\.charAt\(0\)/.test(line)) type = 'char';
                else if (/bool\.Parse|Convert\.ToBoolean|Boolean\.parseBoolean/.test(line) || hasScannerBool) type = 'bool';

                // איתור שם משתנה המטרה
                let target = '';
                const assignMatch = line.match(/(?:(?:int|double|string|char|bool|var)\s+)?([A-Za-z0-9_\[\]]+)\s*=/);
                if (assignMatch) target = assignMatch[1];

                // האם זו שורה בתוך לולאה?
                const isInsideLoop = /for|while/.test(code.slice(0, code.indexOf(line)));

                detected.push({
                    lineNum: i + 1,
                    type: type,
                    target: target,
                    isInsideLoop: isInsideLoop
                });
            }
        }

        return detected;
    }

    /**
     * אם טבלת הקלט ריקה, ומזוהות קריאות קלט בקוד - אכלס אוטומטית ערכי ברירת מחדל ידידותיים
     */
    autoPopulateIfEmpty(code) {
        if (this.inputs.length > 0) return false;
        const detected = this.detectInputsFromCode(code);
        if (detected.length === 0) return false;

        // בדיקה אם יש לולאה
        const hasLoop = /for\s*\(|while\s*\(/.test(code);
        const loopCountMatch = code.match(/for\s*\([^;]+;\s*[A-Za-z0-9_]+\s*<\s*(\d+)\s*;/);
        const loopCount = loopCountMatch ? Math.min(10, parseInt(loopCountMatch[1], 10)) : 5;

        // אם יש קריאה ראשונה (למשל מספר איברים) ולאחריה לולאה
        if (detected.length >= 2 || hasLoop) {
            if (/count|size|n|len/i.test(detected[0].target)) {
                // קלט ראשון הוא כמות האיברים
                this.addRow(String(loopCount), 'int', `כמות איברים (${detected[0].target || 'n'})`);
                for (let k = 0; k < loopCount; k++) {
                    const sampleVal = 70 + Math.floor(Math.random() * 25);
                    this.addRow(String(sampleVal), detected[1] ? detected[1].type : 'int', `איטרציה ${k + 1}`);
                }
            } else {
                for (let k = 0; k < loopCount; k++) {
                    const sampleVal = 60 + Math.floor(Math.random() * 35);
                    this.addRow(String(sampleVal), detected[0].type, `קלט #${k + 1}`);
                }
            }
        } else {
            detected.forEach((d, idx) => {
                let defaultVal = '10';
                if (d.type === 'double') defaultVal = '12.5';
                else if (d.type === 'string') defaultVal = 'שלום';
                else if (d.type === 'char') defaultVal = 'A';
                else if (d.type === 'bool') defaultVal = 'true';
                this.addRow(defaultVal, d.type, d.target ? `משתנה ${d.target}` : `שורה ${d.lineNum}`);
            });
        }

        this.render();
        return true;
    }

    /**
     * עדכון הדגשת שורה בזמן מעבר צעד בדיבאגר (Step-by-Step Viewlive)
     */
    updateStep(consumedInputsCount, currentInputEvent = null) {
        this.activeRowIndex = currentInputEvent ? currentInputEvent.index : -1;

        this.inputs.forEach((item, idx) => {
            if (idx < consumedInputsCount) {
                item.status = (idx === this.activeRowIndex) ? 'active' : 'consumed';
            } else {
                item.status = 'pending';
            }
        });

        this.renderRowsOnly();

        // גלילה לשורה הפעילה
        if (this.activeRowIndex >= 0 && this.dom.tbody) {
            const activeTr = this.dom.tbody.querySelector(`tr[data-index="${this.activeRowIndex}"]`);
            if (activeTr) {
                activeTr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    render() {
        this.renderRowsOnly();
        this.updateBadges();
    }

    renderRowsOnly() {
        if (!this.dom.tbody) return;

        if (this.inputs.length === 0) {
            this.dom.tbody.innerHTML = `
                <tr class="empty-input-row">
                    <td colspan="6" style="text-align: center; padding: 1.25rem; color: #94a3b8;">
                        📥 אין ערכים בתור הקלט כרגע. לחץ על <strong>➕ הוסף שורת קלט</strong> או <strong>🎲 הגרל ערכים</strong> כדי להגדיר קלט לקוד.
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        this.inputs.forEach((item, idx) => {
            let rowClass = 'input-row';
            let statusBadge = '<span class="status-badge status-pending">⚪ ממתין</span>';

            if (item.status === 'active') {
                rowClass += ' active-input-row';
                statusBadge = '<span class="status-badge status-active">🟡 נקלט כעת!</span>';
            } else if (item.status === 'consumed') {
                rowClass += ' consumed-input-row';
                statusBadge = '<span class="status-badge status-consumed">🟢 נקלט</span>';
            }

            html += `
                <tr class="${rowClass}" data-index="${idx}">
                    <td style="text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
                    <td>
                        <input type="text" class="input-cell-val" data-index="${idx}" value="${this.escapeHtml(item.value)}" dir="ltr" placeholder="ערך...">
                    </td>
                    <td>
                        <select class="input-cell-type" data-index="${idx}">
                            <option value="int" ${item.type === 'int' ? 'selected' : ''}>int</option>
                            <option value="double" ${item.type === 'double' ? 'selected' : ''}>double</option>
                            <option value="string" ${item.type === 'string' ? 'selected' : ''}>string</option>
                            <option value="char" ${item.type === 'char' ? 'selected' : ''}>char</option>
                            <option value="bool" ${item.type === 'bool' ? 'selected' : ''}>bool</option>
                        </select>
                    </td>
                    <td>
                        <input type="text" class="input-cell-note" data-index="${idx}" value="${this.escapeHtml(item.note)}" placeholder="הערה / שם משתנה...">
                    </td>
                    <td>${statusBadge}</td>
                    <td style="text-align: center;">
                        <button type="button" class="btn-input-row-del" data-index="${idx}" title="מחק שורה">✕</button>
                    </td>
                </tr>
            `;
        });

        this.dom.tbody.innerHTML = html;

        // הצמדת מאזינים לשדות הטבלה
        this.dom.tbody.querySelectorAll('.input-cell-val').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                if (this.inputs[idx]) {
                    this.inputs[idx].value = e.target.value;
                    this.notifyChange();
                }
            });
        });

        this.dom.tbody.querySelectorAll('.input-cell-type').forEach(select => {
            select.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                if (this.inputs[idx]) {
                    this.inputs[idx].type = e.target.value;
                    this.notifyChange();
                }
            });
        });

        this.dom.tbody.querySelectorAll('.input-cell-note').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                if (this.inputs[idx]) {
                    this.inputs[idx].note = e.target.value;
                }
            });
        });

        this.dom.tbody.querySelectorAll('.btn-input-row-del').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index, 10);
                this.removeRow(idx);
            });
        });

        this.updateBadges();
    }

    updateBadges() {
        const count = this.inputs.length;
        if (this.dom.countBadge) {
            this.dom.countBadge.textContent = String(count);
        }
        if (this.dom.statusBadge) {
            this.dom.statusBadge.textContent = `${count} קלטים מוגדרים`;
        }
    }

    notifyChange() {
        if (typeof this.onInputsChanged === 'function') {
            this.onInputsChanged(this.getInputValues());
        }
    }

    escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputTableManager;
} else {
    window.InputTableManager = InputTableManager;
}
