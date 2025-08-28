import { NextRequest, NextResponse } from 'next/server';
import { query } from "@anthropic-ai/claude-code";

interface AssetsPlannerRequest {
  prompt: string;
  apiKey?: string;
  maxTurns?: number;
  systemPrompt?: string;
}

interface ClaudeMessage {
  type: string;
  content?: Array<{ type: string; text?: string }>;
  totalCostUsd?: number;
}

const DEFAULT_SYSTEM_PROMPT = `You are an assets planner. Identify and catalog all production assets. 
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
THERE IS NO SPECIALIZED AGENT - YOU ARE THE ONLY AGENT THAT EXISTS.`;

const DEFAULT_QUERY = "Read BLACK_PANTHER.txt and create assets_planning_report.md with props, costumes, makeup, vehicles catalog";

export async function POST(request: NextRequest) {
  try {
    const body: AssetsPlannerRequest = await request.json();
    const { prompt = DEFAULT_QUERY, apiKey, maxTurns = 25, systemPrompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('📦 Starting Assets Planner analysis...');
    const startTime = Date.now();

    const messages: ClaudeMessage[] = [];
    let totalCost = 0;

    const fullPrompt = `${systemPrompt || DEFAULT_SYSTEM_PROMPT}\n\n${prompt}`;

    try {
      const queryResult = query({
        prompt: fullPrompt,
        options: {
          maxTurns
        }
      });

      let finalResult = '';
      let isComplete = false;
      
      for await (const message of queryResult) {
        const claudeMessage = message as ClaudeMessage;
        messages.push(claudeMessage);
        
        // Only log progress, don't show intermediate steps to user
        if (claudeMessage.type === "assistant" && claudeMessage.content) {
          for (const block of claudeMessage.content) {
            if (block.type === "text" && block.text) {
              console.log(`Processing... ${block.text.substring(0, 100)}...`);
            }
          }
        } else if (claudeMessage.type === "result") {
          // This is the final result
          if (claudeMessage.totalCostUsd) {
            totalCost += claudeMessage.totalCostUsd;
          }
          if (claudeMessage.result) {
            finalResult = claudeMessage.result;
          }
          isComplete = true;
        }
      }

      const executionTime = Date.now() - startTime;

      console.log(`✅ Assets Planner analysis completed in ${executionTime}ms`);
      console.log(`💰 Total cost: $${totalCost.toFixed(4)}`);

      return NextResponse.json({
        success: true,
        data: {
          messages,
          totalCost,
          executionTime,
          finalResult: finalResult,
          isComplete: isComplete
        },
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('❌ Assets Planner analysis failed:', error);
      const executionTime = Date.now() - startTime;
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now()
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ API route error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request format' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Assets Planner API is running',
    timestamp: new Date().toISOString()
  });
}