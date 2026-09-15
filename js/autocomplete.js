/**
 * Autocomplete & Code Snippets for 10th Grade C# Fundamentals
 * מרכז מדעי המחשב - בית ספר מקיף דוד טוביהו | אלון שרייבמן
 */

class CSharp10thAutocomplete {
    constructor(textarea, suggestionsBox) {
        this.textarea = textarea;
        this.box = suggestionsBox;
        this.keywords = [
            { text: 'for', display: 'for (לולאה ספורה)', snippet: 'for (int i = 0; i < $1; i++)\n{\n    $0\n}' },
            { text: 'formatrix', display: 'for מקונן לסריקת מטריצה', snippet: 'for (int i = 0; i < mat.GetLength(0); i++)\n{\n    for (int j = 0; j < mat.GetLength(1); j++)\n    {\n        $0\n    }\n}' },
            { text: 'while', display: 'while (לולאת תנאי)', snippet: 'while ($1)\n{\n    $0\n}' },
            { text: 'if', display: 'if (תנאי)', snippet: 'if ($1)\n{\n    $0\n}' },
            { text: 'ifelse', display: 'if / else', snippet: 'if ($1)\n{\n    $2\n}\nelse\n{\n    $0\n}' },
            { text: 'cw', display: 'Console.WriteLine(...) הדפסה עם ירידת שורה', snippet: 'Console.WriteLine($0);' },
            { text: 'cr', display: 'Console.ReadLine() קליטת מחרוזת', snippet: 'Console.ReadLine()' },
            { text: 'cprint', display: 'Console.Write(...) הדפסה באותה שורה', snippet: 'Console.Write($0);' },
            { text: 'parseint', display: 'int.Parse(Console.ReadLine()) קליטת מספר שלם', snippet: 'int.Parse(Console.ReadLine())' },
            { text: 'arr', display: 'int[] arr = new int[size]; מערך חד-ממדי', snippet: 'int[] arr = new int[$1];$0' },
            { text: 'mat', display: 'int[,] mat = new int[rows, cols]; מטריצה דו-ממדית', snippet: 'int[,] mat = new int[$1, $2];$0' },
            { text: 'matrix', display: 'מטריצה מאותחלת ערכים', snippet: 'int[,] mat = {\n    { $1, $2 },\n    { $3, $4 }\n};$0' },
            { text: 'class', display: 'הגדרת מחלקה עם בנאי ושדות', snippet: 'public class $1\n{\n    public $2;\n    \n    public $1()\n    {\n        $0\n    }\n}' },
            { text: 'func', display: 'פונקציה סטטית public static void/int', snippet: 'public static $1 $2($3)\n{\n    $0\n}' },
            { text: 'Math.Max', display: 'Math.Max(a, b) מקסימום', snippet: 'Math.Max($1, $2)$0' },
            { text: 'Math.Min', display: 'Math.Min(a, b) מינימום', snippet: 'Math.Min($1, $2)$0' },
            { text: 'Math.Abs', display: 'Math.Abs(x) ערך מוחלט', snippet: 'Math.Abs($1)$0' },
            { text: 'Math.Pow', display: 'Math.Pow(base, exp) חזקה', snippet: 'Math.Pow($1, $2)$0' },
            { text: 'Math.Sqrt', display: 'Math.Sqrt(x) שורש ריבועי', snippet: 'Math.Sqrt($1)$0' },
            { text: 'Substring', display: 'str.Substring(start, length) תת-מחרוזת', snippet: 'Substring($1, $2)$0' },
            { text: 'IndexOf', display: 'str.IndexOf(char/string) חיפוש תו', snippet: 'IndexOf($1)$0' },
            { text: 'Length', display: '.Length אורך מערך / מחרוזת', snippet: 'Length' },
            { text: 'GetLength', display: 'mat.GetLength(dim) ממד מטריצה', snippet: 'GetLength($1)$0' },
            { text: 'int', display: 'int מספר שלם', snippet: 'int ' },
            { text: 'double', display: 'double מספר ממשי', snippet: 'double ' },
            { text: 'string', display: 'string מחרוזת', snippet: 'string ' },
            { text: 'char', display: 'char תו בודד', snippet: 'char ' },
            { text: 'bool', display: 'bool בוליאני (true/false)', snippet: 'bool ' }
        ];

        this.selectedIndex = 0;
        this.currentSuggestions = [];
        this.bindEvents();
    }

    bindEvents() {
        if (!this.textarea || !this.box) return;

        this.textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.textarea.addEventListener('input', () => this.handleInput());
        document.addEventListener('click', (e) => {
            if (!this.box.contains(e.target) && e.target !== this.textarea) {
                this.hide();
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

    show() {
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
