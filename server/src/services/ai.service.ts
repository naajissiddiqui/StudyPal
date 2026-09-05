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
  buildStudyAssistantSystemPrompt
} from '../prompts';

// Zod validation schemas for structured AI responses
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
  private primaryModel = 'gemini-3.6-flash';
  private fallbackModel = 'gemini-2.0-flash';

  constructor() {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
      try {
        this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        console.log('[AIService] Google GenAI initialized successfully with Gemini API key');
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
  private async generateWithTimeout(promise: Promise<any>, ms: number = 7000): Promise<any> {
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
   * Core generation wrapper with model fallback & error resilience
   */
  private async generateWithGemini(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.ai) {
      throw new Error('Gemini API client not initialized');
    }

    const payload = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;

    // Try primary model first with 7s timeout
    try {
      const response = await this.generateWithTimeout(
        this.ai.models.generateContent({
          model: this.primaryModel,
          contents: payload
        }),
        7000
      );
      if (response.text) return response.text;
    } catch (primaryErr: any) {
      console.warn(`[AIService] Primary model ${this.primaryModel} failed or timed out:`, primaryErr?.message || primaryErr);
      
      // Attempt fallback model with 7s timeout
      try {
        const fallbackRes = await this.generateWithTimeout(
          this.ai.models.generateContent({
            model: this.fallbackModel,
            contents: payload
          }),
          7000
        );
        if (fallbackRes.text) return fallbackRes.text;
      } catch (fallbackErr: any) {
        console.warn(`[AIService] Fallback model ${this.fallbackModel} also failed:`, fallbackErr?.message || fallbackErr);
        throw fallbackErr;
      }
    }

    throw new Error('Gemini response was empty');
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
