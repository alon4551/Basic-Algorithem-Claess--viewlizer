/**
 * C# & Java Fundamentals Visualizer UI Controller
 * אלון שרייבמן — מורה פרטי
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
        this.memFilter = 'all';
        this.selectedTraceVars = new Set();
        this.allTraceVars = [];
        this.hasCustomTraceSelection = false;
        this.customWatchExpressions = new Set();

        // ניהול שפה וקבצים בלשוניות (Class Tabs)
        this.currentLang = 'csharp'; // 'csharp' | 'java'
        const mainFile = this.getMainFileName();
        const initialPresets = this.getPresetsForCurrentLang();
        const initialCode = (initialPresets['empty_main'] && initialPresets['empty_main'].files[mainFile]) || '';
        this.editorFiles = {
            [mainFile]: {
                name: mainFile,
                code: initialCode
            }
        };
        this.activeFileName = mainFile;
        this.recompileTimer = null;
        this.dom = {};
    }

    getMainFileName() {
        return this.currentLang === 'java' ? 'Main.java' : 'Program.cs';
    }

    getPresetsForCurrentLang() {
        const lang = this.currentLang || 'csharp';
        if (typeof window !== 'undefined' && typeof window.getPresets10th === 'function') {
            return window.getPresets10th(lang);
        }
        if (typeof getPresets10th === 'function') {
            return getPresets10th(lang);
        }
        if (lang === 'java') {
            if (typeof PRESETS_10TH_JAVA !== 'undefined') return PRESETS_10TH_JAVA;
            if (typeof window !== 'undefined' && window.PRESETS_10TH_JAVA) return window.PRESETS_10TH_JAVA;
            if (typeof globalThis !== 'undefined' && globalThis.PRESETS_10TH_JAVA) return globalThis.PRESETS_10TH_JAVA;
        }
        if (typeof PRESETS_10TH_CS !== 'undefined') return PRESETS_10TH_CS;
        if (typeof PRESETS_10TH !== 'undefined') return PRESETS_10TH;
        return {};
    }

    init() {
        this.cacheDom();
        this.bindEvents();
        this.setupAutocomplete();
        this.updatePresetsDropdown();
        this.renderTabs();
        this.setupResizer();
        this.setupStageVerticalResizer();
        this.setupCardResizers();
        this.loadPreset('empty_main');
    }

    cacheDom() {
        this.dom.studioModeButtons = document.querySelectorAll('.btn-studio-mode');
        this.dom.btnLangCs = document.getElementById('btn-lang-cs');
        this.dom.btnLangJava = document.getElementById('btn-lang-java');
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

        // במת הזיכרון הדינמית האחודה ולשוניות ראשיות
        this.dom.cardMainStage = document.getElementById('card-main-stage');
        this.dom.tabBtnMemoryView = document.getElementById('tab-btn-memory-view');
        this.dom.tabBtnTraceView = document.getElementById('tab-btn-trace-view');
        this.dom.tabBtnsMain = document.querySelectorAll('.tab-btn-main');
        this.dom.paneMemoryView = document.getElementById('pane-memory-view');
        this.dom.paneTraceView = document.getElementById('pane-trace-view');
        this.dom.btnMemFilters = document.querySelectorAll('.btn-mem-filter');

        this.dom.btnOpenSetup = document.getElementById('btn-open-setup');
        this.dom.btnCloseInitCard = document.getElementById('btn-close-init-card');

        this.dom.dynamicMemoryStage = document.getElementById('dynamic-memory-stage');
        this.dom.cardEmptyState = document.getElementById('card-empty-state');

        // כרטיסי במת זיכרון חיים ותגיות כמות
        this.dom.cardArrays = document.getElementById('card-arrays');
        this.dom.arraysCountBadge = document.getElementById('arrays-count-badge');
        this.dom.arrayContainer = document.getElementById('array-container');

        this.dom.cardMatrices = document.getElementById('card-matrices');
        this.dom.matricesCountBadge = document.getElementById('matrices-count-badge');
        this.dom.matrixContainer = document.getElementById('matrix-container');

        this.dom.cardStrings = document.getElementById('card-strings');
        this.dom.stringsCountBadge = document.getElementById('strings-count-badge');
        this.dom.stringContainer = document.getElementById('string-container');

        this.dom.cardHeap = document.getElementById('card-heap');
        this.dom.heapCountBadge = document.getElementById('heap-count-badge');
        this.dom.heapContainer = document.getElementById('heap-container');

        // כרטיסיית בדיקה ממוזערת עם לשוניות (משתנים, קונסול, מחסנית)
        this.dom.cardInspectionTabs = document.getElementById('card-inspection-tabs');
        this.dom.stageVerticalResizer = document.getElementById('stage-vertical-resizer');
        this.dom.tabBtnsInsp = document.querySelectorAll('.tab-btn-insp');
        this.dom.tabPanesInsp = document.querySelectorAll('.tab-pane-insp');
        this.dom.tabBtnVars = document.getElementById('tab-btn-vars');
        this.dom.tabBtnConsole = document.getElementById('tab-btn-console');
        this.dom.tabBtnStack = document.getElementById('tab-btn-stack');
        this.dom.tabPaneVars = document.getElementById('tab-pane-vars');
        this.dom.tabPaneConsole = document.getElementById('tab-pane-console');
        this.dom.tabPaneStack = document.getElementById('tab-pane-stack');

        this.dom.varsCountBadge = document.getElementById('vars-count-badge');
        this.dom.variablesChipsGrid = document.getElementById('variables-chips-grid');
        this.dom.variablesTable = document.getElementById('variables-table');
        this.dom.variablesTbody = document.getElementById('variables-tbody');

        this.dom.stackCountBadge = document.getElementById('stack-count-badge');
        this.dom.callStackList = document.getElementById('call-stack-list');

        this.dom.consoleCountBadge = document.getElementById('console-count-badge');
        this.dom.consoleOutput = document.getElementById('console-output');
        this.dom.btnClearConsole = document.getElementById('btn-clear-console');

        // תאימות לאחור
        this.dom.arrayCard = this.dom.cardArrays;
        this.dom.matrixCard = this.dom.cardMatrices;
        this.dom.stringCard = this.dom.cardStrings;
        this.dom.heapCard = this.dom.cardHeap;
        this.dom.cardVariables = this.dom.tabPaneVars;
        this.dom.cardCallstack = this.dom.tabPaneStack;
        this.dom.cardConsole = this.dom.tabPaneConsole;

        // טבלת מעקב ובחירת משתנים
        this.dom.traceTable = document.getElementById('trace-table');
        this.dom.traceThead = document.getElementById('trace-thead');
        this.dom.traceTbody = document.getElementById('trace-tbody');
        this.dom.traceStepCount = document.getElementById('trace-step-count');
        this.dom.traceVarChipsList = document.getElementById('trace-var-chips-list');
        this.dom.btnTraceSelectAll = document.getElementById('btn-trace-select-all');
        this.dom.btnTraceDeselectAll = document.getElementById('btn-trace-deselect-all');
        this.dom.btnCopyTrace = document.getElementById('btn-copy-trace');
        this.dom.inputAddTraceVar = document.getElementById('input-add-trace-var');
        this.dom.btnAddTraceVar = document.getElementById('btn-add-trace-var');

        this.dom.resizer = document.getElementById('resizer-h');
        this.dom.editorPanel = document.getElementById('editor-panel');
        this.dom.visualPanel = document.getElementById('visual-panel');
    }

    setLanguage(lang) {
        if (!lang) return;
        this.currentLang = lang;

        const btnCs = document.getElementById('btn-lang-cs');
        const btnJava = document.getElementById('btn-lang-java');
        if (btnCs) btnCs.classList.toggle('active', lang === 'csharp');
        if (btnJava) btnJava.classList.toggle('active', lang === 'java');

        const currentPresetId = (this.dom.presetSelect && this.dom.presetSelect.value) || 'empty_main';
        this.updatePresetsDropdown();
        if (this.dom.presetSelect) {
            this.dom.presetSelect.value = currentPresetId;
        }
        this.loadPreset(currentPresetId);
        this.setStatus('info', `שפת הסטודיו הוחלפה ל-${lang === 'java' ? 'Java' : 'C#'}`);
    }

    updatePresetsDropdown() {
        if (!this.dom.presetSelect) return;
        const presets = this.getPresetsForCurrentLang();
        const currentValue = this.dom.presetSelect.value || 'empty_main';

        this.dom.presetSelect.innerHTML = '';
        for (const [id, p] of Object.entries(presets)) {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = p.title;
            if (id === currentValue) opt.selected = true;
            this.dom.presetSelect.appendChild(opt);
        }
    }

    bindEvents() {
        // בורר שפה (C# / Java) - האזנה ישירה, האזנה למיכל ו-onclick
        const langContainer = document.getElementById('lang-switch-pills');
        if (langContainer) {
            langContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-lang-pill');
                if (btn) {
                    const targetLang = btn.dataset.lang || (btn.id === 'btn-lang-java' ? 'java' : 'csharp');
                    this.setLanguage(targetLang);
                }
            });
        }
        if (this.dom.btnLangCs) {
            this.dom.btnLangCs.onclick = (e) => {
                e.preventDefault();
                this.setLanguage('csharp');
            };
        }
        if (this.dom.btnLangJava) {
            this.dom.btnLangJava.onclick = (e) => {
                e.preventDefault();
                this.setLanguage('java');
            };
        }

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

        // כפתור פתיחה/סגירה של חלונית אתחול נתונים (Setup Drawer)
        if (this.dom.btnOpenSetup && this.dom.cardFlexibleInit) {
            this.dom.btnOpenSetup.addEventListener('click', () => {
                const isHidden = this.dom.cardFlexibleInit.style.display === 'none';
                this.dom.cardFlexibleInit.style.display = isHidden ? '' : 'none';
                this.dom.btnOpenSetup.classList.toggle('active', isHidden);
                if (isHidden) {
                    this.dom.cardFlexibleInit.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }
        if (this.dom.btnCloseInitCard && this.dom.cardFlexibleInit) {
            this.dom.btnCloseInitCard.addEventListener('click', () => {
                this.dom.cardFlexibleInit.style.display = 'none';
                if (this.dom.btnOpenSetup) this.dom.btnOpenSetup.classList.remove('active');
            });
        }
        if (this.dom.btnToggleInitCard && this.dom.cardFlexibleInit) {
            this.dom.btnToggleInitCard.addEventListener('click', () => {
                const isHidden = this.dom.cardFlexibleInit.style.display === 'none';
                this.dom.cardFlexibleInit.style.display = isHidden ? '' : 'none';
                if (this.dom.btnOpenSetup) this.dom.btnOpenSetup.classList.toggle('active', isHidden);
            });
        }

        // כפתורי מזעור/הרחבה לכל הכרטיסיות (.view-card ו-.stage-card)
        document.querySelectorAll('.btn-card-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.view-card') || e.target.closest('.stage-card') || e.target.closest('.inspection-tabs-card');
                if (card && btn.id !== 'btn-close-init-card') {
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
                const mainFile = this.getMainFileName();
                if (!this.editorFiles[mainFile]) return;
                const code = this.editorFiles[mainFile].code;
                if (code.includes('int[] arr =')) {
                    this.editorFiles[mainFile].code = code.replace(/int\[\]\s*arr\s*=\s*\{[^}]*\};/, snippet);
                } else {
                    const isJava = this.currentLang === 'java';
                    const mainRegex = isJava
                        ? /public\s+static\s+void\s+main\s*\([^)]*\)\s*\{/
                        : /public\s+static\s+void\s+Main\s*\([^)]*\)\s*\{/;
                    const mainReplace = isJava
                        ? `public static void main(String[] args) {\n        ${snippet}`
                        : `public static void Main()\n    {\n        ${snippet}`;
                    this.editorFiles[mainFile].code = code.replace(mainRegex, mainReplace);
                }
                if (this.activeFileName === mainFile) {
                    this.dom.codeTextarea.value = this.editorFiles[mainFile].code;
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
                const isJava = this.currentLang === 'java';
                const snippet = isJava
                    ? `int[][] mat = {\n${rowsFormatted}\n    };`
                    : `int[,] mat = {\n${rowsFormatted}\n    };`;

                const mainFile = this.getMainFileName();
                if (!this.editorFiles[mainFile]) return;
                const code = this.editorFiles[mainFile].code;
                const matRegex = isJava
                    ? /int\[\]\[\]\s*mat\s*=\s*\{[\s\S]*?\};/
                    : /int\[,\]\s*mat\s*=\s*\{[\s\S]*?\};/;

                if (matRegex.test(code)) {
                    this.editorFiles[mainFile].code = code.replace(matRegex, snippet);
                } else {
                    const mainRegex = isJava
                        ? /public\s+static\s+void\s+main\s*\([^)]*\)\s*\{/
                        : /public\s+static\s+void\s+Main\s*\([^)]*\)\s*\{/;
                    const mainReplace = isJava
                        ? `public static void main(String[] args) {\n${snippet}`
                        : `public static void Main()\n    {\n        ${snippet}`;
                    this.editorFiles[mainFile].code = code.replace(mainRegex, mainReplace);
                }
                if (this.activeFileName === mainFile) {
                    this.dom.codeTextarea.value = this.editorFiles[mainFile].code;
                    this.updateLineNumbers();
                }
                this.recompile();
            });
        }

        if (this.dom.btnInitApplyString) {
            this.dom.btnInitApplyString.addEventListener('click', () => {
                const word = this.dom.initStringInput.value.trim();
                const isJava = this.currentLang === 'java';
                const snippet = isJava ? `String word = "${word}";` : `string word = "${word}";`;
                const mainFile = this.getMainFileName();
                if (!this.editorFiles[mainFile]) return;
                const code = this.editorFiles[mainFile].code;
                const strRegex = isJava
                    ? /String\s+(word|str|text)\s*=\s*"[^"]*";/
                    : /string\s+(word|str|text)\s*=\s*"[^"]*";/;

                if (strRegex.test(code)) {
                    this.editorFiles[mainFile].code = code.replace(strRegex, snippet);
                } else {
                    const mainRegex = isJava
                        ? /public\s+static\s+void\s+main\s*\([^)]*\)\s*\{/
                        : /public\s+static\s+void\s+Main\s*\([^)]*\)\s*\{/;
                    const mainReplace = isJava
                        ? `public static void main(String[] args) {\n        ${snippet}`
                        : `public static void Main()\n    {\n        ${snippet}`;
                    this.editorFiles[mainFile].code = code.replace(mainRegex, mainReplace);
                }
                if (this.activeFileName === mainFile) {
                    this.dom.codeTextarea.value = this.editorFiles[mainFile].code;
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

        // מעבר בין לשוניות הבמה הראשית (במת זיכרון מול טבלת מעקב)
        if (this.dom.tabBtnsMain) {
            this.dom.tabBtnsMain.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.dom.tabBtnsMain.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const view = btn.dataset.view;
                    if (this.dom.paneMemoryView) {
                        this.dom.paneMemoryView.classList.toggle('active', view === 'memory');
                        this.dom.paneMemoryView.style.display = (view === 'memory') ? 'block' : 'none';
                    }
                    if (this.dom.paneTraceView) {
                        this.dom.paneTraceView.classList.toggle('active', view === 'trace');
                        this.dom.paneTraceView.style.display = (view === 'trace') ? 'block' : 'none';
                        if (view === 'trace') {
                            this.renderTraceTable();
                            this.highlightTraceTableRow(this.currentFrameIdx);
                        }
                    }
                });
            });
        }

        // כפתורי סינון מהיר בתוך במת הזיכרון
        if (this.dom.btnMemFilters) {
            this.dom.btnMemFilters.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.dom.btnMemFilters.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.memFilter = btn.dataset.filter || 'all';
                    this.applyMemFilter();
                });
            });
        }

        // כפתורי סמן הכל / בטל הכל והוספת ביטוי מותאם אישית עבור עמודות טבלת מעקב
        if (this.dom.btnTraceSelectAll) {
            this.dom.btnTraceSelectAll.addEventListener('click', () => {
                if (this.allTraceVars) {
                    this.hasCustomTraceSelection = true;
                    this.selectedTraceVars = new Set(this.allTraceVars);
                    this.updateTraceChipsCheckedState();
                    this.renderTraceTable(true);
                }
            });
        }
        if (this.dom.btnTraceDeselectAll) {
            this.dom.btnTraceDeselectAll.addEventListener('click', () => {
                this.hasCustomTraceSelection = true;
                this.selectedTraceVars.clear();
                this.updateTraceChipsCheckedState();
                this.renderTraceTable(true);
            });
        }

        const handleAddCustomVar = () => {
            if (!this.dom.inputAddTraceVar) return;
            const expr = this.dom.inputAddTraceVar.value.trim();
            if (!expr) return;
            this.customWatchExpressions.add(expr);
            this.hasCustomTraceSelection = true;
            this.selectedTraceVars.add(expr);
            this.dom.inputAddTraceVar.value = '';
            this.recompile(false);
        };

        if (this.dom.btnAddTraceVar) {
            this.dom.btnAddTraceVar.addEventListener('click', handleAddCustomVar);
        }
        if (this.dom.inputAddTraceVar) {
            this.dom.inputAddTraceVar.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomVar();
                }
            });
        }

        // לשוניות כרטיסיית בדיקה תחתונה (משתנים, קונסול, מחסנית)
        if (this.dom.tabBtnsInsp) {
            this.dom.tabBtnsInsp.forEach(btn => {
                btn.addEventListener('click', () => {
                    const tab = btn.dataset.tab;
                    this.switchInspectionTab(tab);
                });
            });
        }

        // כפתור הוספת מחלקה חדשה
        this.dom.btnAddTab.addEventListener('click', () => this.promptAddClass());

        // עריכת קוד (עם השהיה קלה למניעת שבירת זרימת ההקלדה והחלפת טאבים)
        this.dom.codeTextarea.addEventListener('input', () => {
            if (this.editorFiles[this.activeFileName]) {
                this.editorFiles[this.activeFileName].code = this.dom.codeTextarea.value;
            }
            this.updateLineNumbers();
            if (this.recompileTimer) {
                clearTimeout(this.recompileTimer);
            }
            this.recompileTimer = setTimeout(() => {
                this.recompile(false);
            }, 250);
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

        // שחזור רוחב מועדף מ-localStorage אם קיים
        try {
            const savedRatio = localStorage.getItem('agy_10th_editor_width_ratio');
            if (savedRatio) {
                const ratio = parseFloat(savedRatio);
                if (!isNaN(ratio) && ratio >= 20 && ratio <= 80) {
                    this.dom.editorPanel.style.flex = `0 0 ${ratio}%`;
                }
            }
        } catch (e) {}

        const onStart = () => {
            isResizing = true;
            this.dom.resizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        };

        const onMove = (clientX) => {
            if (!isResizing) return;
            const container = document.querySelector('.main-layout');
            if (!container) return;
            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            if (containerWidth <= 0) return;

            // In 10th grade, layout is direction: ltr.
            // Editor is on the left, visual stage is on the right.
            const relativeX = clientX - containerRect.left;
            
            // Keep safe margins: min editor 280px, min visual 320px
            const minEditor = 280;
            const maxEditor = Math.max(minEditor + 40, containerWidth - 320);
            const clamped = Math.max(minEditor, Math.min(maxEditor, relativeX));
            
            const percentage = (clamped / containerWidth) * 100;
            this.dom.editorPanel.style.flex = `0 0 ${percentage.toFixed(2)}%`;
            try {
                localStorage.setItem('agy_10th_editor_width_ratio', percentage.toFixed(2));
            } catch (e) {}
        };

        const onEnd = () => {
            if (isResizing) {
                isResizing = false;
                this.dom.resizer.classList.remove('resizing');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };

        this.dom.resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            onStart();
        });

        this.dom.resizer.addEventListener('touchstart', () => {
            onStart();
        }, { passive: true });

        document.addEventListener('mousemove', (e) => {
            if (isResizing) {
                if (e.buttons === 0) {
                    onEnd();
                    return;
                }
                onMove(e.clientX);
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (isResizing && e.touches.length === 1) {
                onMove(e.touches[0].clientX);
            }
        }, { passive: true });

        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);

        // לחיצה כפולה לאיפוס חלוקה שווה (50%-50%)
        this.dom.resizer.addEventListener('dblclick', () => {
            this.dom.editorPanel.style.flex = '0 0 50%';
            try {
                localStorage.setItem('agy_10th_editor_width_ratio', '50');
            } catch (e) {}
        });
    }

    setupCardResizers() {
        // 1. טיפול במתיחה ידנית (Drag-to-resize) עבור כל הכרטיסים והחלוניות
        document.querySelectorAll('.card-resize-handle').forEach(handle => {
            let isDragging = false;
            let startY = 0;
            let startHeight = 0;
            let target = null;

            const onStart = (clientY) => {
                const card = handle.closest('.view-card') || handle.closest('.stage-card') || handle.closest('.main-view-pane') || handle.closest('.inspection-tabs-card');
                if (card) {
                    if (handle.classList.contains('trace-resize-handle')) {
                        target = card.querySelector('.trace-table-wrapper');
                    } else if (handle.classList.contains('drawer-resize-handle')) {
                        target = card.querySelector('#flexible-init-body');
                    } else if (card.classList.contains('inspection-tabs-card')) {
                        target = card.querySelector('.inspection-body');
                    } else if (card.id === 'card-console') {
                        target = card.querySelector('.console-box');
                    } else {
                        target = card.querySelector('.view-card-body') || card.querySelector('.card-body');
                    }
                }

                if (!target) return;
                isDragging = true;
                startY = clientY;
                startHeight = target.offsetHeight;
                handle.classList.add('resizing');
                document.body.style.cursor = 'row-resize';
                document.body.style.userSelect = 'none';
            };

            const onMove = (clientY) => {
                if (!isDragging || !target) return;
                const diff = clientY - startY;
                const winH = window.innerHeight || 800;
                const maxHeight = Math.max(160, winH - 220);
                const newHeight = Math.max(65, Math.min(maxHeight, startHeight + diff));
                target.style.height = `${newHeight}px`;
                target.style.maxHeight = `${maxHeight}px`;
            };

            const onEnd = () => {
                if (isDragging) {
                    isDragging = false;
                    handle.classList.remove('resizing');
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                }
            };

            // עכבר
            handle.addEventListener('mousedown', (e) => {
                if (e.button && e.button !== 0) return;
                e.preventDefault();
                onStart(e.clientY);
            });

            // מגע (Touch)
            handle.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    onStart(e.touches[0].clientY);
                }
            }, { passive: true });

            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    if (e.buttons === 0) {
                        onEnd();
                        return;
                    }
                    onMove(e.clientY);
                }
            });

            document.addEventListener('touchmove', (e) => {
                if (isDragging && e.touches.length === 1) {
                    onMove(e.touches[0].clientY);
                }
            }, { passive: true });

            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchend', onEnd);

            // לחיצה כפולה לאיפוס גובה לברירת המחדל
            handle.addEventListener('dblclick', () => {
                const card = handle.closest('.view-card') || handle.closest('.stage-card') || handle.closest('.main-view-pane') || handle.closest('.inspection-tabs-card');
                if (card) {
                    const el = card.querySelector('.trace-table-wrapper') || 
                               card.querySelector('#flexible-init-body') || 
                               card.querySelector('.inspection-body') || 
                               card.querySelector('.console-box') || 
                               card.querySelector('.view-card-body') || 
                               card.querySelector('.card-body');
                    if (el) {
                        el.style.height = '';
                        el.style.maxHeight = '';
                    }
                }
            });
        });

        // 2. כפתור מקסום/שחזור חלונית (Maximize / Restore)
        document.querySelectorAll('.btn-card-stretch').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.view-card') || e.target.closest('.inspection-tabs-card');
                if (card) {
                    const isMaximized = card.classList.toggle('maximized');
                    btn.textContent = isMaximized ? '🗗' : '⛶';
                    btn.title = isMaximized ? 'שחזר גודל חלונית' : 'מקסם חלונית';
                    if (isMaximized) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            });
        });
    }

    setupStageVerticalResizer() {
        const stageResizer = this.dom.stageVerticalResizer;
        const stageCard = this.dom.cardMainStage;
        const inspectionCard = this.dom.cardInspectionTabs;
        if (!stageResizer || !stageCard) return;

        const visualPanel = document.querySelector('.visual-panel');

        // שחזור גובה שמור במידה וקיים
        try {
            const savedHeight = localStorage.getItem('agy_10th_stage_height');
            if (savedHeight) {
                const h = parseFloat(savedHeight);
                const panelH = visualPanel ? visualPanel.clientHeight : 800;
                const maxH = Math.max(220, panelH - 160);
                if (!isNaN(h) && h >= 180 && h <= maxH) {
                    stageCard.style.height = `${h}px`;
                    stageCard.style.flex = `0 0 ${h}px`;
                }
            }
        } catch (e) {}

        let isDraggingVert = false;
        let startY = 0;
        let startHeight = 0;

        const onPointerMoveVert = (e) => {
            if (!isDraggingVert) return;
            if (e.buttons === 0) {
                onPointerUpVert(e);
                return;
            }
            const deltaY = e.clientY - startY;
            const currentPanel = document.querySelector('.visual-panel');
            const currentPanelH = currentPanel ? currentPanel.clientHeight : 800;

            const minHeight = 180;
            // השארת לפחות 130 פיקסלים עבור כרטיסיות הבדיקה התחתונות
            const maxHeight = Math.max(minHeight + 60, currentPanelH - 150);
            const newHeight = Math.max(minHeight, Math.min(maxHeight, Math.round(startHeight + deltaY)));

            stageCard.style.height = `${newHeight}px`;
            stageCard.style.flex = `0 0 ${newHeight}px`;
            try {
                localStorage.setItem('agy_10th_stage_height', newHeight);
            } catch (err) {}
        };

        const onPointerUpVert = (e) => {
            if (!isDraggingVert) return;
            isDraggingVert = false;
            stageResizer.classList.remove('is-dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            if (e && e.pointerId != null) {
                try { stageResizer.releasePointerCapture(e.pointerId); } catch (_) {}
            }

            window.removeEventListener('pointermove', onPointerMoveVert);
            window.removeEventListener('pointerup', onPointerUpVert);
            window.removeEventListener('pointercancel', onPointerUpVert);
        };

        const onPointerDownVert = (e) => {
            if (e.button && e.button !== 0) return;
            isDraggingVert = true;
            startY = e.clientY;
            startHeight = stageCard.getBoundingClientRect().height;

            stageResizer.classList.add('is-dragging');
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
            try { stageResizer.setPointerCapture(e.pointerId); } catch (_) {}

            window.addEventListener('pointermove', onPointerMoveVert, { passive: false });
            window.addEventListener('pointerup', onPointerUpVert);
            window.addEventListener('pointercancel', onPointerUpVert);

            e.preventDefault();
        };

        stageResizer.addEventListener('pointerdown', onPointerDownVert);

        // לחיצה כפולה לאיפוס חלוקה לברירת המחדל
        stageResizer.addEventListener('dblclick', () => {
            stageCard.style.height = '';
            stageCard.style.flex = '';
            if (inspectionCard) {
                inspectionCard.style.height = '';
                inspectionCard.style.flex = '';
            }
            try {
                localStorage.removeItem('agy_10th_stage_height');
            } catch (err) {}
        });
    }

    switchInspectionTab(tabName) {
        this.activeInspectionTab = tabName;
        if (this.dom.tabBtnsInsp) {
            this.dom.tabBtnsInsp.forEach(b => {
                b.classList.toggle('active', b.dataset.tab === tabName);
            });
        }
        if (this.dom.tabPanesInsp) {
            this.dom.tabPanesInsp.forEach(p => {
                p.classList.toggle('active', p.id === `tab-pane-${tabName}`);
            });
        }
        if (this.dom.btnClearConsole) {
            this.dom.btnClearConsole.style.display = (tabName === 'console') ? '' : 'none';
        }
        if (tabName === 'console' && this.dom.tabBtnConsole) {
            this.dom.tabBtnConsole.classList.remove('tab-has-new');
        }
    }

    loadPreset(presetId) {
        const presets = this.getPresetsForCurrentLang();
        const preset = presets[presetId] || presets['empty_main'];
        if (!preset) return;

        this.pause();
        this.selectedTraceVars.clear();
        this.hasCustomTraceSelection = false;
        this.customWatchExpressions.clear();
        this.editorFiles = {};
        for (const [fName, code] of Object.entries(preset.files)) {
            this.editorFiles[fName] = { name: fName, code: code };
        }
        const mainFile = this.getMainFileName();
        this.activeFileName = this.editorFiles[mainFile] ? mainFile : Object.keys(this.editorFiles)[0];
        this.renderTabs();
        if (this.dom.codeTextarea && this.editorFiles[this.activeFileName]) {
            this.dom.codeTextarea.value = this.editorFiles[this.activeFileName].code;
        }
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
        const mainFile = this.getMainFileName();
        for (const fName of Object.keys(this.editorFiles)) {
            const tab = document.createElement('div');
            tab.className = 'tab-file' + (fName === this.activeFileName ? ' active' : '');
            tab.innerHTML = `<span>${fName}</span>` + 
                (fName !== mainFile ? `<span class="tab-close-btn" title="סגור קובץ">&times;</span>` : '');

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
        if (this.activeFileName === fName) return;
        if (this.editorFiles[this.activeFileName] && this.dom.codeTextarea) {
            this.editorFiles[this.activeFileName].code = this.dom.codeTextarea.value;
        }
        this.activeFileName = fName;
        if (this.dom.codeTextarea) {
            this.dom.codeTextarea.value = this.editorFiles[fName].code;
        }
        this.renderTabs();
        this.updateLineNumbers();
        this.updateActiveLinePosition();
    }

    promptAddClass() {
        const langName = this.currentLang === 'java' ? 'Java' : 'C#';
        const name = prompt(`הזן שם למחלקה החדשה ב-${langName} (לדוגמה: Student, Point, Car):`);
        if (!name) return;
        const cleanName = name.replace(/[^A-Za-z0-9_]/g, '');
        if (!cleanName) return;
        const ext = this.currentLang === 'java' ? '.java' : '.cs';
        const fName = `${cleanName}${ext}`;
        if (this.editorFiles[fName]) {
            alert(`הקובץ ${fName} כבר קיים במערכת.`);
            return;
        }

        const isJava = this.currentLang === 'java';
        const defaultCode = isJava
            ? `public class ${cleanName} {\n    // שדות המחלקה\n    public String name;\n    public int value;\n\n    // בנאי\n    public ${cleanName}(String name, int value) {\n        this.name = name;\n        this.value = value;\n    }\n}`
            : `public class ${cleanName}\n{\n    // שדות המחלקה\n    public string name;\n    public int value;\n\n    // בנאי\n    public ${cleanName}(string name, int value)\n    {\n        this.name = name;\n        this.value = value;\n    }\n}`;

        this.editorFiles[fName] = {
            name: fName,
            code: defaultCode
        };

        this.switchTab(fName);
        this.recompile(false);
    }

    removeTab(fName) {
        const mainFile = this.getMainFileName();
        if (fName === mainFile) return;
        if (!confirm(`האם אתה בטוח שברצונך למחוק את ${fName}?`)) return;
        delete this.editorFiles[fName];
        if (this.activeFileName === fName) {
            this.activeFileName = mainFile;
            if (this.editorFiles[mainFile]) {
                this.dom.codeTextarea.value = this.editorFiles[mainFile].code;
            }
            this.renderTabs();
            this.updateLineNumbers();
            this.updateActiveLinePosition();
        } else {
            this.renderTabs();
        }
        this.recompile(false);
    }

    updateLineNumbers() {
        const lines = (this.dom.codeTextarea.value || '').split('\n').length;
        let html = '';
        for (let i = 1; i <= lines; i++) {
            html += `<div data-line="${i}">${i}</div>`;
        }
        this.dom.lineNumbers.innerHTML = html;
    }

    recompile(autoSwitchTab = false) {
        this.pause();
        const codeFiles = {};
        for (const [name, obj] of Object.entries(this.editorFiles)) {
            codeFiles[name] = obj.code;
        }

        const customWatches = Array.from(this.customWatchExpressions);
        const traceResult = this.interpreter.run(codeFiles, [], customWatches);
        this.frames = traceResult.frames || [];
        this.currentFrameIdx = 0;

        if (traceResult.error) {
            this.setStatus('error', `⚠️ שגיאה: ${traceResult.error}`);
        } else {
            this.setStatus('success', `הקוד הורץ בהצלחה (${this.frames.length} צעדים הוקלטו)`);
        }

        this.renderFrame(0, autoSwitchTab);
        this.renderTraceTable();
    }

    renderFrame(idx, autoSwitchTab = true) {
        if (!this.frames || this.frames.length === 0) {
            this.dom.stepBadge.textContent = '0 / 0';
            this.highlightActiveLine(0);
            if (this.dom.cardEmptyState) this.dom.cardEmptyState.style.display = '';
            this.hideAllCards();
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

        // מעבר אוטומטי לקובץ הפעיל במסגרת אם נדרש והקובץ קיים
        if (autoSwitchTab && frame.file && frame.file !== this.activeFileName && this.editorFiles[frame.file]) {
            this.switchTab(frame.file);
        }

        // הדגשת שורה נוכחית בעורך - רק אם הקובץ המוצג בעורך תואם לקובץ המסגרת
        if (!frame.file || frame.file === this.activeFileName) {
            this.highlightActiveLine(frame.line);
        } else {
            this.highlightActiveLine(0);
        }

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

        // עדכון דינמי של כרטיסים: כרטיס שאין בו מידע מוסתר לחלוטין (תופס 0 מקום!)
        this.updateCardsVisibility(frame);

        // הדגשת שורה בטבלת מעקב
        this.highlightTraceTableRow(idx);
    }

    highlightActiveLine(lineNum) {
        if (!lineNum || lineNum <= 0 || !this.dom.activeLineHighlight || !this.dom.codeTextarea) {
            if (this.dom.activeLineHighlight) this.dom.activeLineHighlight.style.display = 'none';
            if (this.dom.lineNumbers) {
                const prev = this.dom.lineNumbers.querySelector('.active-line-num');
                if (prev) prev.classList.remove('active-line-num');
            }
            return;
        }

        const cs = window.getComputedStyle(this.dom.codeTextarea);
        const paddingTop = parseFloat(cs.paddingTop) || 10.4;
        const lineHeight = parseFloat(cs.lineHeight) || 23.2;
        const scrollTop = this.dom.codeTextarea.scrollTop || 0;

        const top = paddingTop + (lineNum - 1) * lineHeight - scrollTop;

        this.dom.activeLineHighlight.style.top = `${top}px`;
        this.dom.activeLineHighlight.style.height = `${lineHeight}px`;
        this.dom.activeLineHighlight.style.display = 'block';

        // הדגשת מספר השורה בסרגל מספרי השורות
        if (this.dom.lineNumbers) {
            const prev = this.dom.lineNumbers.querySelector('.active-line-num');
            if (prev) prev.classList.remove('active-line-num');
            const targetDiv = this.dom.lineNumbers.querySelector(`[data-line="${lineNum}"]`);
            if (targetDiv) targetDiv.classList.add('active-line-num');
        }

        // וידוא שהשורה המודגשת גלויה במלואה בעורך
        this.ensureActiveLineVisible(lineNum, paddingTop, lineHeight);
    }

    ensureActiveLineVisible(lineNum, paddingTop, lineHeight) {
        if (!this.dom.codeTextarea) return;
        const lineTop = paddingTop + (lineNum - 1) * lineHeight;
        const lineBottom = lineTop + lineHeight;
        const clientHeight = this.dom.codeTextarea.clientHeight || 400;
        const currentScroll = this.dom.codeTextarea.scrollTop || 0;

        if (lineTop < currentScroll) {
            this.dom.codeTextarea.scrollTop = Math.max(0, lineTop - lineHeight);
        } else if (lineBottom > currentScroll + clientHeight) {
            this.dom.codeTextarea.scrollTop = lineBottom - clientHeight + lineHeight;
        }
    }

    updateActiveLinePosition() {
        if (this.frames && this.frames[this.currentFrameIdx]) {
            const frame = this.frames[this.currentFrameIdx];
            if (!frame.file || frame.file === this.activeFileName) {
                this.highlightActiveLine(frame.line);
            } else {
                this.highlightActiveLine(0);
            }
        } else {
            this.highlightActiveLine(0);
        }
    }

    render1DArrays(arrays, activePointers) {
        const count = arrays ? arrays.length : 0;
        if (this.dom.arraysCountBadge) {
            this.dom.arraysCountBadge.textContent = `${count} מערכים`;
        }
        if (!arrays || arrays.length === 0) {
            this.dom.arrayContainer.innerHTML = '';
            return;
        }

        let html = '';
        for (const arr of arrays) {
            const elemType = arr.elemType || 'int';
            html += `<div class="array-box-wrapper">`;
            html += `<div class="array-name-badge">${elemType}[] ${arr.name} (אורך: ${arr.length})</div>`;
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

                let cellContentHtml = '';
                let cellExtraClass = '';

                if (val === null || val === undefined) {
                    cellContentHtml = `<span class="val-null">null</span>`;
                    cellExtraClass = ' cell-is-null';
                } else if (typeof val === 'object' && val._heapId) {
                    cellExtraClass = ' is-object-cell';
                    const fields = val.fields || {};
                    const fieldsList = Object.entries(fields).map(([k, v]) => `<span>${k}: <b>${v}</b></span>`).join('');
                    cellContentHtml = `
                        <div class="cell-obj-badge">#${val._heapId} ${val.className}</div>
                        <div class="cell-obj-fields">${fieldsList}</div>
                    `;
                } else {
                    cellContentHtml = String(val);
                }

                html += `
                    <div class="array-cell-col">
                        <div class="array-cell-pointer">${pointerText}</div>
                        <div class="array-cell-box ${cellExtraClass} ${hasPointer ? 'pointer-active' : ''}">${cellContentHtml}</div>
                        <div class="array-cell-index">[${i}]</div>
                    </div>
                `;
            }

            html += `</div></div>`;
        }
        this.dom.arrayContainer.innerHTML = html;
    }

    render2DMatrices(matrices) {
        const count = matrices ? matrices.length : 0;
        if (this.dom.matricesCountBadge) {
            this.dom.matricesCountBadge.textContent = `${count} מטריצות`;
        }
        if (!matrices || matrices.length === 0) {
            this.dom.matrixContainer.innerHTML = '';
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
        const count = strings ? strings.length : 0;
        if (this.dom.stringsCountBadge) {
            this.dom.stringsCountBadge.textContent = `${count} מחרוזות`;
        }
        if (!strings || strings.length === 0) {
            this.dom.stringContainer.innerHTML = '';
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
        const count = objects ? objects.length : 0;
        if (this.dom.heapCountBadge) {
            this.dom.heapCountBadge.textContent = `${count} עצמים ב-Heap`;
        }
        if (!objects || objects.length === 0) {
            this.dom.heapContainer.innerHTML = '';
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
        // סינון תאי מערך סטטיים (arr[0], arr[1]) כדי לשמור על לשונית המשתנים נקייה וממוקדת
        const validEntries = variables 
            ? Object.entries(variables).filter(([k]) => k !== 'this' && !k.startsWith('_') && !/\[\s*\d+\s*(?:,\s*\d+\s*)?\]/.test(k))
            : [];

        if (this.dom.varsCountBadge) {
            this.dom.varsCountBadge.textContent = `${validEntries.length} משתנים`;
        }

        if (!variables || validEntries.length === 0) {
            if (this.dom.variablesChipsGrid) {
                this.dom.variablesChipsGrid.innerHTML = '';
            }
            if (this.dom.variablesTbody) {
                this.dom.variablesTbody.innerHTML = '<tr><td colspan="2" class="text-muted">אין משתנים מקומיים</td></tr>';
            }
            return;
        }

        let chipsHtml = '';
        let tableHtml = '';

        for (const [key, val] of validEntries) {
            let displayVal = val;
            if (Array.isArray(val)) {
                const itemsStr = val.slice(0, 4).map(item => {
                    if (item && item._heapId) return item.fields && item.fields.name ? `${item.fields.name}` : `${item.className}#${item._heapId}`;
                    if (typeof item === 'string') return `"${item}"`;
                    if (item === null) return 'null';
                    return item;
                }).join(', ');
                displayVal = `[${itemsStr}${val.length > 4 ? '...' : ''}]`;
            } else if (val && val._isMatrix) {
                displayVal = `Matrix[${val.rows},${val.cols}]`;
            } else if (val && val._heapId) {
                displayVal = `#${val.className}(#${val._heapId})`;
            } else if (typeof val === 'string') {
                displayVal = `"${val}"`;
            } else if (typeof val === 'boolean') {
                displayVal = val ? 'true' : 'false';
            }

            // זיהוי שינוי ערך לעומת הצעד הקודם
            const prevVal = this.prevVariables ? this.prevVariables[key] : undefined;
            const isUpdated = prevVal !== undefined && prevVal !== val;

            chipsHtml += `
                <div class="var-badge-card ${isUpdated ? 'updated' : ''}">
                    <span class="var-badge-name">${key}</span>
                    <span class="var-badge-val" title="${displayVal}">${displayVal}</span>
                </div>
            `;

            tableHtml += `<tr><td><strong>${key}</strong></td><td>${displayVal}</td></tr>`;
        }

        if (this.dom.variablesChipsGrid) {
            this.dom.variablesChipsGrid.innerHTML = chipsHtml;
        }
        if (this.dom.variablesTbody) {
            this.dom.variablesTbody.innerHTML = tableHtml;
        }

        this.prevVariables = { ...variables };
    }

    renderCallStack(callStack) {
        const count = callStack ? callStack.length : 0;
        if (this.dom.stackCountBadge) {
            this.dom.stackCountBadge.textContent = `${count} מסגרות`;
        }
        if (!this.dom.callStackList) return;
        if (!callStack || count === 0) {
            this.dom.callStackList.innerHTML = '<li class="text-muted" style="padding: 0.25rem 0; font-size: 0.8rem;">מחסנית ריקה</li>';
            return;
        }

        let html = '';
        for (let i = callStack.length - 1; i >= 0; i--) {
            const frame = callStack[i];
            const isTop = (i === callStack.length - 1);
            html += `
                <li class="call-stack-item ${isTop ? 'top-frame' : ''}">
                    <span><strong>${frame.funcName}()</strong></span>
                    <span style="color: var(--text-muted); font-size: 0.75rem;">שורה ${frame.line || '-'}</span>
                </li>
            `;
        }
        this.dom.callStackList.innerHTML = html;
    }

    renderConsole(outputs) {
        const count = outputs ? outputs.length : 0;
        if (this.dom.consoleCountBadge) {
            this.dom.consoleCountBadge.textContent = `${count} שורות`;
        }
        if (this.dom.tabBtnConsole && count > 0 && this.activeInspectionTab !== 'console') {
            this.dom.tabBtnConsole.classList.add('tab-has-new');
        }
        if (!this.dom.consoleOutput) return;
        if (!outputs || count === 0) {
            this.dom.consoleOutput.textContent = '--- אין פלט עדיין ---';
            return;
        }
        this.dom.consoleOutput.textContent = outputs.join('\n');
        this.dom.consoleOutput.scrollTop = this.dom.consoleOutput.scrollHeight;
    }

    renderTraceTable(skipChips = false) {
        if (!this.frames || this.frames.length === 0) {
            if (this.dom.traceThead) this.dom.traceThead.innerHTML = '';
            if (this.dom.traceTbody) this.dom.traceTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">הרץ את התוכנית כדי להפיק טבלת מעקב</td></tr>';
            if (this.dom.traceStepCount) this.dom.traceStepCount.textContent = '0 צעדים';
            return;
        }

        if (this.dom.traceStepCount) {
            this.dom.traceStepCount.textContent = `${this.frames.length} צעדים`;
        }

        // איסוף כל שמות המשתנים המופיעים לאורך הריצה (כולל מערכים, מטריצות, מחרוזות ועצמים)
        const varSet = new Set();
        for (const f of this.frames) {
            if (f.variables) {
                for (const [k, v] of Object.entries(f.variables)) {
                    if (k === 'this' || k.startsWith('_')) continue;
                    // סינון אינדקסים סטטיים כגון arr[0], arr[4] שאינם רלוונטיים, אלא אם המשתמש הוסיף אותם במפורש למעקב
                    if (/\[\s*\d+\s*(?:,\s*\d+\s*|\]\s*\[\s*\d+\s*)?\]$/.test(k) && !this.customWatchExpressions.has(k)) {
                        continue;
                    }
                    varSet.add(k);
                }
            }
        }
        for (const expr of this.customWatchExpressions) {
            varSet.add(expr);
        }

        // מיון פדגוגי הגיוני של משתני הטבלה
        const getVarCategoryOrder = (name) => {
            const loopCounters = ['i', 'j', 'k', 'r', 'c', 'idx', 'row', 'col', 'index', 'n', 'len'];
            if (loopCounters.includes(name.toLowerCase())) return 1;
            
            // ביטוי אינדקס דינמי כמו arr[i], arr[j], votes[i], candidate[votes[i]-1], mat[r, c]
            if (/\[.*[a-zA-Z].*\]/.test(name)) return 2;
            
            // משתנים סקלריים פשוטים ללא סוגריים מרובעים
            const sampleVal = this.frames.find(f => f.variables && f.variables[name] !== undefined)?.variables[name];
            const isArrayOrObj = Array.isArray(sampleVal) || (sampleVal && (sampleVal._isMatrix || sampleVal._heapId));
            if (!name.includes('[') && !isArrayOrObj) return 3;
            
            // תאים ממוספרים סטטיים כמו arr[0], arr[1]
            if (/\[\s*\d+\s*(?:,\s*\d+\s*)?\]/.test(name)) return 4;
            
            // מערכים שלמים, מטריצות, מחלקות
            return 5;
        };

        this.allTraceVars = Array.from(varSet).sort((a, b) => {
            const catA = getVarCategoryOrder(a);
            const catB = getVarCategoryOrder(b);
            if (catA !== catB) return catA - catB;
            const matchA = a.match(/^(.*)\[(\d+)(?:,\s*(\d+))?\]$/);
            const matchB = b.match(/^(.*)\[(\d+)(?:,\s*(\d+))?\]$/);
            if (matchA && matchB && matchA[1] === matchB[1]) {
                const numA1 = parseInt(matchA[2], 10);
                const numB1 = parseInt(matchB[2], 10);
                if (numA1 !== numB1) return numA1 - numB1;
                const numA2 = matchA[3] !== undefined ? parseInt(matchA[3], 10) : 0;
                const numB2 = matchB[3] !== undefined ? parseInt(matchB[3], 10) : 0;
                return numA2 - numB2;
            }
            return a.localeCompare(b);
        });

        // סנכרון משתנים נבחרים - אם המשתמש לא שינה ידנית, בחר את כולם; אם שינה ידנית, כבד את בחירתו
        if (!this.hasCustomTraceSelection) {
            this.selectedTraceVars = new Set(this.allTraceVars);
        } else {
            const valid = new Set();
            for (const v of this.selectedTraceVars) {
                if (this.allTraceVars.includes(v)) valid.add(v);
            }
            this.selectedTraceVars = valid;
        }

        if (!skipChips) {
            this.renderTraceVarChips();
        }

        const displayedVars = this.allTraceVars.filter(v => this.selectedTraceVars.has(v));

        // פונקציית עזר לעיצוב ערך תא בטבלה
        const formatVal = (val) => {
            if (val === undefined || val === null) return '-';
            if (typeof val === 'boolean') return val ? 'true' : 'false';
            if (typeof val === 'number') return String(val);
            if (Array.isArray(val)) {
                return `[${val.map(item => {
                    if (item && item._heapId) {
                        return item.fields && item.fields.name ? `${item.fields.name}` : `${item.className}#${item._heapId}`;
                    }
                    if (typeof item === 'string') return `"${item}"`;
                    return item;
                }).join(', ')}]`;
            }
            if (val && val._isMatrix) return `${val.rows}×${val.cols}`;
            if (val && val._heapId) {
                if (val.fields && Object.keys(val.fields).length > 0) {
                    const fieldsStr = Object.entries(val.fields)
                        .map(([k, v]) => `${k}:${typeof v === 'string' ? `"${v}"` : v}`)
                        .join(', ');
                    return `${val.className}{${fieldsStr}}`;
                }
                return `${val.className}#${val._heapId}`;
            }
            if (typeof val === 'object') {
                try {
                    return JSON.stringify(val);
                } catch {
                    return String(val);
                }
            }
            return String(val);
        };

        // בניית כותרות הטבלה
        let theadHtml = `<tr><th>צעד</th><th>שורה</th><th>תנאי / בדיקה</th>`;
        for (const vName of displayedVars) {
            theadHtml += `<th>${vName}</th>`;
        }
        theadHtml += `<th>פלט לקונסול</th></tr>`;
        if (this.dom.traceThead) this.dom.traceThead.innerHTML = theadHtml;

        // בניית שורות הטבלה
        let tbodyHtml = '';
        this.frames.forEach((f, idx) => {
            const rowClass = (idx === this.currentFrameIdx) ? 'active-trace-row' : '';
            let conditionText = f.condition || '-';
            if (conditionText === '-' && f.description && f.description.includes('תנאי')) {
                conditionText = f.description.replace(/^.*תנאי[^:]*:\s*/, '');
            }

            tbodyHtml += `<tr class="${rowClass}" data-step="${idx}">`;
            tbodyHtml += `<td><strong>${idx + 1}</strong></td>`;
            tbodyHtml += `<td>${f.line || '-'}</td>`;
            tbodyHtml += `<td>${conditionText}</td>`;

            for (const vName of displayedVars) {
                const rawVal = (f.variables && f.variables[vName] !== undefined) ? f.variables[vName] : undefined;
                tbodyHtml += `<td>${formatVal(rawVal)}</td>`;
            }

            let outputText = '-';
            if (f.output !== undefined && f.output !== null) {
                outputText = f.output;
            } else if (f.description && f.description.startsWith('הדפסה לקונסול: "')) {
                const match = f.description.match(/^הדפסה לקונסול: "(.*)"$/);
                if (match) outputText = match[1];
            }
            tbodyHtml += `<td>${outputText}</td></tr>`;
        });

        if (this.dom.traceTbody) this.dom.traceTbody.innerHTML = tbodyHtml;

        // הוספת האזנה לקליק על שורה לקפיצה בזמן
        if (this.dom.traceTbody) {
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
    }

    renderTraceVarChips() {
        if (!this.dom.traceVarChipsList) return;
        if (!this.allTraceVars || this.allTraceVars.length === 0) {
            this.dom.traceVarChipsList.innerHTML = '<span style="color: var(--text-muted); font-size: 0.75rem;">אין משתנים בתוכנית הנוכחית</span>';
            return;
        }
        let html = '';
        this.allTraceVars.forEach(vName => {
            const isChecked = this.selectedTraceVars.has(vName);
            html += `
                <label class="var-chip ${isChecked ? 'checked' : ''}">
                    <input type="checkbox" value="${vName}" ${isChecked ? 'checked' : ''}>
                    <span>${vName}</span>
                </label>
            `;
        });
        this.dom.traceVarChipsList.innerHTML = html;

        this.dom.traceVarChipsList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', (e) => {
                this.hasCustomTraceSelection = true;
                const vName = e.target.value;
                if (e.target.checked) {
                    this.selectedTraceVars.add(vName);
                } else {
                    this.selectedTraceVars.delete(vName);
                }
                this.updateTraceChipsCheckedState();
                this.renderTraceTable(true);
            });
        });
    }

    updateTraceChipsCheckedState() {
        if (!this.dom.traceVarChipsList) return;
        this.dom.traceVarChipsList.querySelectorAll('.var-chip').forEach(chip => {
            const cb = chip.querySelector('input[type="checkbox"]');
            if (cb) {
                const checked = this.selectedTraceVars.has(cb.value);
                cb.checked = checked;
                chip.classList.toggle('checked', checked);
            }
        });
    }

    highlightTraceTableRow(stepIdx) {
        if (!this.dom.traceTbody) return;
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
        if (!this.frames || this.frames.length === 0 || !this.dom.traceThead || !this.dom.traceTbody) return;
        const ths = Array.from(this.dom.traceThead.querySelectorAll('th')).map(th => th.textContent.trim());
        if (ths.length === 0) return;

        let content = `| ${ths.join(' | ')} |\n`;
        content += `| ${ths.map(() => '---').join(' | ')} |\n`;

        this.dom.traceTbody.querySelectorAll('tr').forEach(tr => {
            const rowText = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim()).join(' | ');
            content += `| ${rowText} |\n`;
        });

        navigator.clipboard.writeText(content).then(() => {
            alert('טבלת המעקב הועתקה ללוח בפורמט Markdown בהצלחה!');
        }).catch(() => {
            alert('הטבלה הוכנה להעתקה');
        });
    }

    updateCardsVisibility(frame) {
        if (!frame) {
            this.hideAllCards();
            if (this.dom.cardEmptyState) this.dom.cardEmptyState.style.display = '';
            return;
        }

        const hasArrays = frame.arrays1D && frame.arrays1D.length > 0;
        const hasMatrices = frame.matrices2D && frame.matrices2D.length > 0;
        const hasStrings = frame.strings && frame.strings.length > 0;
        const hasHeap = frame.objects && frame.objects.length > 0;
        const hasVars = frame.variables && Object.keys(frame.variables).length > 0;
        const hasCallStack = frame.callStack && (frame.callStack.length > 1 || this.studioMode === 'functions');
        const hasConsole = frame.consoleOutputs && frame.consoleOutputs.length > 0;

        // סינון לפי סוג סטודיו ולפי בורר סינון מהיר של כרטיסים
        const showArrays = hasArrays && 
            (this.memFilter === 'all' || this.memFilter === 'arrays') && 
            (this.studioMode === 'all' || this.studioMode === 'arrays' || this.studioMode === 'functions' || this.studioMode === 'classes' || this.studioMode === 'oop');

        const showMatrices = hasMatrices && 
            (this.memFilter === 'all' || this.memFilter === 'matrices') && 
            (this.studioMode === 'all' || this.studioMode === 'matrices');

        const showStrings = hasStrings && 
            (this.memFilter === 'all' || this.memFilter === 'strings') && 
            (this.studioMode === 'all' || this.studioMode === 'strings');

        const showHeap = hasHeap && 
            (this.memFilter === 'all' || this.memFilter === 'heap') && 
            (this.studioMode === 'all' || this.studioMode === 'classes' || this.studioMode === 'oop' || this.studioMode === 'arrays');

        // החלת תצוגה: מבנה שלא קיים מקבל 'none' ולכן אינו תופס שום מקום
        if (this.dom.cardArrays) this.dom.cardArrays.style.display = showArrays ? '' : 'none';
        if (this.dom.cardMatrices) this.dom.cardMatrices.style.display = showMatrices ? '' : 'none';
        if (this.dom.cardStrings) this.dom.cardStrings.style.display = showStrings ? '' : 'none';
        if (this.dom.cardHeap) this.dom.cardHeap.style.display = showHeap ? '' : 'none';

        // בדיקה האם יש כרטיס מבנה נתונים גלוי כלשהו - אם אין, מוצג כרטיס מצב ריק
        const anyCardVisible = showArrays || showMatrices || showStrings || showHeap;
        if (this.dom.cardEmptyState) {
            this.dom.cardEmptyState.style.display = anyCardVisible ? 'none' : '';
        }
    }

    hideAllCards() {
        if (this.dom.cardArrays) this.dom.cardArrays.style.display = 'none';
        if (this.dom.cardMatrices) this.dom.cardMatrices.style.display = 'none';
        if (this.dom.cardStrings) this.dom.cardStrings.style.display = 'none';
        if (this.dom.cardHeap) this.dom.cardHeap.style.display = 'none';
    }

    applyStudioModeFilter() {
        if (this.frames && this.frames[this.currentFrameIdx]) {
            this.updateCardsVisibility(this.frames[this.currentFrameIdx]);
        }
    }

    applyMemFilter() {
        if (this.frames && this.frames[this.currentFrameIdx]) {
            this.updateCardsVisibility(this.frames[this.currentFrameIdx]);
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
        const mainFile = this.getMainFileName();
        if (!this.editorFiles[mainFile]) return;
        const currentCode = this.editorFiles[mainFile].code;
        if (currentCode.includes('int[] arr =')) {
            this.editorFiles[mainFile].code = currentCode.replace(/int\[\]\s*arr\s*=\s*\{[^}]*\};/, snippet);
        } else {
            alert(`נוצר מערך חדש:\n${snippet}`);
        }
        if (this.activeFileName === mainFile) {
            this.dom.codeTextarea.value = this.editorFiles[mainFile].code;
        }
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
        const isJava = this.currentLang === 'java';
        const snippet = isJava
            ? `int[][] mat = {\n${rowStrings.join(',\n')}\n};`
            : `int[,] mat = {\n${rowStrings.join(',\n')}\n};`;

        const mainFile = this.getMainFileName();
        if (!this.editorFiles[mainFile]) return;
        const currentCode = this.editorFiles[mainFile].code;
        const matRegex = isJava ? /int\[\]\[\]\s*mat\s*=\s*\{[\s\S]*?\};/ : /int\[,\]\s*mat\s*=\s*\{[\s\S]*?\};/;
        if (matRegex.test(currentCode)) {
            this.editorFiles[mainFile].code = currentCode.replace(matRegex, snippet);
        } else {
            alert(`נוצרה מטריצה חדשה:\n${snippet}`);
        }
        if (this.activeFileName === mainFile) {
            this.dom.codeTextarea.value = this.editorFiles[mainFile].code;
        }
        this.recompile();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    flushPendingRecompile() {
        if (this.recompileTimer) {
            clearTimeout(this.recompileTimer);
            this.recompileTimer = null;
            this.recompile(false);
        }
    }

    play() {
        this.flushPendingRecompile();
        if (this.currentFrameIdx >= this.frames.length - 1) {
            this.currentFrameIdx = 0;
        }
        this.isPlaying = true;
        this.dom.btnPlay.innerHTML = '<span>⏸️</span><span>השהה</span>';
        this.dom.btnPlay.classList.remove('btn-ctrl-primary');
        this.dom.btnPlay.classList.add('btn-ctrl-secondary');

        this.playTimer = setInterval(() => {
            if (this.currentFrameIdx < this.frames.length - 1) {
                this.renderFrame(this.currentFrameIdx + 1, true);
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
        this.flushPendingRecompile();
        this.pause();
        if (this.currentFrameIdx < this.frames.length - 1) {
            this.renderFrame(this.currentFrameIdx + 1, true);
        }
    }

    stepPrev() {
        this.flushPendingRecompile();
        this.pause();
        if (this.currentFrameIdx > 0) {
            this.renderFrame(this.currentFrameIdx - 1, true);
        }
    }

    reset() {
        this.flushPendingRecompile();
        this.pause();
        this.renderFrame(0, true);
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
