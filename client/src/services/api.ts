const API_BASE_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
  : (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

function getHeaders(isJson = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('studypal_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(options.body ? true : false),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || data.error || 'An error occurred';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string }) =>
      request<{ success: boolean; user: any; accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    login: (body: { email: string; password: string }) =>
      request<{ success: boolean; user: any; accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    getMe: () => request<{ success: boolean; user: any }>('/auth/me'),
    logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' })
  },

  plans: {
    createPlan: (planData: any) =>
      request<{ success: boolean; message: string; plan: any; taskCount: number }>('/plans', {
        method: 'POST',
        body: JSON.stringify(planData)
      }),
    getActivePlan: () => request<{ success: boolean; plan: any }>('/plans/active'),
    getPlanById: (planId: string) => request<{ success: boolean; plan: any }>(`/plans/${planId}`),
    getAllPlans: () => request<{ success: boolean; plans: any[] }>('/plans')
  },

  tasks: {
    getTodayTasks: (date?: string) =>
      request<{
        success: boolean;
        date: string;
        metrics: { total: number; completed: number; pending: number; missed: number; progressPercentage: number };
        tasks: any[];
      }>(`/tasks/today${date ? `?date=${date}` : ''}`),
    getWeeklyTasks: (startDate?: string) =>
      request<{
        success: boolean;
        startDate: string;
        endDate: string;
        count: number;
        tasks: any[];
      }>(`/tasks/weekly${startDate ? `?startDate=${startDate}` : ''}`),
    completeTask: (taskId: string, actualDuration?: number) =>
      request<{ success: boolean; message: string; task: any }>(`/tasks/${taskId}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({ actualDuration })
      }),
    rescheduleTask: (taskId: string, options: { mode: 'TOMORROW' | 'NEXT_SLOT' | 'CUSTOM_DATE'; targetDate?: string; targetStartTime?: string }) =>
      request<{ success: boolean; message: string; task: any }>(`/tasks/${taskId}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify(options)
      })
  },

  ai: {
    suggestTopics: (body: { subjectName: string; gradeLevel?: string; examType?: string; targetGoal?: string }) =>
      request<{
        success: boolean;
        data: {
          subject: string;
          overview?: string;
          suggestedTopics: Array<{
            name: string;
            estimatedHours: number;
            difficulty: 'EASY' | 'MEDIUM' | 'HARD';
            importance: 'CORE' | 'HIGH_YIELD' | 'ADVANCED';
            keyConcepts: string[];
          }>;
        };
      }>('/ai/suggest-topics', {
        method: 'POST',
        body: JSON.stringify(body)
      }),

    askAssistant: (body: { query: string; planId?: string }) =>
      request<{
        success: boolean;
        data: {
          query: string;
          answer: string;
          timestamp: string;
        };
      }>('/ai/ask-assistant', {
        method: 'POST',
        body: JSON.stringify(body)
      }),

    breakdownTask: (body: { subject?: string; topic: string; duration?: number }) =>
      request<{
        success: boolean;
        data: {
          topic: string;
          totalMinutes: number;
          strategy: string;
          steps: Array<{ phase: string; action: string; deliverable: string }>;
          commonPitfalls: string[];
        };
      }>('/ai/breakdown-task', {
        method: 'POST',
        body: JSON.stringify(body)
      }),

    getRescheduleAdvice: (taskId: string) =>
      request<{
        success: boolean;
        data: {
          recommendedStrategy: string;
          targetDate: string;
          suggestedStartTime: string;
          suggestedDuration: number;
          rationale: string;
          burnoutWarning?: string | null;
          efficiencyTip?: string;
        };
      }>('/ai/reschedule-advice', {
        method: 'POST',
        body: JSON.stringify({ taskId })
      })
  }
};
