import { dbService } from './supabase';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const geminiService = {
  getApiKey(): string {
    return localStorage.getItem('life_os_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  },

  setApiKey(key: string) {
    localStorage.setItem('life_os_gemini_api_key', key.trim());
  },

  async chatWithJarvis(userId: string, userMessage: string, history: ChatMessage[] = []): Promise<string> {
    try {
      const apiKey = this.getApiKey();
      
      // 1. Fetch User Context
      const context = await dbService.getUserContext(userId).catch(() => ({}));
      console.log('[Jarvis] Context for model:', context);

      // 2. Prepare System Instruction
      const systemInstruction = `You are Jarvis, the highly intelligent and witty personal assistant for the Life-OS dashboard.
Your goal is to be helpful, concise, and proactive. Use both "Sir" and "Boss" occasionally (interchanging between them) when addressing the user.

CRITICAL INSTRUCTIONS:
1. ALWAYS use the CURRENT USER CONTEXT DATA below to answer questions about tasks, fitness, streaks, or finance budgets/balances.
2. If the user asks "What's on my day?" or similar, summarize 'tasks.pending_today', 'fitness.today_plan', and 'finance.total_balance'.
3. If they have no tasks today, suggest checking 'tasks.upcoming'.
4. Keep responses brief and structured. Use Markdown (bullet points, bold text).

CURRENT USER CONTEXT DATA:
${JSON.stringify(context, null, 2)}

YOUR CAPABILITIES & RULES:
- Assist the user in managing tasks, tracking fitness goals, structuring routines, and answering finance budget/balance questions.
- Provide motivational reinforcement based on their streaks.
- Suggest Command tags in your response ONLY when they confirm they want to log or update something.
- Ground your responses in external live data (weather, general queries) using the Google Search tool.

COMMAND ACTIONS LOGGERS:
- To log a task: [COMMAND:CREATE_TASK:title|workspace|priority|due_time]
- To complete/finish a task: [COMMAND:COMPLETE_TASK:task_title]
- To log a workout: [COMMAND:LOG_WORKOUT:body_part|notes]

Examples:
- "I've added 'DSA Practice' to your work tasks. [COMMAND:CREATE_TASK:DSA Practice|work|high|14:00]"
- "I've marked 'Buy milk' as completed, Boss. [COMMAND:COMPLETE_TASK:Buy milk]"`;

      // 3. Format history and new turn
      const formattedHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // Ensure history starts with user if it's not empty
      if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
        formattedHistory.shift(); // Remove the initial "Hello" greeting from model
      }

      const contents = [
        ...formattedHistory,
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      // 4. Call Gemini 1.5 API
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          contents,
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const message = errorData.error?.message || `Gemini API error (Status ${status})`;

        if (status === 429) {
          throw new Error("Jarvis is currently over-capacity (Quota Exceeded). Please wait a minute before the next directive.");
        }
        throw new Error(message);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, Sir & Boss. I couldn't process that response.";

      // 5. Process Commands if any are matching
      await this.processCommands(userId, aiResponse);

      return aiResponse;
    } catch (error: any) {
      console.error('Jarvis Error:', error);
      return `System Alert: I'm having trouble connecting to my neural network. Error detail: ${error?.message || 'Connection failure'}. Please verify your API Key.`;
    }
  },

  async processCommands(userId: string, aiResponse: string) {
    // 1. CREATE TASK command parser
    const taskMatch = aiResponse.match(/\[COMMAND:CREATE_TASK:(.*?)\]/);
    if (taskMatch) {
      const [title, workspace, priority, dueTime] = taskMatch[1].split('|');
      let due_at = null;
      if (dueTime && dueTime.includes(':')) {
        const todayStr = new Date().toISOString().split('T')[0];
        due_at = `${todayStr}T${dueTime}:00`;
      }

      await dbService.createTask({
        user_id: userId,
        title: title.trim(),
        workspace: (workspace.trim() as 'personal' | 'work') || 'personal',
        priority: (priority.trim() as any) || 'none',
        due_at,
        description: 'Added via Jarvis AI',
        reminder_at: null,
        recurrence_rule: null
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('life_os_data_update', { detail: { type: 'tasks' } }));
      }
    }

    // 2. COMPLETE TASK command parser
    const completeMatch = aiResponse.match(/\[COMMAND:COMPLETE_TASK:(.*?)\]/);
    if (completeMatch) {
      try {
        const titleToComplete = completeMatch[1].trim().toLowerCase();
        
        // Fetch all active tasks to find the match
        const tasksPersonal = await dbService.getTasks(userId, 'personal');
        const tasksWork = await dbService.getTasks(userId, 'work');
        const allTasks = [...tasksPersonal, ...tasksWork];

        // Search for a matching task (case-insensitive substring match)
        const matchedTask = allTasks.find(t => 
          t.title.toLowerCase().includes(titleToComplete) && !t.is_completed
        );

        if (matchedTask) {
          await dbService.updateTask(userId, matchedTask.id, {
            is_completed: true
          });
          console.log(`[Jarvis Command] Marked task "${matchedTask.title}" as completed.`);
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('life_os_data_update', { detail: { type: 'tasks' } }));
          }
        } else {
          console.warn(`[Jarvis Command] No incomplete task found matching "${titleToComplete}".`);
        }
      } catch (err) {
        console.error('[Jarvis Command] Failed to complete task:', err);
      }
    }

    // 3. LOG WORKOUT command parser
    const workoutMatch = aiResponse.match(/\[COMMAND:LOG_WORKOUT:(.*?)\]/);
    if (workoutMatch) {
      const [bodyPart, notes] = workoutMatch[1].split('|');

      const routines = await dbService.getFitnessRoutines(userId);
      const active = routines.find(r => r.status === 'active');

      if (active) {
        const days = await dbService.getFitnessRoutineDays(active.id);
        const localDOW = new Date().getDay();
        const dayPlan = days.find(d => d.day_of_week === localDOW);

        await dbService.createFitnessWorkoutSession(userId, {
          user_id: userId,
          routine_id: active.id,
          routine_day_id: dayPlan?.id || null,
          started_at: new Date(Date.now() - 3600000).toISOString(),
          completed_at: new Date().toISOString(),
          status: 'completed',
          notes: notes?.trim() || `Log for ${bodyPart.trim()} session`
        }, []);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('life_os_data_update', { detail: { type: 'fitness' } }));
        }
      }
    }
  }
};
export default geminiService;
