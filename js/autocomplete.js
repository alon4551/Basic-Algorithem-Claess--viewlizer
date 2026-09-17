/**
 * Autocomplete & Code Snippets for C# & Java Fundamentals
 * אלון שרייבמן — מורה פרטי
 */

class CSharp10thAutocomplete {
    constructor(textarea, suggestionsBox) {
        this.textarea = textarea;
        this.box = suggestionsBox;
        this.keywords = [
            { text: 'for', display: 'for (int i = 0; i < n; i++) לולאה ספורה', snippet: 'for (int i = 0; i < $1; i++)\n{\n    $0\n}' },
            { text: 'forarr', display: 'for (int i = 0; i < arr.Length; i++) סריקת מערך', snippet: 'for (int i = 0; i < arr.Length; i++)\n{\n    $0\n}' },
            { text: 'formatrix', display: 'for מקונן לסריקת מטריצה 2D', snippet: 'for (int i = 0; i < mat.GetLength(0); i++)\n{\n    for (int j = 0; j < mat.GetLength(1); j++)\n    {\n        $0\n    }\n}' },
            { text: 'while', display: 'while (condition) לולאת תנאי', snippet: 'while ($1)\n{\n    $0\n}' },
            { text: 'if', display: 'if (condition) משפט תנאי', snippet: 'if ($1)\n{\n    $0\n}' },
            { text: 'ifelse', display: 'if / else תנאי מלא', snippet: 'if ($1)\n{\n    $2\n}\nelse\n{\n    $0\n}' },
            { text: 'cw', display: 'Console.WriteLine(...) הדפסה עם ירידת שורה (C#)', snippet: 'Console.WriteLine($0);' },
            { text: 'sout', display: 'System.out.println(...) הדפסה עם ירידת שורה (Java)', snippet: 'System.out.println($0);' },
            { text: 'System.out.println', display: 'System.out.println(...) הדפסה (Java)', snippet: 'System.out.println($0);' },
            { text: 'System.out.print', display: 'System.out.print(...) הדפסה באותה שורה (Java)', snippet: 'System.out.print($0);' },
            { text: 'cr', display: 'Console.ReadLine() קליטת מחרוזת (C#)', snippet: 'Console.ReadLine()' },
            { text: 'cprint', display: 'Console.Write(...) הדפסה באותה שורה (C#)', snippet: 'Console.Write($0);' },
            { text: 'scanner', display: 'Scanner in = new Scanner(System.in); קליטה (Java)', snippet: 'Scanner in = new Scanner(System.in);$0' },
            { text: 'Scanner', display: 'Scanner in = new Scanner(System.in); קליטה (Java)', snippet: 'Scanner in = new Scanner(System.in);$0' },
            { text: 'nextInt', display: 'in.nextInt() קליטת מספר שלם (Java)', snippet: 'in.nextInt()' },
            { text: 'nextLine', display: 'in.nextLine() קליטת שורת טקסט (Java)', snippet: 'in.nextLine()' },
            { text: 'parseint', display: 'int.Parse / Integer.parseInt קליטת שלם', snippet: 'int.Parse(Console.ReadLine())' },
            { text: 'Integer.parseInt', display: 'Integer.parseInt(str) המרה לשלם (Java)', snippet: 'Integer.parseInt($1)$0' },
            { text: 'parsedouble', display: 'double.Parse / Double.parseDouble קליטת עשרוני', snippet: 'double.Parse(Console.ReadLine())' },
            { text: 'Double.parseDouble', display: 'Double.parseDouble(str) המרה לעשרוני (Java)', snippet: 'Double.parseDouble($1)$0' },
            { text: 'arr', display: 'int[] arr = new int[size]; מערך חד-ממדי', snippet: 'int[] arr = new int[$1];$0' },
            { text: 'newarr', display: 'int[] arr = new int[] { ... }; מערך מאותחל', snippet: 'int[] arr = new int[] { $1 };$0' },
            { text: 'mat', display: 'int[,] mat = new int[rows, cols]; מטריצה דו-ממדית (C#)', snippet: 'int[,] mat = new int[$1, $2];$0' },
            { text: 'mat2d', display: 'int[][] mat = new int[rows][cols]; מטריצה דו-ממדית (Java)', snippet: 'int[][] mat = new int[$1][$2];$0' },
            { text: 'matrix', display: 'int[,] mat = { {...}, {...} }; מטריצה מאותחלת', snippet: 'int[,] mat = {\n    { $1, $2 },\n    { $3, $4 }\n};$0' },
            { text: 'class', display: 'הגדרת מחלקה עם בנאי ושדות', snippet: 'public class $1\n{\n    public $2;\n    \n    public $1()\n    {\n        $0\n    }\n}' },
            { text: 'func', display: 'פונקציה סטטית public static void/int', snippet: 'public static $1 $2($3)\n{\n    $0\n}' },
            { text: 'Math.Max', display: 'Math.Max(a, b) מקסימום', snippet: 'Math.Max($1, $2)$0' },
            { text: 'Math.Min', display: 'Math.Min(a, b) מינימום', snippet: 'Math.Min($1, $2)$0' },
            { text: 'Math.Abs', display: 'Math.Abs(x) ערך מוחלט', snippet: 'Math.Abs($1)$0' },
            { text: 'Math.Pow', display: 'Math.Pow(base, exp) חזקה', snippet: 'Math.Pow($1, $2)$0' },
            { text: 'Math.Sqrt', display: 'Math.Sqrt(x) שורש ריבועי', snippet: 'Math.Sqrt($1)$0' },
            { text: 'Substring', display: 'str.Substring(start, length) תת-מחרוזת (C#)', snippet: 'Substring($1, $2)$0' },
            { text: 'substring', display: 'str.substring(begin, end) תת-מחרוזת (Java)', snippet: 'substring($1, $2)$0' },
            { text: 'charAt', display: 'str.charAt(index) תו במחרוזת (Java)', snippet: 'charAt($1)$0' },
            { text: 'equals', display: 'str.equals(other) השוואת מחרוזות (Java)', snippet: 'equals($1)$0' },
            { text: 'IndexOf', display: 'str.IndexOf(char/string) מיקום תו', snippet: 'IndexOf($1)$0' },
            { text: 'Contains', display: 'str.Contains(text) בדיקת הכלה', snippet: 'Contains($1)$0' },
            { text: 'ToUpper', display: 'str.ToUpper() אותיות גדולות', snippet: 'ToUpper()$0' },
            { text: 'ToLower', display: 'str.ToLower() אותיות קטנות', snippet: 'ToLower()$0' },
            { text: 'Length', display: '.Length אורך מערך או מחרוזת', snippet: 'Length' },
            { text: 'length', display: '.length / .length() אורך מערך או מחרוזת', snippet: 'length' },
            { text: 'GetLength', display: 'mat.GetLength(dim) גודל ממד במטריצה (C#)', snippet: 'GetLength($1)$0' },
            { text: 'int', display: 'int טיפוס שלם', snippet: 'int ' },
            { text: 'double', display: 'double טיפוס ממשי', snippet: 'double ' },
            { text: 'string', display: 'string טיפוס מחרוזת (C#)', snippet: 'string ' },
            { text: 'String', display: 'String טיפוס מחרוזת (Java)', snippet: 'String ' },
            { text: 'char', display: 'char טיפוס תו בודד', snippet: 'char ' },
            { text: 'bool', display: 'bool בוליאני (C#)', snippet: 'bool ' },
            { text: 'boolean', display: 'boolean בוליאני (Java)', snippet: 'boolean ' },
            { text: 'true', display: 'true אמת', snippet: 'true' },
            { text: 'false', display: 'false שקר', snippet: 'false' },
            { text: 'return', display: 'return ערך החזרה', snippet: 'return $0;' },
            { text: 'break', display: 'break יציאה מלולאה', snippet: 'break;' },
            { text: 'continue', display: 'continue מעבר לאיטרציה הבאה', snippet: 'continue;' }
        ];

        this.selectedIndex = 0;
        this.currentSuggestions = [];
        this.bindEvents();
    }

    bindEvents() {
        if (!this.textarea || !this.box) return;

        this.textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.textarea.addEventListener('input', () => this.handleInput());

        // סגירה כאשר לוחצים בכל מקום מחוץ לחלון ההשלמה האוטומטית
        document.addEventListener('mousedown', (e) => {
            if (this.box.style.display !== 'none' && !this.box.contains(e.target)) {
                this.hide();
            }
        });

        // סגירה כאשר החלון מאבד פוקוס
        window.addEventListener('blur', () => this.hide());

        // עדכון מיקום החלון בעת גלילת הטקסט
        this.textarea.addEventListener('scroll', () => {
            if (this.box.style.display !== 'none') {
                this.updatePosition();
            }
        });
    }

    getCurrentWord() {
        const text = this.textarea.value;
        const pos = this.textarea.selectionStart;
        let start = pos - 1;
        while (start >= 0 && /[a-zA-Z0-9_\.]/.test(text[start])) {
            start--;
        }
        return {
            word: text.slice(start + 1, pos),
            start: start + 1,
            end: pos
        };
    }

    handleInput() {
        const { word } = this.getCurrentWord();
        if (word.length < 1) {
            this.hide();
            return;
        }

        const lower = word.toLowerCase();
        this.currentSuggestions = this.keywords.filter(k => 
            k.text.toLowerCase().startsWith(lower) || 
            (lower.length >= 2 && k.text.toLowerCase().includes(lower))
        );

        if (this.currentSuggestions.length === 0) {
            this.hide();
            return;
        }

        this.selectedIndex = 0;
        this.renderSuggestions();
        this.show();
    }

    handleKeyDown(e) {
        if (this.box.style.display === 'none' || this.currentSuggestions.length === 0) {
            // טיפול בהזחה עם Tab
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                const start = this.textarea.selectionStart;
                const end = this.textarea.selectionEnd;
                this.textarea.value = this.textarea.value.substring(0, start) + '    ' + this.textarea.value.substring(end);
                this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
                this.textarea.dispatchEvent(new Event('input'));
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % this.currentSuggestions.length;
            this.updateActiveItem();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + this.currentSuggestions.length) % this.currentSuggestions.length;
            this.updateActiveItem();
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            this.applySuggestion(this.currentSuggestions[this.selectedIndex]);
        } else if (e.key === 'Escape') {
            this.hide();
        }
    }

    applySuggestion(item) {
        if (!item) return;
        const { start, end } = this.getCurrentWord();
        const fullText = this.textarea.value;
        
        let snippet = item.snippet;
        // טיפול במילוי נקודת קוורסור $0 / $1
        let cursorPos = -1;
        if (snippet.includes('$0') || snippet.includes('$1')) {
            const firstPlaceholder = snippet.indexOf('$1') !== -1 ? '$1' : '$0';
            cursorPos = start + snippet.indexOf(firstPlaceholder);
            snippet = snippet.replace(/\$[0-9]/g, '');
        }

        const newText = fullText.slice(0, start) + snippet + fullText.slice(end);
        this.textarea.value = newText;

        const finalCursor = (cursorPos !== -1) ? cursorPos : (start + snippet.length);
        this.textarea.selectionStart = this.textarea.selectionEnd = finalCursor;
        this.textarea.focus();
        this.textarea.dispatchEvent(new Event('input'));
        this.hide();
    }

    renderSuggestions() {
        this.box.innerHTML = '';
        this.currentSuggestions.slice(0, 8).forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item' + (idx === this.selectedIndex ? ' active' : '');
            div.innerHTML = `<span class="ac-text">${item.text}</span> <span class="ac-desc">${item.display}</span>`;
            div.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.applySuggestion(item);
            });
            this.box.appendChild(div);
        });
    }

    updateActiveItem() {
        const items = this.box.querySelectorAll('.autocomplete-item');
        items.forEach((it, idx) => {
            it.classList.toggle('active', idx === this.selectedIndex);
        });
        if (items[this.selectedIndex]) {
            items[this.selectedIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    updatePosition() {
        if (!this.textarea || !this.box) return;

        const pos = this.textarea.selectionStart || 0;
        const textBefore = this.textarea.value.substring(0, pos);
        const lines = textBefore.split('\n');
        const lineIndex = lines.length - 1;
        const colIndex = lines[lineIndex].length;

        // חישוב גובה שורה ורוחב תו מוערך לעורך קוד
        const lineHeight = 23.2;
        const charWidth = 8.5;
        const paddingOffset = 10;
        const lineNumGutter = 48;

        const computedTop = paddingOffset + ((lineIndex + 1) * lineHeight) - this.textarea.scrollTop;
        const computedLeft = lineNumGutter + (colIndex * charWidth) - this.textarea.scrollLeft;

        const editorHeight = this.textarea.clientHeight || 400;
        const editorWidth = this.textarea.clientWidth || 600;

        let top = computedTop + 4;
        if (top + 220 > editorHeight && computedTop - 220 > 0) {
            top = computedTop - lineHeight - 210;
        }

        let left = Math.max(50, Math.min(computedLeft, editorWidth - 270));

        this.box.style.top = `${Math.max(4, top)}px`;
        this.box.style.left = `${left}px`;
    }

    show() {
        this.updatePosition();
        this.box.style.display = 'block';
    }

    hide() {
        this.box.style.display = 'none';
        this.currentSuggestions = [];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSharp10thAutocomplete;
}
