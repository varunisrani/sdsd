import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

interface ScriptData {
  success: boolean;
  data: {
    scriptName?: string;
    genre?: string;
    type?: string;
    budgetLevel?: string;
    scenes: Array<{
      sceneNumber: number;
      Scene_Names?: string;
      Scene_action?: string;
      Scene_Characters?: string[] | null;
      location?: string;
      timeOfDay?: string;
      Contents?: string;
    }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { scriptData } = await request.json() as { scriptData: ScriptData };
    
    // Use direct API key (no environment variables)
    const apiKey = 'AIzaSyABISxaNzifdIcZUCe408LoKnEz0bia8cI';

    const startTime = Date.now();
    
    // Initialize AI model
    const model = google('gemini-2.5-flash', {
      apiKey: apiKey
    });

    // Process sample scenes for analysis (first 10 scenes like in working test)
    const sampleScenes = scriptData.data.scenes.slice(0, 10);
    const stages: any = {};
    
    console.log('💰 BUDGET AGENT 1: Cost Database Analysis');
    const costStart = Date.now();
    
    try {
      const costAnalysis = await generateObject({
        model,
        schema: z.object({
          unionRates: z.object({
            sagAftra: z.object({
              dailyRate: z.string(),
              weeklyRate: z.string(),
              pensionHealth: z.string()
            }),
            iatse: z.object({
              baseRate: z.string(),
              overtimeMultiplier: z.number(),
              fringePercentage: z.number()
            }),
            dga: z.object({
              directorWeekly: z.string(),
              assistantDaily: z.string()
            })
          }),
          equipmentCosts: z.object({
            camera: z.array(z.object({
              item: z.string(),
              dailyRate: z.string(),
              weeklyRate: z.string()
            })),
            lighting: z.array(z.object({
              item: z.string(),
              dailyRate: z.string(),
              weeklyRate: z.string()
            })),
            grip: z.array(z.object({
              item: z.string(),
              dailyRate: z.string(),
              weeklyRate: z.string()
            }))
          }),
          locationCosts: z.array(z.object({
            location: z.string(),
            permitFee: z.string(),
            insuranceRate: z.string(),
            securityCost: z.string()
          })),
          confidence: z.number().min(0).max(1)
        }),
        prompt: `Analyze cost requirements for ${scriptData.data.scriptName || 'film'} scenes:

Sample scenes: ${sampleScenes.map(s => 
  `Scene ${s.sceneNumber}: ${s.Scene_Names || s.location} - ${(s.Scene_action || s.Contents || '').substring(0, 100)}...`
).join('\n')}

Provide 2025 industry-standard costs for:
1. Union rates (SAG-AFTRA, IATSE, DGA)
2. Equipment rental costs (camera, lighting, grip)
3. Location costs and permits
4. Insurance and security requirements

Focus on ${scriptData.data.genre || 'feature'} film requirements with ${scriptData.data.scenes.length} total scenes.`
      });

      const costDuration = Date.now() - costStart;
      stages.costDatabase = {
        completed: true,
        duration: costDuration,
        data: costAnalysis.object
      };
      console.log(`✅ Cost Database completed: ${costDuration}ms`);
    } catch (error) {
      const costDuration = Date.now() - costStart;
      stages.costDatabase = {
        completed: false,
        duration: costDuration,
        error: error instanceof Error ? error.message : 'Cost analysis failed'
      };
      console.log(`❌ Cost Database failed: ${error}`);
    }

    // BUDGET AGENT 2: Preliminary Budget Creation
    console.log('📋 BUDGET AGENT 2: Preliminary Budget Creation');
    const prelimStart = Date.now();
    
    try {
      const prelimBudget = await generateObject({
        model,
        schema: z.object({
          topSheet: z.object({
            totalBudget: z.string(),
            atlBudget: z.string(),
            btlBudget: z.string(),
            contingency: z.string(),
            atlPercentage: z.number(),
            btlPercentage: z.number()
          }),
          atlBreakdown: z.object({
            cast: z.string(),
            director: z.string(),
            producer: z.string(),
            writer: z.string()
          }),
          btlBreakdown: z.object({
            crew: z.string(),
            equipment: z.string(),
            locations: z.string(),
            postProduction: z.string(),
            other: z.string()
          }),
          budgetTier: z.enum(['ULTRA_LOW', 'LOW', 'BASIC', 'HIGH']),
          investorSummary: z.string(),
          confidence: z.number().min(0).max(1)
        }),
        prompt: `Create preliminary budget for ${scriptData.data.scriptName || 'film'} based on ${scriptData.data.scenes.length} total scenes:

Genre: ${scriptData.data.genre || 'Feature Film'}
Budget Level: ${scriptData.data.budgetLevel || 'Medium'}
Type: ${scriptData.data.type || 'Feature Film'}

Sample scenes analyzed:
${sampleScenes.map(s => `${s.sceneNumber}: ${s.location} - ${s.Scene_Characters ? s.Scene_Characters.join(', ') : 'Various'}`).join('\n')}

Create investor-ready preliminary budget with:
1. Professional ATL/BTL breakdown
2. Industry-standard percentages for ${scriptData.data.genre || 'feature'} films
3. Department-specific estimates
4. Budget tier classification
5. Investment summary for stakeholders`
      });

      const prelimDuration = Date.now() - prelimStart;
      stages.preliminaryBudget = {
        completed: true,
        duration: prelimDuration,
        data: prelimBudget.object
      };
      console.log(`✅ Preliminary Budget completed: ${prelimDuration}ms`);
    } catch (error) {
      const prelimDuration = Date.now() - prelimStart;
      stages.preliminaryBudget = {
        completed: false,
        duration: prelimDuration,
        error: error instanceof Error ? error.message : 'Preliminary budget failed'
      };
      console.log(`❌ Preliminary Budget failed: ${error}`);
    }

    // Continue with other agents but let's test these first
    const totalProcessingTime = Date.now() - startTime;
    const completedStages = Object.values(stages).filter((stage: any) => stage.completed).length;

    // Extract final budget from preliminary budget data
    const finalBudget = stages.preliminaryBudget?.completed ? {
      totalBudget: stages.preliminaryBudget.data.topSheet.totalBudget,
      atlBudget: stages.preliminaryBudget.data.topSheet.atlBudget,
      btlBudget: stages.preliminaryBudget.data.topSheet.btlBudget,
      contingency: stages.preliminaryBudget.data.topSheet.contingency,
      departmentBreakdown: stages.preliminaryBudget.data.btlBreakdown,
      confidence: stages.preliminaryBudget.data.confidence
    } : null;

    return NextResponse.json({
      success: completedStages > 0,
      processingTime: totalProcessingTime,
      stages,
      finalBudget,
      totalBudget: finalBudget?.totalBudget,
      atlBudget: finalBudget?.atlBudget,
      btlBudget: finalBudget?.btlBudget,
      contingency: finalBudget?.contingency,
      departmentBreakdown: finalBudget?.departmentBreakdown,
      confidence: finalBudget?.confidence
    });

  } catch (error) {
    console.error('Budget analysis API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Budget analysis failed',
        processingTime: 0,
        stages: {}
      },
      { status: 500 }
    );
  }
}