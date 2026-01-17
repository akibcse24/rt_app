// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
// Provides comprehensive type-safe validation for all data structures.
// Uses native TypeScript with runtime validation without heavy dependencies.
// Supports both client-side and server-side validation with detailed error reporting.

// ----------------------------------------------------------------------------
// TYPE DEFINITIONS
// ----------------------------------------------------------------------------

// Time block enumeration
export type TimeBlock = "Dawn" | "Morning" | "Noon" | "Afternoon" | "Evening" | "Night";
const TIME_BLOCKS: TimeBlock[] = ["Dawn", "Morning", "Noon", "Afternoon", "Evening", "Night"];

// Day abbreviation enumeration
export type DayAbbreviation = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";
const DAY_ABBREVIATIONS: DayAbbreviation[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Reminder options
export type ReminderOption = "5m" | "15m" | "30m" | "1h" | "1d";
const REMINDER_OPTIONS: ReminderOption[] = ["5m", "15m", "30m", "1h", "1d"];

// Goal priority levels
export type PriorityLevel = "low" | "medium" | "high";
const PRIORITY_LEVELS: PriorityLevel[] = ["low", "medium", "high"];

// Pattern matchers
const TIME_PATTERN = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const URL_PATTERN = /^https?:\/\/[^\s]+$/;
const COLOR_PATTERN = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// ----------------------------------------------------------------------------
// VALIDATION RESULT TYPES
// ----------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  sanitized?: unknown;
}

export interface FieldError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationError {
  valid: boolean;
  errors: FieldError[];
  details: Record<string, string[]>;
}

// ----------------------------------------------------------------------------
// CORE VALIDATION UTILITIES
// ----------------------------------------------------------------------------

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "object" && Object.keys(value).length === 0) return true;
  return false;
}

/**
 * Sanitize string input to prevent XSS and unwanted characters
 */
export function sanitizeString(input: string, maxLength = 1000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

/**
 * Validate UUID format
 */
export function isValidUUID(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/**
 * Validate email format
 */
export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

/**
 * Validate URL format
 */
export function isValidUrl(value: string): boolean {
  return URL_PATTERN.test(value);
}

/**
 * Validate hex color format
 */
export function isValidColor(value: string): boolean {
  return COLOR_PATTERN.test(value);
}

// ----------------------------------------------------------------------------
// TASK VALIDATION
// ----------------------------------------------------------------------------

export interface Task {
  id: string;
  title: string;
  icon: string;
  startTime: string;
  endTime: string;
  timeBlock: TimeBlock;
  days: DayAbbreviation[];
  isCompleted: boolean;
  lastCompletedDate?: string | null;
  completionHistory: string[];
  specificDate?: string;
  reminder?: ReminderOption;
  color?: string;
  notes?: string;
}

/**
 * Validate task object with comprehensive checks
 */
export function validateTask(data: unknown, options?: { strict?: boolean }): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const strict = options?.strict ?? false;

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Task must be an object"] };
  }

  const task = data as Record<string, unknown>;

  // Required string fields
  if (typeof task.id !== "string" || !isValidUUID(task.id)) {
    errors.push("Invalid task ID format (must be UUID)");
  }

  if (typeof task.title !== "string" || task.title.length === 0) {
    errors.push("Title is required");
  } else {
    if (task.title.length > 100) {
      errors.push("Title must be 100 characters or less");
    }
    if (strict && task.title.length < 3) {
      warnings.push("Title might be too short for clear identification");
    }
  }

  if (typeof task.icon !== "string") {
    errors.push("Icon must be a string");
  } else if (task.icon.length > 10) {
    errors.push("Icon must be 10 characters or less");
  }

  if (typeof task.startTime !== "string" || !TIME_PATTERN.test(task.startTime)) {
    errors.push("Invalid start time format (HH:mm)");
  }

  if (typeof task.endTime !== "string" || !TIME_PATTERN.test(task.endTime)) {
    errors.push("Invalid end time format (HH:mm)");
  }

  // Time validation
  if (TIME_PATTERN.test(task.startTime as string) && TIME_PATTERN.test(task.endTime as string)) {
    if ((task.startTime as string) >= (task.endTime as string)) {
      errors.push("End time must be after start time");
    }
  }

  if (!TIME_BLOCKS.includes(task.timeBlock as TimeBlock)) {
    errors.push(`Invalid time block. Must be one of: ${TIME_BLOCKS.join(", ")}`);
  }

  if (!Array.isArray(task.days) || task.days.length === 0) {
    errors.push("At least one day must be selected");
  } else if (!task.days.every((d: unknown) => DAY_ABBREVIATIONS.includes(d as DayAbbreviation))) {
    errors.push("Invalid day abbreviation");
  }

  if (typeof task.isCompleted !== "boolean") {
    errors.push("isCompleted must be a boolean");
  }

  if (!Array.isArray(task.completionHistory)) {
    errors.push("completionHistory must be an array");
  }

  // Optional fields with validation
  if (task.specificDate !== undefined && task.specificDate !== null) {
    if (typeof task.specificDate !== "string") {
      errors.push("specificDate must be a string");
    } else if (task.specificDate && !DATE_PATTERN.test(task.specificDate)) {
      errors.push("Invalid specificDate format (YYYY-MM-DD)");
    }
  }

  if (task.reminder !== undefined && !REMINDER_OPTIONS.includes(task.reminder as ReminderOption)) {
    errors.push(`Invalid reminder. Must be one of: ${REMINDER_OPTIONS.join(", ")}`);
  }

  // Optional color validation
  if (task.color !== undefined && task.color !== null) {
    if (typeof task.color !== "string") {
      errors.push("Color must be a string");
    } else if (!isValidColor(task.color)) {
      errors.push("Invalid color format (must be hex)");
    }
  }

  // Optional notes field
  if (task.notes !== undefined && task.notes !== null) {
    if (typeof task.notes !== "string") {
      errors.push("Notes must be a string");
    } else if (task.notes.length > 1000) {
      errors.push("Notes must be 1000 characters or less");
    }
  }

  return { 
    valid: errors.length === 0, 
    errors, 
    warnings: warnings.length > 0 ? warnings : undefined 
  };
}

/**
 * Create a validation error with field-level details
 */
export function validateTaskWithDetails(data: unknown): ValidationError {
  const details: Record<string, string[]> = {};
  const errors: FieldError[] = [];

  if (!data || typeof data !== "object") {
    return {
      valid: false,
      errors: [{ field: "root", message: "Task must be an object", code: "INVALID_TYPE" }],
      details: { root: ["Task must be an object"] }
    };
  }

  const task = data as Record<string, unknown>;

  // ID validation
  if (typeof task.id !== "string" || !isValidUUID(task.id)) {
    errors.push({ field: "id", message: "Invalid task ID format (must be UUID)", code: "INVALID_UUID" });
    details.id = ["Invalid task ID format (must be UUID)"];
  }

  // Title validation
  if (typeof task.title !== "string" || task.title.length === 0) {
    errors.push({ field: "title", message: "Title is required", code: "REQUIRED" });
    details.title = ["Title is required"];
  } else if (task.title.length > 100) {
    errors.push({ field: "title", message: "Title must be 100 characters or less", code: "MAX_LENGTH" });
    details.title = ["Title must be 100 characters or less"];
  }

  // Time validation
  if (typeof task.startTime !== "string" || !TIME_PATTERN.test(task.startTime)) {
    errors.push({ field: "startTime", message: "Invalid start time format (HH:mm)", code: "INVALID_FORMAT" });
    details.startTime = ["Invalid start time format (HH:mm)"];
  }

  if (typeof task.endTime !== "string" || !TIME_PATTERN.test(task.endTime)) {
    errors.push({ field: "endTime", message: "Invalid end time format (HH:mm)", code: "INVALID_FORMAT" });
    details.endTime = ["Invalid end time format (HH:mm)"];
  }

  // Days validation
  if (!Array.isArray(task.days) || task.days.length === 0) {
    errors.push({ field: "days", message: "At least one day must be selected", code: "REQUIRED" });
    details.days = ["At least one day must be selected"];
  }

  return { valid: errors.length === 0, errors, details };
}

// ----------------------------------------------------------------------------
// GOAL VALIDATION
// ----------------------------------------------------------------------------

export interface Goal {
  id: string;
  title: string;
  description?: string;
  emoji?: string;
  icon?: string;
  category: string;
  priority: PriorityLevel;
  targetDate: string;
  milestones: Milestone[];
  createdAt: string;
  isCompleted: boolean;
  progress?: number;
}

export interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  isCompleted: boolean;
  completedAt?: string;
  order?: number;
}

/**
 * Validate milestone object
 */
export function validateMilestone(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Milestone must be an object"] };
  }

  const milestone = data as Record<string, unknown>;

  if (typeof milestone.id !== "string" || !isValidUUID(milestone.id)) {
    errors.push("Invalid milestone ID format");
  }

  if (typeof milestone.title !== "string" || milestone.title.length === 0) {
    errors.push("Milestone title is required");
  } else if (milestone.title.length > 100) {
    errors.push("Milestone title must be 100 characters or less");
  }

  if (typeof milestone.targetDate !== "string" || !DATE_PATTERN.test(milestone.targetDate)) {
    errors.push("Invalid milestone target date format (YYYY-MM-DD)");
  }

  if (typeof milestone.isCompleted !== "boolean") {
    errors.push("isCompleted must be a boolean");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate goal object
 */
export function validateGoal(data: unknown, options?: { strict?: boolean }): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const strict = options?.strict ?? false;

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Goal must be an object"] };
  }

  const goal = data as Record<string, unknown>;

  // ID validation
  if (typeof goal.id !== "string" || !isValidUUID(goal.id)) {
    errors.push("Invalid goal ID format");
  }

  // Title validation
  if (typeof goal.title !== "string" || goal.title.length === 0) {
    errors.push("Goal title is required");
  } else if (goal.title.length > 100) {
    errors.push("Goal title must be 100 characters or less");
  }

  // Date validation
  if (typeof goal.targetDate !== "string" || !DATE_PATTERN.test(goal.targetDate)) {
    errors.push("Invalid target date format (YYYY-MM-DD)");
  }

  if (typeof goal.isCompleted !== "boolean") {
    errors.push("isCompleted must be a boolean");
  }

  // Priority validation
  if (typeof goal.priority !== "string" || !PRIORITY_LEVELS.includes(goal.priority as PriorityLevel)) {
    errors.push("Priority must be low, medium, or high");
  }

  // Category validation
  if (typeof goal.category !== "string" || goal.category.length === 0) {
    if (strict) {
      warnings.push("Category is recommended for better organization");
    }
  } else if (goal.category.length > 50) {
    errors.push("Category must be 50 characters or less");
  }

  // Description validation (optional)
  if (goal.description !== undefined && goal.description !== null) {
    if (typeof goal.description !== "string") {
      errors.push("Description must be a string");
    } else if (goal.description.length > 500) {
      errors.push("Description must be 500 characters or less");
    }
  }

  // Milestones validation (optional)
  if (goal.milestones !== undefined && goal.milestones !== null) {
    if (!Array.isArray(goal.milestones)) {
      errors.push("Milestones must be an array");
    } else {
      goal.milestones.forEach((milestone, index) => {
        const result = validateMilestone(milestone);
        if (!result.valid) {
          errors.push(`Milestone ${index + 1}: ${result.errors.join(", ")}`);
        }
      });
    }
  }

  // Progress validation (optional)
  if (goal.progress !== undefined && goal.progress !== null) {
    if (typeof goal.progress !== "number") {
      errors.push("Progress must be a number");
    } else if (goal.progress < 0 || goal.progress > 100) {
      errors.push("Progress must be between 0 and 100");
    }
  }

  return { 
    valid: errors.length === 0, 
    errors, 
    warnings: warnings.length > 0 ? warnings : undefined 
  };
}

// ----------------------------------------------------------------------------
// USER STATS VALIDATION
// ----------------------------------------------------------------------------

export interface UserStats {
  score: number;
  email?: string;
  displayName?: string;
  photoURL?: string | null;
  totalCompleted: number;
  completionRate: number;
  streak: number;
  lastActive?: string;
  longestStreak?: number;
  createdAt?: string;
}

/**
 * Validate user stats
 */
export function validateUserStats(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["User stats must be an object"] };
  }

  const stats = data as Record<string, unknown>;

  // Required numeric fields
  if (typeof stats.score !== "number" || stats.score < 0) {
    errors.push("Score must be a non-negative number");
  }

  if (typeof stats.totalCompleted !== "number" || stats.totalCompleted < 0) {
    errors.push("totalCompleted must be a non-negative number");
  }

  if (typeof stats.completionRate !== "number" || stats.completionRate < 0 || stats.completionRate > 100) {
    errors.push("completionRate must be between 0 and 100");
  }

  if (typeof stats.streak !== "number" || stats.streak < 0) {
    errors.push("streak must be a non-negative number");
  }

  // Optional fields
  if (stats.email !== undefined && stats.email !== null) {
    if (typeof stats.email !== "string") {
      errors.push("Email must be a string");
    } else if (!isValidEmail(stats.email)) {
      errors.push("Invalid email format");
    }
  }

  if (stats.displayName !== undefined && stats.displayName !== null) {
    if (typeof stats.displayName !== "string") {
      errors.push("Display name must be a string");
    } else if (stats.displayName.length > 50) {
      errors.push("Display name must be 50 characters or less");
    }
  }

  if (stats.photoURL !== undefined && stats.photoURL !== null) {
    if (typeof stats.photoURL !== "string") {
      errors.push("Photo URL must be a string");
    } else if (stats.photoURL && !isValidUrl(stats.photoURL)) {
      errors.push("Invalid photo URL format");
    }
  }

  if (stats.longestStreak !== undefined && stats.longestStreak !== null) {
    if (typeof stats.longestStreak !== "number" || stats.longestStreak < 0) {
      errors.push("longestStreak must be a non-negative number");
    }
  }

  return { valid: errors.length === 0, errors };
}

// ----------------------------------------------------------------------------
// USER PROFILE VALIDATION
// ----------------------------------------------------------------------------

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  settings: UserSettings;
}

export interface UserSettings {
  theme?: "light" | "dark" | "system";
  notifications?: boolean;
  reminderDefault?: ReminderOption;
  weekStartsOn?: "SUN" | "MON";
  timezone?: string;
  language?: string;
}

/**
 * Validate user settings
 */
export function validateUserSettings(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["User settings must be an object"] };
  }

  const settings = data as Record<string, unknown>;

  // Theme validation
  if (settings.theme !== undefined) {
    const validThemes = ["light", "dark", "system"];
    if (!validThemes.includes(settings.theme as string)) {
      errors.push("Theme must be light, dark, or system");
    }
  }

  // Notifications validation
  if (settings.notifications !== undefined && typeof settings.notifications !== "boolean") {
    errors.push("Notifications must be a boolean");
  }

  // Reminder validation
  if (settings.reminderDefault !== undefined) {
    if (!REMINDER_OPTIONS.includes(settings.reminderDefault as ReminderOption)) {
      errors.push(`Invalid default reminder. Must be one of: ${REMINDER_OPTIONS.join(", ")}`);
    }
  }

  // Week start validation
  if (settings.weekStartsOn !== undefined) {
    const validDays = ["SUN", "MON"];
    if (!validDays.includes(settings.weekStartsOn as string)) {
      errors.push("Week must start on SUN or MON");
    }
  }

  // Timezone validation (basic check)
  if (settings.timezone !== undefined) {
    if (typeof settings.timezone !== "string") {
      errors.push("Timezone must be a string");
    } else if (settings.timezone.length > 50) {
      errors.push("Timezone must be 50 characters or less");
    }
  }

  // Language validation (basic check)
  if (settings.language !== undefined) {
    if (typeof settings.language !== "string") {
      errors.push("Language must be a string");
    } else if (settings.language.length > 10) {
      errors.push("Language code must be 10 characters or less");
    } else {
      warnings.push("Consider using standard language codes (e.g., 'en', 'zh-CN')");
    }
  }

  return { 
    valid: errors.length === 0, 
    errors, 
    warnings: warnings.length > 0 ? warnings : undefined 
  };
}

/**
 * Validate complete user profile
 */
export function validateUserProfile(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["User profile must be an object"] };
  }

  const profile = data as Record<string, unknown>;

  if (typeof profile.uid !== "string" || !isValidUUID(profile.uid)) {
    errors.push("Invalid user ID format");
  }

  if (typeof profile.email !== "string" || !isValidEmail(profile.email)) {
    errors.push("Invalid email format");
  }

  if (profile.displayName !== undefined && profile.displayName !== null) {
    if (typeof profile.displayName !== "string") {
      errors.push("Display name must be a string");
    } else if (profile.displayName.length > 50) {
      errors.push("Display name must be 50 characters or less");
    }
  }

  if (profile.settings !== undefined && profile.settings !== null) {
    const settingsResult = validateUserSettings(profile.settings);
    if (!settingsResult.valid) {
      errors.push(...settingsResult.errors);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ----------------------------------------------------------------------------
// FIRESTORE DOCUMENT VALIDATION
// ----------------------------------------------------------------------------

export interface FirestoreDocument<T> {
  id: string;
  data: T;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Validate and sanitize data for Firestore
 */
export function sanitizeForFirestore<T extends Record<string, unknown>>(data: T): T {
  const sanitized = { ...data } as Record<string, unknown>;

  // Remove undefined values (Firestore doesn't support them)
  Object.keys(sanitized).forEach((key) => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });

  // Ensure createdAt and updatedAt are Date objects or ISO strings
  const now = new Date().toISOString();
  if (!sanitized.createdAt) {
    sanitized.createdAt = now;
  }
  if (!sanitized.updatedAt) {
    sanitized.updatedAt = now;
  }

  return sanitized as T;
}

/**
 * Batch validation for multiple tasks
 */
export function validateTaskBatch(tasks: unknown[]): { valid: boolean; results: ValidationResult[] } {
  const results = tasks.map((task) => validateTask(task));
  const valid = results.every((result) => result.valid);

  return { valid, results };
}

/**
 * Batch validation for multiple goals
 */
export function validateGoalBatch(goals: unknown[]): { valid: boolean; results: ValidationResult[] } {
  const results = goals.map((goal) => validateGoal(goal));
  const valid = results.every((result) => result.valid);

  return { valid, results };
}

// ----------------------------------------------------------------------------
// PARSE & SAFE VALIDATE UTILITIES
// ----------------------------------------------------------------------------

/**
 * Parse and validate JSON string with error handling
 */
export function parseAndValidateJson<T>(
  jsonString: string,
  validator: (data: unknown) => ValidationResult
): { success: boolean; data?: T; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    const result = validator(data);

    if (result.valid) {
      return { success: true, data: data as T };
    } else {
      return { success: false, error: result.errors.join("; ") };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Invalid JSON" };
  }
}

/**
 * Safe validation wrapper for try-catch scenarios
 */
export function safeValidate<T>(
  data: unknown,
  validator: (data: unknown) => ValidationResult
): { success: boolean; result?: ValidationResult; error?: string } {
  try {
    const result = validator(data);
    return { success: result.valid, result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Validation failed" };
  }
}

// ----------------------------------------------------------------------------
// EXPORT ALL VALIDATORS
// ----------------------------------------------------------------------------

export const validators = {
  task: validateTask,
  taskWithDetails: validateTaskWithDetails,
  taskBatch: validateTaskBatch,
  goal: validateGoal,
  milestone: validateMilestone,
  goalBatch: validateGoalBatch,
  userStats: validateUserStats,
  userProfile: validateUserProfile,
  userSettings: validateUserSettings,
  sanitizeForFirestore,
  parseAndValidateJson,
  safeValidate,
};

export const utils = {
  isEmpty,
  sanitizeString,
  isValidUUID,
  isValidEmail,
  isValidUrl,
  isValidColor,
};
