/**
 * AI Subject Topic Breakdown & Syllabus Suggester Prompt
 */

export interface TopicSuggestionInput {
  subjectName: string;
  gradeLevel?: string;
  examType?: string; // e.g. "Engineering Semester Finals", "GATE", "SAT", "High School Board"
  targetGoal?: string;
}

export function buildTopicSuggestionPrompt(input: TopicSuggestionInput): string {
  return `You are StudyPal's Academic Syllabus & Curriculum Specialist.
Given a subject name and student context, break down the subject into 6-10 essential, high-yield topics or units needed for mastery.

SUBJECT DETAILS:
- Subject: ${input.subjectName}
- Level / Exam: ${input.gradeLevel || 'Undergraduate / High School'}
- Exam Context: ${input.examType || 'Final Exams'}
- Target Goal: ${input.targetGoal || 'Comprehensive Mastery'}

OUTPUT JSON SCHEMA:
{
  "subject": "${input.subjectName}",
  "overview": "string (1-2 sentences summarizing what this syllabus covers)",
  "suggestedTopics": [
    {
      "name": "string (Topic/Chapter name, e.g. 'Binary Search Trees & AVL Trees')",
      "estimatedHours": number (e.g. 4 to 8),
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "importance": "CORE" | "HIGH_YIELD" | "ADVANCED",
      "keyConcepts": ["string", "string", "string"]
    }
  ]
}

Respond ONLY with valid JSON. No commentary, markdown formatting, or preamble.`;
}

export function buildTaskBreakdownPrompt(subject: string, topic: string, durationMinutes: number): string {
  return `You are StudyPal's Cognitive Learning Coach.
Break down a single study block into structured, actionable sub-steps using the Pomodoro / Active Recall methodology.

SESSION DETAILS:
- Subject: ${subject}
- Topic: ${topic}
- Total Allocated Time: ${durationMinutes} minutes

OUTPUT JSON SCHEMA:
{
  "topic": "${topic}",
  "totalMinutes": ${durationMinutes},
  "strategy": "string (e.g. '50 min Deep Work + 10 min Feynman Recall')",
  "steps": [
    {
      "phase": "string (e.g. 'Phase 1: Concept Absorption (20 min)')",
      "action": "string (Specific step to execute)",
      "deliverable": "string (Concrete proof of learning, e.g. '1 page formula sheet' or '3 solved problems')"
    }
  ],
  "commonPitfalls": ["string", "string"]
}

Respond ONLY with valid JSON.`;
}
