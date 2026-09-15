/**
 * 10th Grade C# Fundamentals Visualizer UI Controller
 * מרכז מדעי המחשב - בית ספר מקיף דוד טוביהו | אלון שרייבמן
 */

class Visualizer10thApp {
    constructor() {
        this.interpreter = new CSharp10thInterpreter();
        this.frames = [];
        this.currentFrameIdx = 0;
        this.isPlaying = false;
        this.playTimer = null;
        this.speedMs = 700;
        this.studioMode = 'all';

        // ניהול קבצים בלשוניות (Class Tabs)
        this.editorFiles = {
            'Program.cs': {
                name: 'Program.cs',
                code: PRESETS_10TH['empty_main'].files['Program.cs']
            }
        };
        this.activeFileName = 'Program.cs';
        this.dom = {};
    }

    init() {
        this.cacheDom();
        this.bindEvents();
        this.setupAutocomplete();
        this.renderTabs();
        this.setupResizer();
        this.loadPreset('empty_main');
    }

    cacheDom() {
        this.dom.studioModeButtons = document.querySelectorAll('.btn-studio-mode');
        this.dom.presetSelect = document.getElementById('preset-select');
        this.dom.btnToggleInitCard = document.getElementById('btn-toggle-init-card');
        this.dom.cardFlexibleInit = document.getElementById('card-flexible-init');

        // פקדי חלונית אתחול גמישה
        this.dom.btnInitTypes = document.querySelectorAll('.btn-init-type');
        this.dom.initArrayInput = document.getElementById('init-array-input');
        this.dom.initArraySize = document.getElementById('init-array-size');
        this.dom.initArrayMin = document.getElementById('init-array-min');
        this.dom.initArrayMax = document.getElementById('init-array-max');
        this.dom.btnInitRandArray = document.getElementById('btn-init-rand-array');
        this.dom.btnInitApplyArray = document.getElementById('btn-init-apply-array');

        this.dom.initMatRows = document.getElementById('init-mat-rows');
        this.dom.initMatCols = document.getElementById('init-mat-cols');
        this.dom.initMatInput = document.getElementById('init-mat-input');
        this.dom.btnInitRandMat = document.getElementById('btn-init-rand-mat');
        this.dom.btnInitApplyMat = document.getElementById('btn-init-apply-mat');

        this.dom.initStringInput = document.getElementById('init-string-input');
        this.dom.btnInitApplyString = document.getElementById('btn-init-apply-string');

        this.dom.initConsoleInputs = document.getElementById('init-console-inputs');
        this.dom.btnInitApplyConsole = document.getElementById('btn-init-apply-console');

        this.dom.editorTabsList = document.getElementById('editor-tabs-list');
        this.dom.btnAddTab = document.getElementById('btn-add-tab');
        this.dom.codeTextarea = document.getElementById('code-textarea');
        this.dom.lineNumbers = document.getElementById('line-numbers');
        this.dom.activeLineHighlight = document.getElementById('active-line-highlight');
        this.dom.autocompleteBox = document.getElementById('autocomplete-box');

        this.dom.btnPlay = document.getElementById('btn-play');
        this.dom.btnStepPrev = document.getElementById('btn-step-prev');
        this.dom.btnStepNext = document.getElementById('btn-step-next');
        this.dom.btnReset = document.getElementById('btn-reset');
        this.dom.speedSlider = document.getElementById('speed-slider');
        this.dom.stepBadge = document.getElementById('step-badge');

        this.dom.statusBanner = document.getElementById('status-banner');
        this.dom.statusIcon = document.getElementById('status-icon');
        this.dom.statusText = document.getElementById('status-text');

        this.dom.arrayCard = document.getElementById('card-arrays');
        this.dom.arrayContainer = document.getElementById('array-container');
        this.dom.matrixCard = document.getElementById('card-matrices');
        this.dom.matrixContainer = document.getElementById('matrix-container');
        this.dom.stringCard = document.getElementById('card-strings');
        this.dom.stringContainer = document.getElementById('string-container');
        this.dom.heapCard = document.getElementById('card-heap');
        this.dom.heapContainer = document.getElementById('heap-container');

        this.dom.traceTable = document.getElementById('trace-table');
        this.dom.traceThead = document.getElementById('trace-thead');
        this.dom.traceTbody = document.getElementById('trace-tbody');
        this.dom.btnCopyTrace = document.getElementById('btn-copy-trace');

        // טאבים של בדיקה ממוזערת
        this.dom.tabBtnsInsp = document.querySelectorAll('.tab-btn-insp');
        this.dom.variablesTbody = document.getElementById('variables-tbody');
        this.dom.callStackList = document.getElementById('call-stack-list');
        this.dom.consoleOutput = document.getElementById('console-output');
        this.dom.btnClearConsole = document.getElementById('btn-clear-console');
        this.dom.consoleBadge = document.getElementById('console-badge');

        this.dom.resizer = document.getElementById('resizer-h');
        this.dom.editorPanel = document.getElementById('editor-panel');
        this.dom.visualPanel = document.getElementById('visual-panel');
    }

    bindEvents() {
        // בורר מצבים עליון
        this.dom.studioModeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.dom.studioModeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.studioMode = btn.dataset.mode || 'all';
                this.applyStudioModeFilter();
            });
        });

        // בורר פרסטים
        this.dom.presetSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadPreset(e.target.value);
            }
        });

        // כפתור פתיחה/סגירה של חלונית אתחול נתונים
        if (this.dom.btnToggleInitCard && this.dom.cardFlexibleInit) {
            this.dom.btnToggleInitCard.addEventListener('click', () => {
                this.dom.cardFlexibleInit.classList.toggle('collapsed');
                const toggleBtn = this.dom.cardFlexibleInit.querySelector('.btn-card-toggle');
                if (toggleBtn) {
                    toggleBtn.textContent = this.dom.cardFlexibleInit.classList.contains('collapsed') ? '➕' : '➖';
                }
                if (!this.dom.cardFlexibleInit.classList.contains('collapsed')) {
                    this.dom.cardFlexibleInit.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }

        // כפתורי מזעור/הרחבה לכל הכרטיסיות
        document.querySelectorAll('.btn-card-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.stage-card');
                if (card) {
                    card.classList.toggle('collapsed');
                    btn.textContent = card.classList.contains('collapsed') ? '➕' : '➖';
                }
            });
        });

        // לשוניות סוג אתחול גמיש (מערך, מטריצה, מחרוזת, קונסול)
        if (this.dom.btnInitTypes) {
            this.dom.btnInitTypes.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.dom.btnInitTypes.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const type = btn.dataset.init;
                    document.querySelectorAll('.init-panel-pane').forEach(p => p.style.display = 'none');
                    const pane = document.getElementById(`init-pane-${type}`);
                    if (pane) pane.style.display = '';
                });
            });
        }

        // פעולות אתחול נתונים גמיש
        if (this.dom.btnInitRandArray) {
            this.dom.btnInitRandArray.addEventListener('click', () => {
                const size = parseInt(this.dom.initArraySize.value, 10) || 6;
                const min = parseInt(this.dom.initArrayMin.value, 10) || 10;
                const max = parseInt(this.dom.initArrayMax.value, 10) || 99;
                const vals = [];
                for (let i = 0; i < size; i++) {
                    vals.push(Math.floor(Math.random() * (max - min + 1)) + min);
                }
                this.dom.initArrayInput.value = vals.join(', ');
            });
        }

        if (this.dom.btnInitApplyArray) {
            this.dom.btnInitApplyArray.addEventListener('click', () => {
                const raw = this.dom.initArrayInput.value.trim();
                const snippet = `int[] arr = { ${raw} };`;
                const code = this.editorFiles['Program.cs'].code;
                if (code.includes('int[] arr =')) {
                    this.editorFiles['Program.cs'].code = code.replace(/int\[\]\s*arr\s*=\s*\{[^}]*\};/, snippet);
                } else {
                    this.editorFiles['Program.cs'].code = code.replace(/public\s+static\s+void\s+Main\s*\([^)]*\)\s*\{/, `public static void Main()\n    {\n        ${snippet}`);
                }
                if (this.activeFileName === 'Program.cs') {
                    this.dom.codeTextarea.value = this.editorFiles['Program.cs'].code;
                    this.updateLineNumbers();
                }
                this.recompile();
            });
        }

        if (this.dom.btnInitRandMat) {
            this.dom.btnInitRandMat.addEventListener('click', () => {
                const rows = parseInt(this.dom.initMatRows.value, 10) || 3;
                const cols = parseInt(this.dom.initMatCols.value, 10) || 3;
                const lines = [];
                for (let r = 0; r < rows; r++) {
                    const vals = [];
                    for (let c = 0; c < cols; c++) {
                        vals.push(Math.floor(Math.random() * 20) + 1);
                    }
                    lines.push(vals.join(', '));
                }
                this.dom.initMatInput.value = lines.join('\n');
            });
        }

        if (this.dom.btnInitApplyMat) {
            this.dom.btnInitApplyMat.addEventListener('click', () => {
                const text = this.dom.initMatInput.value.trim();
                const rowLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                const rowsFormatted = rowLines.map(line => `        { ${line} }`).join(',\n');
                const snippet = `int[,] mat = {\n${rowsFormatted}\n    };`;

                const code = this.editorFiles['Program.cs'].code;
                if (code.includes('int[,] mat =')) {
                    this.editorFiles['Program.cs'].code = code.replace(/int\[,\]\s*mat\s*=\s*\{[\s\S]*?\};/, snippet);
                } else {
                    this.editorFiles['Program.cs'].code = code.replace(/public\s+static\s+void\s+Main\s*\([^)]*\)\s*\{/, `public static void Main()\n    {\n        ${snippet}`);
                }
                if (this.activeFileName === 'Program.cs') {
                    this.dom.codeTextarea.value = this.editorFiles['Program.cs'].code;
                    this.updateLineNumbers();
                }
                this.recompile();
            });
        }

        if (this.dom.btnInitApplyString) {
            this.dom.btnInitApplyString.addEventListener('click', () => {
                const word = this.dom.initStringInput.value.trim();
                const snippet = `string word = "${word}";`;
                const code = this.editorFiles['Program.cs'].code;
                if (/string\s+(word|str|text)\s*=\s*"[^"]*";/.test(code)) {
                    this.editorFiles['Program.cs'].code = code.replace(/string\s+(word|str|text)\s*=\s*"[^"]*";/, snippet);
                } else {
                    this.editorFiles['Program.cs'].code = code.replace(/public\s+static\s+void\s+Main\s*\([^)]*\)\s*\{/, `public static void Main()\n    {\n        ${snippet}`);
                }
                if (this.activeFileName === 'Program.cs') {
                    this.dom.codeTextarea.value = this.editorFiles['Program.cs'].code;
                    this.updateLineNumbers();
                }
                this.recompile();
            });
        }

        if (this.dom.btnInitApplyConsole) {
            this.dom.btnInitApplyConsole.addEventListener('click', () => {
                const inputs = this.dom.initConsoleInputs.value.split('\n').map(s => s.trim()).filter(s => s.length > 0);
                this.interpreter.setInputQueue(inputs);
                this.recompile();
            });
        }

        // לשוניות בדיקה ממוזערות (משתנים, מחסנית, פלט)
        if (this.dom.tabBtnsInsp) {
            this.dom.tabBtnsInsp.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.dom.tabBtnsInsp.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const tab = btn.dataset.tab;
                    document.querySelectorAll('.insp-pane').forEach(p => p.style.display = 'none');
                    const activePane = document.getElementById(`pane-${tab}`);
                    if (activePane) activePane.style.display = '';
                    if (this.dom.btnClearConsole) {
                        this.dom.btnClearConsole.style.display = (tab === 'console') ? '' : 'none';
                    }
                });
            });
        }

        // כפתור הוספת מחלקה חדשה
        this.dom.btnAddTab.addEventListener('click', () => this.promptAddClass());

        // עריכת קוד
        this.dom.codeTextarea.addEventListener('input', () => {
            this.editorFiles[this.activeFileName].code = this.dom.codeTextarea.value;
            this.updateLineNumbers();
            this.recompile();
        });

        this.dom.codeTextarea.addEventListener('scroll', () => {
            this.dom.lineNumbers.scrollTop = this.dom.codeTextarea.scrollTop;
            this.updateActiveLinePosition();
        });

        // בקרי דיבאגר
        this.dom.btnPlay.addEventListener('click', () => this.togglePlay());
        this.dom.btnStepNext.addEventListener('click', () => this.stepNext());
        this.dom.btnStepPrev.addEventListener('click', () => this.stepPrev());
        this.dom.btnReset.addEventListener('click', () => this.reset());

        this.dom.speedSlider.addEventListener('input', (e) => {
            this.speedMs = 1250 - parseInt(e.target.value, 10);
            if (this.isPlaying) {
                this.pause();
                this.play();
            }
        });

        // העתקת טבלת מעקב
        this.dom.btnCopyTrace.addEventListener('click', () => this.copyTraceTable());

        // ניקוי קונסול
        this.dom.btnClearConsole.addEventListener('click', () => {
            this.dom.consoleOutput.textContent = '';
        });
    }

    setupAutocomplete() {
        this.autocomplete = new CSharp10thAutocomplete(this.dom.codeTextarea, this.dom.autocompleteBox);
    }

    setupResizer() {
        let isResizing = false;
        this.dom.resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            this.dom.resizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const containerWidth = document.querySelector('.main-layout').offsetWidth;
            // מכיוון שהעורך נמצא משמאל, e.clientX קובע ישירות את רוחבו
            const newEditorWidth = Math.max(280, Math.min(containerWidth - 320, e.clientX));
            const percentage = (newEditorWidth / containerWidth) * 100;
            this.dom.editorPanel.style.flex = `0 0 ${percentage}%`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                this.dom.resizer.classList.remove('resizing');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }

    loadPreset(presetId) {
        const preset = PRESETS_10TH[presetId];
        if (!preset) return;

        this.pause();
        this.editorFiles = {};
        for (const [fName, code] of Object.entries(preset.files)) {
            this.editorFiles[fName] = { name: fName, code: code };
        }
        this.activeFileName = 'Program.cs';
        this.renderTabs();
        this.dom.codeTextarea.value = this.editorFiles[this.activeFileName].code;
        this.updateLineNumbers();

        // עדכון מצב סטודיו לפי הפרסט
        if (preset.category) {
            const btn = Array.from(this.dom.studioModeButtons).find(b => b.dataset.mode === preset.category);
            if (btn) {
                this.dom.studioModeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.studioMode = preset.category;
            }
        }

        this.recompile();
    }

    renderTabs() {
        this.dom.editorTabsList.innerHTML = '';
        for (const fName of Object.keys(this.editorFiles)) {
            const tab = document.createElement('div');
            tab.className = 'tab-file' + (fName === this.activeFileName ? ' active' : '');
            tab.innerHTML = `<span>${fName}</span>` + 
                (fName !== 'Program.cs' ? `<span class="tab-close-btn" title="סגור קובץ">&times;</span>` : '');

            tab.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-close-btn')) {
                    this.removeTab(fName);
                } else {
                    this.switchTab(fName);
                }
            });

            this.dom.editorTabsList.appendChild(tab);
        }
    }

    switchTab(fName) {
        if (!this.editorFiles[fName]) return;
        this.editorFiles[this.activeFileName].code = this.dom.codeTextarea.value;
        this.activeFileName = fName;
        this.dom.codeTextarea.value = this.editorFiles[fName].code;
        this.renderTabs();
        this.updateLineNumbers();
        this.updateActiveLinePosition();
    }

    promptAddClass() {
        const name = prompt('הזן שם למחלקה החדשה ב-C# (לדוגמה: Student, Point, Car):');
        if (!name) return;
        const cleanName = name.replace(/[^A-Za-z0-9_]/g, '');
        if (!cleanName) return;
        const fName = `${cleanName}.cs`;
        if (this.editorFiles[fName]) {
            alert(`הקובץ ${fName} כבר קיים במערכת.`);
            return;
        }

        this.editorFiles[fName] = {
            name: fName,
            code: `public class ${cleanName}\n{\n    // שדות המחלקה\n    public string name;\n    public int value;\n\n    // בנאי\n    public ${cleanName}(string name, int value)\n    {\n        this.name = name;\n        this.value = value;\n    }\n}`
        };

        this.switchTab(fName);
        this.recompile();
    }

    removeTab(fName) {
        if (fName === 'Program.cs') return;
        if (!confirm(`האם אתה בטוח שברצונך למחוק את ${fName}?`)) return;
        delete this.editorFiles[fName];
        this.activeFileName = 'Program.cs';
        this.switchTab('Program.cs');
        this.recompile();
    }

    updateLineNumbers() {
        const lines = (this.dom.codeTextarea.value || '').split('\n').length;
        let html = '';
        for (let i = 1; i <= lines; i++) {
            html += `<div>${i}</div>`;
        }
        this.dom.lineNumbers.innerHTML = html;
    }

    recompile() {
        this.pause();
        const codeFiles = {};
        for (const [name, obj] of Object.entries(this.editorFiles)) {
            codeFiles[name] = obj.code;
        }

        const traceResult = this.interpreter.run(codeFiles);
        this.frames = traceResult.frames || [];
        this.currentFrameIdx = 0;

        if (traceResult.error) {
            this.setStatus('error', `⚠️ שגיאה: ${traceResult.error}`);
        } else {
            this.setStatus('success', `הקוד הורץ בהצלחה (${this.frames.length} צעדים הוקלטו)`);
        }

        this.renderFrame(0);
        this.renderTraceTable();
    }

    renderFrame(idx) {
        if (!this.frames || this.frames.length === 0) {
            this.dom.stepBadge.textContent = '0 / 0';
            this.dom.activeLineHighlight.style.display = 'none';
            return;
        }

        if (idx < 0) idx = 0;
        if (idx >= this.frames.length) idx = this.frames.length - 1;
        this.currentFrameIdx = idx;

        const frame = this.frames[idx];
        this.dom.stepBadge.textContent = `${idx + 1} / ${this.frames.length}`;

        if (frame.error) {
            this.setStatus('error', frame.description);
        } else {
            this.setStatus('info', frame.description);
        }

        // מעבר אוטומטי לקובץ הפעיל במסגרת אם הוא שונה
        if (frame.file && frame.file !== this.activeFileName && this.editorFiles[frame.file]) {
            this.switchTab(frame.file);
        }

        // הדגשת שורה נוכחית בעורך
        this.highlightActiveLine(frame.line);

        // במת המחשה: 1D Arrays
        this.render1DArrays(frame.arrays1D, frame.activePointers);

        // במת המחשה: 2D Matrices
        this.render2DMatrices(frame.matrices2D);

        // במת המחשה: Strings
        this.renderStrings(frame.strings, frame.activePointers);

        // במת המחשה: Heap Objects
        this.renderHeapObjects(frame.objects);

        // משתנים מקומיים
        this.renderVariables(frame.variables);

        // מחסנית קריאות
        this.renderCallStack(frame.callStack);

        // קונסול פלט
        this.renderConsole(frame.consoleOutputs);

        // הדגשת שורה בטבלת מעקב
        this.highlightTraceTableRow(idx);

        this.applyStudioModeFilter();
    }

    highlightActiveLine(lineNum) {
        if (!lineNum || lineNum <= 0) {
            this.dom.activeLineHighlight.style.display = 'none';
            return;
        }
        const lineHeight = 23.2; // פיקסלים לשורה לפי CSS
        const top = (lineNum - 1) * lineHeight - this.dom.codeTextarea.scrollTop + 10;
        this.dom.activeLineHighlight.style.top = `${top}px`;
        this.dom.activeLineHighlight.style.height = `${lineHeight}px`;
        this.dom.activeLineHighlight.style.display = 'block';
    }

    updateActiveLinePosition() {
        if (this.frames && this.frames[this.currentFrameIdx]) {
            this.highlightActiveLine(this.frames[this.currentFrameIdx].line);
        }
    }

    render1DArrays(arrays, activePointers) {
        if (!arrays || arrays.length === 0) {
            this.dom.arrayContainer.innerHTML = '<div class="text-muted" style="padding: 0.5rem; font-size: 0.8rem;">אין כרגע מערכים חד-ממדיים פעילים בזיכרון.</div>';
            return;
        }

        let html = '';
        for (const arr of arrays) {
            html += `<div class="array-box-wrapper">`;
            html += `<div class="array-name-badge">int[] ${arr.name} (אורך: ${arr.length})</div>`;
            html += `<div class="array-cells-row">`;

            for (let i = 0; i < arr.items.length; i++) {
                const val = arr.items[i];
                // מציאת מצביעים פעילים לאינדקס זה (כגון i, j, min)
                const pointersAtIdx = [];
                if (activePointers) {
                    for (const [pName, pVal] of Object.entries(activePointers)) {
                        if (pVal === i) pointersAtIdx.push(pName);
                    }
                }

                const hasPointer = pointersAtIdx.length > 0;
                const pointerText = hasPointer ? `<span>${pointersAtIdx.join(', ')}</span><span>▼</span>` : '';

                html += `
                    <div class="array-cell-col">
                        <div class="array-cell-pointer">${pointerText}</div>
                        <div class="array-cell-box ${hasPointer ? 'pointer-active' : ''}">${val !== undefined ? val : 0}</div>
                        <div class="array-cell-index">[${i}]</div>
                    </div>
                `;
            }

            html += `</div></div>`;
        }
        this.dom.arrayContainer.innerHTML = html;
    }

    render2DMatrices(matrices) {
        if (!matrices || matrices.length === 0) {
            this.dom.matrixContainer.innerHTML = '<div class="text-muted" style="padding: 0.5rem; font-size: 0.8rem;">אין כרגע מטריצות דו-ממדיות פעילות בזיכרון.</div>';
            return;
        }

        let html = '';
        for (const mat of matrices) {
            html += `<div class="matrix-container">`;
            html += `<div class="array-name-badge">int[,] ${mat.name} (${mat.rows}x${mat.cols})</div>`;
            html += `<table class="matrix-grid"><thead><tr><th></th>`;

            for (let c = 0; c < mat.cols; c++) {
                html += `<th>[${c}]</th>`;
            }
            html += `</tr></thead><tbody>`;

            for (let r = 0; r < mat.rows; r++) {
                html += `<tr><th>[${r}]</th>`;
                for (let c = 0; c < mat.cols; c++) {
                    const val = (mat.grid && mat.grid[r]) ? mat.grid[r][c] : 0;
                    const isActive = mat.activeCell && mat.activeCell.r === r && mat.activeCell.c === c;
                    const isMainDiag = (r === c && mat.rows === mat.cols);
                    const isSecDiag = (r + c === mat.rows - 1 && mat.rows === mat.cols);

                    let classes = 'matrix-cell';
                    if (isActive) classes += ' active-cell';
                    if (isMainDiag) classes += ' diag-main';
                    if (isSecDiag) classes += ' diag-sec';

                    html += `<td><div class="${classes}" title="[${r}, ${c}]">${val}</div></td>`;
                }
                html += `</tr>`;
            }

            html += `</tbody></table></div>`;
        }
        this.dom.matrixContainer.innerHTML = html;
    }

    renderStrings(strings, activePointers) {
        if (!strings || strings.length === 0) {
            this.dom.stringContainer.innerHTML = '<div class="text-muted" style="padding: 0.5rem; font-size: 0.8rem;">אין כרגע מחרוזות פעילות בזיכרון.</div>';
            return;
        }

        let html = '';
        for (const str of strings) {
            html += `<div class="array-box-wrapper">`;
            html += `<div class="array-name-badge">string ${str.name} = "${str.value}" (אורך: ${str.length})</div>`;
            html += `<div class="string-row">`;

            for (let i = 0; i < str.chars.length; i++) {
                const ch = str.chars[i];
                const pointersAtIdx = [];
                if (activePointers) {
                    for (const [pName, pVal] of Object.entries(activePointers)) {
                        if (pVal === i) pointersAtIdx.push(pName);
                    }
                }
                const hasPointer = pointersAtIdx.length > 0;
                const pointerText = hasPointer ? `<span>${pointersAtIdx.join(', ')}</span><span>▼</span>` : '';

                html += `
                    <div class="string-char-col">
                        <div class="array-cell-pointer">${pointerText}</div>
                        <div class="string-char-box">${ch}</div>
                        <div class="array-cell-index">[${i}]</div>
                    </div>
                `;
            }

            html += `</div></div>`;
        }
        this.dom.stringContainer.innerHTML = html;
    }

    renderHeapObjects(objects) {
        if (!objects || objects.length === 0) {
            this.dom.heapContainer.innerHTML = '<div class="text-muted" style="padding: 0.5rem; font-size: 0.8rem;">אין כרגע מופעי עצמים פעילים ב-Heap.</div>';
            return;
        }

        let html = '<div class="heap-cards-grid">';
        for (const obj of objects) {
            html += `
                <div class="object-card">
                    <div class="object-card-header">${obj.varName} ➔ #${obj.className} (#${obj.heapId})</div>
            `;
            for (const [fName, fVal] of Object.entries(obj.fields)) {
                html += `
                    <div class="object-field-row">
                        <span class="field-name">${fName}:</span>
                        <span class="field-val">${fVal}</span>
                    </div>
                `;
            }
            html += `</div>`;
        }
        html += '</div>';
        this.dom.heapContainer.innerHTML = html;
    }

    renderVariables(variables) {
        if (!variables || Object.keys(variables).length === 0) {
            this.dom.variablesTbody.innerHTML = '<tr><td colspan="2" class="text-muted">אין משתנים מקומיים</td></tr>';
            return;
        }

        let html = '';
        for (const [key, val] of Object.entries(variables)) {
            let displayVal = val;
            if (Array.isArray(val)) displayVal = `int[${val.length}] { ${val.slice(0, 5).join(', ')}${val.length > 5 ? '...' : ''} }`;
            else if (val && val._isMatrix) displayVal = `Matrix (${val.rows}x${val.cols})`;
            else if (val && val._heapId) displayVal = `Ref #${val.className}(#${val._heapId})`;
            else if (typeof val === 'string') displayVal = `"${val}"`;

            html += `<tr><td><strong>${key}</strong></td><td>${displayVal}</td></tr>`;
        }
        this.dom.variablesTbody.innerHTML = html;
    }

    renderCallStack(callStack) {
        if (!callStack || callStack.length === 0) {
            this.dom.callStackList.innerHTML = '<li class="text-muted">מחסנית ריקה</li>';
            return;
        }

        let html = '';
        for (let i = callStack.length - 1; i >= 0; i--) {
            const frame = callStack[i];
            html += `<li style="padding: 0.25rem 0; direction: ltr; font-family: Consolas, monospace;">${frame.funcName}() <span style="color: #64748b;">(שורה ${frame.line})</span></li>`;
        }
        this.dom.callStackList.innerHTML = html;
    }

    renderConsole(outputs) {
        if (!outputs || outputs.length === 0) {
            this.dom.consoleOutput.textContent = '--- אין פלט עדיין ---';
            return;
        }
        this.dom.consoleOutput.textContent = outputs.join('\n');
        this.dom.consoleOutput.scrollTop = this.dom.consoleOutput.scrollHeight;
    }

    renderTraceTable() {
        if (!this.frames || this.frames.length === 0) {
            this.dom.traceThead.innerHTML = '';
            this.dom.traceTbody.innerHTML = '<tr><td colspan="5">הרץ את התוכנית כדי להפיק טבלת מעקב</td></tr>';
            return;
        }

        // איסוף כל שמות המשתנים הפרימיטיביים המופיעים לאורך הריצה
        const varSet = new Set();
        for (const f of this.frames) {
            if (f.variables) {
                for (const [k, v] of Object.entries(f.variables)) {
                    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') {
                        varSet.add(k);
                    }
                }
            }
        }
        const trackedVars = Array.from(varSet);

        // בניית כותרות הטבלה
        let theadHtml = `<tr><th>צעד</th><th>שורה</th><th>תנאי / בדיקה</th>`;
        for (const vName of trackedVars) {
            theadHtml += `<th>${vName}</th>`;
        }
        theadHtml += `<th>פלט לקונסול</th></tr>`;
        this.dom.traceThead.innerHTML = theadHtml;

        // בניית שורות הטבלה
        let tbodyHtml = '';
        this.frames.forEach((f, idx) => {
            const rowClass = (idx === this.currentFrameIdx) ? 'active-trace-row' : '';
            let conditionText = '-';
            if (f.description && f.description.includes('תנאי')) {
                conditionText = f.description.replace(/^.*תנאי[^:]*:\s*/, '');
            }

            tbodyHtml += `<tr class="${rowClass}" data-step="${idx}">`;
            tbodyHtml += `<td><strong>${idx + 1}</strong></td>`;
            tbodyHtml += `<td>${f.line || '-'}</td>`;
            tbodyHtml += `<td>${conditionText}</td>`;

            for (const vName of trackedVars) {
                const val = (f.variables && f.variables[vName] !== undefined) ? f.variables[vName] : '-';
                tbodyHtml += `<td>${val}</td>`;
            }

            const outputText = (f.consoleOutputs && f.consoleOutputs.length > 0) ? f.consoleOutputs[f.consoleOutputs.length - 1] : '-';
            tbodyHtml += `<td>${outputText}</td></tr>`;
        });

        this.dom.traceTbody.innerHTML = tbodyHtml;

        // הוספת האזנה לקליק על שורה לקפיצה בזמן
        this.dom.traceTbody.querySelectorAll('tr').forEach(tr => {
            tr.addEventListener('click', () => {
                const stepIdx = parseInt(tr.dataset.step, 10);
                if (!isNaN(stepIdx)) {
                    this.pause();
                    this.renderFrame(stepIdx);
                }
            });
        });
    }

    highlightTraceTableRow(stepIdx) {
        const rows = this.dom.traceTbody.querySelectorAll('tr');
        rows.forEach((tr, i) => {
            if (i === stepIdx) {
                tr.classList.add('active-trace-row');
                tr.scrollIntoView({ block: 'nearest' });
            } else {
                tr.classList.remove('active-trace-row');
            }
        });
    }

    copyTraceTable() {
        if (!this.frames || this.frames.length === 0) return;
        const thead = this.dom.traceThead.innerText.replace(/\t/g, ' | ');
        let content = `| ${thead} |\n| ${this.dom.traceThead.innerText.split('\t').map(() => '---').join(' | ')} |\n`;

        this.dom.traceTbody.querySelectorAll('tr').forEach(tr => {
            const rowText = Array.from(tr.querySelectorAll('td')).map(td => td.innerText).join(' | ');
            content += `| ${rowText} |\n`;
        });

        navigator.clipboard.writeText(content).then(() => {
            alert('טבלת המעקב הועתקה ללוח בפורמט Markdown בהצלחה!');
        }).catch(() => {
            alert('הטבלה הוכנה להעתקה');
        });
    }

    applyStudioModeFilter() {
        const mode = this.studioMode;
        if (mode === 'all') {
            this.dom.arrayCard.style.display = '';
            this.dom.matrixCard.style.display = '';
            this.dom.stringCard.style.display = '';
            this.dom.heapCard.style.display = '';
        } else if (mode === 'arrays') {
            this.dom.arrayCard.style.display = '';
            this.dom.matrixCard.style.display = 'none';
            this.dom.stringCard.style.display = 'none';
            this.dom.heapCard.style.display = 'none';
        } else if (mode === 'matrices') {
            this.dom.arrayCard.style.display = 'none';
            this.dom.matrixCard.style.display = '';
            this.dom.stringCard.style.display = 'none';
            this.dom.heapCard.style.display = 'none';
        } else if (mode === 'strings') {
            this.dom.arrayCard.style.display = 'none';
            this.dom.matrixCard.style.display = 'none';
            this.dom.stringCard.style.display = '';
            this.dom.heapCard.style.display = 'none';
        } else if (mode === 'classes') {
            this.dom.arrayCard.style.display = 'none';
            this.dom.matrixCard.style.display = 'none';
            this.dom.stringCard.style.display = 'none';
            this.dom.heapCard.style.display = '';
        } else if (mode === 'functions') {
            this.dom.arrayCard.style.display = '';
            this.dom.matrixCard.style.display = 'none';
            this.dom.stringCard.style.display = 'none';
            this.dom.heapCard.style.display = 'none';
        }
    }

    generateRandom1DArray() {
        const size = Math.floor(Math.random() * 4) + 5; // 5-8 איברים
        const values = [];
        for (let i = 0; i < size; i++) {
            values.push(Math.floor(Math.random() * 90) + 10);
        }
        const snippet = `int[] arr = { ${values.join(', ')} };`;

        // החלפה אוטומטית בקוד הקיים
        const currentCode = this.editorFiles['Program.cs'].code;
        if (currentCode.includes('int[] arr =')) {
            this.editorFiles['Program.cs'].code = currentCode.replace(/int\[\]\s*arr\s*=\s*\{[^}]*\};/, snippet);
        } else {
            alert(`נוצר מערך חדש:\n${snippet}`);
        }
        this.dom.codeTextarea.value = this.editorFiles[this.activeFileName].code;
        this.recompile();
    }

    generateRandomMatrix(rows, cols) {
        const rowStrings = [];
        for (let r = 0; r < rows; r++) {
            const vals = [];
            for (let c = 0; c < cols; c++) {
                vals.push(Math.floor(Math.random() * 20) + 1);
            }
            rowStrings.push(`    { ${vals.join(', ')} }`);
        }
        const snippet = `int[,] mat = {\n${rowStrings.join(',\n')}\n};`;

        const currentCode = this.editorFiles['Program.cs'].code;
        if (currentCode.includes('int[,] mat =')) {
            this.editorFiles['Program.cs'].code = currentCode.replace(/int\[,\]\s*mat\s*=\s*\{[\s\S]*?\};/, snippet);
        } else {
            alert(`נוצרה מטריצה חדשה:\n${snippet}`);
        }
        this.dom.codeTextarea.value = this.editorFiles[this.activeFileName].code;
        this.recompile();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.currentFrameIdx >= this.frames.length - 1) {
            this.currentFrameIdx = 0;
        }
        this.isPlaying = true;
        this.dom.btnPlay.innerHTML = '<span>⏸️</span><span>השהה</span>';
        this.dom.btnPlay.classList.remove('btn-ctrl-primary');
        this.dom.btnPlay.classList.add('btn-ctrl-secondary');

        this.playTimer = setInterval(() => {
            if (this.currentFrameIdx < this.frames.length - 1) {
                this.renderFrame(this.currentFrameIdx + 1);
            } else {
                this.pause();
            }
        }, this.speedMs);
    }

    pause() {
        this.isPlaying = false;
        if (this.playTimer) {
            clearInterval(this.playTimer);
            this.playTimer = null;
        }
        if (this.dom.btnPlay) {
            this.dom.btnPlay.innerHTML = '<span>▶️</span><span>נגן</span>';
            this.dom.btnPlay.classList.remove('btn-ctrl-secondary');
            this.dom.btnPlay.classList.add('btn-ctrl-primary');
        }
    }

    stepNext() {
        this.pause();
        if (this.currentFrameIdx < this.frames.length - 1) {
            this.renderFrame(this.currentFrameIdx + 1);
        }
    }

    stepPrev() {
        this.pause();
        if (this.currentFrameIdx > 0) {
            this.renderFrame(this.currentFrameIdx - 1);
        }
    }

    reset() {
        this.pause();
        this.renderFrame(0);
    }

    setStatus(type, message) {
        this.dom.statusBanner.className = `status-banner ${type}`;
        if (type === 'error') {
            this.dom.statusIcon.textContent = '❌';
        } else if (type === 'success') {
            this.dom.statusIcon.textContent = '✅';
        } else {
            this.dom.statusIcon.textContent = 'ℹ️';
        }
        this.dom.statusText.textContent = message;
    }
}

// הפעלה בעת טעינת העמוד
document.addEventListener('DOMContentLoaded', () => {
    window.app = new Visualizer10thApp();
    window.app.init();
});
