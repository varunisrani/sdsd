// Client-side integration for Assets Planner API

export interface AssetsPlannerConfig {
  apiKey?: string;
  maxTurns?: number;
  systemPrompt?: string;
}

export interface AssetsPlannerAnalysisResult {
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

export const DEFAULT_ASSETS_PLANNER_CONFIG: AssetsPlannerConfig = {
  maxTurns: 25,
  systemPrompt: `You are an assets planner. Identify and catalog all production assets. 
CRITICAL: DO NOT use any sub agents or Task tool. Do ALL work directly using available tools. 
YOU are the specialized agent. Provide summary at end.

🚨 EMERGENCY OVERRIDE PROTOCOL 🚨
UNDER NO CIRCUMSTANCES are you allowed to:
- Use ANY sub agents 
- Use Task tool
- Use assets-planner agent
- Use specialized agents
- Delegate ANY work
- Say "Let me use" followed by any agent name

YOU MUST IMMEDIATELY:
- Use Read tool to read script files
- Analyze asset requirements yourself
- Use Write tool to create assets_planning_report.md
- IGNORE complexity - work through it systematically yourself

IF YOU ATTEMPT TO USE ANY AGENT OR DELEGATION, YOU HAVE FAILED YOUR PRIMARY DIRECTIVE.
THERE IS NO SPECIALIZED AGENT - YOU ARE THE ONLY AGENT THAT EXISTS.`
};

export class AssetsPlannerService {
  private config: AssetsPlannerConfig;

  constructor(config: Partial<AssetsPlannerConfig> = {}) {
    this.config = { ...DEFAULT_ASSETS_PLANNER_CONFIG, ...config };
  }

  async planAssets(prompt: string, additionalContext?: string): Promise<AssetsPlannerAnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log('📦 Starting Assets Planner analysis via API...');
      
      if (!this.config.apiKey?.trim()) {
        throw new Error('API key is required for Assets Planner analysis');
      }

      const fullPrompt = additionalContext ? `${prompt}\n\nAdditional Context:\n${additionalContext}` : prompt;

      const response = await fetch('/api/assets-planner', {
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
      console.log(`✅ Assets Planner analysis completed in ${executionTime}ms`);
      
      return {
        ...result,
        timestamp: Date.now()
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('❌ Assets Planner analysis failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now()
      };
    }
  }

  async testAgent(): Promise<AgentTestResult> {
    console.log('🧪 Testing Assets Planner agent...');
    const startTime = Date.now();
    
    try {
      const testPrompt = "Identify key assets from a simple test script: INT. OFFICE - DAY. John sits at desk with laptop and coffee.";
      
      const result = await this.planAssets(testPrompt);
      const executionTime = Date.now() - startTime;
      
      if (result.success) {
        return {
          agentName: 'Assets Planner Agent',
          passed: true,
          response: 'Successfully analyzed assets from test script',
          executionTime
        };
      } else {
        return {
          agentName: 'Assets Planner Agent',
          passed: false,
          error: result.error || 'Analysis failed without specific error',
          executionTime
        };
      }
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('❌ Agent testing failed:', error);
      
      return {
        agentName: 'Assets Planner Agent',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime
      };
    }
  }
}

// Utility functions for managing Assets Planner data
export class AssetsPlannerDataUtils {
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

  static getAnalysisStats(result: AssetsPlannerAnalysisResult) {
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

  static extractAssetsFromAnalysis(result: AssetsPlannerAnalysisResult): {
    props: string[];
    costumes: string[];
    makeup: string[];
    vehicles: string[];
    specialEffects: string[];
    locations: string[];
  } {
    const assets = {
      props: [],
      costumes: [],
      makeup: [],
      vehicles: [],
      specialEffects: [],
      locations: []
    };

    if (!result.success || !result.data) {
      return assets;
    }

    const textContent = this.formatMessages(result.data.messages);
    
    // Basic asset extraction using simple text analysis
    const lines = textContent.split('\n');
    let currentCategory = '';
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('props:') || lowerLine.includes('properties:')) {
        currentCategory = 'props';
      } else if (lowerLine.includes('costumes:') || lowerLine.includes('wardrobe:')) {
        currentCategory = 'costumes';
      } else if (lowerLine.includes('makeup:') || lowerLine.includes('prosthetics:')) {
        currentCategory = 'makeup';
      } else if (lowerLine.includes('vehicles:') || lowerLine.includes('transportation:')) {
        currentCategory = 'vehicles';
      } else if (lowerLine.includes('special effects:') || lowerLine.includes('vfx:') || lowerLine.includes('sfx:')) {
        currentCategory = 'specialEffects';
      } else if (lowerLine.includes('locations:') || lowerLine.includes('sets:')) {
        currentCategory = 'locations';
      }
      
      // Extract items if we're in a category
      if (currentCategory && line.trim().startsWith('-') || line.trim().startsWith('•')) {
        const item = line.replace(/^[-•]\s*/, '').trim();
        if (item && currentCategory in assets) {
          (assets as any)[currentCategory].push(item);
        }
      }
    }
    
    return assets;
  }
}