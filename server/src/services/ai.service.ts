import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '../config/env';
import {
  StudentPlanContext,
  buildStudyPlanSystemPrompt,
  buildStudyPlanUserPrompt,
  TopicSuggestionInput,
  buildTopicSuggestionPrompt,
  buildTaskBreakdownPrompt,
  RescheduleContext,
  buildAdaptiveReschedulePrompt,
  AssistantContext,
  buildStudyAssistantSystemPrompt,
  buildSyllabusParsingSystemPrompt,
  buildSyllabusParsingUserPrompt
} from '../prompts';

// Zod validation schemas for structured AI responses
export const SubtopicStringSchema = z
  .string()
  .trim()
  .min(1, 'Subtopic name cannot be empty')
  .refine(
    (val) => {
      const lower = val.toLowerCase().trim();
      // Reject count or summary patterns like "10 subtopics", "5 topics", "multiple subtopics", "several subtopics", etc.
      const isCount = /^\d+\s*(sub-?topics?|topics?|chapters?|units?|items?|concepts?)$/i.test(lower);
      const isSummary = /^(multiple|several|various|many|few|all|some|no)\s*(sub-?topics?|topics?|chapters?|items?|concepts?)$/i.test(lower);
      const isExplicitCount = /^\d+\s+subtopics?$/i.test(lower);
      return !isCount && !isSummary && !isExplicitCount;
    },
    {
      message: 'Subtopic must be an actual syllabus concept name, not a count or summary string (e.g. "10 subtopics", "5 topics", "multiple subtopics")'
    }
  );

export const AISyllabusSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  overview: z.string().optional(),
  units: z.array(
    z.object({
      name: z.string().min(1, 'Unit or module name is required'),
      topics: z.array(
        z.object({
          name: z.string().min(1, 'Topic name is required'),
          subtopics: z.array(SubtopicStringSchema).default([]),
          keyConcepts: z.array(z.string()).default([])
        })
      ).min(1, 'At least 1 topic is required per unit')
    })
  ).min(1, 'At least 1 unit or module is required per subject')
});

export const AISyllabusResponseSchema = z.object({
  institution: z.string().optional(),
  program: z.string().optional(),
  subjects: z.array(AISyllabusSubjectSchema).min(1, 'At least 1 subject must be extracted from the syllabus')
});

export type AISyllabusResponse = z.infer<typeof AISyllabusResponseSchema>;
export type AISyllabusSubject = z.infer<typeof AISyllabusSubjectSchema>;

const AITaskSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number().default(60),
  subject: z.string(),
  topic: z.string(),
  type: z.enum(['LEARNING', 'PRACTICE', 'REVISION', 'MOCK_TEST']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  title: z.string(),
  description: z.string()
});

const AIPlanResponseSchema = z.object({
  planTitle: z.string().optional(),
  pedagogicalStrategy: z.string().optional(),
  dailyTargetMinutes: z.number().optional(),
  tasks: z.array(AITaskSchema)
});

const AITopicSuggestionSchema = z.object({
  subject: z.string(),
  overview: z.string().optional(),
  suggestedTopics: z.array(
    z.object({
      name: z.string(),
      estimatedHours: z.number().default(6),
      difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
      importance: z.enum(['CORE', 'HIGH_YIELD', 'ADVANCED']).default('CORE'),
      keyConcepts: z.array(z.string()).default([])
    })
  )
});

const AITaskBreakdownSchema = z.object({
  topic: z.string(),
  totalMinutes: z.number(),
  strategy: z.string(),
  steps: z.array(
    z.object({
      phase: z.string(),
      action: z.string(),
      deliverable: z.string()
    })
  ),
  commonPitfalls: z.array(z.string()).default([])
});

const AIRescheduleAdviceSchema = z.object({
  recommendedStrategy: z.enum([
    'IMMEDIATE_NEXT_SLOT',
    'SPLIT_SESSION',
    'WEEKEND_CATCHUP',
    'SWAP_WITH_LIGHT_REVISION'
  ]),
  targetDate: z.string(),
  suggestedStartTime: z.string(),
  suggestedDuration: z.number(),
  rationale: z.string(),
  burnoutWarning: z.string().nullable().optional(),
  efficiencyTip: z.string().optional()
});

export class AIService {
  private ai: GoogleGenAI | null = null;
  private primaryModel: string;
  private fallbackModel: string;

  constructor() {
    this.primaryModel = env.GEMINI_MODEL || 'gemini-3.6-flash';
    this.fallbackModel = env.GEMINI_FALLBACK_MODEL || 'gemini-flash-latest';

    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
      try {
        this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        console.log(`[AIService] Google GenAI initialized successfully (Primary: ${this.primaryModel}, Fallback: ${this.fallbackModel})`);
      } catch (err) {
        console.warn('[AIService] Failed to instantiate GoogleGenAI client:', err);
      }
    } else {
      console.warn('[AIService] No GEMINI_API_KEY configured. AIService will use deterministic pedagogical fallbacks.');
    }
  }

  public isAIAvailable(): boolean {
    return Boolean(this.ai && env.GEMINI_API_KEY);
  }

  /**
   * Helper to clean JSON markdown wrappers (e.g. ```json ... ```)
   */
  private extractJSON(text: string): string {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return clean;
  }

  /**
   * Helper timeout wrapper to guarantee responsiveness under high load or network latency
   */
  private async generateWithTimeout(promise: Promise<any>, ms: number = 25000): Promise<any> {
    let timer: any;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Gemini API request timed out after ${ms}ms`)), ms);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Evaluates whether an error from Google GenAI is transient (503, 429, 500, timeout, overloaded)
   */
  public isTransientError(err: any): boolean {
    if (!err) return false;
    const status = err.status || err.statusCode || err.response?.status;
    if (status === 503 || status === 429 || status === 500 || status === 502 || status === 504) {
      return true;
    }

    const msg = (err.message || '').toLowerCase();
    return (
      msg.includes('503') ||
      msg.includes('unavailable') ||
      msg.includes('high demand') ||
      msg.includes('spikes in demand') ||
      msg.includes('overloaded') ||
      msg.includes('429') ||
      msg.includes('resource_exhausted') ||
      msg.includes('rate limit') ||
      msg.includes('quota') ||
      msg.includes('timed out') ||
      msg.includes('timeout') ||
      msg.includes('econnreset') ||
      msg.includes('fetch failed') ||
      msg.includes('temporarily')
    );
  }

  /**
   * Evaluates whether an error is permanent and should NOT be retried (400, 401, 403, 404, 422)
   */
  public isPermanentError(err: any): boolean {
    if (!err) return false;
    const status = err.status || err.statusCode || err.response?.status;
    if (status === 400 || status === 401 || status === 403 || status === 404 || status === 422) {
      return true;
    }

    const msg = (err.message || '').toLowerCase();
    return (
      msg.includes('400') ||
      msg.includes('invalid_argument') ||
      msg.includes('401') ||
      msg.includes('unauthenticated') ||
      msg.includes('403') ||
      msg.includes('permission_denied') ||
      msg.includes('404') ||
      msg.includes('not_found') ||
      msg.includes('is not found for api version')
    );
  }

  /**
   * Converts raw API errors into clean, user-friendly errors without exposing raw JSON/secrets
   */
  public sanitizeUserFacingError(err: any): Error {
    const msg = (err?.message || '').toLowerCase();
    const status = err?.status || err?.statusCode || 500;

    if (status === 503 || msg.includes('503') || msg.includes('high demand') || msg.includes('unavailable') || msg.includes('overloaded')) {
      const sanitized: any = new Error('The AI service is temporarily experiencing high demand. Please try processing the syllabus again in a few moments.');
      sanitized.statusCode = 503;
      sanitized.code = 'AI_SERVICE_HIGH_DEMAND';
      return sanitized;
    }

    if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('rate limit')) {
      const sanitized: any = new Error('The AI service rate limit was reached. Please wait a moment and try processing again.');
      sanitized.statusCode = 429;
      sanitized.code = 'AI_RATE_LIMIT_EXCEEDED';
      return sanitized;
    }

    if (msg.includes('timed out') || msg.includes('timeout')) {
      const sanitized: any = new Error('The AI request timed out while analyzing the syllabus. Please try again.');
      sanitized.statusCode = 504;
      sanitized.code = 'AI_REQUEST_TIMEOUT';
      return sanitized;
    }

    if (status === 401 || status === 403 || msg.includes('api_key') || msg.includes('unauthenticated')) {
      const sanitized: any = new Error('AI service authorization failed. Please check your Gemini API key configuration.');
      sanitized.statusCode = 500;
      sanitized.code = 'AI_AUTH_ERROR';
      return sanitized;
    }

    const sanitized: any = new Error('The AI service is temporarily busy. Please try processing the syllabus again.');
    sanitized.statusCode = status >= 400 && status < 600 ? status : 503;
    sanitized.code = 'AI_SERVICE_UNAVAILABLE';
    return sanitized;
  }

  /**
   * Invokes a specific model with exponential backoff for transient 503/429/timeout errors
   */
  public async callModelWithRetry(
    model: string,
    payload: string,
    maxRetries = 3,
    initialDelayMs = 1000,
    backoffMultiplier = 2,
    timeoutMs = 25000
  ): Promise<string> {
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.generateWithTimeout(
          this.ai!.models.generateContent({
            model,
            contents: payload
          }),
          timeoutMs
        );

        if (response && response.text) {
          if (attempt > 1) {
            console.log(`[AIService] Model ${model} recovered and succeeded on attempt ${attempt}/${maxRetries}`);
          }
          return response.text;
        }
        throw new Error(`Empty response returned by Gemini model ${model}`);
      } catch (err: any) {
        lastError = err;
        const isTransient = this.isTransientError(err);
        const isPermanent = this.isPermanentError(err);

        console.warn(
          `[AIService] Model ${model} attempt ${attempt}/${maxRetries} failed (transient: ${isTransient}, permanent: ${isPermanent}):`,
          err?.message || err
        );

        // Fail fast on permanent errors (400, 401, 403, 404)
        if (isPermanent) {
          throw err;
        }

        // On transient errors, back off exponentially if attempts remain
        if (attempt < maxRetries) {
          const delay = Math.min(6000, initialDelayMs * Math.pow(backoffMultiplier, attempt - 1)) + Math.floor(Math.random() * 200);
          console.log(`[AIService] Transient error on ${model}. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`Model ${model} failed after ${maxRetries} attempts`);
  }

  /**
   * Core generation wrapper with model fallback & error resilience
   */
  private async generateWithGemini(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.ai) {
      const err: any = new Error('Gemini API client not initialized. Please verify GEMINI_API_KEY.');
      err.statusCode = 503;
      throw err;
    }

    const payload = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;

    console.log(`[AIService] Trying primary model: ${this.primaryModel}`);

    // 1. Attempt Primary Model with exponential retries
    try {
      const result = await this.callModelWithRetry(this.primaryModel, payload, 3, 1000, 2, 25000);
      return result;
    } catch (primaryErr: any) {
      const primaryStatus = primaryErr.status || primaryErr.statusCode || (this.isTransientError(primaryErr) ? '503' : 'Error');
      console.warn(`[AIService] Primary failed: ${primaryStatus} (${primaryErr?.message || primaryErr})`);

      // 2. Attempt Fallback Model with exponential retries
      if (this.fallbackModel && this.fallbackModel !== this.primaryModel) {
        console.log(`[AIService] Switching to fallback model: ${this.fallbackModel}`);
        try {
          const fallbackResult = await this.callModelWithRetry(this.fallbackModel, payload, 3, 1000, 2, 25000);
          return fallbackResult;
        } catch (fallbackErr: any) {
          const fallbackStatus = fallbackErr.status || fallbackErr.statusCode || (this.isTransientError(fallbackErr) ? '503' : 'Error');
          console.error(`[AIService] Fallback failed: ${fallbackStatus} (${fallbackErr?.message || fallbackErr})`);
          throw this.sanitizeUserFacingError(fallbackErr);
        }
      }

      throw this.sanitizeUserFacingError(primaryErr);
    }
  }

  /**
   * Generates or enriches study tasks with structured titles and actionable descriptions
   */
  async generateTaskDetails(input: {
    subjectName: string;
    topic: string;
    type: 'LEARNING' | 'PRACTICE' | 'REVISION' | 'MOCK_TEST';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    confidence: 'WEAK' | 'AVERAGE' | 'STRONG';
  }): Promise<{ title: string; description: string }> {
    const { subjectName, topic, type, difficulty, confidence } = input;
    let title = '';
    let description = '';

    switch (type) {
      case 'LEARNING':
        title = `Core Concepts: ${topic}`;
        description = confidence === 'WEAK'
          ? `Deep dive into fundamentals of ${topic}. Read primary lecture notes, sketch concept diagrams, and write out key definitions.`
          : `Understand foundational theories and core formulas for ${topic}. Build a concise one-page summary cheat sheet.`;
        break;

      case 'PRACTICE':
        title = `Problem Solving: ${topic}`;
        description = difficulty === 'HARD'
          ? `Solve 6-8 challenging graded problems on ${topic}. Focus on edge cases and write clean step-by-step proofs/solutions.`
          : `Solve standard practice problem sets for ${topic}. Test active recall and identify any recurring calculation errors.`;
        break;

      case 'REVISION':
        title = `Spaced Revision: ${topic}`;
        description = `Quick active-recall drill on ${topic}. Review flashcards, high-yield formula sheets, and past mistake logs.`;
        break;

      case 'MOCK_TEST':
        title = `Timed Simulation: ${subjectName}`;
        description = `Strictly timed sectional mock test covering ${topic} and related units. Simulate actual exam conditions with zero interruptions.`;
        break;

      default:
        title = `Study Block: ${topic}`;
        description = `Focused study session covering ${topic} in ${subjectName}.`;
    }

    return { title, description };
  }

  /**
   * Parse & structure raw extracted syllabus text into all subjects, units, topics, and subtopics.
   * Strictly grounded in the provided syllabus text (no hallucination/dictionary fallback).
   */
  async parseSyllabusWithAI(syllabusText: string): Promise<AISyllabusResponse> {
    if (!syllabusText || syllabusText.trim().length < 20) {
      const err: any = new Error('Insufficient syllabus text provided for parsing');
      err.statusCode = 400;
      throw err;
    }

    if (!this.isAIAvailable()) {
      const err: any = new Error('Gemini AI service is not available. Please verify your GEMINI_API_KEY configuration.');
      err.statusCode = 503;
      throw err;
    }

    try {
      const systemPrompt = buildSyllabusParsingSystemPrompt();
      const userPrompt = buildSyllabusParsingUserPrompt({ syllabusText });
      const rawResponse = await this.generateWithGemini(userPrompt, systemPrompt);
      const jsonStr = this.extractJSON(rawResponse);
      const parsed = JSON.parse(jsonStr);
      const validated = AISyllabusResponseSchema.parse(parsed);

      return validated;
    } catch (err: any) {
      console.error('[AIService] parseSyllabusWithAI failed:', err?.message || err);

      if (err instanceof z.ZodError) {
        const issueMsg = err.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ');
        const customErr: any = new Error(`Syllabus AI output did not match required schema (${issueMsg}). Please retry with a clearer syllabus document.`);
        customErr.statusCode = 422;
        throw customErr;
      }

      if (err instanceof SyntaxError) {
        const customErr: any = new Error('Gemini returned an unreadable response format. Please retry processing your syllabus.');
        customErr.statusCode = 502;
        throw customErr;
      }

      throw err;
    }
  }

  /**
   * 1. Generate Structured AI Study Plan
   */
  async generateStudyPlanWithAI(context: StudentPlanContext) {
    if (!this.isAIAvailable()) {
      return null;
    }

    try {
      const systemPrompt = buildStudyPlanSystemPrompt();
      const userPrompt = buildStudyPlanUserPrompt(context);
      const rawResponse = await this.generateWithGemini(userPrompt, systemPrompt);
      const jsonStr = this.extractJSON(rawResponse);
      const parsed = JSON.parse(jsonStr);
      const validated = AIPlanResponseSchema.parse(parsed);

      return validated;
    } catch (err) {
      console.warn('[AIService] generateStudyPlanWithAI error, falling back to deterministic planner:', err);
      return null;
    }
  }

  /**
   * 2. Suggest High-Yield Topics for a Subject
   */
  async suggestTopicsWithAI(input: TopicSuggestionInput) {
    if (this.isAIAvailable()) {
      try {
        const prompt = buildTopicSuggestionPrompt(input);
        const rawResponse = await this.generateWithGemini(prompt);
        const jsonStr = this.extractJSON(rawResponse);
        const parsed = JSON.parse(jsonStr);
        const validated = AITopicSuggestionSchema.parse(parsed);
        return validated;
      } catch (err) {
        console.warn('[AIService] suggestTopicsWithAI failed, using smart syllabus dictionary:', err);
      }
    }

    // Deterministic fallback dictionary for popular academic subjects
    return this.getFallbackTopics(input.subjectName);
  }

  /**
   * 3. Ask StudyPal Contextual AI Assistant
   */
  async askStudyAssistantWithAI(userQuery: string, context: AssistantContext): Promise<string> {
    if (this.isAIAvailable()) {
      try {
        const systemPrompt = buildStudyAssistantSystemPrompt(context);
        const prompt = `STUDENT QUESTION:\n"${userQuery}"\n\nPlease provide a clear, encouraging, structured response tailored to my current study plan.`;
        const response = await this.generateWithGemini(prompt, systemPrompt);
        return response.trim();
      } catch (err: any) {
        console.warn('[AIService] askStudyAssistantWithAI failed:', err?.message || err);
      }
    }

    // Intelligent pedagogical fallback responses
    return this.getFallbackAssistantResponse(userQuery, context);
  }

  /**
   * 4. AI Granular Task Breakdown
   */
  async breakdownTaskWithAI(subject: string, topic: string, durationMinutes: number) {
    if (this.isAIAvailable()) {
      try {
        const prompt = buildTaskBreakdownPrompt(subject, topic, durationMinutes);
        const rawResponse = await this.generateWithGemini(prompt);
        const jsonStr = this.extractJSON(rawResponse);
        const parsed = JSON.parse(jsonStr);
        return AITaskBreakdownSchema.parse(parsed);
      } catch (err) {
        console.warn('[AIService] breakdownTaskWithAI failed:', err);
      }
    }

    // Deterministic task breakdown
    const half = Math.floor(durationMinutes / 2);
    return {
      topic,
      totalMinutes: durationMinutes,
      strategy: 'Active Recall & Deep Work Cycle',
      steps: [
        {
          phase: `Phase 1: Core Absorption (${half} min)`,
          action: `Read key definitions, formulas, and theorems for ${topic}. Sketch a single-page concept map.`,
          deliverable: 'Summary concept sheet'
        },
        {
          phase: `Phase 2: Practice & Active Recall (${durationMinutes - half} min)`,
          action: `Solve 4-6 representative exam problems on ${topic} without looking at reference answers.`,
          deliverable: 'Completed solution sets + mistake log'
        }
      ],
      commonPitfalls: [
        'Passive re-reading instead of active problem solving',
        'Skipping edge-case scenarios in practice problems'
      ]
    };
  }

  /**
   * 5. AI Adaptive Reschedule Recommendation
   */
  async recommendAdaptiveRescheduleWithAI(context: RescheduleContext) {
    if (this.isAIAvailable()) {
      try {
        const prompt = buildAdaptiveReschedulePrompt(context);
        const rawResponse = await this.generateWithGemini(prompt);
        const jsonStr = this.extractJSON(rawResponse);
        const parsed = JSON.parse(jsonStr);
        return AIRescheduleAdviceSchema.parse(parsed);
      } catch (err) {
        console.warn('[AIService] recommendAdaptiveRescheduleWithAI failed:', err);
      }
    }

    // Fallback recommendation
    const nextSlot = context.freeSlotsInComingDays[0] || {
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      currentLoadMinutes: 60
    };

    return {
      recommendedStrategy: 'IMMEDIATE_NEXT_SLOT' as const,
      targetDate: nextSlot.date,
      suggestedStartTime: '18:00',
      suggestedDuration: Math.min(context.missedDurationMinutes, 60),
      rationale: `Moving ${context.taskTitle} to ${nextSlot.date} maintains momentum without exceeding your daily cognitive threshold.`,
      burnoutWarning: nextSlot.currentLoadMinutes > 180 ? 'Heavy study load on this day. Take regular 10-min Pomodoro breaks.' : null,
      efficiencyTip: 'Prioritize high-yield problem patterns and past exam questions to complete this block efficiently.'
    };
  }

  /**
   * Smart fallback syllabus repository for offline / rate-limited mode
   */
  private getFallbackTopics(subjectName: string) {
    const lower = subjectName.toLowerCase();

    if (lower.includes('data structure') || lower.includes('algorithm') || lower.includes('dsa')) {
      return {
        subject: subjectName,
        overview: 'Fundamental computer science data structures, algorithmic complexity, and dynamic problem solving.',
        suggestedTopics: [
          { name: 'Arrays, Strings & Two-Pointer Techniques', estimatedHours: 4, difficulty: 'EASY' as const, importance: 'CORE' as const, keyConcepts: ['Sliding Window', 'Prefix Sum', 'Two Pointers'] },
          { name: 'Linked Lists & Pointer Manipulation', estimatedHours: 4, difficulty: 'MEDIUM' as const, importance: 'CORE' as const, keyConcepts: ['Cycle Detection', 'Reversal', 'Fast-Slow Pointer'] },
          { name: 'Stacks, Queues & Monotonic Deque', estimatedHours: 5, difficulty: 'MEDIUM' as const, importance: 'HIGH_YIELD' as const, keyConcepts: ['Next Greater Element', 'LRU Cache', 'Recursion simulation'] },
          { name: 'Binary Trees & Tree Traversals (DFS/BFS)', estimatedHours: 6, difficulty: 'MEDIUM' as const, importance: 'CORE' as const, keyConcepts: ['Inorder/Preorder/Postorder', 'Lowest Common Ancestor', 'Path Sum'] },
          { name: 'Binary Search Trees & Heap/Priority Queues', estimatedHours: 6, difficulty: 'MEDIUM' as const, importance: 'HIGH_YIELD' as const, keyConcepts: ['BST validation', 'K-way Merge', 'Top-K Elements'] },
          { name: 'Graph Algorithms (BFS, DFS, Dijkstra, TopoSort)', estimatedHours: 8, difficulty: 'HARD' as const, importance: 'HIGH_YIELD' as const, keyConcepts: ['Shortest Paths', 'Connected Components', 'Bipartite Graphs'] },
          { name: 'Dynamic Programming & Memoization', estimatedHours: 10, difficulty: 'HARD' as const, importance: 'HIGH_YIELD' as const, keyConcepts: ['Knapsack Variants', 'LCS/LIS', 'State Transitions'] }
        ]
      };
    }

    if (lower.includes('operating system') || lower.includes('os')) {
      return {
        subject: subjectName,
        overview: 'Core concepts of operating system architecture, process scheduling, concurrency, and virtual memory.',
        suggestedTopics: [
          { name: 'Processes, Threads & System Calls', estimatedHours: 4, difficulty: 'EASY' as const, importance: 'CORE' as const, keyConcepts: ['Process Control Block', 'Fork/Exec', 'Context Switching'] },
          { name: 'CPU Scheduling Algorithms', estimatedHours: 5, difficulty: 'MEDIUM' as const, importance: 'HIGH_YIELD' as const, keyConcepts: ['FCFS, SJF, Round Robin', 'Multi-Level Feedback Queues'] },
          { name: 'Process Synchronization & Semaphores', estimatedHours: 7, difficulty: 'HARD' as const, importance: 'HIGH_YIELD' as const, keyConcepts: ['Critical Section', 'Mutex & Semaphores', 'Deadlock Detection'] },
          { name: 'Memory Management & Paging', estimatedHours: 6, difficulty: 'MEDIUM' as const, importance: 'CORE' as const, keyConcepts: ['Virtual Memory', 'Page Tables', 'TLB Architecture'] },
          { name: 'Page Replacement Algorithms & Thrashing', estimatedHours: 5, difficulty: 'MEDIUM' as const, importance: 'HIGH_YIELD' as const, keyConcepts: ['LRU, FIFO, Optimal', 'Working Set Model'] },
          { name: 'File Systems & Disk Scheduling', estimatedHours: 4, difficulty: 'EASY' as const, importance: 'CORE' as const, keyConcepts: ['Inodes', 'SCAN/C-SCAN', 'RAID Levels'] }
        ]
      };
    }

    if (lower.includes('math') || lower.includes('calculus') || lower.includes('linear algebra')) {
      return {
        subject: subjectName,
        overview: 'Mathematical foundations, analytical calculus, vector spaces, and theorem applications.',
        suggestedTopics: [
          { name: 'Limits, Continuity & Differentiation Rules', estimatedHours: 5, difficulty: 'EASY' as const, importance: 'CORE' as const, keyConcepts: ['L\'Hopital Rule', 'Chain Rule', 'Implicit Differentiation'] },
          { name: 'Applications of Derivatives & Optimization', estimatedHours: 6, difficulty: 'MEDIUM' as const, importance: 'HIGH_YIELD' as const, keyConcepts: ['Maxima/Minima', 'Mean Value Theorem', 'Curve Sketching'] },
          { name: 'Definite & Indefinite Integration Techniques', estimatedHours: 8, difficulty: 'HARD' as const, importance: 'HIGH_YIELD' as const, keyConcepts: ['Integration by Parts', 'Partial Fractions', 'Trig Substitutions'] },
          { name: 'Differential Equations & Growth Models', estimatedHours: 6, difficulty: 'HARD' as const, importance: 'HIGH_YIELD' as const, keyConcepts: ['Separable Equations', 'Integrating Factors', 'Second Order ODEs'] },
          { name: 'Matrices, Determinants & Eigenvalues', estimatedHours: 6, difficulty: 'MEDIUM' as const, importance: 'CORE' as const, keyConcepts: ['Gaussian Elimination', 'Eigenvectors', 'Rank & Nullity'] }
        ]
      };
    }

    // Generic structured syllabus for any topic
    return {
      subject: subjectName,
      overview: `Structured mastery breakdown for ${subjectName} covering fundamental theory, problem-solving methodologies, and exam revision.`,
      suggestedTopics: [
        { name: `${subjectName} Core Fundamentals & Definitions`, estimatedHours: 5, difficulty: 'EASY' as const, importance: 'CORE' as const, keyConcepts: ['Key Terminology', 'Fundamental Theorems', 'Standard Notation'] },
        { name: `${subjectName} Applied Principles & Standard Models`, estimatedHours: 6, difficulty: 'MEDIUM' as const, importance: 'CORE' as const, keyConcepts: ['Mechanisms', 'Standard Formulations', 'Real-world Applications'] },
        { name: `${subjectName} Advanced Problem Solving & Analysis`, estimatedHours: 8, difficulty: 'HARD' as const, importance: 'HIGH_YIELD' as const, keyConcepts: ['Complex Case Studies', 'Multi-step Problems', 'Edge Cases'] },
        { name: `${subjectName} High-Yield Exam Topics & Synthesis`, estimatedHours: 6, difficulty: 'MEDIUM' as const, importance: 'HIGH_YIELD' as const, keyConcepts: ['Past Exam Questions', 'Formula Derivations', 'Active Recall'] },
        { name: `${subjectName} Comprehensive Review & Mock Practice`, estimatedHours: 4, difficulty: 'MEDIUM' as const, importance: 'ADVANCED' as const, keyConcepts: ['Timed Simulation', 'Error Analysis', 'Speed Drills'] }
      ]
    };
  }

  /**
   * Smart fallback assistant answers
   */
  private getFallbackAssistantResponse(query: string, context: AssistantContext): string {
    const lower = query.toLowerCase();

    if (lower.includes('today') || lower.includes('schedule') || lower.includes('start')) {
      if (context.todayTasksSummary.length > 0) {
        const pending = context.todayTasksSummary.filter((t) => !t.completed);
        return `### 🎯 Your Focus Strategy for Today\n\nYou have **${context.todayTasksSummary.length} task(s)** scheduled for today (${pending.length} pending):\n\n` +
          pending.map((t, idx) => `${idx + 1}. **${t.title}** (${t.subject}, ${t.duration} min)`).join('\n') +
          `\n\n💡 **Coach's Tip**: Start with your highest-priority concept block first using a **50-minute Pomodoro timer**. Drink water and take a 10-minute break between sessions!`;
      } else {
        return `### 🌟 Today's Schedule Overview\n\nYou don't have any pending study blocks scheduled for today! Use this time for light active recall on past topics, or get ahead on upcoming subjects. Your current study streak is **${context.streakDays} days** 🔥!`;
      }
    }

    if (lower.includes('overwhelmed') || lower.includes('behind') || lower.includes('stress')) {
      return `### 🧘 3-Step Reset Plan for When You Feel Overwhelmed\n\n1. **Breathe & Single-Task**: Close all tabs except one. You don't need to study everything today; you only need to complete the very next 25-minute block.\n2. **Use the 2-Minute Rule**: Open your notes and read just 2 paragraphs. Starting breaks inertia.\n3. **Use Adaptive Rescheduling**: If a task was missed, click **Reschedule** on the task card to automatically shift it to a lighter day without breaking your weekly timetable.`;
    }

    if (lower.includes('memoriz') || lower.includes('remember') || lower.includes('recall')) {
      return `### 🧠 The Feynman Active Recall Method\n\nTo lock concepts permanently into long-term memory:\n1. **Close your notes** and write out what you just studied on a blank sheet of paper.\n2. **Explain it simply** as if teaching a beginner student.\n3. **Identify the exact gaps** where your explanation stumbled, then revisit that specific page in your textbook.`;
    }

    return `### 🤖 StudyPal Coaching Insights\n\nBased on your active study plan **"${context.planTitle || 'Exam Preparation'}"**:\n\n- **Overall Progress**: ${context.overallProgressPercentage}% completed across your syllabus.\n- **Subjects Covered**: ${context.subjectsSummary.map((s) => s.name).join(', ')}.\n- **Current Streak**: ${context.streakDays} day(s) 🔥.\n\nKeep maintaining your daily study habit! Feel free to ask me to explain difficult topics, break down complex chapters, or help you organize your daily time slots.`;
  }
}

export const aiService = new AIService();
