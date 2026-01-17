// ============================================================================
// AGENT MODULE INDEX
// ============================================================================
// Barrel export for the agentic system
// Provides convenient imports for all agent-related functionality

// Types
export * from "./types";

// Core Services
export { agentService } from "./AgentService";
export type { LocalIntelligenceEngine, NLPProcessor } from "./AgentService";

// Local Intelligence
export { localIntelligence } from "./LocalIntelligence";
export { 
    LocalIntelligence as LocalIntelligenceClass,
    PatternDetector,
    ProductivityAnalyzer,
    InsightGenerator,
    SuggestionEngine 
} from "./LocalIntelligence";

// NLP Utilities (excluding conflicting types)
// Re-export parseTaskInput, formatParsedTask, and other utilities
export { parseTaskInput, formatParsedTask, suggestPriorityChange, parseRecurrence } from "../nlpUtils";
export type { ParsedTask, ParsedEntity, NlpIntentType as NlpIntent } from "../nlpUtils";

// React Hooks
export { useAgent, useSmartTasks, useAgentMemory } from "./useAgent";

// Component exports
export { SmartTaskInput } from "../../components/agent/SmartTaskInput";
export { SmartSuggestions } from "../../components/agent/SmartSuggestions";

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// 1. Using SmartTaskInput component
import { SmartTaskInput } from "@/lib/agent";

function MyComponent() {
    return (
        <SmartTaskInput 
            onTaskCreated={(task) => console.log("Created:", task)}
            showAnalysis={true}
        />
    );
}

// 2. Using SmartSuggestions component
import { SmartSuggestions } from "@/lib/agent";

function Dashboard() {
    return (
        <SmartSuggestions 
            maxVisible={5}
            showProductivity={true}
            onAction={(suggestion) => handleSuggestion(suggestion)}
        />
    );
}

// 3. Using NLP utilities directly
import { parseTaskInput, parseRecurrence } from "@/lib/agent";

function analyzeInput(text: string) {
    const parsed = parseTaskInput(text);
    console.log("Task:", parsed.name);
    console.log("Priority:", parsed.priority);
    console.log("Date:", parsed.date);
    console.log("Time:", parsed.time);
}

// 4. Using Local Intelligence
import { localIntelligence } from "@/lib/agent";

function analyzeProductivity(tasks: Task[]) {
    const results = localIntelligence.analyze(tasks);
    console.log("Patterns:", results.patterns);
    console.log("Productivity:", results.productivity);
    console.log("Insights:", results.insights);
    console.log("Suggestions:", results.suggestions);
}

// 5. Using Agent Service
import { agentService } from "@/lib/agent";

async function processUserInput(input: string) {
    // Process input
    const perception = agentService.processInput(input);
    
    // Reason about it
    const reasoning = await agentService.reason(perception, []);
    
    // Execute appropriate action
    if (reasoning.strategy === "direct_execution") {
        const result = await agentService.executeAction("create_task", {
            name: perception.entities.find(e => e.type === "task_name")?.value,
        });
        return result;
    }
}
*/

// ============================================================================
// VERSION & METADATA
// ============================================================================

export const AGENT_VERSION = "1.0.0";
export const AGENT_FEATURES = [
    "Natural language task parsing",
    "Client-side habit detection",
    "Productivity analytics",
    "Smart suggestions",
    "Context-aware actions",
    "Local-first architecture",
    "IndexedDB persistence",
];
