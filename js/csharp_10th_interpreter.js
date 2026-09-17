/**
 * C# 10th Grade Fundamentals Interpreter & Execution Tracer
 * אלון שרייבמן — מורה פרטי
 * 
 * מפרש קוד C# ייעודי לשכבת י':
 * - מערכים חד-ממדיים (1D Arrays)
 * - מטריצות דו-ממדיות (2D Rectangular & Jagged Matrices)
 * - מחרוזות ותווים (Strings & Chars)
 * - פונקציות, קריאות ומחסנית קריאות (Call Stack & Functions)
 * - מחלקות ועצמים בסיסיים (Basic OOP & Heap)
 * - מחלקת Math ופעולות שלמים (% /)
 * - הפקת טבלת מעקב (Dry Run Table) בסטנדרט בגרות
 * - אבחון שגיאות פדגוגי מפורט בעברית
 */

class CSharp10thInterpreter {
    constructor() {
        this.maxSteps = 1500;
        this.inputQueue = [];
    }

    setInputQueue(inputs) {
        if (Array.isArray(inputs)) {
            this.inputQueue = [...inputs];
        } else if (typeof inputs === 'string') {
            this.inputQueue = inputs.split('\n').map(s => s.trim()).filter(s => s.length > 0);
        } else {
            this.inputQueue = [];
        }
    }

    run(sourceCode, initialInputs = [], customWatchExpressions = []) {
        this.setInputQueue(initialInputs);
        let runtime = null;
        try {
            const preprocessed = this.preprocess(sourceCode);
            const ast = this.parse(preprocessed.files);
            this.ast = ast;
            runtime = new Runtime10thEnvironment(ast, this.inputQueue, this.maxSteps, customWatchExpressions);
            const trace = runtime.execute();
            trace.ast = ast;
            return trace;
        } catch (err) {
            const errorLine = err.line || 1;
            const errorFile = err.file || (runtime ? runtime.currentFile : 'Program.cs') || 'Program.cs';
            const existingFrames = (runtime && runtime.frames && runtime.frames.length > 0) ? runtime.frames : [];
            const lastFrame = existingFrames.length > 0 ? existingFrames[existingFrames.length - 1] : null;

            const errorFrame = {
                step: existingFrames.length + 1,
                line: errorLine,
                file: errorFile,
                description: `❌ שגיאה: ${err.message}`,
                callStack: lastFrame ? lastFrame.callStack : [{ funcName: 'שגיאה', line: errorLine, file: errorFile, variables: {} }],
                variables: lastFrame ? { ...lastFrame.variables } : {},
                arrays1D: lastFrame ? JSON.parse(JSON.stringify(lastFrame.arrays1D || [])) : [],
                matrices2D: lastFrame ? JSON.parse(JSON.stringify(lastFrame.matrices2D || [])) : [],
                strings: lastFrame ? JSON.parse(JSON.stringify(lastFrame.strings || [])) : [],
                objects: lastFrame ? JSON.parse(JSON.stringify(lastFrame.objects || [])) : [],
                activePointers: lastFrame ? { ...lastFrame.activePointers } : {},
                consoleOutputs: lastFrame ? [...lastFrame.consoleOutputs] : [],
                traceTableRows: lastFrame ? [...(lastFrame.traceTableRows || [])] : [],
                error: err.message,
                isCompleted: true
            };
            existingFrames.push(errorFrame);

            return {
                frames: existingFrames,
                traceTable: runtime ? runtime.traceTable : [],
                error: err.message,
                errorFile: errorFile,
                errorLine: errorLine
            };
        }
    }

    preprocess(source) {
        const files = {};
        const cleanJavaMeta = (code) => {
            if (!code) return '';
            // ניקוי הצהרות package ו-import ב-Java תוך שימור מספרי השורות
            return code.replace(/^\s*(?:package|import)\s+[^;]+;/gm, (match) => ' '.repeat(match.length));
        };

        if (typeof source === 'string') {
            files['Program.cs'] = cleanJavaMeta(source);
        } else if (Array.isArray(source)) {
            for (const item of source) {
                if (item && item.name) {
                    files[item.name] = cleanJavaMeta(item.code || '');
                }
            }
        } else if (source && typeof source === 'object') {
            for (const [key, val] of Object.entries(source)) {
                files[key] = cleanJavaMeta((typeof val === 'string') ? val : (val.code || ''));
            }
        }
        return { files };
    }

    parse(files) {
        const classes = [];
        for (const [fileName, code] of Object.entries(files)) {
            const classMatches = this.extractClasses(code, fileName);
            classes.push(...classMatches);
        }
        return { classes, files };
    }

    extractClasses(code, fileName) {
        const result = [];
        // מציאת בלוקי מחלקות ב-C# (:) וב-Java (extends / implements)
        const classRegex = /(?:public\s+|private\s+|internal\s+)?class\s+([A-Za-z0-9_]+)(?:\s*(?::|extends|implements)\s*([A-Za-z0-9_]+))?(?:\s+implements\s+[A-Za-z0-9_,\s]+)?\s*\{/g;
        let match;
        while ((match = classRegex.exec(code)) !== null) {
            const className = match[1];
            const startIdx = match.index;
            const braceIdx = code.indexOf('{', startIdx);
            const endIdx = this.findMatchingBrace(code, braceIdx);
            if (endIdx === -1) continue;

            const classBody = code.slice(braceIdx + 1, endIdx);
            const lineNum = this.getLineNumber(code, startIdx);

            const parsedClass = {
                name: className,
                fileName: fileName,
                line: lineNum,
                fields: [],
                constructors: [],
                methods: []
            };

            this.parseClassMembers(classBody, parsedClass, fileName, code, braceIdx + 1);
            result.push(parsedClass);
        }
        return result;
    }

    findMatchingBrace(text, openIdx) {
        let depth = 1;
        for (let i = openIdx + 1; i < text.length; i++) {
            const c = text[i];
            // דילוג על הערות שורה //
            if (c === '/' && text[i + 1] === '/') {
                while (i < text.length && text[i] !== '\n') i++;
                continue;
            }
            // דילוג על הערות בלוק /* */
            if (c === '/' && text[i + 1] === '*') {
                i += 2;
                while (i < text.length && !(text[i - 1] === '*' && text[i] === '/')) i++;
                continue;
            }
            if (c === '{') depth++;
            else if (c === '}') {
                depth--;
                if (depth === 0) return i;
            } else if (c === '"') {
                i++;
                while (i < text.length && text[i] !== '"') {
                    if (text[i] === '\\') i++;
                    i++;
                }
            } else if (c === "'") {
                i++;
                while (i < text.length && text[i] !== "'") {
                    if (text[i] === '\\') i++;
                    i++;
                }
            }
        }
        return -1;
    }

    getLineNumber(fullText, charIndex) {
        return (fullText.slice(0, charIndex).match(/\n/g) || []).length + 1;
    }

    parseClassMembers(body, classObj, fileName, fullText, bodyOffset) {
        // פירוק שדות, בנאים ומתודות
        const lines = body.split('\n');
        let currentOffset = bodyOffset;

        // חילוץ מתודות ובנאים
        const methodRegex = /(?:public\s+|private\s+|protected\s+)?(?:(static)\s+)?(?:([A-Za-z0-9_<>\[\],]+)\s+)?([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
        let match;
        const processedRanges = [];

        while ((match = methodRegex.exec(body)) !== null) {
            const isStatic = !!match[1];
            const returnType = match[2] || 'void';
            const methodName = match[3];
            const rawParams = match[4].trim();
            const openBrace = body.indexOf('{', match.index);
            const closeBrace = this.findMatchingBrace(body, openBrace);
            if (closeBrace === -1) continue;

            const methodBody = body.slice(openBrace + 1, closeBrace);
            const lineNum = this.getLineNumber(fullText, bodyOffset + match.index);

            const params = [];
            if (rawParams.length > 0) {
                const pParts = rawParams.split(',');
                for (const p of pParts) {
                    const parts = p.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        params.push({ type: parts.slice(0, -1).join(' '), name: parts[parts.length - 1] });
                    }
                }
            }

            const methodItem = {
                name: methodName,
                returnType: returnType,
                isStatic: isStatic,
                params: params,
                body: methodBody,
                line: lineNum,
                fileName: fileName,
                className: classObj.name,
                bodyOffset: bodyOffset + openBrace + 1
            };

            if (methodName === classObj.name) {
                classObj.constructors.push(methodItem);
            } else {
                classObj.methods.push(methodItem);
            }

            processedRanges.push({ start: match.index, end: closeBrace });
        }

        // חילוץ שדות (מה שלא בתוך מתודות)
        const fieldRegex = /(?:public\s+|private\s+|protected\s+)?(?:(static)\s+)?([A-Za-z0-9_<>\[\],]+)\s+([A-Za-z0-9_]+)(?:\s*=\s*([^;]+))?;/g;
        while ((match = fieldRegex.exec(body)) !== null) {
            const isInsideMethod = processedRanges.some(r => match.index >= r.start && match.index <= r.end);
            if (isInsideMethod) continue;

            const isStatic = !!match[1];
            const type = match[2];
            const name = match[3];
            const initVal = match[4] ? match[4].trim() : null;
            const line = this.getLineNumber(fullText, bodyOffset + match.index);

            classObj.fields.push({
                name,
                type,
                isStatic,
                initVal,
                line
            });
        }
    }
}

/**
 * סביבת הריצה של מפרש כיתה י'
 */
class Runtime10thEnvironment {
    constructor(ast, inputQueue, maxSteps = 1500, customWatchExpressions = []) {
        this.ast = ast;
        this.inputQueue = [...inputQueue];
        this.maxSteps = maxSteps;
        this.stepCount = 0;
        this.frames = [];
        this.heap = new Map(); // id -> { type, fields }
        this.nextHeapId = 1;
        this.callStack = [];
        this.consoleOutputs = [];
        this.currentFile = 'Program.cs';
        this.traceTable = [];
        this.loopIterationCounters = {};
        this.customWatchExpressions = Array.isArray(customWatchExpressions) ? customWatchExpressions : [];
        this.trackedExpressions = this.extractTrackedExpressions();
    }

    extractTrackedExpressions() {
        const expressions = new Set();
        if (Array.isArray(this.customWatchExpressions)) {
            this.customWatchExpressions.forEach(expr => {
                if (expr && typeof expr === 'string' && expr.trim().length > 0) {
                    expressions.add(expr.trim());
                }
            });
        }

        const scanText = (code) => {
            if (!code) return;
            const cleanCode = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
            const regex = /\b([A-Za-z_][A-Za-z0-9_]*)\s*\[/g;
            let match;
            while ((match = regex.exec(cleanCode)) !== null) {
                const ident = match[1];
                if (/^(int|double|string|String|char|bool|boolean|void|float|long|var|new)$/i.test(ident)) {
                    continue;
                }
                const start = match.index;
                const openBracket = cleanCode.indexOf('[', start);
                let depth = 0;
                let endBracket = -1;
                for (let i = openBracket; i < cleanCode.length; i++) {
                    const ch = cleanCode[i];
                    if (ch === '[') depth++;
                    else if (ch === ']') {
                        depth--;
                        if (depth === 0) {
                            endBracket = i;
                            break;
                        }
                    } else if (ch === ';' || ch === '\n' || ch === '{' || ch === '}') {
                        break;
                    }
                }
                if (endBracket !== -1) {
                    let fullEnd = endBracket;
                    // בדיקה אם יש סוגריים מרובעים שניים צמודים (מערך דו-ממדי ב-Java: target[r][c])
                    if (endBracket + 1 < cleanCode.length && cleanCode[endBracket + 1] === '[') {
                        let depth2 = 0;
                        for (let j = endBracket + 1; j < cleanCode.length; j++) {
                            const ch2 = cleanCode[j];
                            if (ch2 === '[') depth2++;
                            else if (ch2 === ']') {
                                depth2--;
                                if (depth2 === 0) {
                                    fullEnd = j;
                                    break;
                                }
                            } else if (ch2 === ';' || ch2 === '\n' || ch2 === '{' || ch2 === '}') {
                                break;
                            }
                        }
                    }
                    const rawExpr = cleanCode.slice(start, fullEnd + 1).replace(/\s+/g, ' ').trim();
                    const inside = rawExpr.slice(rawExpr.indexOf('[') + 1, -1).trim();
                    // אם הביטוי הוא אינדקס קבוע בלבד (לדוגמה arr[4] או arr[0]), נדלג עליו כדי לא להעמיס על טבלת המעקב
                    const isConstantIndex = /^\[\s*\d+\s*(?:,\s*\d+\s*|\]\s*\[\s*\d+\s*)?\]$/.test(rawExpr.slice(rawExpr.indexOf('[')));
                    if (inside.length > 0 && inside !== ',' && !isConstantIndex) {
                        expressions.add(rawExpr);
                        scanText(inside);
                    }
                }
            }

            // זיהוי קריאות charAt במחרוזות ב-Java: str.charAt(...)
            const charAtRegex = /\b([A-Za-z_][A-Za-z0-9_]*)\.charAt\s*\(/g;
            let charAtMatch;
            while ((charAtMatch = charAtRegex.exec(cleanCode)) !== null) {
                const openP = cleanCode.indexOf('(', charAtMatch.index);
                const closeP = this.findMatchingParen(cleanCode, openP);
                if (closeP !== -1) {
                    const rawCharAt = cleanCode.slice(charAtMatch.index, closeP + 1).trim();
                    // סינון אינדקס קבוע (כמו str.charAt(0)) - מנטר רק אינדקסים דינמיים
                    const innerArg = cleanCode.slice(openP + 1, closeP).trim();
                    if (!/^\d+$/.test(innerArg)) {
                        expressions.add(rawCharAt);
                    }
                }
            }
        };

        if (this.ast && this.ast.classes) {
            for (const cls of this.ast.classes) {
                if (cls.methods) {
                    for (const m of cls.methods) {
                        scanText(m.body);
                    }
                }
                if (cls.constructors) {
                    for (const c of cls.constructors) {
                        scanText(c.body);
                    }
                }
            }
        }
        return Array.from(expressions);
    }

    execute() {
        // מציאת נקודת הכניסה: מחלקת Program עם Main
        let mainMethod = null;
        let mainClass = null;

        for (const cls of this.ast.classes) {
            for (const m of cls.methods) {
                if (m.name.toLowerCase() === 'main') {
                    mainMethod = m;
                    mainClass = cls;
                    break;
                }
            }
            if (mainMethod) break;
        }

        if (!mainMethod) {
            const firstFile = (this.ast && this.ast.files && Object.keys(this.ast.files)[0]) || 'Program.cs';
            throw { message: 'לא נמצאה מתודת Main / main בתוכנית. ודא שקיימת מחלקה ראשית (Program או Main) ובתוכה public static void Main() או public static void main(String[] args)', line: 1, file: firstFile };
        }

        this.currentFile = mainMethod.fileName;
        this.invokeMethod(mainClass, mainMethod, null, []);

        if (this.frames.length > 0) {
            this.frames[this.frames.length - 1].isCompleted = true;
        }

        return {
            frames: this.frames,
            traceTable: this.traceTable,
            consoleOutputs: this.consoleOutputs,
            error: null
        };
    }

    invokeMethod(targetClass, method, thisRef, argValues) {
        const frameVars = {};
        if (thisRef) {
            frameVars['this'] = thisRef;
        }

        // השמת ארגומנטים לפרמטרים
        if (method.params) {
            for (let i = 0; i < method.params.length; i++) {
                const p = method.params[i];
                frameVars[p.name] = (i < argValues.length) ? argValues[i] : null;
            }
        }

        const callStackEntry = {
            funcName: `${targetClass ? targetClass.name + '.' : ''}${method.name}`,
            line: method.line,
            file: method.fileName,
            variables: frameVars
        };

        this.callStack.push(callStackEntry);
        this.currentFile = method.fileName;

        this.recordFrame(method.line, `קריאה למתודה: ${callStackEntry.funcName}`);

        const result = this.executeBlock(method.body, method.bodyOffset, method.fileName, frameVars);
        this.callStack.pop();
        return result ? result.value : undefined;
    }

    executeBlock(code, bodyOffset, fileName, scopeVars) {
        // פירוק שורות ופקודות
        const statements = this.extractStatements(code, bodyOffset, fileName);
        for (const stmt of statements) {
            this.checkLimit();
            const res = this.executeStatement(stmt, scopeVars);
            if (res && (res.type === 'return' || res.type === 'break' || res.type === 'continue')) {
                return res;
            }
        }
        return null;
    }

    extractStatements(code, bodyOffset, fileName) {
        const list = [];
        let i = 0;
        const len = code.length;
        const fullText = (this.ast && this.ast.files && this.ast.files[fileName]) ? this.ast.files[fileName] : code;
        const baseOffset = (typeof bodyOffset === 'number' && bodyOffset >= 0) ? bodyOffset : 0;

        while (i < len) {
            // דילוג על רווחים
            while (i < len && /\s/.test(code[i])) {
                i++;
            }
            if (i >= len) break;

            const charIndex = baseOffset + i;
            const currentLine = (fullText.slice(0, charIndex).match(/\n/g) || []).length + 1;

            // דילוג על הערות //
            if (code[i] === '/' && code[i + 1] === '/') {
                while (i < len && code[i] !== '\n') i++;
                continue;
            }
            // דילוג על הערות /* */
            if (code[i] === '/' && code[i + 1] === '*') {
                i += 2;
                while (i < len && !(code[i - 1] === '*' && code[i] === '/')) {
                    i++;
                }
                i++;
                continue;
            }

            // זיהוי מבני בקרה: for, while, if, do
            const remaining = code.slice(i);
            const forMatch = remaining.match(/^for\s*\(/);
            const whileMatch = remaining.match(/^while\s*\(/);
            const ifMatch = remaining.match(/^if\s*\(/);

            if (forMatch) {
                const headerEnd = this.findMatchingParen(code, i + forMatch[0].length - 1);
                const header = code.slice(i + forMatch[0].length, headerEnd);
                let bodyStart = headerEnd + 1;
                while (bodyStart < len && /\s/.test(code[bodyStart])) {
                    bodyStart++;
                }

                if (code[bodyStart] === '{') {
                    const bodyEnd = this.findMatchingBrace(code, bodyStart);
                    const body = code.slice(bodyStart + 1, bodyEnd);
                    list.push({
                        type: 'for',
                        header,
                        body,
                        bodyOffset: baseOffset + bodyStart + 1,
                        line: currentLine,
                        fileName
                    });
                    i = bodyEnd + 1;
                } else {
                    // שורה יחידה ללא סוגריים מסולסלים
                    let singleEnd = code.indexOf(';', bodyStart);
                    if (singleEnd === -1) singleEnd = len;
                    list.push({
                        type: 'for',
                        header,
                        body: code.slice(bodyStart, singleEnd + 1),
                        bodyOffset: baseOffset + bodyStart,
                        line: currentLine,
                        fileName
                    });
                    i = singleEnd + 1;
                }
                continue;
            }

            if (whileMatch) {
                const headerEnd = this.findMatchingParen(code, i + whileMatch[0].length - 1);
                const condition = code.slice(i + whileMatch[0].length, headerEnd);
                let bodyStart = headerEnd + 1;
                while (bodyStart < len && /\s/.test(code[bodyStart])) {
                    bodyStart++;
                }

                if (code[bodyStart] === '{') {
                    const bodyEnd = this.findMatchingBrace(code, bodyStart);
                    const body = code.slice(bodyStart + 1, bodyEnd);
                    list.push({
                        type: 'while',
                        condition,
                        body,
                        bodyOffset: baseOffset + bodyStart + 1,
                        line: currentLine,
                        fileName
                    });
                    i = bodyEnd + 1;
                } else {
                    let singleEnd = code.indexOf(';', bodyStart);
                    if (singleEnd === -1) singleEnd = len;
                    list.push({
                        type: 'while',
                        condition,
                        body: code.slice(bodyStart, singleEnd + 1),
                        bodyOffset: baseOffset + bodyStart,
                        line: currentLine,
                        fileName
                    });
                    i = singleEnd + 1;
                }
                continue;
            }

            if (ifMatch) {
                const headerEnd = this.findMatchingParen(code, i + ifMatch[0].length - 1);
                const condition = code.slice(i + ifMatch[0].length, headerEnd);
                let bodyStart = headerEnd + 1;
                while (bodyStart < len && /\s/.test(code[bodyStart])) {
                    bodyStart++;
                }

                let ifBody = '';
                let ifBodyOffset = baseOffset + bodyStart;
                let nextIdx = bodyStart;
                if (code[bodyStart] === '{') {
                    const bodyEnd = this.findMatchingBrace(code, bodyStart);
                    ifBody = code.slice(bodyStart + 1, bodyEnd);
                    ifBodyOffset = baseOffset + bodyStart + 1;
                    nextIdx = bodyEnd + 1;
                } else {
                    let singleEnd = code.indexOf(';', bodyStart);
                    if (singleEnd === -1) singleEnd = len;
                    ifBody = code.slice(bodyStart, singleEnd + 1);
                    ifBodyOffset = baseOffset + bodyStart;
                    nextIdx = singleEnd + 1;
                }

                // בדיקה אם יש else
                let elseBody = null;
                let elseBodyOffset = null;
                let postIf = code.slice(nextIdx);
                const elseMatch = postIf.match(/^\s*else(?:\s*\{|\s+if\s*\(|\s+)/);
                if (elseMatch) {
                    const elseKeywordIdx = nextIdx + postIf.indexOf('else');
                    let elseStart = elseKeywordIdx + 4;
                    while (elseStart < len && /\s/.test(code[elseStart])) {
                        elseStart++;
                    }
                    if (code[elseStart] === '{') {
                        const elseEnd = this.findMatchingBrace(code, elseStart);
                        elseBody = code.slice(elseStart + 1, elseEnd);
                        elseBodyOffset = baseOffset + elseStart + 1;
                        nextIdx = elseEnd + 1;
                    } else {
                        // else if או שורה יחידה
                        let singleEnd = code.indexOf(';', elseStart);
                        if (code.slice(elseStart).trim().startsWith('if')) {
                            const subStatements = this.extractStatements(code.slice(elseStart), baseOffset + elseStart, fileName);
                            if (subStatements.length > 0) {
                                elseBody = subStatements[0];
                                elseBodyOffset = baseOffset + elseStart;
                                nextIdx = len;
                            }
                        } else {
                            if (singleEnd === -1) singleEnd = len;
                            elseBody = code.slice(elseStart, singleEnd + 1);
                            elseBodyOffset = baseOffset + elseStart;
                            nextIdx = singleEnd + 1;
                        }
                    }
                }

                list.push({
                    type: 'if',
                    condition,
                    body: ifBody,
                    bodyOffset: ifBodyOffset,
                    elseBody,
                    elseBodyOffset: elseBodyOffset,
                    line: currentLine,
                    fileName
                });
                i = nextIdx;
                continue;
            }

            // פקודה רגילה המסתיימת ב-;
            let semiIdx = code.indexOf(';', i);
            if (semiIdx === -1) semiIdx = len;
            const stmtText = code.slice(i, semiIdx).trim();
            if (stmtText.length > 0) {
                list.push({
                    type: 'statement',
                    text: stmtText,
                    line: currentLine,
                    fileName
                });
            }
            i = semiIdx + 1;
        }

        return list;
    }

    findMatchingParen(text, openIdx) {
        let depth = 1;
        for (let i = openIdx + 1; i < text.length; i++) {
            if (text[i] === '(') depth++;
            else if (text[i] === ')') {
                depth--;
                if (depth === 0) return i;
            }
        }
        return text.length;
    }

    findMatchingBrace(text, openIdx) {
        let depth = 1;
        for (let i = openIdx + 1; i < text.length; i++) {
            if (text[i] === '{') depth++;
            else if (text[i] === '}') {
                depth--;
                if (depth === 0) return i;
            }
        }
        return text.length;
    }

    executeStatement(stmt, scopeVars) {
        this.currentFile = stmt.fileName;
        const line = stmt.line;

        if (stmt.type === 'for') {
            return this.executeForLoop(stmt, scopeVars);
        } else if (stmt.type === 'while') {
            return this.executeWhileLoop(stmt, scopeVars);
        } else if (stmt.type === 'if') {
            return this.executeIf(stmt, scopeVars);
        }

        const raw = stmt.text;

        // return [expr];
        if (raw.startsWith('return')) {
            const expr = raw.slice(6).trim();
            const val = expr ? this.evalExpr(expr, scopeVars, line) : undefined;
            this.recordFrame(line, `החזרת ערך: ${val !== undefined ? val : 'void'}`);
            return { type: 'return', value: val };
        }

        // break;
        if (raw === 'break') {
            this.recordFrame(line, 'יציאה מהלולאה (break)');
            return { type: 'break' };
        }

        // continue;
        if (raw === 'continue') {
            this.recordFrame(line, 'מעבר לאיטרציה הבאה (continue)');
            return { type: 'continue' };
        }

        // Console.WriteLine / Console.Write / System.out.println / System.out.print
        if (raw.startsWith('Console.WriteLine') || raw.startsWith('Console.Write') ||
            raw.startsWith('System.out.println') || raw.startsWith('System.out.print')) {
            return this.executeConsolePrint(raw, scopeVars, line);
        }

        // הצהרת משתנה: type varName = expr; או varName++; או arr[i] = expr;
        return this.executeAssignmentOrDecl(raw, scopeVars, line);
    }

    executeForLoop(stmt, scopeVars) {
        const parts = stmt.header.split(';');
        if (parts.length < 3) {
            throw { message: `תחביר שגוי בלולאת for: ${stmt.header}`, line: stmt.line, file: stmt.fileName };
        }

        const initCode = parts[0].trim();
        const condCode = parts[1].trim();
        const updateCode = parts[2].trim();

        // אתחול לולאת for
        if (initCode.length > 0) {
            this.executeAssignmentOrDecl(initCode, scopeVars, stmt.line);
        }

        const loopId = `for_${stmt.line}`;
        this.loopIterationCounters[loopId] = 0;

        while (true) {
            this.checkLimit();
            let condVal = true;
            if (condCode.length > 0) {
                condVal = !!this.evalExpr(condCode, scopeVars, stmt.line);
                this.recordFrame(stmt.line, `בדיקת תנאי לולאת for: ${condCode} ➔ ${condVal ? 'אמת (ממשיך)' : 'שקר (יציאה)'}`, {
                    condition: `${condCode} ➔ ${condVal}`,
                    iteration: this.loopIterationCounters[loopId]
                });
            }

            if (!condVal) break;

            this.loopIterationCounters[loopId]++;

            // ביצוע גוף הלולאה
            const res = this.executeBlock(stmt.body, stmt.bodyOffset, stmt.fileName, scopeVars);
            if (res) {
                if (res.type === 'break') break;
                if (res.type === 'return') return res;
            }

            // צעד קידום הלולאה
            if (updateCode.length > 0) {
                const subUpdates = updateCode.split(',');
                for (const subUp of subUpdates) {
                    if (subUp.trim().length > 0) {
                        this.executeAssignmentOrDecl(subUp.trim(), scopeVars, stmt.line);
                    }
                }
            }
        }
        return null;
    }

    executeWhileLoop(stmt, scopeVars) {
        const condCode = stmt.condition.trim();
        const loopId = `while_${stmt.line}`;
        this.loopIterationCounters[loopId] = 0;

        while (true) {
            this.checkLimit();
            const condVal = !!this.evalExpr(condCode, scopeVars, stmt.line);
            this.recordFrame(stmt.line, `בדיקת תנאי while: ${condCode} ➔ ${condVal ? 'אמת (ממשיך)' : 'שקר (יציאה)'}`, {
                condition: `${condCode} ➔ ${condVal}`,
                iteration: this.loopIterationCounters[loopId]
            });

            if (!condVal) break;

            this.loopIterationCounters[loopId]++;
            const res = this.executeBlock(stmt.body, stmt.bodyOffset, stmt.fileName, scopeVars);
            if (res) {
                if (res.type === 'break') break;
                if (res.type === 'return') return res;
            }
        }
        return null;
    }

    executeIf(stmt, scopeVars) {
        const condCode = stmt.condition.trim();
        const condVal = !!this.evalExpr(condCode, scopeVars, stmt.line);

        this.recordFrame(stmt.line, `בדיקת תנאי if: ${condCode} ➔ ${condVal ? 'אמת (נכנס)' : 'שקר'}`, {
            condition: `${condCode} ➔ ${condVal}`
        });

        if (condVal) {
            return this.executeBlock(stmt.body, stmt.bodyOffset, stmt.fileName, scopeVars);
        } else if (stmt.elseBody) {
            if (typeof stmt.elseBody === 'string') {
                return this.executeBlock(stmt.elseBody, stmt.elseBodyOffset, stmt.fileName, scopeVars);
            } else if (stmt.elseBody.type) {
                return this.executeStatement(stmt.elseBody, scopeVars);
            }
        }
        return null;
    }

    executeConsolePrint(raw, scopeVars, line) {
        const isLine = raw.startsWith('Console.WriteLine') || raw.startsWith('System.out.println');
        const openP = raw.indexOf('(');
        const closeP = raw.lastIndexOf(')');
        let text = '';
        if (openP !== -1 && closeP !== -1 && closeP > openP) {
            const expr = raw.slice(openP + 1, closeP).trim();
            if (expr.length > 0) {
                const val = this.evalExpr(expr, scopeVars, line);
                text = (val !== null && val !== undefined) ? String(val) : '';
            }
        }

        if (isLine) {
            this.consoleOutputs.push(text);
        } else {
            if (this.consoleOutputs.length === 0) {
                this.consoleOutputs.push(text);
            } else {
                this.consoleOutputs[this.consoleOutputs.length - 1] += text;
            }
        }

        this.recordFrame(line, `הדפסה לקונסול: "${text}"`, { output: text });
    }

    executeAssignmentOrDecl(raw, scopeVars, line) {
        raw = raw.trim().replace(/;+$/, '').trim();
        if (raw.length === 0) return;

        // קידום והפחתה: target++, target--, ++target, --target
        let incDecMatch = null;
        if (raw.endsWith('++')) incDecMatch = { target: raw.slice(0, -2).trim(), delta: 1 };
        else if (raw.endsWith('--')) incDecMatch = { target: raw.slice(0, -2).trim(), delta: -1 };
        else if (raw.startsWith('++')) incDecMatch = { target: raw.slice(2).trim(), delta: 1 };
        else if (raw.startsWith('--')) incDecMatch = { target: raw.slice(2).trim(), delta: -1 };

        if (incDecMatch && incDecMatch.target.length > 0) {
            const target = incDecMatch.target;
            const currentVal = this.evalTargetValue(target, scopeVars, line);
            const num = (typeof currentVal === 'number') ? currentVal : (parseFloat(currentVal) || 0);
            const newVal = num + incDecMatch.delta;
            this.assignTargetValue(target, newVal, scopeVars, line);
            this.recordFrame(line, `קידום/הפחתה: ${target} = ${newVal}`);
            return;
        }

        // השמה מורכבת (+=, -=, *=, /=, %=) או רגילה (=)
        const assignMatch = this.splitTopLevelAssignment(raw);
        if (assignMatch) {
            const target = assignMatch.target;
            const op = assignMatch.op;
            const expr = assignMatch.expr;

            if (op !== '=') {
                const rhsVal = this.evalExpr(expr, scopeVars, line);
                const currentVal = this.evalTargetValue(target, scopeVars, line);

                const numCurrent = (typeof currentVal === 'number') ? currentVal : (parseFloat(currentVal) || 0);
                const numRhs = (typeof rhsVal === 'number') ? rhsVal : (parseFloat(rhsVal) || 0);

                let newVal;
                if (op === '+=') {
                    if (typeof currentVal === 'string' || typeof rhsVal === 'string') {
                        newVal = String(currentVal ?? '') + String(rhsVal ?? '');
                    } else {
                        newVal = numCurrent + numRhs;
                    }
                }
                else if (op === '-=') newVal = numCurrent - numRhs;
                else if (op === '*=') newVal = numCurrent * numRhs;
                else if (op === '/=') {
                    if (numRhs === 0) throw { message: 'חלוקה באפס (DivideByZeroException): לא ניתן לחלק ב-0.', line, file: this.currentFile };
                    if (Number.isInteger(numCurrent) && Number.isInteger(numRhs)) {
                        newVal = Math.trunc(numCurrent / numRhs);
                    } else {
                        newVal = numCurrent / numRhs;
                    }
                } else if (op === '%=') {
                    if (numRhs === 0) throw { message: 'חלוקה באפס (DivideByZeroException): שארית מודולו באפס אינה מוגדרת.', line, file: this.currentFile };
                    newVal = numCurrent % numRhs;
                }

                this.assignTargetValue(target, newVal, scopeVars, line);
                this.recordFrame(line, `השמה מורכבת: ${target} ${op} ${rhsVal} ➔ ${newVal}`);
                return;
            } else {
                const rhsVal = this.evalExpr(expr, scopeVars, line);

                // בדיקה אם target מכיל טיפוס (הצהרת משתנה חדש: type varName = expr)
                const parts = target.split(/\s+/);
                const isIndexAccess = target.endsWith(']');
                const isMemberAccess = target.includes('.');
                if (!isIndexAccess && !isMemberAccess && parts.length >= 2) {
                    const type = parts.slice(0, -1).join(' ');
                    const varName = parts[parts.length - 1];
                    if (/^[A-Za-z0-9_]+$/.test(varName)) {
                        if (Array.isArray(rhsVal)) {
                            if (type.endsWith('[][]')) rhsVal._elemType = type.slice(0, -4).trim();
                            else if (type.endsWith('[]')) rhsVal._elemType = type.slice(0, -2).trim();
                        }
                        scopeVars[varName] = rhsVal;
                        this.recordFrame(line, `הצהרה והשמה: ${type} ${varName} = ${this.formatVal(rhsVal)}`);
                        return;
                    }
                }

                // השמה למשתנה, תא במערך, מטריצה או שדה קיים
                this.assignTargetValue(target, rhsVal, scopeVars, line);
                this.recordFrame(line, `השמה: ${target} = ${this.formatVal(rhsVal)}`);
                return;
            }
        }

        // הצהרת משתנה ללא אתחול: int x; או int[] arr; או int[][] mat;
        const declParts = raw.split(/\s+/);
        if (declParts.length >= 2) {
            const type = declParts.slice(0, -1).join(' ');
            const varName = declParts[declParts.length - 1];
            let defaultVal = 0;
            if (type === 'string' || type === 'String') defaultVal = '';
            else if (type === 'bool' || type === 'boolean') defaultVal = false;
            else if (type.includes('[') || type.includes('class')) defaultVal = null;
            scopeVars[varName] = defaultVal;
            this.recordFrame(line, `הצהרת משתנה: ${type} ${varName}`);
            return;
        }

        // ביטוי כפקודה (למשל קריאה למתודה ללא השמה)
        this.evalExpr(raw, scopeVars, line);
    }

    evalTargetValue(target, scopeVars, line) {
        // גישה לאינדקס (מטריצה 2D או מערך 1D)
        const indexed = this.parseIndexedAccess(target);
        if (indexed) {
            if (indexed.type === '2D') {
                const matName = indexed.target;
                const r = this.evalExpr(indexed.rowExpr, scopeVars, line);
                const c = this.evalExpr(indexed.colExpr, scopeVars, line);
                const matObj = this.resolveVariable(matName, scopeVars);
                if (matObj && matObj.grid) {
                    if (r < 0 || r >= matObj.rows || c < 0 || c >= matObj.cols) {
                        throw { message: `חריגה מגבולות המטריצה [${r}, ${c}] במטריצה בגודל ${matObj.rows}x${matObj.cols}`, line, file: this.currentFile };
                    }
                    return matObj.grid[r][c];
                }
                if (Array.isArray(matObj)) {
                    if (r < 0 || r >= matObj.length) {
                        throw { message: `חריגה מגבולות המטריצה: שורה [${r}] במטריצה בעלת ${matObj.length} שורות`, line, file: this.currentFile };
                    }
                    const rowArr = matObj[r];
                    if (!Array.isArray(rowArr) || c < 0 || c >= rowArr.length) {
                        throw { message: `חריגה מגבולות המטריצה: עמודה [${c}]`, line, file: this.currentFile };
                    }
                    return rowArr[c];
                }
                throw { message: `ניסיון לגשת למטריצה שאינה קיימת או שערכה null: ${matName}`, line, file: this.currentFile };
            } else if (indexed.type === '1D') {
                const arrName = indexed.target;
                const idx = this.evalExpr(indexed.indexExpr, scopeVars, line);
                const arr = this.resolveVariable(arrName, scopeVars);
                if (!Array.isArray(arr)) throw { message: `ניסיון לגשת למערך שאינו קיים או שערכו null: ${arrName}`, line, file: this.currentFile };
                if (idx < 0 || idx >= arr.length) {
                    throw { message: `חריגה מגבולות המערך: אינדקס [${idx}] במערך בגודל ${arr.length} (האינדקסים החוקיים: 0 עד ${arr.length - 1})`, line, file: this.currentFile };
                }
                return arr[idx];
            }
        }

        // גישה לשדה באובייקט obj.field או target[i].field
        const dotMatch = this.splitTopLevelDot(target);
        if (dotMatch) {
            const objRef = this.evalExpr(dotMatch.target, scopeVars, line);
            const field = dotMatch.member;
            if (!objRef || typeof objRef !== 'object' || !objRef._heapId) {
                throw { message: `ניסיון לגשת לשדה ${field} של עצם שאינו קיים (NullReferenceException)`, line, file: this.currentFile };
            }
            return objRef.fields[field];
        }

        return this.resolveVariable(target, scopeVars);
    }

    assignTargetValue(target, val, scopeVars, line) {
        // גישה לאינדקס (מטריצה 2D או מערך 1D)
        const indexed = this.parseIndexedAccess(target);
        if (indexed) {
            if (indexed.type === '2D') {
                const matName = indexed.target;
                const r = this.evalExpr(indexed.rowExpr, scopeVars, line);
                const c = this.evalExpr(indexed.colExpr, scopeVars, line);
                const matObj = this.resolveVariable(matName, scopeVars);
                if (matObj && matObj.grid) {
                    if (r < 0 || r >= matObj.rows || c < 0 || c >= matObj.cols) {
                        throw { message: `שגיאת חריגה מגבולות המטריצה [${r}, ${c}] במטריצה בגודל ${matObj.rows}x${matObj.cols}`, line, file: this.currentFile };
                    }
                    matObj.grid[r][c] = val;
                    matObj.activeCell = { r, c };
                    return;
                }
                if (Array.isArray(matObj)) {
                    if (r < 0 || r >= matObj.length) {
                        throw { message: `שגיאת חריגה מגבולות המטריצה: שורה [${r}] במטריצה בעלת ${matObj.length} שורות`, line, file: this.currentFile };
                    }
                    const rowArr = matObj[r];
                    if (!Array.isArray(rowArr) || c < 0 || c >= rowArr.length) {
                        throw { message: `שגיאת חריגה מגבולות המטריצה: [${r}][${c}]`, line, file: this.currentFile };
                    }
                    rowArr[c] = val;
                    matObj._activeCell = { r, c };
                    return;
                }
                throw { message: `ניסיון לגשת למטריצה שלא אותחלה: ${matName}`, line, file: this.currentFile };
            } else if (indexed.type === '1D') {
                const arrName = indexed.target;
                const idx = this.evalExpr(indexed.indexExpr, scopeVars, line);
                const arr = this.resolveVariable(arrName, scopeVars);
                if (!Array.isArray(arr)) throw { message: `ניסיון לגשת למערך שלא אותחל: ${arrName}`, line, file: this.currentFile };
                if (idx < 0 || idx >= arr.length) {
                    throw { message: `שגיאת חריגה מגבולות המערך: אינדקס ${idx} אינו חוקי עבור מערך בגודל ${arr.length} (האינדקסים החוקיים: 0 עד ${arr.length - 1})`, line, file: this.currentFile };
                }
                arr[idx] = val;
                return;
            }
        }

        // שדה באובייקט obj.field = val או target[i].field = val
        const dotMatch = this.splitTopLevelDot(target);
        if (dotMatch) {
            const objRef = this.evalExpr(dotMatch.target, scopeVars, line);
            const field = dotMatch.member;
            if (!objRef || typeof objRef !== 'object' || !objRef._heapId) {
                throw { message: `שגיאת גישה לעצם ריק (NullReferenceException) בשדה ${field}`, line, file: this.currentFile };
            }
            objRef.fields[field] = val;
            return;
        }

        // משתנה מקומי
        scopeVars[target] = val;
    }

    resolveVariable(name, scopeVars) {
        if (scopeVars[name] !== undefined) return scopeVars[name];
        // בדיקה במחסנית קריאות
        for (let i = this.callStack.length - 1; i >= 0; i--) {
            if (this.callStack[i].variables && this.callStack[i].variables[name] !== undefined) {
                return this.callStack[i].variables[name];
            }
        }
        return undefined;
    }

    evalExpr(expr, scopeVars, line) {
        expr = expr.trim();
        if (expr.length === 0) return 0;

        // הסרת סוגריים עוטפים: (expr)
        if (expr.startsWith('(') && expr.endsWith(')')) {
            let depth = 0;
            let canUnwrap = true;
            for (let i = 0; i < expr.length - 1; i++) {
                if (expr[i] === '(') depth++;
                else if (expr[i] === ')') {
                    depth--;
                    if (depth === 0) { canUnwrap = false; break; }
                }
            }
            if (canUnwrap) {
                return this.evalExpr(expr.slice(1, -1).trim(), scopeVars, line);
            }
        }

        // קידום והפחתה בתוך ביטוי: target++, target--, ++target, --target
        let exprIncDec = null;
        if (expr.endsWith('++') && !expr.includes(';') && !expr.startsWith('++')) exprIncDec = { target: expr.slice(0, -2).trim(), delta: 1, isPost: true };
        else if (expr.endsWith('--') && !expr.includes(';') && !expr.startsWith('--')) exprIncDec = { target: expr.slice(0, -2).trim(), delta: -1, isPost: true };
        else if (expr.startsWith('++') && !expr.includes(';')) exprIncDec = { target: expr.slice(2).trim(), delta: 1, isPost: false };
        else if (expr.startsWith('--') && !expr.includes(';')) exprIncDec = { target: expr.slice(2).trim(), delta: -1, isPost: false };

        if (exprIncDec && /^[A-Za-z0-9_\[\], \.]+$/.test(exprIncDec.target)) {
            const currentVal = this.evalTargetValue(exprIncDec.target, scopeVars, line);
            const oldVal = (typeof currentVal === 'number') ? currentVal : (parseFloat(currentVal) || 0);
            const newVal = oldVal + exprIncDec.delta;
            this.assignTargetValue(exprIncDec.target, newVal, scopeVars, line);
            return exprIncDec.isPost ? oldVal : newVal;
        }

        // טיפול במחרוזות מפורשות "..."
        if (expr.startsWith('"') && expr.endsWith('"') && expr.length >= 2) {
            let isSingle = true;
            for (let i = 1; i < expr.length - 1; i++) {
                if (expr[i] === '\\') { i++; continue; }
                if (expr[i] === '"') {
                    isSingle = false;
                    break;
                }
            }
            if (isSingle) {
                return expr.slice(1, -1);
            }
        }

        // טיפול בתו בודד '...'
        if (expr.startsWith("'") && expr.endsWith("'") && expr.length === 3) {
            return expr[1];
        }

        // בוליאני
        if (expr === 'true') return true;
        if (expr === 'false') return false;
        if (expr === 'null') return null;

        // מספר טהור
        if (/^-?\d+$/.test(expr)) return parseInt(expr, 10);
        if (/^-?\d+\.\d+$/.test(expr)) return parseFloat(expr);

        // Console.ReadLine()
        if (expr.startsWith('Console.ReadLine')) {
            const val = this.inputQueue.length > 0 ? this.inputQueue.shift() : '0';
            this.recordFrame(line, `קליטת קלט מהמשתמש (Console.ReadLine): "${val}"`);
            return val;
        }

        // int.Parse / Integer.parseInt / double.Parse / Double.parseDouble
        if (expr.startsWith('int.Parse(') || expr.startsWith('Convert.ToInt32(') || expr.startsWith('Integer.parseInt(')) {
            const inner = expr.slice(expr.indexOf('(') + 1, expr.lastIndexOf(')')).trim();
            const val = this.evalExpr(inner, scopeVars, line);
            const res = parseInt(val, 10);
            return isNaN(res) ? 0 : res;
        }
        if (expr.startsWith('double.Parse(') || expr.startsWith('Convert.ToDouble(') || expr.startsWith('Double.parseDouble(')) {
            const inner = expr.slice(expr.indexOf('(') + 1, expr.lastIndexOf(')')).trim();
            const val = this.evalExpr(inner, scopeVars, line);
            const res = parseFloat(val);
            return isNaN(res) ? 0.0 : res;
        }

        // new int[size] או new int[rows, cols] או new int[rows][cols]
        if (expr.startsWith('new ') && expr.endsWith(']')) {
            const newTarget = expr.slice(4).trim();
            const newIndexed = this.parseIndexedAccess(newTarget);
            if (newIndexed) {
                if (newIndexed.type === '1D') {
                    const type = newIndexed.target;
                    const size = this.evalExpr(newIndexed.indexExpr, scopeVars, line);
                    if (size < 0) throw { message: `לא ניתן ליצור מערך בגודל שלילי: ${size}`, line, file: this.currentFile };
                    let defaultVal = 0;
                    if (type === 'string' || type === 'String') defaultVal = '';
                    else if (type === 'bool' || type === 'boolean') defaultVal = false;
                    else if (type === 'char') defaultVal = '\0';
                    else if (type !== 'int' && type !== 'double') defaultVal = null;
                    const arr = new Array(size).fill(defaultVal);
                    arr._elemType = type;
                    return arr;
                } else if (newIndexed.type === '2D') {
                    const type = newIndexed.target;
                    const rows = this.evalExpr(newIndexed.rowExpr, scopeVars, line);
                    const cols = this.evalExpr(newIndexed.colExpr, scopeVars, line);
                    if (rows <= 0 || cols <= 0) throw { message: `ממדי מטריצה חייבים להיות חיוביים (${rows}x${cols})`, line, file: this.currentFile };

                    const grid = [];
                    for (let r = 0; r < rows; r++) {
                        grid.push(new Array(cols).fill(0));
                    }
                    grid._isMatrix = true;
                    grid.type = `${type}[,]`;
                    grid.rows = rows;
                    grid.cols = cols;
                    grid.grid = grid;
                    grid.activeCell = null;
                    return grid;
                }
            }
        }

        // אתחול מערך עם new Type[] { ... } או new Type[n] { ... }
        if (expr.startsWith('new ') && expr.endsWith('}') && expr.includes('{')) {
            const braceIdx = expr.indexOf('{');
            const typePart = expr.slice(4, braceIdx).trim();
            const literal = expr.slice(braceIdx).trim();
            const arr = this.evalExpr(literal, scopeVars, line);
            if (Array.isArray(arr) && typePart.endsWith('[]')) {
                arr._elemType = typePart.slice(0, -2).trim();
            }
            return arr;
        }

        // אתחול מערך 1D עם ערכים: { 1, 2, 3 } או {}
        if (expr.startsWith('{') && expr.endsWith('}') && !expr.includes(';')) {
            const inner = expr.slice(1, -1).trim();
            if (inner.length === 0) return [];
            // בדיקה האם זו מטריצה { {1,2}, {3,4} }
            if (inner.startsWith('{')) {
                return this.parseMatrixLiteral(inner, scopeVars, line);
            }
            const parts = this.splitArgs(inner);
            return parts.map(p => this.evalExpr(p, scopeVars, line));
        }

        if (expr === 'System.in') return 'System.in';

        // new ClassName(args)
        const newObjMatch = expr.match(/^new\s+([A-Za-z0-9_]+)\s*\((.*)\)$/);
        if (newObjMatch) {
            const className = newObjMatch[1];
            if (className === 'Scanner') {
                return this.instantiateClass('Scanner', [], line);
            }
            const rawArgs = newObjMatch[2].trim();
            const args = rawArgs.length > 0 ? this.splitArgs(rawArgs).map(a => this.evalExpr(a, scopeVars, line)) : [];
            return this.instantiateClass(className, args, line);
        }

        // Math פונקציות
        if (expr.startsWith('Math.')) {
            return this.evalMathCall(expr, scopeVars, line);
        }

        // char / Character פונקציות ב-C# וב-Java
        if (expr.startsWith('char.IsDigit') || expr.startsWith('Character.isDigit')) {
            const arg = this.evalExpr(expr.slice(expr.indexOf('(') + 1, expr.lastIndexOf(')')).trim(), scopeVars, line);
            const ch = String(arg)[0] || '';
            return /[0-9]/.test(ch);
        }
        if (expr.startsWith('char.IsLetter') || expr.startsWith('Character.isLetter')) {
            const arg = this.evalExpr(expr.slice(expr.indexOf('(') + 1, expr.lastIndexOf(')')).trim(), scopeVars, line);
            const ch = String(arg)[0] || '';
            return /[a-zA-Zא-ת]/.test(ch);
        }
        if (expr.startsWith('Character.toUpperCase(')) {
            const arg = this.evalExpr(expr.slice(expr.indexOf('(') + 1, expr.lastIndexOf(')')).trim(), scopeVars, line);
            return String(arg).toUpperCase();
        }
        if (expr.startsWith('Character.toLowerCase(')) {
            const arg = this.evalExpr(expr.slice(expr.indexOf('(') + 1, expr.lastIndexOf(')')).trim(), scopeVars, line);
            return String(arg).toLowerCase();
        }

        // Java str.charAt(index)
        const charAtMatch = expr.match(/^([A-Za-z0-9_\[\], \.]+)\.charAt\s*\(([^)]+)\)$/);
        if (charAtMatch) {
            const target = this.evalExpr(charAtMatch[1].trim(), scopeVars, line);
            const idx = this.evalExpr(charAtMatch[2].trim(), scopeVars, line);
            if (typeof target !== 'string') throw { message: `קריאה ל-charAt על טיפוס שאינו מחרוזת: ${charAtMatch[1]}`, line, file: this.currentFile };
            if (idx < 0 || idx >= target.length) throw { message: `חריגה מגבולות המחרוזת ב-charAt: אינדקס [${idx}] במחרוזת באורך ${target.length}`, line, file: this.currentFile };
            return target[idx];
        }

        // Java str.equals(other) / str.equalsIgnoreCase(other)
        const equalsMatch = expr.match(/^([A-Za-z0-9_\[\], \.]+)\.(equals|equalsIgnoreCase)\s*\(([^)]+)\)$/);
        if (equalsMatch) {
            const target = this.evalExpr(equalsMatch[1].trim(), scopeVars, line);
            const other = this.evalExpr(equalsMatch[3].trim(), scopeVars, line);
            if (equalsMatch[2] === 'equals') return String(target) === String(other);
            return String(target).toLowerCase() === String(other).toLowerCase();
        }

        // קריאה למתודת מחרוזת או מאפיין: str.Length, str.length, arr.Length, arr.length וכו'
        const strMethodMatch = expr.match(/^([A-Za-z0-9_\[\], \.]+)\.(Length|Substring|IndexOf|Contains|ToUpper|ToLower|Replace)\s*(?:\((.*)\))?$/i);
        if (strMethodMatch) {
            const target = strMethodMatch[1].trim();
            const method = strMethodMatch[2];
            const rawArgs = strMethodMatch[3] !== undefined ? strMethodMatch[3].trim() : null;

            // mat.GetLength(dim)
            if (method.toLowerCase() === 'getlength' || (method.toLowerCase() === 'length' && target.endsWith('GetLength'))) {
                // יטופל בהמשך
            }

            const targetVal = this.evalExpr(target, scopeVars, line);
            const methodLower = method.toLowerCase();

            if (methodLower === 'length') {
                if (targetVal === null || targetVal === undefined) throw { message: `ניסיון לקרוא Length של ערך ריק או null ב-${target}`, line, file: this.currentFile };
                if (targetVal && targetVal._isMatrix) {
                    if (method === 'length' || (targetVal.type && targetVal.type.includes('[][]'))) {
                        return targetVal.rows;
                    }
                    return targetVal.rows * targetVal.cols;
                }
                return targetVal.length !== undefined ? targetVal.length : 0;
            }

            const strVal = String(targetVal || '');
            const args = rawArgs ? this.splitArgs(rawArgs).map(a => this.evalExpr(a, scopeVars, line)) : [];

            if (methodLower === 'substring') {
                const start = args[0] || 0;
                const second = args[1];
                if (second !== undefined) {
                    // Java substring(beginIndex, endIndex) vs C# Substring(startIndex, length)
                    if (method === 'substring' || (second >= start && second <= strVal.length)) {
                        return strVal.substring(start, second);
                    }
                    return strVal.substr(start, second);
                }
                return strVal.substring(start);
            }
            if (methodLower === 'indexof') {
                return strVal.indexOf(String(args[0] || ''));
            }
            if (methodLower === 'contains') {
                return strVal.includes(String(args[0] || ''));
            }
            if (methodLower === 'toupper') return strVal.toUpperCase();
            if (methodLower === 'tolower') return strVal.toLowerCase();
            if (methodLower === 'replace') return strVal.replaceAll(String(args[0] || ''), String(args[1] || ''));
        }

        // mat.GetLength(dim)
        const getLengthMatch = expr.match(/^([A-Za-z0-9_]+)\.GetLength\s*\(([^)]+)\)$/);
        if (getLengthMatch) {
            const matName = getLengthMatch[1];
            const dim = this.evalExpr(getLengthMatch[2].trim(), scopeVars, line);
            const matObj = this.resolveVariable(matName, scopeVars);
            if (!matObj || !matObj.grid) throw { message: `קריאה ל-GetLength על משתנה שאינו מטריצה: ${matName}`, line, file: this.currentFile };
            return dim === 0 ? matObj.rows : matObj.cols;
        }

        // גישה לאינדקס סוגריים מרובעים: mat[r, c], arr[i], str[i], candidate[arr[i] - 1]
        const indexedAccess = this.parseIndexedAccess(expr);
        if (indexedAccess) {
            if (indexedAccess.type === '2D') {
                const matName = indexedAccess.target;
                const r = this.evalExpr(indexedAccess.rowExpr, scopeVars, line);
                const c = this.evalExpr(indexedAccess.colExpr, scopeVars, line);
                const matObj = this.resolveVariable(matName, scopeVars);
                if (matObj && matObj.grid) {
                    if (r < 0 || r >= matObj.rows || c < 0 || c >= matObj.cols) {
                        throw { message: `חריגה מגבולות המטריצה [${r}, ${c}] במטריצה בגודל ${matObj.rows}x${matObj.cols}`, line, file: this.currentFile };
                    }
                    matObj.activeCell = { r, c };
                    return matObj.grid[r][c];
                }
                if (Array.isArray(matObj)) {
                    if (r < 0 || r >= matObj.length) {
                        throw { message: `חריגה מגבולות המטריצה: שורה [${r}] במטריצה בעלת ${matObj.length} שורות`, line, file: this.currentFile };
                    }
                    const rowArr = matObj[r];
                    if (!Array.isArray(rowArr) || c < 0 || c >= rowArr.length) {
                        throw { message: `חריגה מגבולות המטריצה: [${r}][${c}]`, line, file: this.currentFile };
                    }
                    matObj._activeCell = { r, c };
                    return rowArr[c];
                }
                throw { message: `גישה למטריצה שאינה קיימת: ${matName}`, line, file: this.currentFile };
            } else if (indexedAccess.type === '1D') {
                const name = indexedAccess.target;
                const idx = this.evalExpr(indexedAccess.indexExpr, scopeVars, line);
                const target = this.resolveVariable(name, scopeVars);
                if (Array.isArray(target)) {
                    if (idx < 0 || idx >= target.length) {
                        throw { message: `חריגה מגבולות המערך: אינדקס [${idx}] במערך בגודל ${target.length}`, line, file: this.currentFile };
                    }
                    return target[idx];
                }
                if (typeof target === 'string') {
                    if (idx < 0 || idx >= target.length) {
                        throw { message: `חריגה מגבולות המחרוזת: אינדקס [${idx}] במחרוזת באורך ${target.length}`, line, file: this.currentFile };
                    }
                    return target[idx];
                }
                throw { message: `ניסיון לגשת באינדקס למשתנה שאינו מערך או מחרוזת: ${name}`, line, file: this.currentFile };
            }
        }

        // שדה/מתודה של עצם: obj.field, obj.method(args), target[i].field, ClassName.StaticMethod(args)
        const dotMatch = this.splitTopLevelDot(expr);
        if (dotMatch) {
            const memberExpr = dotMatch.member.trim();

            // ולידציה: ה-member חייב להיות מזהה תקין (identifier) או קריאת מתודה (identifier(...))
            // אם הוא מכיל אופרטורים בינאריים ברמה עליונה (למשל "width * factor"), זה ביטוי בינארי ולא גישה לשדה
            const isValidMember = /^[A-Za-z0-9_]+(\s*\(.*\))?$/.test(memberExpr) ||
                                  memberExpr.match(/^[A-Za-z0-9_]+\s*\(/) !== null;
            // בדיקה שה-member לא מכיל אופרטורים בינאריים ברמה עליונה
            let hasBinaryOp = false;
            if (!isValidMember) {
                hasBinaryOp = true;
            } else {
                // בדיקה נוספת: אם ה-member מכיל תוים כמו space ואחריהם אופרטור ב-top level
                let d = 0;
                for (let ci = 0; ci < memberExpr.length; ci++) {
                    const ch = memberExpr[ci];
                    if (ch === '(' || ch === '[' || ch === '{') d++;
                    else if (ch === ')' || ch === ']' || ch === '}') d--;
                    else if (d === 0 && /[\+\-\*\/\%\<\>\!\=\&\|]/.test(ch) && ch !== '.' && ch !== '_') {
                        // מנע false positives על != == <= >=
                        hasBinaryOp = true;
                        break;
                    }
                }
            }
            if (hasBinaryOp) {
                // זהו ביטוי בינארי כמו "this.width * factor" - נטפל בו ב-evalBinaryExpr
                return this.evalBinaryExpr(expr, scopeVars, line);
            }

            // בדיקה האם זוהי קריאה למתודה: member מסתיים ב-( ... )
            const memberCallMatch = memberExpr.match(/^([A-Za-z0-9_]+)\s*\(([\s\S]*)?\)$/);
            if (memberCallMatch) {
                const methodName = memberCallMatch[1];
                const rawArgs = (memberCallMatch[2] || '').trim();
                const args = rawArgs.length > 0 ? this.splitArgs(rawArgs).map(a => this.evalExpr(a, scopeVars, line)) : [];

                // ניסיון לזהות האם זהו שם מחלקה סטטי (ClassName.Method)
                const targetExpr = dotMatch.target.trim();
                const staticCls = this.ast.classes.find(c => c.name === targetExpr);
                if (staticCls) {
                    const staticMethod = staticCls.methods.find(m => m.name === methodName && m.isStatic);
                    if (staticMethod) {
                        return this.invokeMethod(staticCls, staticMethod, null, args);
                    }
                }

                // מתודה של מופע (instance method): eval the target object first
                const targetVal = this.evalExpr(targetExpr, scopeVars, line);
                if (targetVal && targetVal._isScanner) {
                    const rawVal = this.inputQueue.length > 0 ? this.inputQueue.shift() : '0';
                    this.recordFrame(line, `קליטת קלט מהמשתמש (${targetExpr}.${methodName}): "${rawVal}"`);
                    if (methodName === 'nextInt') {
                        const parsed = parseInt(rawVal, 10);
                        return isNaN(parsed) ? 0 : parsed;
                    }
                    if (methodName === 'nextDouble') {
                        const parsed = parseFloat(rawVal);
                        return isNaN(parsed) ? 0.0 : parsed;
                    }
                    if (methodName === 'next' || methodName === 'nextLine') {
                        return String(rawVal);
                    }
                    return rawVal;
                }
                if (targetVal && typeof targetVal === 'object' && targetVal._heapId) {
                    const cls = this.ast.classes.find(c => c.name === targetVal.className);
                    if (cls) {
                        const method = cls.methods.find(m => m.name === methodName);
                        if (method) {
                            return this.invokeMethod(cls, method, targetVal, args);
                        }
                    }
                    // מתודה שאינה מוגדרת על העצם
                    return undefined;
                }
            }

            // גישה לשדה (לא מתודה): obj.field
            const targetVal = this.evalExpr(dotMatch.target, scopeVars, line);
            const field = memberExpr;
            if (targetVal && typeof targetVal === 'object' && targetVal._heapId) {
                return targetVal.fields[field];
            }
            if (Array.isArray(targetVal) && (field === 'Length' || field === 'length')) {
                return targetVal.length;
            }
            if (typeof targetVal === 'string' && (field === 'Length' || field === 'length')) {
                return targetVal.length;
            }
            if (targetVal && targetVal._isMatrix && (field === 'Length' || field === 'length')) {
                if (field === 'length' || (targetVal.type && targetVal.type.includes('[][]'))) {
                    return targetVal.rows;
                }
                return targetVal.rows * targetVal.cols;
            }
        }

        // קריאה לפונקציה מקומית או סטטית: FuncName(args)
        const funcCallMatch = expr.match(/^([A-Za-z0-9_]+)\s*\((.*)?\)$/s);
        if (funcCallMatch) {
            const funcName = funcCallMatch[1];
            const rawArgs = (funcCallMatch[2] || '').trim();
            const args = rawArgs.length > 0 ? this.splitArgs(rawArgs).map(a => this.evalExpr(a, scopeVars, line)) : [];
            return this.callStaticOrLocalFunction(funcName, args, line, scopeVars);
        }

        // ביטוי בינארי: חיבור, חיסור, כפל, חילוק, מודולו, השוואות
        return this.evalBinaryExpr(expr, scopeVars, line);
    }

    parseMatrixLiteral(literal, scopeVars, line) {
        // { {1,2}, {3,4} }
        const rows = [];
        let cur = '';
        let depth = 0;
        for (let i = 0; i < literal.length; i++) {
            const c = literal[i];
            if (c === '{') {
                depth++;
                if (depth === 1) { cur = ''; continue; }
            } else if (c === '}') {
                depth--;
                if (depth === 0) {
                    const rowVals = this.splitArgs(cur).map(p => this.evalExpr(p, scopeVars, line));
                    rows.push(rowVals);
                    cur = '';
                    continue;
                }
            }
            if (depth >= 1) cur += c;
        }

        const rowCount = rows.length;
        const colCount = rows.length > 0 ? rows[0].length : 0;
        rows._isMatrix = true;
        rows.type = 'int[,]';
        rows.rows = rowCount;
        rows.cols = colCount;
        rows.grid = rows;
        rows.activeCell = null;
        return rows;
    }

    instantiateClass(className, args, line) {
        if (className === 'Scanner') {
            const heapId = this.nextHeapId++;
            const scannerInstance = {
                _heapId: heapId,
                _isScanner: true,
                className: 'Scanner',
                fields: {}
            };
            this.heap.set(heapId, scannerInstance);
            this.recordFrame(line, `יצירת אובייקט Scanner לקליטת נתונים (System.in)`);
            return scannerInstance;
        }

        // מציאת הגדרת המחלקה
        const cls = this.ast.classes.find(c => c.name === className);
        if (!cls) {
            throw { message: `המחלקה ${className} אינה מוגדרת בפרויקט`, line, file: this.currentFile };
        }

        const heapId = this.nextHeapId++;
        const instanceFields = {};
        for (const f of cls.fields) {
            instanceFields[f.name] = f.initVal ? this.evalExpr(f.initVal, {}, line) : 0;
        }

        const instance = {
            _heapId: heapId,
            className: className,
            fields: instanceFields
        };
        this.heap.set(heapId, instance);

        // הפעלת בנאי - בחירה לפי מספר פרמטרים (Overload Resolution)
        if (cls.constructors.length > 0) {
            // מחפש בנאי עם מספר פרמטרים תואם בדיוק
            let ctor = cls.constructors.find(c => c.params.length === args.length);
            // אם לא נמצא, מחפש בנאי עם פחות פרמטרים (יקבל null על הפרמטרים החסרים)
            if (!ctor) {
                ctor = cls.constructors.find(c => c.params.length <= args.length);
            }
            // ברירת מחדל: הבנאי הראשון
            if (!ctor) {
                ctor = cls.constructors[0];
            }

            const ctorVars = { 'this': instance };
            if (ctor.params) {
                for (let i = 0; i < ctor.params.length; i++) {
                    ctorVars[ctor.params[i].name] = (i < args.length) ? args[i] : null;
                }
            }
            this.callStack.push({
                funcName: `${className}.${className}`,
                line: ctor.line,
                file: ctor.fileName,
                variables: ctorVars
            });
            this.executeBlock(ctor.body, ctor.bodyOffset, ctor.fileName, ctorVars);
            this.callStack.pop();
        }

        this.recordFrame(line, `יצירת מופע חדש ב-Heap: new ${className}() [מזהה #${heapId}]`);
        return instance;
    }

    callStaticOrLocalFunction(funcName, args, line, scopeVars) {
        // חיפוש מתודה בכל המחלקות
        for (const cls of this.ast.classes) {
            for (const m of cls.methods) {
                if (m.name === funcName) {
                    // מתודה סטטית: קריאה ישירה ללא thisRef
                    if (m.isStatic) {
                        return this.invokeMethod(cls, m, null, args);
                    }
                    // מתודה של מופע: ניסיון למצוא this בסביבה הנוכחית
                    const thisRef = scopeVars && scopeVars['this'] ? scopeVars['this'] : null;
                    return this.invokeMethod(cls, m, thisRef, args);
                }
            }
        }
        throw { message: `קריאה לפונקציה שאינה מוכרת: ${funcName}()`, line, file: this.currentFile };
    }

    evalMathCall(expr, scopeVars, line) {
        const m = expr.match(/^Math\.([A-Za-z0-9_]+)\s*\((.*)\)$/);
        if (!m) return 0;
        const fn = m[1].toLowerCase();
        const args = m[2].trim().length > 0 ? this.splitArgs(m[2]).map(a => this.evalExpr(a, scopeVars, line)) : [];

        switch (fn) {
            case 'max': return Math.max(args[0], args[1]);
            case 'min': return Math.min(args[0], args[1]);
            case 'abs': return Math.abs(args[0]);
            case 'pow': return Math.pow(args[0], args[1]);
            case 'sqrt': return Math.sqrt(args[0]);
            case 'floor': return Math.floor(args[0]);
            case 'ceil':
            case 'ceiling': return Math.ceil(args[0]);
            case 'round': return Math.round(args[0]);
            default: return 0;
        }
    }

    splitArgs(raw) {
        const result = [];
        let cur = '';
        let depth = 0;
        for (let i = 0; i < raw.length; i++) {
            const c = raw[i];
            if (c === '(' || c === '[' || c === '{') depth++;
            else if (c === ')' || c === ']' || c === '}') depth--;
            else if (c === ',' && depth === 0) {
                result.push(cur.trim());
                cur = '';
                continue;
            }
            cur += c;
        }
        if (cur.trim().length > 0) result.push(cur.trim());
        return result;
    }

    evalBinaryExpr(expr, scopeVars, line) {
        // פירוק בסיסי לפי סדר קדימויות:
        // 1. או ||
        // 2. וגם &&
        // 3. השוואות: ==, !=, <=, >=, <, >
        // 4. חיבור וחיסור: +, -
        // 5. כפל, חילוק, מודולו: *, /, %

        const ops = [
            ['||'],
            ['&&'],
            ['==', '!='],
            ['<=', '>=', '<', '>'],
            ['+', '-'],
            ['*', '/', '%']
        ];

        for (const opGroup of ops) {
            const splitRes = this.splitTopLevelOp(expr, opGroup);
            if (splitRes) {
                const leftVal = this.evalExpr(splitRes.left, scopeVars, line);
                const rightVal = this.evalExpr(splitRes.right, scopeVars, line);
                const op = splitRes.op;

                switch (op) {
                    case '||': return !!(leftVal || rightVal);
                    case '&&': return !!(leftVal && rightVal);
                    case '==': return leftVal == rightVal;
                    case '!=': return leftVal != rightVal;
                    case '<=': return leftVal <= rightVal;
                    case '>=': return leftVal >= rightVal;
                    case '<': return leftVal < rightVal;
                    case '>': return leftVal > rightVal;
                    case '+':
                        if (typeof leftVal === 'string' || typeof rightVal === 'string') {
                            return String(leftVal) + String(rightVal);
                        }
                        return leftVal + rightVal;
                    case '-': return leftVal - rightVal;
                    case '*': return leftVal * rightVal;
                    case '/':
                        if (rightVal === 0) throw { message: 'שגיאת חלוקה באפס (DivideByZeroException)', line, file: this.currentFile };
                        // חילוק שלמים ב-C# מחזיר שלם אם שני האופרנדים שלמים!
                        if (Number.isInteger(leftVal) && Number.isInteger(rightVal)) {
                            return Math.trunc(leftVal / rightVal);
                        }
                        return leftVal / rightVal;
                    case '%':
                        if (rightVal === 0) throw { message: 'שגיאת מודולו באפס: לא ניתן לחשב שארית בחלוקה ב-0', line, file: this.currentFile };
                        return leftVal % rightVal;
                }
            }
        }

        // אם אין אופרטור עליון, בדיקה אם זה משתנה
        const val = this.resolveVariable(expr, scopeVars);
        if (val !== undefined) return val;

        if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(expr)) {
            throw { message: `המשתנה '${expr}' אינו קיים בהקשר הנוכחי`, line, file: this.currentFile };
        }

        return 0;
    }

    splitTopLevelBracket(str) {
        if (!str) return null;
        str = str.trim();
        const firstBracket = str.indexOf('[');
        if (firstBracket <= 0 || !str.endsWith(']')) return null;

        const targetName = str.slice(0, firstBracket).trim();
        if (!/^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)*$/.test(targetName)) return null;

        let depth = 0;
        let inQuote = false;
        let quoteChar = '';

        for (let i = firstBracket; i < str.length; i++) {
            const c = str[i];
            if ((c === '"' || c === "'") && (i === 0 || str[i - 1] !== '\\')) {
                if (!inQuote) {
                    inQuote = true;
                    quoteChar = c;
                } else if (quoteChar === c) {
                    inQuote = false;
                }
                continue;
            }
            if (inQuote) continue;

            if (c === '[') {
                depth++;
            } else if (c === ']') {
                depth--;
                if (depth === 0) {
                    if (i === str.length - 1) {
                        const inside = str.slice(firstBracket + 1, i).trim();
                        return { target: targetName, inside };
                    }
                    return null;
                }
            }
        }
        return null;
    }

    splitTopLevelCommas(inside) {
        const parts = [];
        let cur = '';
        let depth = 0;
        let inQuote = false;
        let quoteChar = '';

        for (let i = 0; i < inside.length; i++) {
            const c = inside[i];
            if ((c === '"' || c === "'") && (i === 0 || inside[i - 1] !== '\\')) {
                if (!inQuote) {
                    inQuote = true;
                    quoteChar = c;
                } else if (quoteChar === c) {
                    inQuote = false;
                }
                cur += c;
                continue;
            }
            if (inQuote) {
                cur += c;
                continue;
            }

            if (c === '(' || c === '[' || c === '{') {
                depth++;
            } else if (c === ')' || c === ']' || c === '}') {
                depth--;
            } else if (c === ',' && depth === 0) {
                parts.push(cur.trim());
                cur = '';
                continue;
            }
            cur += c;
        }
        if (cur.trim().length > 0) parts.push(cur.trim());
        return parts;
    }

    splitDoubleBracket(str) {
        // מחפש תבנית target[expr1][expr2] ב-Java
        const firstOpen = str.indexOf('[');
        if (firstOpen <= 0) return null;
        const target = str.slice(0, firstOpen).trim();
        let depth = 0;
        let firstClose = -1;
        for (let i = firstOpen; i < str.length; i++) {
            if (str[i] === '[') depth++;
            else if (str[i] === ']') {
                depth--;
                if (depth === 0) {
                    firstClose = i;
                    break;
                }
            }
        }
        if (firstClose === -1 || firstClose >= str.length - 2) return null;
        if (str[firstClose + 1] !== '[') return null;
        const secondOpen = firstClose + 1;
        let secondClose = -1;
        depth = 0;
        for (let i = secondOpen; i < str.length; i++) {
            if (str[i] === '[') depth++;
            else if (str[i] === ']') {
                depth--;
                if (depth === 0) {
                    secondClose = i;
                    break;
                }
            }
        }
        if (secondClose === str.length - 1) {
            return {
                target: target,
                rowExpr: str.slice(firstOpen + 1, firstClose).trim(),
                colExpr: str.slice(secondOpen + 1, secondClose).trim()
            };
        }
        return null;
    }

    parseIndexedAccess(str) {
        // בדיקה לתחביר Java 2D: target[r][c]
        const doubleMatch = this.splitDoubleBracket(str);
        if (doubleMatch) {
            return {
                type: '2D',
                target: doubleMatch.target,
                rowExpr: doubleMatch.rowExpr,
                colExpr: doubleMatch.colExpr
            };
        }

        const bracket = this.splitTopLevelBracket(str);
        if (!bracket) return null;
        const parts = this.splitTopLevelCommas(bracket.inside);
        if (parts.length === 1) {
            return {
                type: '1D',
                target: bracket.target,
                indexExpr: parts[0]
            };
        } else if (parts.length === 2) {
            return {
                type: '2D',
                target: bracket.target,
                rowExpr: parts[0],
                colExpr: parts[1]
            };
        }
        return null;
    }

    splitTopLevelAssignment(raw) {
        let depth = 0;
        let inQuote = false;
        let quoteChar = '';

        for (let i = 0; i < raw.length; i++) {
            const c = raw[i];
            if ((c === '"' || c === "'") && (i === 0 || raw[i - 1] !== '\\')) {
                if (!inQuote) {
                    inQuote = true;
                    quoteChar = c;
                } else if (quoteChar === c) {
                    inQuote = false;
                }
                continue;
            }
            if (inQuote) continue;

            if (c === '(' || c === '[' || c === '{') {
                depth++;
            } else if (c === ')' || c === ']' || c === '}') {
                depth--;
            } else if (depth === 0) {
                const two = raw.slice(i, i + 2);
                if (['+=', '-=', '*=', '/=', '%='].includes(two)) {
                    return {
                        target: raw.slice(0, i).trim(),
                        op: two,
                        expr: raw.slice(i + 2).trim()
                    };
                }
                if (c === '=' && two !== '==' && (i === 0 || !['<', '>', '!', '='].includes(raw[i - 1]))) {
                    return {
                        target: raw.slice(0, i).trim(),
                        op: '=',
                        expr: raw.slice(i + 1).trim()
                    };
                }
            }
        }
        return null;
    }

    splitTopLevelDot(expr) {
        let depth = 0;
        let inQuote = false;
        let lastDotIdx = -1;

        for (let i = 0; i < expr.length; i++) {
            const c = expr[i];
            if (c === '\\' && inQuote) {
                i++;
                continue;
            }
            if (c === '"') {
                inQuote = !inQuote;
                continue;
            }
            if (inQuote) continue;

            if (c === '(' || c === '[' || c === '{') depth++;
            else if (c === ')' || c === ']' || c === '}') depth--;
            else if (depth === 0 && c === '.') {
                lastDotIdx = i;
            }
        }

        if (lastDotIdx !== -1) {
            return {
                target: expr.slice(0, lastDotIdx).trim(),
                member: expr.slice(lastDotIdx + 1).trim()
            };
        }
        return null;
    }

    splitTopLevelOp(expr, opList) {
        let depth = 0;
        let inQuote = false;
        let lastMatch = null;

        for (let i = 0; i < expr.length; i++) {
            const c = expr[i];
            if (c === '\\' && inQuote) {
                i++;
                continue;
            }
            if (c === '"') {
                inQuote = !inQuote;
                continue;
            }
            if (inQuote) continue;

            if (c === '(' || c === '[' || c === '{') {
                depth++;
            } else if (c === ')' || c === ']' || c === '}') {
                depth--;
            } else if (depth === 0) {
                for (const op of opList) {
                    const opLen = op.length;
                    if (expr.slice(i, i + opLen) === op) {
                        // בדיקה האם זה סימן מינוס בתחילת מספר שלילי
                        if (op === '-' && (i === 0 || /[\+\-\*\/\%\(\=\<\>\!]/.test(expr.slice(0, i).trim().slice(-1)))) {
                            continue;
                        }
                        lastMatch = {
                            op,
                            index: i,
                            opLen
                        };
                        break;
                    }
                }
            }
        }

        if (lastMatch) {
            return {
                op: lastMatch.op,
                left: expr.slice(0, lastMatch.index).trim(),
                right: expr.slice(lastMatch.index + lastMatch.opLen).trim()
            };
        }
        return null;
    }

    formatVal(val) {
        if (val === null) return 'null';
        if (val === undefined) return 'undefined';
        if (Array.isArray(val)) return `[${val.join(', ')}]`;
        if (val && val._isMatrix) return `Matrix (${val.rows}x${val.cols})`;
        if (val && val._heapId) return `#${val.className}(#${val._heapId})`;
        if (typeof val === 'string') return `"${val}"`;
        return String(val);
    }

    deepCloneVal(val) {
        if (val === null || val === undefined) return val;
        if (typeof val !== 'object') return val;
        if (Array.isArray(val)) {
            const copy = val.map(item => this.deepCloneVal(item));
            if (val._elemType) copy._elemType = val._elemType;
            return copy;
        }
        if (val._isMatrix) {
            return {
                _isMatrix: true,
                rows: val.rows,
                cols: val.cols,
                type: val.type,
                grid: val.grid.map(row => row.map(cell => this.deepCloneVal(cell))),
                activeCell: val.activeCell ? { ...val.activeCell } : null
            };
        }
        if (val._heapId) {
            return {
                _heapId: val._heapId,
                className: val.className,
                fields: this.deepCloneVal(val.fields)
            };
        }
        const copy = {};
        for (const [k, v] of Object.entries(val)) {
            copy[k] = this.deepCloneVal(v);
        }
        return copy;
    }

    recordFrame(line, description, extra = {}) {
        this.stepCount++;
        const rawScope = this.callStack.length > 0 ? this.callStack[this.callStack.length - 1].variables : {};
        const currentScope = {};
        for (const [k, v] of Object.entries(rawScope)) {
            currentScope[k] = this.deepCloneVal(v);
        }

        // הערכת ביטויי אינדקס מקוננים ודינמיים מהקוד (לדוגמה: arr[i], votes[i], candidate[votes[i] - 1])
        if (this.trackedExpressions && this.trackedExpressions.length > 0) {
            for (const expr of this.trackedExpressions) {
                try {
                    const res = this.evalExpr(expr, rawScope, line);
                    if (res !== undefined && typeof res !== 'function') {
                        currentScope[expr] = this.deepCloneVal(res);
                    } else {
                        currentScope[expr] = undefined;
                    }
                } catch (_) {
                    currentScope[expr] = undefined;
                }
            }
        }

        // זיהוי מערכים חד-ממדיים, מטריצות, מחרוזות, ואובייקטים פעילים
        const arrays1D = [];
        const matrices2D = [];
        const strings = [];
        const objects = [];
        const activePointers = {};

        const heapMap = new Map();

        // 1. מעקב אחר כל האובייקטים הקיימים במערכת מ-this.heap
        for (const [heapId, inst] of this.heap.entries()) {
            if (inst && inst._heapId) {
                heapMap.set(heapId, {
                    heapId: heapId,
                    className: inst.className,
                    fields: { ...inst.fields },
                    refs: []
                });
            }
        }

        // 2. זיהוי אובייקטים ישירים ב-currentScope
        for (const [varName, val] of Object.entries(currentScope)) {
            if (val && typeof val === 'object' && val._heapId) {
                if (!heapMap.has(val._heapId)) {
                    heapMap.set(val._heapId, {
                        heapId: val._heapId,
                        className: val.className,
                        fields: { ...val.fields },
                        refs: varName === 'this' ? [] : [varName]
                    });
                } else if (varName !== 'this') {
                    const entry = heapMap.get(val._heapId);
                    if (!entry.refs.includes(varName)) entry.refs.push(varName);
                }
            }
        }

        // 3. זיהוי מערכים חד-ממדיים, מטריצות, מחרוזות ומשתנים פעילים
        for (const [varName, val] of Object.entries(currentScope)) {
            if (val && val._isMatrix) {
                matrices2D.push({
                    name: varName,
                    rows: val.rows,
                    cols: val.cols,
                    grid: (val.grid || val).map(row => [...row]),
                    activeCell: val.activeCell ? { ...val.activeCell } : (val._activeCell ? { ...val._activeCell } : null)
                });
            } else if (Array.isArray(val) && val.length > 0 && Array.isArray(val[0])) {
                matrices2D.push({
                    name: varName,
                    rows: val.length,
                    cols: val[0].length,
                    grid: val.map(row => Array.isArray(row) ? [...row] : []),
                    activeCell: val._activeCell ? { ...val._activeCell } : null
                });
            } else if (Array.isArray(val)) {
                let elemType = val._elemType;
                if (!elemType) {
                    const firstNonNull = val.find(x => x !== null && x !== undefined);
                    if (firstNonNull && firstNonNull._heapId) {
                        elemType = firstNonNull.className;
                    } else if (firstNonNull && typeof firstNonNull === 'string') {
                        elemType = 'string';
                    } else if (firstNonNull && typeof firstNonNull === 'boolean') {
                        elemType = 'bool';
                    } else if (firstNonNull && typeof firstNonNull === 'number') {
                        elemType = Number.isInteger(firstNonNull) ? 'int' : 'double';
                    } else {
                        elemType = 'int';
                    }
                }

                // רישום הפניות של איברי המערך לאובייקטים ב-Heap
                val.forEach((item, idx) => {
                    if (item && typeof item === 'object' && item._heapId) {
                        const refName = `${varName}[${idx}]`;
                        if (!heapMap.has(item._heapId)) {
                            heapMap.set(item._heapId, {
                                heapId: item._heapId,
                                className: item.className,
                                fields: { ...item.fields },
                                refs: [refName]
                            });
                        } else {
                            const entry = heapMap.get(item._heapId);
                            if (!entry.refs.includes(refName)) entry.refs.push(refName);
                        }
                    }
                });

                arrays1D.push({
                    name: varName,
                    elemType: elemType,
                    length: val.length,
                    items: val.map(item => (item && typeof item === 'object') ? JSON.parse(JSON.stringify(item)) : item)
                });
            } else if (typeof val === 'string' && val.length > 0) {
                strings.push({
                    name: varName,
                    value: val,
                    chars: val.split(''),
                    length: val.length
                });
            } else if (typeof val === 'number') {
                // משתני אינדקס נפוצים (i, j, min, max, left, right וכו')
                if (/^(i|j|k|row|col|idx|min|max|left|right|mid|count|pos)/i.test(varName)) {
                    activePointers[varName] = val;
                }
            }
        }

        // המרת heapMap לרשימת objects מסודרת
        for (const entry of heapMap.values()) {
            objects.push({
                varName: entry.refs.length > 0 ? entry.refs.join(', ') : `#${entry.heapId}`,
                heapId: entry.heapId,
                className: entry.className,
                fields: { ...entry.fields }
            });
        }

        // עדכון טבלת המעקב
        const traceRow = {
            step: this.stepCount,
            line: line,
            iteration: extra.iteration !== undefined ? extra.iteration : null,
            condition: extra.condition || '-',
            variables: { ...currentScope },
            output: extra.output || '-'
        };
        this.traceTable.push(traceRow);

        const frame = {
            step: this.stepCount,
            line: line,
            file: this.currentFile,
            description: description,
            callStack: this.callStack.map(c => ({
                funcName: c.funcName,
                line: c.line,
                file: c.file,
                variables: this.deepCloneVal(c.variables)
            })),
            variables: currentScope,
            condition: extra.condition || null,
            output: extra.output || null,
            iteration: extra.iteration !== undefined ? extra.iteration : null,
            arrays1D: arrays1D,
            matrices2D: matrices2D,
            strings: strings,
            objects: objects,
            activePointers: activePointers,
            consoleOutputs: [...this.consoleOutputs],
            traceTableRows: [...this.traceTable],
            error: null,
            isCompleted: false
        };

        this.frames.push(frame);
    }

    checkLimit() {
        if (this.stepCount > this.maxSteps) {
            throw {
                message: `חריגה ממספר הצעדים המרבי (${this.maxSteps}). ככל הנראה מדובר בלולאה אינסופית או רקורסיה ללא תנאי עצירה תקין!`,
                line: this.callStack.length > 0 ? this.callStack[this.callStack.length - 1].line : 1,
                file: this.currentFile
            };
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CSharp10thInterpreter, Runtime10thEnvironment };
}
