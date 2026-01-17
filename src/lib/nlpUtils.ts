// ============================================================================
// NLP UTILITIES
// ============================================================================
// Client-side natural language processing for task parsing
// Regex-based parsing for dates, times, priorities, and entities
// No external dependencies - runs entirely in the browser

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ParsedEntity {
    type: string;
    value: string;
    confidence: number;
    startIndex: number;
    endIndex: number;
}

export interface ParsedTask {
    raw: string;
    name: string;
    date: string | null;
    time: string | null;
    priority: number;
    category: string | null;
    isRecurring: boolean;
    duration: number | null;
    intent: NlpIntentType;
    entities: ParsedEntity[];
}

export type NlpIntentType = 
    | "create"
    | "update"
    | "delete"
    | "complete"
    | "schedule"
    | "query"
    | "remind"
    | "routine"
    | "focus"
    | "chat"
    | "unknown";

// ============================================================================
// PRIORITY CONFIGURATION
// ============================================================================

const PRIORITY_KEYWORDS: Record<string, string[]> = {
    4: ["critical", "emergency", "urgent", "asap", "immediately", "priority 1", "p1", "life or death"],
    3: ["high priority", "important", "priority high", "urgent", "soon", "priority 3", "p3"],
    2: ["medium priority", "normal", "regular", "priority 2", "p2"],
    1: ["low priority", "sometime", "when possible", "eventually", "priority 1", "p1", "not urgent"],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
    work: ["work", "job", "office", "project", "meeting", "deadline", "client"],
    personal: ["personal", "home", "family", "errand", "chore"],
    health: ["health", "exercise", "gym", "workout", "doctor", "medicine", "wellness"],
    finance: ["money", "bill", "payment", "bank", "budget", "invoice", "financial"],
    learning: ["study", "learn", "read", "course", "practice", "training", "education"],
    social: ["call", "meet", "friend", "family", "birthday", "dinner", "party"],
    creative: ["write", "create", "design", "art", "music", "paint", "draw"],
};

// ============================================================================
// TIME PATTERN DEFINITIONS
// ============================================================================

const TIME_PATTERNS = [
    // 24-hour format: 14:30, 9:00
    { regex: /\b(\d{1,2}):(\d{2})\b/g, extract: (m: RegExpMatchArray) => m[0] },
    // 12-hour format with AM/PM: 2:30 PM, 9:00am
    { regex: /\b(\d{1,2}):(\d{2})\s*(am|pm)\b/gi, extract: (m: RegExpMatchArray) => m[0] },
    // Time words: noon, midnight, 3 o'clock
    { regex: /\b(noon|midnight|3\s*o'clock|4\s*o'clock|5\s*o'clock)\b/gi, extract: (m: RegExpMatchArray) => m[0] },
];

const DATE_PATTERNS = [
    // Absolute dates: 2024-01-15, 01/15/2024
    { regex: /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/g },
    // Relative days: today, tomorrow, tonight
    { regex: /\b(today|tomorrow|tonight|this evening|this afternoon|this morning)\b/gi },
    // Days of week: monday, tuesday, etc.
    { regex: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi },
    // In X days/weeks: in 3 days, in 2 weeks
    { regex: /\bin\s+(\d+)\s*(day|week|month)s?\b/gi },
];

const RECURRENCE_PATTERNS = [
    /\b(every day|daily|everyday)\b/gi,
    /\b(every week|weekly)\b/gi,
    /\b(every month|monthly)\b/gi,
    /\b(every weekday|mon-fri|workdays?)\b/gi,
    /\b(every weekend|weekends?)\b/gi,
    /\b(every monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
];

const DURATION_PATTERNS = [
    /\b(\d+)\s*(min|mins|minute|minutes)\b/i,
    /\b(\d+)\s*(hour|hours|hr|hrs)\b/i,
    /\b(\d+)\s*(second|seconds|sec|secs)\b/i,
];

// ============================================================================
// MAIN PARSING FUNCTION
// ============================================================================

export function parseTaskInput(input: string): ParsedTask {
    const entities: ParsedEntity[] = [];
    let name = input;

    // Extract and remove time
    const timeExtraction = extractTime(input);
    if (timeExtraction) {
        entities.push({
            type: "time",
            value: timeExtraction.value,
            confidence: timeExtraction.confidence,
            startIndex: timeExtraction.index,
            endIndex: timeExtraction.index + timeExtraction.value.length,
        });
        name = name.replace(timeExtraction.pattern, "").trim();
    }

    // Extract and remove date
    const dateExtraction = extractDate(input);
    if (dateExtraction) {
        entities.push({
            type: "date",
            value: dateExtraction.value,
            confidence: dateExtraction.confidence,
            startIndex: dateExtraction.index,
            endIndex: dateExtraction.index + dateExtraction.value.length,
        });
        name = name.replace(dateExtraction.pattern, "").trim();
    }

    // Extract and remove duration
    const durationExtraction = extractDuration(input);
    if (durationExtraction) {
        entities.push({
            type: "duration",
            value: durationExtraction.value,
            confidence: durationExtraction.confidence,
            startIndex: durationExtraction.index,
            endIndex: durationExtraction.index + durationExtraction.value.length,
        });
        name = name.replace(durationExtraction.pattern, "").trim();
    }

    // Check for recurrence
    const isRecurring = checkRecurrence(input);

    // Detect priority
    const priority = detectPriority(input);

    // Detect category
    const category = detectCategory(input);

    // Clean up task name
    name = cleanTaskName(name);

    // Detect intent
    const intent = detectIntent(input);

    return {
        raw: input,
        name,
        date: dateExtraction?.date || null,
        time: timeExtraction?.time || null,
        priority,
        category,
        isRecurring,
        duration: durationExtraction?.duration || null,
        intent,
        entities,
    };
}

// ============================================================================
// TIME EXTRACTION
// ============================================================================

function extractTime(input: string): {
    value: string;
    time: string;
    confidence: number;
    index: number;
    pattern: string;
} | null {
    // Check 12-hour format with AM/PM
    const pmMatch = input.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (pmMatch) {
        let hours = parseInt(pmMatch[1]);
        const minutes = pmMatch[2];
        const period = pmMatch[3].toLowerCase();
        
        if (period === "pm" && hours < 12) hours += 12;
        if (period === "am" && hours === 12) hours = 0;
        
        return {
            value: pmMatch[0],
            time: `${hours.toString().padStart(2, "0")}:${minutes}`,
            confidence: 0.95,
            index: pmMatch.index || 0,
            pattern: pmMatch[0],
        };
    }

    // Check 24-hour format
    const match = input.match(/(\d{1,2}):(\d{2})/);
    if (match) {
        const hours = parseInt(match[1]);
        if (hours <= 23) {
            return {
                value: match[0],
                time: match[0],
                confidence: 0.9,
                index: match.index || 0,
                pattern: match[0],
            };
        }
    }

    // Check time words
    if (/\bnoon\b/i.test(input)) {
        const match = input.match(/\bnoon\b/i);
        return {
            value: "12:00 PM",
            time: "12:00",
            confidence: 0.95,
            index: match?.index || 0,
            pattern: "noon",
        };
    }

    if (/\bmidnight\b/i.test(input)) {
        const match = input.match(/\bmidnight\b/i);
        return {
            value: "12:00 AM",
            time: "00:00",
            confidence: 0.95,
            index: match?.index || 0,
            pattern: "midnight",
        };
    }

    return null;
}

// ============================================================================
// DATE EXTRACTION
// ============================================================================

function extractDate(input: string): {
    value: string;
    date: string;
    confidence: number;
    index: number;
    pattern: string;
} | null {
    const now = new Date();
    let dateStr: string | null = null;
    let patternStr = "";
    let confidence = 0.9;
    let index = 0;

    // Check for "today"
    const todayMatch = input.match(/\btoday\b/i);
    if (todayMatch) {
        dateStr = now.toISOString().split("T")[0];
        patternStr = "today";
        index = todayMatch.index || 0;
    }

    // Check for "tomorrow"
    const tomorrowMatch = input.match(/\btomorrow\b/i);
    if (tomorrowMatch) {
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        dateStr = tomorrow.toISOString().split("T")[0];
        patternStr = "tomorrow";
        index = tomorrowMatch.index || 0;
    }

    // Check for days of week
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    for (let i = 0; i < dayNames.length; i++) {
        const dayMatch = input.match(new RegExp(`\\b${dayNames[i]}\\b`, "i"));
        if (dayMatch) {
            const targetDay = i;
            const currentDay = now.getDay();
            let daysUntil = targetDay - currentDay;
            if (daysUntil <= 0) daysUntil += 7;
            
            const targetDate = new Date(now.getTime() + daysUntil * 24 * 60 * 60 * 1000);
            dateStr = targetDate.toISOString().split("T")[0];
            patternStr = dayNames[i];
            index = dayMatch.index || 0;
            confidence = 0.85;
            break;
        }
    }

    // Check for "in X days/weeks"
    const inDaysMatch = input.match(/in\s+(\d+)\s+days?/i);
    if (inDaysMatch && !dateStr) {
        const days = parseInt(inDaysMatch[1]);
        const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        dateStr = targetDate.toISOString().split("T")[0];
        patternStr = inDaysMatch[0];
        index = inDaysMatch.index || 0;
        confidence = 0.8;
    }

    if (dateStr) {
        return {
            value: patternStr,
            date: dateStr,
            confidence,
            index,
            pattern: patternStr,
        };
    }

    return null;
}

// ============================================================================
// DURATION EXTRACTION
// ============================================================================

function extractDuration(input: string): {
    value: string;
    duration: number;
    confidence: number;
    index: number;
    pattern: string;
} | null {
    // Check for minutes
    const minMatch = input.match(/(\d+)\s*(min|mins|minute|minutes)\b/i);
    if (minMatch) {
        const minutes = parseInt(minMatch[1]);
        return {
            value: minMatch[0],
            duration: minutes * 60, // Convert to seconds
            confidence: 0.95,
            index: minMatch.index || 0,
            pattern: minMatch[0],
        };
    }

    // Check for hours
    const hourMatch = input.match(/(\d+)\s*(hour|hours|hr|hrs)\b/i);
    if (hourMatch) {
        const hours = parseInt(hourMatch[1]);
        return {
            value: hourMatch[0],
            duration: hours * 3600, // Convert to seconds
            confidence: 0.95,
            index: hourMatch.index || 0,
            pattern: hourMatch[0],
        };
    }

    return null;
}

// ============================================================================
// RECURRENCE CHECK
// ============================================================================

function checkRecurrence(input: string): boolean {
    return RECURRENCE_PATTERNS.some(pattern => pattern.test(input));
}

// ============================================================================
// PRIORITY DETECTION
// ============================================================================

function detectPriority(input: string): number {
    const lowerInput = input.toLowerCase();

    // Check for explicit priority indicators
    for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
        if (keywords.some(kw => lowerInput.includes(kw))) {
            return parseInt(priority);
        }
    }

    // Default to medium priority
    return 2;
}

// ============================================================================
// CATEGORY DETECTION
// ============================================================================

function detectCategory(input: string): string | null {
    const lowerInput = input.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(kw => lowerInput.includes(kw))) {
            return category;
        }
    }

    return null;
}

// ============================================================================
// INTENT DETECTION
// ============================================================================

function detectIntent(input: string): NlpIntentType {
    const lowerInput = input.toLowerCase();

    if (/create|add|new|make|schedule|set up/i.test(input)) return "create";
    if (/update|change|modify|edit|reschedule/i.test(input)) return "update";
    if (/delete|remove|cancel|drop|eliminate/i.test(input)) return "delete";
    if (/complete|done|finished|check off|mark done|accomplish/i.test(input)) return "complete";
    if (/when|what's due|what do i have|show me/i.test(input)) return "query";
    if (/remind|alarm|notify|alert/i.test(input)) return "remind";
    if (/routine|habit|daily|weekly|every day/i.test(input)) return "routine";
    if (/focus|timer|pomodoro|concentrate/i.test(input)) return "focus";
    if (/help|how|tell me|explain|what is/i.test(input)) return "chat";

    return "unknown";
}

// ============================================================================
// TASK NAME CLEANUP
// ============================================================================

function cleanTaskName(input: string): string {
    let cleaned = input
        // Remove action verbs
        .replace(/^(create|add|new|make|schedule|complete|delete|update|set|start|stop)\s+(a\s+)?(new\s+)?/i, "")
        // Remove filler words
        .replace(/(for me|please|thanks?|thank you|would you|could you)\b/gi, "")
        // Remove extra whitespace
        .replace(/\s+/g, " ")
        .trim();

    // Capitalize first letter
    if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function formatParsedTask(task: ParsedTask): string {
    const parts: string[] = [];

    if (task.name) parts.push(`Task: "${task.name}"`);
    if (task.date) parts.push(`Date: ${task.date}`);
    if (task.time) parts.push(`Time: ${task.time}`);
    if (task.priority) {
        const priorityLabels = ["", "Low", "Medium", "High", "Critical"];
        parts.push(`Priority: ${priorityLabels[task.priority]}`);
    }
    if (task.category) parts.push(`Category: ${task.category}`);
    if (task.isRecurring) parts.push("Recurring: Yes");
    if (task.duration) parts.push(`Duration: ${Math.round(task.duration / 60)} minutes`);
    if (task.intent !== "unknown") parts.push(`Intent: ${task.intent}`);

    return parts.join("\n");
}

export function suggestPriorityChange(
    currentPriority: number,
    taskDetails: { hasDueDate: boolean; isOverdue: boolean; isLongTask: boolean }
): number {
    // Increase priority for overdue tasks
    if (taskDetails.isOverdue) {
        return Math.min(4, currentPriority + 1);
    }

    // Increase priority for tasks with imminent due dates
    if (taskDetails.hasDueDate && !taskDetails.isOverdue) {
        return Math.min(4, currentPriority + 1);
    }

    // Keep priority for long tasks
    if (taskDetails.isLongTask && currentPriority < 3) {
        return 3;
    }

    return currentPriority;
}

export function parseRecurrence(input: string): {
    frequency: "daily" | "weekly" | "monthly" | null;
    daysOfWeek?: number[];
    interval: number;
} | null {
    const lowerInput = input.toLowerCase();

    if (/\b(every day|daily|everyday)\b/.test(lowerInput)) {
        return { frequency: "daily", interval: 1 };
    }

    if (/\b(every week|weekly)\b/.test(lowerInput)) {
        return { frequency: "weekly", interval: 1 };
    }

    if (/\b(every month|monthly)\b/.test(lowerInput)) {
        return { frequency: "monthly", interval: 1 };
    }

    // Check for specific days
    const dayMap: Record<string, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6,
    };

    const days: number[] = [];
    for (const [day, num] of Object.entries(dayMap)) {
        if (new RegExp(`\\bevery\\s+${day}\\b`).test(lowerInput)) {
            days.push(num);
        }
    }

    if (days.length > 0) {
        return { frequency: "weekly", interval: 1, daysOfWeek: days };
    }

    return null;
}
