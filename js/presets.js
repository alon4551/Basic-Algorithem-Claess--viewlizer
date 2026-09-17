/**
 * Presets Library - 10th Grade C# & Java Fundamentals
 * אלון שרייבמן — מורה פרטי
 * 6 דוגמאות בסיס קנוניות המייצגות את נושאי הליבה של שכבת י' ב-C# וב-Java
 */

const PRESETS_10TH_CS = {
    'empty_main': {
        id: 'empty_main',
        title: '0. תוכנית ריקה (פרויקט ברירת מחדל)',
        category: 'all',
        categoryName: 'ברירת מחדל',
        description: 'תבנית C# בסיסית ונקייה עם פונקציית Main בלבד, מוכנה לכתיבת קוד אישי.',
        files: {
            'Program.cs': `public class Program
{
    public static void Main()
    {
        // כתוב את הקוד שלך כאן
        Console.WriteLine("שלום עולם!");
    }
}`
        }
    },

    'array_find_max': {
        id: 'array_find_max',
        title: '1. מערך חד-ממדי: מציאת מקסימום ואינדקס',
        category: 'arrays',
        categoryName: 'מערכים (1D)',
        description: 'סריקה ליניארית של מערך מספרים שלמים, מציאת הערך המקסימלי ומיקומו (אינדקס) במערך.',
        files: {
            'Program.cs': `public class Program
{
    public static void Main()
    {
        int[] arr = { 14, 52, 28, 89, 41, 63 };
        
        int maxVal = arr[0];
        int maxIndex = 0;
        
        for (int i = 1; i < arr.Length; i++)
        {
            if (arr[i] > maxVal)
            {
                maxVal = arr[i];
                maxIndex = i;
            }
        }
        
        Console.WriteLine("הערך המקסימלי שנמצא: " + maxVal);
        Console.WriteLine("מיקום המקסימום (אינדקס): " + maxIndex);
    }
}`
        }
    },

    'matrix_diagonals': {
        id: 'matrix_diagonals',
        title: '2. מטריצה דו-ממדית: סכום אלכסון ראשי ומשני',
        category: 'matrices',
        categoryName: 'מטריצות (2D)',
        description: 'סריקת מטריצה ריבועית (3x3), חישוב סכום האלכסון הראשי (i == j) וסכום האלכסון המשני (i + j == n - 1), ובדיקה האם הם שווים.',
        files: {
            'Program.cs': `public class Program
{
    public static void Main()
    {
        // הגדרת מטריצה ריבועית 3 על 3
        int[,] mat = {
            { 8, 3, 5 },
            { 4, 6, 2 },
            { 7, 1, 9 }
        };
        
        int n = mat.GetLength(0);
        int mainDiagSum = 0;
        int secondaryDiagSum = 0;
        
        for (int i = 0; i < n; i++)
        {
            // איבר באלכסון הראשי
            mainDiagSum += mat[i, i];
            
            // איבר באלכסון המשני
            secondaryDiagSum += mat[i, n - 1 - i];
        }
        
        Console.WriteLine("סכום אלכסון ראשי: " + mainDiagSum);
        Console.WriteLine("סכום אלכסון משני: " + secondaryDiagSum);
        
        if (mainDiagSum == secondaryDiagSum)
        {
            Console.WriteLine("האלכסונים שווים בסכומם!");
        }
        else
        {
            Console.WriteLine("האלכסונים אינם שווים.");
        }
    }
}`
        }
    },

    'string_palindrome': {
        id: 'string_palindrome',
        title: '3. מחרוזות ותווים: בדיקת פלינדרום',
        category: 'strings',
        categoryName: 'מחרוזות (Strings)',
        description: 'בדיקה האם מילה נקראת אותו הדבר משני הכיוונים באמצעות שני מצביעים (left ו-right) שנעים מהקצוות למרכז.',
        files: {
            'Program.cs': `public class Program
{
    public static void Main()
    {
        string word = "RADAR";
        bool isPalindrome = true;
        
        int left = 0;
        int right = word.Length - 1;
        
        while (left < right)
        {
            if (word[left] != word[right])
            {
                isPalindrome = false;
                break;
            }
            left++;
            right--;
        }
        
        if (isPalindrome)
        {
            Console.WriteLine("המילה " + word + " היא פלינדרום!");
        }
        else
        {
            Console.WriteLine("המילה " + word + " אינה פלינדרום.");
        }
    }
}`
        }
    },

    'math_digits_sum': {
        id: 'math_digits_sum',
        title: '4. פונקציות ו-Math: פירוק מספר לספרות וסכום',
        category: 'functions',
        categoryName: 'פונקציות ו-Math',
        description: 'פונקציה סטטית המקבלת מספר שלם ומחשבת את סכום ספרותיו בעזרת אופרטור מודולו (% 10) לחילוץ ספרת אחדות וחילוק שלם (/ 10) להסרתה.',
        files: {
            'Program.cs': `public class Program
{
    // פונקציה המחשבת ומחזירה את סכום הספרות של מספר חיובי
    public static int SumOfDigits(int num)
    {
        int sum = 0;
        int temp = Math.Abs(num);
        
        while (temp > 0)
        {
            int lastDigit = temp % 10; // חילוץ ספרת אחדות
            sum += lastDigit;
            temp = temp / 10;          // הסרת ספרת אחדות
        }
        
        return sum;
    }

    public static void Main()
    {
        int number = 4725;
        int result = SumOfDigits(number);
        
        Console.WriteLine("המספר: " + number);
        Console.WriteLine("סכום הספרות המחושב: " + result);
    }
}`
        }
    },

    'oop_students': {
        id: 'oop_students',
        title: '5. מחלקות ועצמים: מחלקת תלמיד ומערך עצמים',
        category: 'classes',
        categoryName: 'מחלקות ועצמים (OOP)',
        description: 'הגדרת מחלקת תלמיד (Student) עם שדות, בנאי ומתודה, יצירת מערך תלמידים ומציאת התלמיד בעל הציון הגבוה ביותר.',
        files: {
            'Program.cs': `public class Program
{
    public static void Main()
    {
        // יצירת מערך של עצמים מסוג Student
        Student[] classroom = new Student[3];
        
        classroom[0] = new Student("נועה", 88);
        classroom[1] = new Student("איתי", 96);
        classroom[2] = new Student("מאיה", 91);
        
        Student topStudent = classroom[0];
        
        for (int i = 1; i < classroom.Length; i++)
        {
            if (classroom[i].grade > topStudent.grade)
            {
                topStudent = classroom[i];
            }
        }
        
        Console.WriteLine("התלמיד המצטיין הוא: " + topStudent.name);
        Console.WriteLine("עם הציון: " + topStudent.grade);
    }
}`,
            'Student.cs': `public class Student
{
    public string name;
    public int grade;
    
    // בנאי (Constructor)
    public Student(string name, int grade)
    {
        this.name = name;
        this.grade = grade;
    }
    
    public bool IsPassing()
    {
        return this.grade >= 55;
    }
}`
        }
    },

    'counting_array': {
        id: 'counting_array',
        title: '6. מערך מונים: ספירת קולות מועמדים (אינדקס מקונן)',
        category: 'arrays',
        categoryName: 'מערכים (1D)',
        description: 'שימוש בערכי מערך כאינדקס במערך אחר: קריאת פתקי הצבעה (1 עד 4) ועדכון מונה המועמד המתאים בעזרת candidate[votes[i] - 1]++.',
        files: {
            'Program.cs': `public class Program
{
    public static void Main()
    {
        // פתקי הצבעה (מספרי מועמדים בין 1 ל-4)
        int[] votes = { 2, 1, 3, 2, 1, 4, 2 };
        
        // מערך מונים ל-4 מועמדים (אינדקס 0 למועמד 1, אינדקס 1 למועמד 2 וכו')
        int[] candidate = new int[4];
        
        // עדכון המונים בעזרת גישה מקוננת: ערך הפתק הופך לאינדקס
        for (int i = 0; i < votes.Length; i++)
        {
            candidate[votes[i] - 1]++;
        }
        
        // הדפסת תוצאות ההצבעה
        for (int c = 0; c < candidate.Length; c++)
        {
            Console.WriteLine("מועמד " + (c + 1) + ": " + candidate[c] + " קולות");
        }
    }
}`
        }
    }
};

const PRESETS_10TH_JAVA = {
    'empty_main': {
        id: 'empty_main',
        title: '0. תוכנית ריקה (פרויקט ברירת מחדל)',
        category: 'all',
        categoryName: 'ברירת מחדל',
        description: 'תבנית Java בסיסית ונקייה עם פונקציית main בלבד, מוכנה לכתיבת קוד אישי.',
        files: {
            'Main.java': `public class Main {
    public static void main(String[] args) {
        // כתוב את הקוד שלך כאן
        System.out.println("שלום עולם!");
    }
}`
        }
    },

    'array_find_max': {
        id: 'array_find_max',
        title: '1. מערך חד-ממדי: מציאת מקסימום ואינדקס',
        category: 'arrays',
        categoryName: 'מערכים (1D)',
        description: 'סריקה ליניארית של מערך מספרים שלמים, מציאת הערך המקסימלי ומיקומו (אינדקס) במערך.',
        files: {
            'Main.java': `public class Main {
    public static void main(String[] args) {
        int[] arr = { 14, 52, 28, 89, 41, 63 };
        
        int maxVal = arr[0];
        int maxIndex = 0;
        
        for (int i = 1; i < arr.length; i++) {
            if (arr[i] > maxVal) {
                maxVal = arr[i];
                maxIndex = i;
            }
        }
        
        System.out.println("הערך המקסימלי שנמצא: " + maxVal);
        System.out.println("מיקום המקסימום (אינדקס): " + maxIndex);
    }
}`
        }
    },

    'matrix_diagonals': {
        id: 'matrix_diagonals',
        title: '2. מטריצה דו-ממדית: סכום אלכסון ראשי ומשני',
        category: 'matrices',
        categoryName: 'מטריצות (2D)',
        description: 'סריקת מטריצה ריבועית (3x3), חישוב סכום האלכסון הראשי (i == j) וסכום האלכסון המשני (i + j == n - 1), ובדיקה האם הם שווים.',
        files: {
            'Main.java': `public class Main {
    public static void main(String[] args) {
        // הגדרת מטריצה ריבועית 3 על 3 ב-Java
        int[][] mat = {
            { 8, 3, 5 },
            { 4, 6, 2 },
            { 7, 1, 9 }
        };
        
        int n = mat.length;
        int mainDiagSum = 0;
        int secondaryDiagSum = 0;
        
        for (int i = 0; i < n; i++) {
            // איבר באלכסון הראשי
            mainDiagSum += mat[i][i];
            
            // איבר באלכסון המשני
            secondaryDiagSum += mat[i][n - 1 - i];
        }
        
        System.out.println("סכום אלכסון ראשי: " + mainDiagSum);
        System.out.println("סכום אלכסון משני: " + secondaryDiagSum);
        
        if (mainDiagSum == secondaryDiagSum) {
            System.out.println("האלכסונים שווים בסכומם!");
        } else {
            System.out.println("האלכסונים אינם שווים.");
        }
    }
}`
        }
    },

    'string_palindrome': {
        id: 'string_palindrome',
        title: '3. מחרוזות ותווים: בדיקת פלינדרום',
        category: 'strings',
        categoryName: 'מחרוזות (Strings)',
        description: 'בדיקה האם מילה נקראת אותו הדבר משני הכיוונים באמצעות שני מצביעים (left ו-right) שנעים מהקצוות למרכז.',
        files: {
            'Main.java': `public class Main {
    public static void main(String[] args) {
        String word = "RADAR";
        boolean isPalindrome = true;
        
        int left = 0;
        int right = word.length() - 1;
        
        while (left < right) {
            if (word.charAt(left) != word.charAt(right)) {
                isPalindrome = false;
                break;
            }
            left++;
            right--;
        }
        
        if (isPalindrome) {
            System.out.println("המילה " + word + " היא פלינדרום!");
        } else {
            System.out.println("המילה " + word + " אינה פלינדרום.");
        }
    }
}`
        }
    },

    'math_digits_sum': {
        id: 'math_digits_sum',
        title: '4. פונקציות ו-Math: פירוק מספר לספרות וסכום',
        category: 'functions',
        categoryName: 'פונקציות ו-Math',
        description: 'פונקציה סטטית המקבלת מספר שלם ומחשבת את סכום ספרותיו בעזרת אופרטור מודולו (% 10) לחילוץ ספרת אחדות וחילוק שלם (/ 10) להסרתה.',
        files: {
            'Main.java': `public class Main {
    // פונקציה המחשבת ומחזירה את סכום הספרות של מספר חיובי
    public static int sumOfDigits(int num) {
        int sum = 0;
        int temp = Math.abs(num);
        
        while (temp > 0) {
            int lastDigit = temp % 10; // חילוץ ספרת אחדות
            sum += lastDigit;
            temp = temp / 10;          // הסרת ספרת אחדות
        }
        
        return sum;
    }

    public static void main(String[] args) {
        int number = 4725;
        int result = sumOfDigits(number);
        
        System.out.println("המספר: " + number);
        System.out.println("סכום הספרות המחושב: " + result);
    }
}`
        }
    },

    'oop_students': {
        id: 'oop_students',
        title: '5. מחלקות ועצמים: מחלקת תלמיד ומערך עצמים',
        category: 'classes',
        categoryName: 'מחלקות ועצמים (OOP)',
        description: 'הגדרת מחלקת תלמיד (Student) עם שדות, בנאי ומתודה, יצירת מערך תלמידים ומציאת התלמיד בעל הציון הגבוה ביותר.',
        files: {
            'Main.java': `public class Main {
    public static void main(String[] args) {
        // יצירת מערך של עצמים מסוג Student
        Student[] classroom = new Student[3];
        
        classroom[0] = new Student("נועה", 88);
        classroom[1] = new Student("איתי", 96);
        classroom[2] = new Student("מאיה", 91);
        
        Student topStudent = classroom[0];
        
        for (int i = 1; i < classroom.length; i++) {
            if (classroom[i].grade > topStudent.grade) {
                topStudent = classroom[i];
            }
        }
        
        System.out.println("התלמיד המצטיין הוא: " + topStudent.name);
        System.out.println("עם הציון: " + topStudent.grade);
    }
}`,
            'Student.java': `public class Student {
    public String name;
    public int grade;
    
    // בנאי (Constructor)
    public Student(String name, int grade) {
        this.name = name;
        this.grade = grade;
    }
    
    public boolean isPassing() {
        return this.grade >= 55;
    }
}`
        }
    },

    'counting_array': {
        id: 'counting_array',
        title: '6. מערך מונים: ספירת קולות מועמדים (אינדקס מקונן)',
        category: 'arrays',
        categoryName: 'מערכים (1D)',
        description: 'שימוש בערכי מערך כאינדקס במערך אחר: קריאת פתקי הצבעה (1 עד 4) ועדכון מונה המועמד המתאים בעזרת candidate[votes[i] - 1]++.',
        files: {
            'Main.java': `public class Main {
    public static void main(String[] args) {
        // פתקי הצבעה (מספרי מועמדים בין 1 ל-4)
        int[] votes = { 2, 1, 3, 2, 1, 4, 2 };
        
        // מערך מונים ל-4 מועמדים (אינדקס 0 למועמד 1, אינדקס 1 למועמד 2 וכו')
        int[] candidate = new int[4];
        
        // עדכון המונים בעזרת גישה מקוננת: ערך הפתק הופך לאינדקס
        for (int i = 0; i < votes.length; i++) {
            candidate[votes[i] - 1]++;
        }
        
        // הדפסת תוצאות ההצבעה
        for (int c = 0; c < candidate.length; c++) {
            System.out.println("מועמד " + (c + 1) + ": " + candidate[c] + " קולות");
        }
    }
}`
        }
    }
};

// ברירת מחדל ותאימות לאחור
const PRESETS_10TH = PRESETS_10TH_CS;

function getPresets10th(lang) {
    return lang === 'java' ? PRESETS_10TH_JAVA : PRESETS_10TH_CS;
}

if (typeof window !== 'undefined') {
    window.PRESETS_10TH_CS = PRESETS_10TH_CS;
    window.PRESETS_10TH_JAVA = PRESETS_10TH_JAVA;
    window.PRESETS_10TH = PRESETS_10TH;
    window.getPresets10th = getPresets10th;
}

if (typeof globalThis !== 'undefined') {
    globalThis.PRESETS_10TH_CS = PRESETS_10TH_CS;
    globalThis.PRESETS_10TH_JAVA = PRESETS_10TH_JAVA;
    globalThis.PRESETS_10TH = PRESETS_10TH;
    globalThis.getPresets10th = getPresets10th;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PRESETS_10TH,
        PRESETS_10TH_CS,
        PRESETS_10TH_JAVA,
        getPresets10th
    };
}
