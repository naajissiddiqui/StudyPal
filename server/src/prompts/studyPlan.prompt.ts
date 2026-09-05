/**
 * Study Plan Generation Prompt
 * Guides Gemini to synthesize a structured, pedagogically sound study schedule.
 */

export interface StudentPlanContext {
  studentName?: string;
  gradeLevel: string;
  targetGoal: string;
  subjects: Array<{
    name: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    confidence: 'WEAK' | 'AVERAGE' | 'STRONG';
    examDate?: string;
    topics: string[];
  }>;
  dailyAvailableHours: number;
  preferredStudyTimes: string[]; // e.g. ['MORNING', 'EVENING']
  daysUntilExam: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export function buildStudyPlanSystemPrompt(): string {
  return `You are StudyPal's Chief Pedagogical AI Planner.
Your purpose is to design high-efficiency, personalized, and scientifically backed study timetables for students preparing for exams.

Pedagogical Principles you must strictly apply:
1. Spaced Repetition & Progressive Overload:
   - Phase 1 (Initial 40% of time window): LEARNING & Concept Mastery for all topics (prioritize WEAK confidence & HARD subjects first).
   - Phase 2 (Next 30% of time window): PRACTICE & Problem Solving (application, past paper questions, high-yield problems).
   - Phase 3 (Next 20% of time window): REVISION & Active Recall (flashcards, mistake logs, summary sheets).
   - Phase 4 (Final 10% leading to exam date): MOCK_TEST & Timed Exam Simulation under exam constraints.

2. Workload & Focus Balance:
   - Avoid cognitive fatigue: alternate hard technical subjects with lighter review.
   - Ensure study blocks match the student's preferred study times.
   - Never schedule study tasks for a subject after its exam date has passed.
   - Respect daily study limits strictly.

3. Strict Output Requirements:
   - You MUST respond with ONLY valid JSON (no markdown formatting, no code blocks, no preamble, no trailing commentary).
   - The JSON must adhere strictly to the requested schema.`;
}

export function buildStudyPlanUserPrompt(context: StudentPlanContext): string {
  return `Generate a complete, structured study timetable for the following student profile:

STUDENT PROFILE:
- Level / Target: ${context.gradeLevel} - Goal: "${context.targetGoal}"
- Daily Study Capacity: ${context.dailyAvailableHours} hours/day
- Preferred Time Slots: ${context.preferredStudyTimes.join(', ')}
- Plan Schedule Range: From ${context.startDate} to ${context.endDate} (${context.daysUntilExam} total days)

SUBJECTS & SYLLABUS:
${context.subjects
  .map(
    (s, idx) =>
      `${idx + 1}. ${s.name}
   - Difficulty: ${s.difficulty} | Confidence: ${s.confidence}
   - Exam Date: ${s.examDate || 'Not specified'}
   - Topics: ${s.topics.length > 0 ? s.topics.join(', ') : 'Standard core syllabus'}`
  )
  .join('\n')}

OUTPUT JSON SCHEMA:
{
  "planTitle": "string (e.g. 'Mastery Blueprint: 4-Week Exam Preparation')",
  "pedagogicalStrategy": "string (1-2 sentences explaining how topics were prioritized and spaced)",
  "dailyTargetMinutes": number,
  "tasks": [
    {
      "date": "YYYY-MM-DD (must be between ${context.startDate} and ${context.endDate})",
      "startTime": "HH:MM (24-hour format, e.g. '09:00', '14:00', '19:00')",
      "endTime": "HH:MM (24-hour format, e.g. '10:30', '15:30', '20:30')",
      "duration": number (in minutes, typically 45 to 90),
      "subject": "Exact subject name from list above",
      "topic": "Specific topic name",
      "type": "LEARNING" | "PRACTICE" | "REVISION" | "MOCK_TEST",
      "priority": "LOW" | "MEDIUM" | "HIGH",
      "title": "Concise, actionable task title (e.g. 'Mastery: Dynamic Programming Fundamentals')",
      "description": "Clear study instructions with specific learning action (e.g. 'Derive recurrence relations, solve 4 standard LeetCode medium problems on tabulation vs memoization.')"
    }
  ]
}

Return ONLY the valid JSON object.`;
}
