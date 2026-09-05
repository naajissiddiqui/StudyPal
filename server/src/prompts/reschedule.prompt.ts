/**
 * Intelligent Adaptive Rescheduling Advisor Prompt
 */

export interface RescheduleContext {
  taskTitle: string;
  subject: string;
  topic: string;
  originalDate: string;
  missedDurationMinutes: number;
  examDate?: string;
  daysUntilExam?: number;
  freeSlotsInComingDays: Array<{
    date: string;
    dayName: string;
    availableMinutes: number;
    currentLoadMinutes: number;
  }>;
}

export function buildAdaptiveReschedulePrompt(context: RescheduleContext): string {
  return `You are StudyPal's Adaptive Timetable Optimization Engine.
A student missed or was unable to complete a scheduled study task. Analyze their schedule and determine the best recovery strategy without causing burnout or timetable collapse.

MISSED TASK:
- Title: ${context.taskTitle}
- Subject: ${context.subject} (${context.topic})
- Original Date: ${context.originalDate}
- Duration Needed: ${context.missedDurationMinutes} minutes
- Days until Exam: ${context.daysUntilExam ?? 'N/A'} (Exam Date: ${context.examDate ?? 'N/A'})

UPCOMING SCHEDULE SLOTS:
${context.freeSlotsInComingDays
  .map(
    (s) =>
      `- Date: ${s.date} (${s.dayName}) | Current Load: ${s.currentLoadMinutes} min | Free Headroom: ${s.availableMinutes} min`
  )
  .join('\n')}

RECOVERY STRATEGY OPTIONS:
1. "IMMEDIATE_NEXT_SLOT": Shift to the next available open slot tomorrow with minimal disruption.
2. "SPLIT_SESSION": Split into two shorter 30-45 min high-intensity sessions across consecutive days.
3. "WEEKEND_CATCHUP": Move to the upcoming weekend buffer block to keep weekdays light.
4. "SWAP_WITH_LIGHT_REVISION": Swap with a lower-priority spaced revision task later in the week.

OUTPUT JSON SCHEMA:
{
  "recommendedStrategy": "IMMEDIATE_NEXT_SLOT" | "SPLIT_SESSION" | "WEEKEND_CATCHUP" | "SWAP_WITH_LIGHT_REVISION",
  "targetDate": "YYYY-MM-DD",
  "suggestedStartTime": "HH:MM",
  "suggestedDuration": number,
  "rationale": "string (1-2 sentences encouraging the student and explaining why this slot is optimal)",
  "burnoutWarning": "string | null (e.g. if daily study would exceed 5 hours, warn gently, else null)",
  "efficiencyTip": "string (Actionable tip to complete this topic faster)"
}

Respond ONLY with valid JSON.`;
}
