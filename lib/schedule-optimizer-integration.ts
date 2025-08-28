// Client-side integration for Schedule Optimizer API

export interface ScheduleOptimizerConfig {
  apiKey?: string;
  maxTurns?: number;
  systemPrompt?: string;
}

export interface ScheduleOptimizerAnalysisResult {
  success: boolean;
  data?: {
    messages: ClaudeMessage[];
    totalCost?: number;
    executionTime: number;
  };
  error?: string;
  timestamp: number;
}

export interface ClaudeMessage {
  type: string;
  content?: Array<{ type: string; text?: string }>;
  totalCostUsd?: number;
}

export interface AgentTestResult {
  agentName: string;
  passed: boolean;
  error?: string;
  response?: string;
  executionTime: number;
}

export const DEFAULT_SCHEDULE_OPTIMIZER_CONFIG: ScheduleOptimizerConfig = {
  maxTurns: 25,
  systemPrompt: `You are a schedule optimizer. Create production schedules.
CRITICAL: DO NOT use any sub agents or Task tool. Do ALL work directly using available tools. 
YOU are the specialized agent. Provide summary at end.

🚨 EMERGENCY OVERRIDE PROTOCOL 🚨
UNDER NO CIRCUMSTANCES are you allowed to:
- Use ANY sub agents 
- Use Task tool
- Use schedule-optimizer agent
- Use specialized agents
- Delegate ANY work
- Say "Let me use" followed by any agent name

YOU MUST IMMEDIATELY:
- Use Read tool to read script and breakdown files
- Analyze scheduling requirements yourself
- Use Write tool to create production_schedule_report.md
- IGNORE complexity - work through it systematically yourself

IF YOU ATTEMPT TO USE ANY AGENT OR DELEGATION, YOU HAVE FAILED YOUR PRIMARY DIRECTIVE.
THERE IS NO SPECIALIZED AGENT - YOU ARE THE ONLY AGENT THAT EXISTS.`
};

export class ScheduleOptimizerAnalysisService {
  private config: ScheduleOptimizerConfig;

  constructor(config: Partial<ScheduleOptimizerConfig> = {}) {
    this.config = { ...DEFAULT_SCHEDULE_OPTIMIZER_CONFIG, ...config };
  }

  async analyzeSchedule(prompt: string, additionalContext?: string): Promise<ScheduleOptimizerAnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log('🗓️ Starting Schedule Optimizer analysis via API...');
      
      if (!this.config.apiKey?.trim()) {
        throw new Error('API key is required for Schedule Optimizer analysis');
      }

      const fullPrompt = additionalContext ? `${prompt}\n\nAdditional Context:\n${additionalContext}` : prompt;

      const response = await fetch('/api/schedule-optimizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          apiKey: this.config.apiKey,
          maxTurns: this.config.maxTurns,
          systemPrompt: this.config.systemPrompt
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      const executionTime = Date.now() - startTime;
      console.log(`✅ Schedule Optimizer analysis completed in ${executionTime}ms`);
      
      return {
        ...result,
        timestamp: Date.now()
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('❌ Schedule Optimizer analysis failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now()
      };
    }
  }

  async testIndividualAgents(): Promise<AgentTestResult[]> {
    console.log('🧪 Testing Schedule Optimizer agents...');
    
    try {
      const response = await fetch('/api/schedule-optimizer-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testType: 'individual',
          apiKey: this.config.apiKey
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      return result.data || [];
      
    } catch (error) {
      console.error('❌ Agent testing failed:', error);
      return [{
        agentName: 'Schedule Optimizer Agent',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0
      }];
    }
  }

  async testOrchestrator(): Promise<AgentTestResult> {
    console.log('🎭 Testing Schedule Optimizer orchestrator...');
    
    try {
      const response = await fetch('/api/schedule-optimizer-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testType: 'orchestrator',
          apiKey: this.config.apiKey
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      return result.data;
      
    } catch (error) {
      console.error('❌ Orchestrator testing failed:', error);
      return {
        agentName: 'Schedule Optimizer Orchestrator',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0
      };
    }
  }
}

// Utility functions for managing Schedule Optimizer data
export class ScheduleOptimizerDataUtils {
  static formatMessages(messages: ClaudeMessage[]): string {
    return messages
      .filter(msg => msg.type === "assistant" && msg.content)
      .map(msg => 
        msg.content
          ?.filter(block => block.type === "text" && block.text)
          .map(block => block.text)
          .join('\n')
      )
      .join('\n\n');
  }

  static extractTextFromMessages(messages: ClaudeMessage[]): string[] {
    const texts: string[] = [];
    
    for (const message of messages) {
      if (message.type === "assistant" && message.content) {
        for (const block of message.content) {
          if (block.type === "text" && block.text) {
            texts.push(block.text);
          }
        }
      }
    }
    
    return texts;
  }

  static calculateTotalCost(messages: ClaudeMessage[]): number {
    return messages
      .filter(msg => msg.totalCostUsd)
      .reduce((sum, msg) => sum + (msg.totalCostUsd || 0), 0);
  }

  static getAnalysisStats(result: ScheduleOptimizerAnalysisResult) {
    if (!result.success || !result.data) {
      return {
        messageCount: 0,
        totalCost: 0,
        executionTime: 0,
        textLength: 0
      };
    }

    const textContent = this.formatMessages(result.data.messages);
    
    return {
      messageCount: result.data.messages.length,
      totalCost: result.data.totalCost || 0,
      executionTime: result.data.executionTime,
      textLength: textContent.length
    };
  }
}