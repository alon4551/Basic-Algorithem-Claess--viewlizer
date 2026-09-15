/**
 * C# 10th Grade Fundamentals Interpreter & Execution Tracer
 * מרכז מדעי המחשב - בית ספר מקיף דוד טוביהו | אלון שרייבמן
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

    run(sourceCode, initialInputs = []) {
        this.setInputQueue(initialInputs);
        let runtime = null;
        try {
            const preprocessed = this.preprocess(sourceCode);
            const ast = this.parse(preprocessed.files);
            this.ast = ast;
            runtime = new Runtime10thEnvironment(ast, this.inputQueue, this.maxSteps);
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
        if (typeof source === 'string') {
            files['Program.cs'] = source;
        } else if (source && typeof source === 'object') {
            for (const [key, val] of Object.entries(source)) {
                files[key] = (typeof val === 'string') ? val : (val.code || '');
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
        // מציאת בלוקי מחלקות
        const classRegex = /(?:public\s+|private\s+|internal\s+)?class\s+([A-Za-z0-9_]+)(?:\s*:\s*([A-Za-z0-9_]+))?\s*\{/g;
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
    constructor(ast, inputQueue, maxSteps = 1500) {
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
            throw { message: 'לא נמצאה מתודת Main בתוכנית. ודא שקיימת המחלקה Program ובתוכה public static void Main()', line: 1, file: 'Program.cs' };
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

        const result = this.executeBlock(method.body, method.line, method.fileName, frameVars);
        this.callStack.pop();
        return result ? result.value : undefined;
    }

    executeBlock(code, startLine, fileName, scopeVars) {
        // פירוק שורות ופקודות
        const statements = this.extractStatements(code, startLine, fileName);
        for (const stmt of statements) {
            this.checkLimit();
            const res = this.executeStatement(stmt, scopeVars);
            if (res && (res.type === 'return' || res.type === 'break' || res.type === 'continue')) {
                return res;
            }
        }
        return null;
    }

    extractStatements(code, startLine, fileName) {
        const list = [];
        let i = 0;
        const len = code.length;
        let lineOffset = 0;

        while (i < len) {
            // דילוג על רווחים
            while (i < len && /\s/.test(code[i])) {
                if (code[i] === '\n') lineOffset++;
                i++;
            }
            if (i >= len) break;

            const currentLine = startLine + lineOffset;

            // דילוג על הערות //
            if (code[i] === '/' && code[i + 1] === '/') {
                while (i < len && code[i] !== '\n') i++;
                continue;
            }
            // דילוג על הערות /* */
            if (code[i] === '/' && code[i + 1] === '*') {
                i += 2;
                while (i < len && !(code[i - 1] === '*' && code[i] === '/')) {
                    if (code[i] === '\n') lineOffset++;
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
            const doMatch = remaining.match(/^do\s*\{/);

            if (forMatch) {
                const headerEnd = this.findMatchingParen(code, i + forMatch[0].length - 1);
                const header = code.slice(i + forMatch[0].length, headerEnd);
                let bodyStart = headerEnd + 1;
                while (bodyStart < len && /\s/.test(code[bodyStart])) {
                    if (code[bodyStart] === '\n') lineOffset++;
                    bodyStart++;
                }

                if (code[bodyStart] === '{') {
                    const bodyEnd = this.findMatchingBrace(code, bodyStart);
                    const body = code.slice(bodyStart + 1, bodyEnd);
                    list.push({
                        type: 'for',
                        header,
                        body,
                        line: currentLine,
                        fileName
                    });
                    lineOffset += (code.slice(i, bodyEnd).match(/\n/g) || []).length;
                    i = bodyEnd + 1;
                } else {
                    // שורה יחידה ללא סוגריים מסולסלים
                    let singleEnd = code.indexOf(';', bodyStart);
                    if (singleEnd === -1) singleEnd = len;
                    list.push({
                        type: 'for',
                        header,
                        body: code.slice(bodyStart, singleEnd + 1),
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
                    if (code[bodyStart] === '\n') lineOffset++;
                    bodyStart++;
                }

                if (code[bodyStart] === '{') {
                    const bodyEnd = this.findMatchingBrace(code, bodyStart);
                    const body = code.slice(bodyStart + 1, bodyEnd);
                    list.push({
                        type: 'while',
                        condition,
                        body,
                        line: currentLine,
                        fileName
                    });
                    lineOffset += (code.slice(i, bodyEnd).match(/\n/g) || []).length;
                    i = bodyEnd + 1;
                } else {
                    let singleEnd = code.indexOf(';', bodyStart);
                    if (singleEnd === -1) singleEnd = len;
                    list.push({
                        type: 'while',
                        condition,
                        body: code.slice(bodyStart, singleEnd + 1),
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
                    if (code[bodyStart] === '\n') lineOffset++;
                    bodyStart++;
                }

                let ifBody = '';
                let nextIdx = bodyStart;
                if (code[bodyStart] === '{') {
                    const bodyEnd = this.findMatchingBrace(code, bodyStart);
                    ifBody = code.slice(bodyStart + 1, bodyEnd);
                    nextIdx = bodyEnd + 1;
                } else {
                    let singleEnd = code.indexOf(';', bodyStart);
                    if (singleEnd === -1) singleEnd = len;
                    ifBody = code.slice(bodyStart, singleEnd + 1);
                    nextIdx = singleEnd + 1;
                }

                // בדיקה אם יש else
                let elseBody = null;
                let postIf = code.slice(nextIdx);
                const elseMatch = postIf.match(/^\s*else(?:\s*\{|\s+if\s*\(|\s+)/);
                if (elseMatch) {
                    const elseKeywordIdx = nextIdx + postIf.indexOf('else');
                    let elseStart = elseKeywordIdx + 4;
                    while (elseStart < len && /\s/.test(code[elseStart])) {
                        if (code[elseStart] === '\n') lineOffset++;
                        elseStart++;
                    }
                    if (code[elseStart] === '{') {
                        const elseEnd = this.findMatchingBrace(code, elseStart);
                        elseBody = code.slice(elseStart + 1, elseEnd);
                        nextIdx = elseEnd + 1;
                    } else {
                        // else if או שורה יחידה
                        let singleEnd = code.indexOf(';', elseStart);
                        if (code.slice(elseStart).trim().startsWith('if')) {
                            const subStatements = this.extractStatements(code.slice(elseStart), currentLine, fileName);
                            if (subStatements.length > 0) {
                                elseBody = subStatements[0];
                                nextIdx = len; // יטופל בנפרד
                            }
                        } else {
                            if (singleEnd === -1) singleEnd = len;
                            elseBody = code.slice(elseStart, singleEnd + 1);
                            nextIdx = singleEnd + 1;
                        }
                    }
                }

                list.push({
                    type: 'if',
                    condition,
                    body: ifBody,
                    elseBody,
                    line: currentLine,
                    fileName
                });
                lineOffset += (code.slice(i, nextIdx).match(/\n/g) || []).length;
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
            lineOffset += (code.slice(i, semiIdx + 1).match(/\n/g) || []).length;
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

        // Console.WriteLine / Console.Write
        if (raw.startsWith('Console.WriteLine') || raw.startsWith('Console.Write')) {
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
            const res = this.executeBlock(stmt.body, stmt.line + 1, stmt.fileName, scopeVars);
            if (res) {
                if (res.type === 'break') break;
                if (res.type === 'return') return res;
            }

            // צעד קידום הלולאה
            if (updateCode.length > 0) {
                this.executeAssignmentOrDecl(updateCode, scopeVars, stmt.line);
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
            const res = this.executeBlock(stmt.body, stmt.line + 1, stmt.fileName, scopeVars);
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
            return this.executeBlock(stmt.body, stmt.line + 1, stmt.fileName, scopeVars);
        } else if (stmt.elseBody) {
            if (typeof stmt.elseBody === 'string') {
                return this.executeBlock(stmt.elseBody, stmt.line + 1, stmt.fileName, scopeVars);
            } else if (stmt.elseBody.type) {
                return this.executeStatement(stmt.elseBody, scopeVars);
            }
        }
        return null;
    }

    executeConsolePrint(raw, scopeVars, line) {
        const isLine = raw.startsWith('Console.WriteLine');
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
        // x++; או x--; או ++x; או --x;
        if (/^[A-Za-z0-9_]+(\+\+|\-\-)$/.test(raw) || /^(\+\+|\-\-)[A-Za-z0-9_]+$/.test(raw)) {
            const varName = raw.replace(/\+\+|\-\-/g, '').trim();
            const delta = raw.includes('++') ? 1 : -1;
            if (scopeVars[varName] !== undefined) {
                scopeVars[varName] += delta;
                this.recordFrame(line, `קידום משתנה: ${varName} = ${scopeVars[varName]}`);
                return;
            }
        }

        // השמה עם אופרטור מורכב: +=, -=, *=, /=, %=
        const compoundMatch = raw.match(/^([A-Za-z0-9_\[\], \.]+)\s*(\+=|\-=|\*=|\/=|\%=)\s*(.+)$/);
        if (compoundMatch) {
            const target = compoundMatch[1].trim();
            const op = compoundMatch[2];
            const expr = compoundMatch[3].trim();
            const rhsVal = this.evalExpr(expr, scopeVars, line);
            const currentVal = this.evalTargetValue(target, scopeVars, line);

            let newVal;
            if (op === '+=') newVal = currentVal + rhsVal;
            else if (op === '-=') newVal = currentVal - rhsVal;
            else if (op === '*=') newVal = currentVal * rhsVal;
            else if (op === '/=') {
                if (rhsVal === 0) throw { message: 'חלוקה באפס (DivideByZeroException): לא ניתן לחלק ב-0.', line, file: this.currentFile };
                newVal = Math.floor(currentVal / rhsVal);
            } else if (op === '%=') {
                if (rhsVal === 0) throw { message: 'חלוקה באפס (DivideByZeroException): שארית מודולו באפס אינה מוגדרת.', line, file: this.currentFile };
                newVal = currentVal % rhsVal;
            }

            this.assignTargetValue(target, newVal, scopeVars, line);
            this.recordFrame(line, `השמה מורכבת: ${target} ${op} ${rhsVal} ➔ ${newVal}`);
            return;
        }

        // הצהרה או השמה רגילה עם =
        const eqIdx = raw.indexOf('=');
        if (eqIdx !== -1) {
            const lhs = raw.slice(0, eqIdx).trim();
            const rhs = raw.slice(eqIdx + 1).trim();

            const rhsVal = this.evalExpr(rhs, scopeVars, line);

            // בדיקה אם lhs מכיל טיפוס (הצהרת משתנה חדש)
            const parts = lhs.split(/\s+/);
            if (parts.length >= 2) {
                const type = parts.slice(0, -1).join(' ');
                const varName = parts[parts.length - 1];
                scopeVars[varName] = rhsVal;
                this.recordFrame(line, `הצהרה והשמה: ${type} ${varName} = ${this.formatVal(rhsVal)}`);
            } else {
                // השמה למשתנה או תא קיים
                this.assignTargetValue(lhs, rhsVal, scopeVars, line);
                this.recordFrame(line, `השמה: ${lhs} = ${this.formatVal(rhsVal)}`);
            }
            return;
        }

        // הצהרת משתנה ללא אתחול: int x; או int[] arr;
        const declParts = raw.split(/\s+/);
        if (declParts.length >= 2) {
            const type = declParts.slice(0, -1).join(' ');
            const varName = declParts[declParts.length - 1];
            let defaultVal = 0;
            if (type === 'string') defaultVal = '';
            else if (type === 'bool') defaultVal = false;
            else if (type.includes('[') || type.includes('class')) defaultVal = null;
            scopeVars[varName] = defaultVal;
            this.recordFrame(line, `הצהרת משתנה: ${type} ${varName}`);
            return;
        }

        // ביטוי כפקודה (למשל קריאה למתודה ללא השמה)
        this.evalExpr(raw, scopeVars, line);
    }

    evalTargetValue(target, scopeVars, line) {
        // גישה למטריצה mat[r, c]
        const matMatch = target.match(/^([A-Za-z0-9_]+)\[([^,]+),([^\]]+)\]$/);
        if (matMatch) {
            const matName = matMatch[1];
            const r = this.evalExpr(matMatch[2].trim(), scopeVars, line);
            const c = this.evalExpr(matMatch[3].trim(), scopeVars, line);
            const matObj = this.resolveVariable(matName, scopeVars);
            if (!matObj || !matObj.grid) throw { message: `ניסיון לגשת למטריצה שאינה קיימת או שערכה null: ${matName}`, line, file: this.currentFile };
            if (r < 0 || r >= matObj.rows || c < 0 || c >= matObj.cols) {
                throw { message: `חריגה מגבולות המטריצה [${r}, ${c}] במטריצה בגודל ${matObj.rows}x${matObj.cols}`, line, file: this.currentFile };
            }
            return matObj.grid[r][c];
        }

        // גישה למערך 1D arr[i]
        const arrMatch = target.match(/^([A-Za-z0-9_]+)\[([^\]]+)\]$/);
        if (arrMatch) {
            const arrName = arrMatch[1];
            const idx = this.evalExpr(arrMatch[2].trim(), scopeVars, line);
            const arr = this.resolveVariable(arrName, scopeVars);
            if (!Array.isArray(arr)) throw { message: `ניסיון לגשת למערך שאינו קיים או שערכו null: ${arrName}`, line, file: this.currentFile };
            if (idx < 0 || idx >= arr.length) {
                throw { message: `חריגה מגבולות המערך: אינדקס [${idx}] במערך בגודל ${arr.length} (האינדקסים החוקיים: 0 עד ${arr.length - 1})`, line, file: this.currentFile };
            }
            return arr[idx];
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
        // מטריצה mat[r, c] = val
        const matMatch = target.match(/^([A-Za-z0-9_]+)\[([^,]+),([^\]]+)\]$/);
        if (matMatch) {
            const matName = matMatch[1];
            const r = this.evalExpr(matMatch[2].trim(), scopeVars, line);
            const c = this.evalExpr(matMatch[3].trim(), scopeVars, line);
            const matObj = this.resolveVariable(matName, scopeVars);
            if (!matObj || !matObj.grid) throw { message: `ניסיון לגשת למטריצה שלא אותחלה: ${matName}`, line, file: this.currentFile };
            if (r < 0 || r >= matObj.rows || c < 0 || c >= matObj.cols) {
                throw { message: `שגיאת חריגה מגבולות המטריצה [${r}, ${c}] במטריצה בגודל ${matObj.rows}x${matObj.cols}`, line, file: this.currentFile };
            }
            matObj.grid[r][c] = val;
            matObj.activeCell = { r, c };
            return;
        }

        // מערך 1D arr[i] = val
        const arrMatch = target.match(/^([A-Za-z0-9_]+)\[([^\]]+)\]$/);
        if (arrMatch) {
            const arrName = arrMatch[1];
            const idx = this.evalExpr(arrMatch[2].trim(), scopeVars, line);
            const arr = this.resolveVariable(arrName, scopeVars);
            if (!Array.isArray(arr)) throw { message: `ניסיון לגשת למערך שלא אותחל: ${arrName}`, line, file: this.currentFile };
            if (idx < 0 || idx >= arr.length) {
                throw { message: `שגיאת חריגה מגבולות המערך: אינדקס ${idx} אינו חוקי עבור מערך בגודל ${arr.length} (האינדקסים החוקיים: 0 עד ${arr.length - 1})`, line, file: this.currentFile };
            }
            arr[idx] = val;
            return;
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

        // int.Parse / double.Parse
        if (expr.startsWith('int.Parse(') || expr.startsWith('Convert.ToInt32(')) {
            const inner = expr.slice(expr.indexOf('(') + 1, expr.lastIndexOf(')')).trim();
            const val = this.evalExpr(inner, scopeVars, line);
            const res = parseInt(val, 10);
            return isNaN(res) ? 0 : res;
        }
        if (expr.startsWith('double.Parse(') || expr.startsWith('Convert.ToDouble(')) {
            const inner = expr.slice(expr.indexOf('(') + 1, expr.lastIndexOf(')')).trim();
            const val = this.evalExpr(inner, scopeVars, line);
            const res = parseFloat(val);
            return isNaN(res) ? 0.0 : res;
        }

        // new int[size]
        const newArrMatch = expr.match(/^new\s+([A-Za-z0-9_]+)\[([^\]]+)\]$/);
        if (newArrMatch) {
            const type = newArrMatch[1];
            const size = this.evalExpr(newArrMatch[2].trim(), scopeVars, line);
            if (size < 0) throw { message: `לא ניתן ליצור מערך בגודל שלילי: ${size}`, line, file: this.currentFile };
            let defaultVal = 0;
            if (type === 'string') defaultVal = '';
            else if (type === 'bool') defaultVal = false;
            else if (type === 'char') defaultVal = '\0';
            else if (type !== 'int' && type !== 'double') defaultVal = null;
            return new Array(size).fill(defaultVal);
        }

        // אתחול מערך 1D עם ערכים: { 1, 2, 3 }
        if (expr.startsWith('{') && expr.endsWith('}') && !expr.includes(';')) {
            const inner = expr.slice(1, -1).trim();
            // בדיקה האם זו מטריצה { {1,2}, {3,4} }
            if (inner.startsWith('{')) {
                return this.parseMatrixLiteral(inner, scopeVars, line);
            }
            const parts = this.splitArgs(inner);
            return parts.map(p => this.evalExpr(p, scopeVars, line));
        }

        // new int[rows, cols] (מטריצה דו-ממדית)
        const newMatMatch = expr.match(/^new\s+([A-Za-z0-9_]+)\[([^,]+),([^\]]+)\]$/);
        if (newMatMatch) {
            const type = newMatMatch[1];
            const rows = this.evalExpr(newMatMatch[2].trim(), scopeVars, line);
            const cols = this.evalExpr(newMatMatch[3].trim(), scopeVars, line);
            if (rows <= 0 || cols <= 0) throw { message: `ממדי מטריצה חייבים להיות חיוביים (${rows}x${cols})`, line, file: this.currentFile };

            const grid = [];
            for (let r = 0; r < rows; r++) {
                grid.push(new Array(cols).fill(0));
            }
            return {
                _isMatrix: true,
                type: `${type}[,]`,
                rows,
                cols,
                grid,
                activeCell: null
            };
        }

        // new ClassName(args)
        const newObjMatch = expr.match(/^new\s+([A-Za-z0-9_]+)\s*\((.*)\)$/);
        if (newObjMatch) {
            const className = newObjMatch[1];
            const rawArgs = newObjMatch[2].trim();
            const args = rawArgs.length > 0 ? this.splitArgs(rawArgs).map(a => this.evalExpr(a, scopeVars, line)) : [];
            return this.instantiateClass(className, args, line);
        }

        // Math פונקציות
        if (expr.startsWith('Math.')) {
            return this.evalMathCall(expr, scopeVars, line);
        }

        // char פונקציות
        if (expr.startsWith('char.IsDigit') || expr.startsWith('char.IsLetter')) {
            const arg = this.evalExpr(expr.slice(expr.indexOf('(') + 1, expr.lastIndexOf(')')).trim(), scopeVars, line);
            const ch = String(arg)[0] || '';
            if (expr.startsWith('char.IsDigit')) return /[0-9]/.test(ch);
            if (expr.startsWith('char.IsLetter')) return /[a-zA-Zא-ת]/.test(ch);
        }

        // קריאה למתודת מחרוזת: str.Length, str.Substring, str.IndexOf, str.Contains, str.ToUpper, str.ToLower
        const strMethodMatch = expr.match(/^([A-Za-z0-9_\[\], \.]+)\.(Length|Substring|IndexOf|Contains|ToUpper|ToLower|Replace)\s*(?:\((.*)\))?$/);
        if (strMethodMatch) {
            const target = strMethodMatch[1].trim();
            const method = strMethodMatch[2];
            const rawArgs = strMethodMatch[3] !== undefined ? strMethodMatch[3].trim() : null;

            // mat.GetLength(dim)
            if (method === 'GetLength' || (method === 'Length' && target.endsWith('GetLength'))) {
                // יטופל בהמשך
            }

            const targetVal = this.evalExpr(target, scopeVars, line);

            if (method === 'Length') {
                if (targetVal === null || targetVal === undefined) throw { message: `ניסיון לקרוא Length של ערך ריק או null ב-${target}`, line, file: this.currentFile };
                return targetVal.length !== undefined ? targetVal.length : 0;
            }

            const strVal = String(targetVal || '');
            const args = rawArgs ? this.splitArgs(rawArgs).map(a => this.evalExpr(a, scopeVars, line)) : [];

            if (method === 'Substring') {
                const start = args[0] || 0;
                const lenArg = args[1];
                if (lenArg !== undefined) return strVal.substr(start, lenArg);
                return strVal.substring(start);
            }
            if (method === 'IndexOf') {
                return strVal.indexOf(String(args[0] || ''));
            }
            if (method === 'Contains') {
                return strVal.includes(String(args[0] || ''));
            }
            if (method === 'ToUpper') return strVal.toUpperCase();
            if (method === 'ToLower') return strVal.toLowerCase();
            if (method === 'Replace') return strVal.replaceAll(String(args[0] || ''), String(args[1] || ''));
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

        // mat[r, c]
        const matAccessMatch = expr.match(/^([A-Za-z0-9_]+)\[([^,]+),([^\]]+)\]$/);
        if (matAccessMatch) {
            const matName = matAccessMatch[1];
            const r = this.evalExpr(matAccessMatch[2].trim(), scopeVars, line);
            const c = this.evalExpr(matAccessMatch[3].trim(), scopeVars, line);
            const matObj = this.resolveVariable(matName, scopeVars);
            if (!matObj || !matObj.grid) throw { message: `גישה למטריצה שאינה קיימת: ${matName}`, line, file: this.currentFile };
            if (r < 0 || r >= matObj.rows || c < 0 || c >= matObj.cols) {
                throw { message: `חריגה מגבולות המטריצה [${r}, ${c}] במטריצה בגודל ${matObj.rows}x${matObj.cols}`, line, file: this.currentFile };
            }
            matObj.activeCell = { r, c };
            return matObj.grid[r][c];
        }

        // arr[i] או str[i]
        const arrAccessMatch = expr.match(/^([A-Za-z0-9_]+)\[([^\]]+)\]$/);
        if (arrAccessMatch) {
            const name = arrAccessMatch[1];
            const idx = this.evalExpr(arrAccessMatch[2].trim(), scopeVars, line);
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
        }

        // שדה באובייקט obj.field או target[i].field
        const dotMatch = this.splitTopLevelDot(expr);
        if (dotMatch) {
            const targetVal = this.evalExpr(dotMatch.target, scopeVars, line);
            const field = dotMatch.member;
            if (targetVal && typeof targetVal === 'object' && targetVal._heapId) {
                return targetVal.fields[field];
            }
            if (Array.isArray(targetVal) && field === 'Length') {
                return targetVal.length;
            }
            if (typeof targetVal === 'string' && field === 'Length') {
                return targetVal.length;
            }
        }

        // קריאה לפונקציה מקומית או סטטית: FuncName(args)
        const funcCallMatch = expr.match(/^([A-Za-z0-9_]+)\s*\((.*)\)$/);
        if (funcCallMatch) {
            const funcName = funcCallMatch[1];
            const rawArgs = funcCallMatch[2].trim();
            const args = rawArgs.length > 0 ? this.splitArgs(rawArgs).map(a => this.evalExpr(a, scopeVars, line)) : [];
            return this.callStaticOrLocalFunction(funcName, args, line);
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
        return {
            _isMatrix: true,
            type: 'int[,]',
            rows: rowCount,
            cols: colCount,
            grid: rows,
            activeCell: null
        };
    }

    instantiateClass(className, args, line) {
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

        // הפעלת בנאי
        if (cls.constructors.length > 0) {
            const ctor = cls.constructors[0];
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
            this.executeBlock(ctor.body, ctor.line, ctor.fileName, ctorVars);
            this.callStack.pop();
        }

        this.recordFrame(line, `יצירת מופע חדש ב-Heap: new ${className}() [מזהה #${heapId}]`);
        return instance;
    }

    callStaticOrLocalFunction(funcName, args, line) {
        for (const cls of this.ast.classes) {
            for (const m of cls.methods) {
                if (m.name === funcName) {
                    return this.invokeMethod(cls, m, null, args);
                }
            }
        }
        throw { message: `קריאה לפונקציה שאינה מוכרת: ${funcName}()`, line, file: this.currentFile };
    }

    evalMathCall(expr, scopeVars, line) {
        const m = expr.match(/^Math\.([A-Za-z0-9_]+)\s*\((.*)\)$/);
        if (!m) return 0;
        const fn = m[1];
        const args = m[2].trim().length > 0 ? this.splitArgs(m[2]).map(a => this.evalExpr(a, scopeVars, line)) : [];

        switch (fn) {
            case 'Max': return Math.max(args[0], args[1]);
            case 'Min': return Math.min(args[0], args[1]);
            case 'Abs': return Math.abs(args[0]);
            case 'Pow': return Math.pow(args[0], args[1]);
            case 'Sqrt': return Math.sqrt(args[0]);
            case 'Floor': return Math.floor(args[0]);
            case 'Ceiling': return Math.ceil(args[0]);
            case 'Round': return Math.round(args[0]);
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

        return 0;
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

    recordFrame(line, description, extra = {}) {
        this.stepCount++;
        const currentScope = this.callStack.length > 0 ? { ...this.callStack[this.callStack.length - 1].variables } : {};

        // זיהוי מערכים חד-ממדיים, מטריצות, מחרוזות, ואובייקטים פעילים
        const arrays1D = [];
        const matrices2D = [];
        const strings = [];
        const objects = [];
        const activePointers = {};

        for (const [varName, val] of Object.entries(currentScope)) {
            if (Array.isArray(val)) {
                arrays1D.push({
                    name: varName,
                    length: val.length,
                    items: [...val]
                });
            } else if (val && val._isMatrix) {
                matrices2D.push({
                    name: varName,
                    rows: val.rows,
                    cols: val.cols,
                    grid: val.grid.map(row => [...row]),
                    activeCell: val.activeCell ? { ...val.activeCell } : null
                });
            } else if (typeof val === 'string' && val.length > 0) {
                strings.push({
                    name: varName,
                    value: val,
                    chars: val.split(''),
                    length: val.length
                });
            } else if (val && val._heapId) {
                objects.push({
                    varName: varName,
                    heapId: val._heapId,
                    className: val.className,
                    fields: { ...val.fields }
                });
            } else if (typeof val === 'number') {
                // משתני אינדקס נפוצים (i, j, min, max, left, right וכו')
                if (/^(i|j|k|row|col|idx|min|max|left|right|mid|count|pos)/i.test(varName)) {
                    activePointers[varName] = val;
                }
            }
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
                variables: { ...c.variables }
            })),
            variables: currentScope,
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
