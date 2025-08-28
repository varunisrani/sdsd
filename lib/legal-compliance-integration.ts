// Client-side integration for Legal Compliance API

export interface LegalComplianceConfig {
  apiKey?: string;
  maxTurns?: number;
  systemPrompt?: string;
}

export interface LegalComplianceAnalysisResult {
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

export const DEFAULT_LEGAL_COMPLIANCE_CONFIG: LegalComplianceConfig = {
  maxTurns: 25,
  systemPrompt: `You are a legal compliance analyzer. Identify legal requirements and risks.
CRITICAL: DO NOT use any sub agents or Task tool. Do ALL work directly using available tools. 
YOU are the specialized agent. Provide summary at end.

🚨 EMERGENCY OVERRIDE PROTOCOL 🚨
UNDER NO CIRCUMSTANCES are you allowed to:
- Use ANY sub agents 
- Use Task tool
- Use legal-compliance-analyzer agent
- Use specialized agents
- Delegate ANY work
- Say "Let me use" followed by any agent name

YOU MUST IMMEDIATELY:
- Use Read tool to read script and breakdown files
- Analyze legal requirements yourself
- Use Write tool to create legal_compliance_report.md
- IGNORE complexity - work through it systematically yourself

IF YOU ATTEMPT TO USE ANY AGENT OR DELEGATION, YOU HAVE FAILED YOUR PRIMARY DIRECTIVE.
THERE IS NO SPECIALIZED AGENT - YOU ARE THE ONLY AGENT THAT EXISTS.`
};

export class LegalComplianceAnalysisService {
  private config: LegalComplianceConfig;

  constructor(config: Partial<LegalComplianceConfig> = {}) {
    this.config = { ...DEFAULT_LEGAL_COMPLIANCE_CONFIG, ...config };
  }

  async analyzeCompliance(prompt: string, additionalContext?: string): Promise<LegalComplianceAnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log('⚖️ Starting Legal Compliance analysis via API...');
      
      if (!this.config.apiKey?.trim()) {
        throw new Error('API key is required for Legal Compliance analysis');
      }

      const fullPrompt = additionalContext ? `${prompt}\n\nAdditional Context:\n${additionalContext}` : prompt;

      const response = await fetch('/api/legal-compliance', {
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
      console.log(`✅ Legal Compliance analysis completed in ${executionTime}ms`);
      
      return {
        ...result,
        timestamp: Date.now()
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('❌ Legal Compliance analysis failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now()
      };
    }
  }

  async testIndividualAgents(): Promise<AgentTestResult[]> {
    console.log('🧪 Testing Legal Compliance agents...');
    
    try {
      const response = await fetch('/api/legal-compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: "Test legal compliance analysis with a simple script review",
          apiKey: this.config.apiKey,
          maxTurns: 10,
          systemPrompt: this.config.systemPrompt
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      // Convert result to test format
      return [{
        agentName: 'Legal Compliance Analyzer',
        passed: result.success,
        error: result.error,
        response: result.data?.finalResult || 'Analysis completed',
        executionTime: result.data?.executionTime || 0
      }];
      
    } catch (error) {
      console.error('❌ Legal Compliance agent testing failed:', error);
      return [{
        agentName: 'Legal Compliance Analyzer',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0
      }];
    }
  }

  async testOrchestrator(): Promise<AgentTestResult> {
    console.log('🎭 Testing Legal Compliance orchestrator...');
    
    try {
      const response = await fetch('/api/legal-compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: "Perform comprehensive legal compliance analysis including rights clearances, contracts, and risk assessment",
          apiKey: this.config.apiKey,
          maxTurns: this.config.maxTurns,
          systemPrompt: this.config.systemPrompt
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      return {
        agentName: 'Legal Compliance Orchestrator',
        passed: result.success,
        error: result.error,
        response: result.data?.finalResult || 'Orchestration completed',
        executionTime: result.data?.executionTime || 0
      };
      
    } catch (error) {
      console.error('❌ Legal Compliance orchestrator testing failed:', error);
      return {
        agentName: 'Legal Compliance Orchestrator',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0
      };
    }
  }
}

// Utility functions for managing Legal Compliance data
export class LegalComplianceDataUtils {
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

  static getAnalysisStats(result: LegalComplianceAnalysisResult) {
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

  static extractLegalRequirements(result: LegalComplianceAnalysisResult): {
    rightsAndClearances: string[];
    contractsNeeded: string[];
    insuranceRequirements: string[];
    complianceRisks: string[];
  } {
    const defaultOutput = {
      rightsAndClearances: [],
      contractsNeeded: [],
      insuranceRequirements: [],
      complianceRisks: []
    };

    if (!result.success || !result.data) {
      return defaultOutput;
    }

    const fullText = this.formatMessages(result.data.messages).toLowerCase();
    
    // Extract key legal compliance areas
    const rightsKeywords = ['rights', 'clearance', 'copyright', 'trademark', 'licensing'];
    const contractKeywords = ['contract', 'agreement', 'release', 'waiver', 'permission'];
    const insuranceKeywords = ['insurance', 'liability', 'coverage', 'bond', 'protection'];
    const riskKeywords = ['risk', 'violation', 'lawsuit', 'penalty', 'fine', 'compliance'];
    
    return {
      rightsAndClearances: this.extractRequirementsByKeywords(fullText, rightsKeywords),
      contractsNeeded: this.extractRequirementsByKeywords(fullText, contractKeywords),
      insuranceRequirements: this.extractRequirementsByKeywords(fullText, insuranceKeywords),
      complianceRisks: this.extractRequirementsByKeywords(fullText, riskKeywords)
    };
  }

  private static extractRequirementsByKeywords(text: string, keywords: string[]): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const relevant = sentences.filter(sentence => 
      keywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );
    
    return relevant.slice(0, 5).map(s => s.trim()); // Limit to 5 most relevant
  }
}