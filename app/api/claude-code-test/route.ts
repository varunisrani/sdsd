import { NextRequest, NextResponse } from 'next/server';
import { query } from "@anthropic-ai/claude-code";

interface ClaudeCodeTestRequest {
  apiKey?: string;
  testType: 'individual' | 'orchestrator';
}

interface ClaudeMessage {
  type: string;
  content?: Array<{ type: string; text?: string }>;
  totalCostUsd?: number;
}

interface AgentTestResult {
  agentName: string;
  passed: boolean;
  error?: string;
  response?: string;
  executionTime: number;
}

const DEFAULT_SYSTEM_PROMPT = `You are a script parser. Analyze scripts and create detailed breakdown reports. 
CRITICAL: DO NOT use any sub agents or Task tool. Do ALL work directly using available tools. 
YOU are the specialized agent. Provide summary at end.`;

async function testClaudeCodeAgent(prompt: string, maxTurns = 5): Promise<{ success: boolean; messages: ClaudeMessage[]; error?: string }> {
  try {
    const messages: ClaudeMessage[] = [];
    
    const queryResult = query({
      prompt: `${DEFAULT_SYSTEM_PROMPT}\n\n${prompt}`,
      options: { maxTurns }
    });

    for await (const message of queryResult) {
      const claudeMessage = message as ClaudeMessage;
      messages.push(claudeMessage);
    }

    return { success: true, messages };
  } catch (error) {
    return { 
      success: false, 
      messages: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ClaudeCodeTestRequest = await request.json();
    const { testType } = body;

    if (testType === 'individual') {
      console.log('🧪 Testing Claude Code agents...');
      
      const tests: AgentTestResult[] = [];

      // Test basic connectivity
      const startTime = Date.now();
      const result = await testClaudeCodeAgent("Test connectivity: respond with 'Claude Code agent is working'");
      const executionTime = Date.now() - startTime;
      
      tests.push({
        agentName: 'Claude Code Agent',
        passed: result.success && result.messages.length > 0,
        response: result.success ? 'Agent responded successfully' : result.error,
        error: result.success ? undefined : result.error,
        executionTime
      });

      return NextResponse.json({ success: true, data: tests });

    } else if (testType === 'orchestrator') {
      console.log('🎭 Testing Claude Code orchestrator...');
      
      const startTime = Date.now();
      const result = await testClaudeCodeAgent(`
        Test orchestration: 
        1. Acknowledge this request
        2. List available tools
        3. Confirm you won't use sub-agents
        4. Respond with "Orchestrator test complete"
      `);
      
      const executionTime = Date.now() - startTime;
      const hasMessages = result.success && result.messages.length > 0;
      
      const orchestratorTest: AgentTestResult = {
        agentName: 'Claude Code Orchestrator',
        passed: hasMessages,
        response: hasMessages ? 'Orchestrator test completed successfully' : 'No response received',
        error: result.success ? undefined : result.error,
        executionTime
      };

      return NextResponse.json({ success: true, data: orchestratorTest });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid test type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Test API route error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request format' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Claude Code Test API is running',
    timestamp: new Date().toISOString()
  });
}