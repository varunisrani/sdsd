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

    // Convert SSD scenes to schedule format (first 20 scenes)
    const convertedScenes = scriptData.data.scenes.slice(0, 20).map((scene, index) => ({
      sceneId: `sc_${String(scene.sceneNumber || index + 1).padStart(3, '0')}`,
      sceneNumber: String(scene.sceneNumber || index + 1),
      pageCount: Math.random() * 3 + 0.5,
      estimatedTime: Math.random() * 180 + 60,
      location: scene.location || scene.Scene_Names || 'Unknown Location',
      locationType: scene.Scene_Names && scene.Scene_Names.includes('INT') ? 'INT' : 'EXT',
      timeOfDay: scene.timeOfDay || (scene.Scene_Names && scene.Scene_Names.includes('NIGHT') ? 'NIGHT' : 'DAY'),
      description: (scene.Scene_action || scene.Contents || '').substring(0, 200) + '...',
      cast: scene.Scene_Characters || ['UNKNOWN'],
      props: extractProps(scene.Scene_action || scene.Contents || ''),
      wardrobe: ['Period appropriate costumes'],
      specialEquipment: extractEquipment(scene.Scene_action || scene.Contents || ''),
      vfx: extractVFX(scene.Scene_action || scene.Contents || ''),
      stunts: extractStunts(scene.Scene_action || scene.Contents || ''),
      animals: [],
      vehicles: extractVehicles(scene.Scene_action || scene.Contents || ''),
      atmospherics: ['Scene atmosphere'],
      priority: determinePriority(scene.Scene_action || scene.Contents || ''),
      complexity: determineComplexity(scene.Scene_action || scene.Contents || '')
    }));

    console.log(`🔄 Converted ${convertedScenes.length} scenes for schedule analysis`);

    const stages: any = {};

    // SCHEDULE AGENT 1: StripCreator Agent
    console.log('🎬 SCHEDULE AGENT 1: StripCreator Agent');
    const stripStart = Date.now();
    
    try {
      const stripResult = await generateObject({
        model,
        schema: z.object({
          strips: z.array(z.object({
            sceneId: z.string(),
            stripColor: z.string(),
            department: z.string(),
            complexity: z.number().min(1).max(10)
          })),
          metadata: z.object({
            totalScenes: z.number(),
            averageComplexity: z.number(),
            primaryLocations: z.array(z.string())
          }),
          confidence: z.number().min(0).max(1)
        }),
        prompt: `Create scene strips for these ${convertedScenes.length} scenes from ${scriptData.data.scriptName || 'film'}:

${convertedScenes.map(s => `Scene ${s.sceneNumber}: ${s.location} (${s.timeOfDay}) - ${s.description.substring(0, 100)}...`).join('\n')}

Generate professional film stripboard with color coding and complexity analysis.`
      });

      const stripDuration = Date.now() - stripStart;
      stages.stripCreator = {
        completed: true,
        duration: stripDuration,
        data: stripResult.object
      };
      console.log(`✅ StripCreator completed: ${stripDuration}ms`);
    } catch (error) {
      const stripDuration = Date.now() - stripStart;
      stages.stripCreator = {
        completed: false,
        duration: stripDuration,
        error: error instanceof Error ? error.message : 'Strip creation failed'
      };
      console.log(`❌ StripCreator failed: ${error}`);
    }

    // SCHEDULE AGENT 2: BlockOptimizer Agent
    console.log('⚡ SCHEDULE AGENT 2: BlockOptimizer Agent');
    const blockStart = Date.now();
    
    try {
      const blockResult = await generateObject({
        model,
        schema: z.object({
          dayBlocks: z.array(z.object({
            blockId: z.string(),
            scenes: z.array(z.string()),
            location: z.string(),
            estimatedDuration: z.number()
          })),
          nightBlocks: z.array(z.object({
            blockId: z.string(),
            scenes: z.array(z.string()),
            location: z.string(),
            estimatedDuration: z.number()
          })),
          optimization: z.object({
            totalDays: z.number(),
            efficiency: z.number().min(0).max(1),
            costSavings: z.string()
          }),
          confidence: z.number().min(0).max(1)
        }),
        prompt: `Optimize day/night scheduling for ${scriptData.data.scriptName || 'film'} scenes:

${convertedScenes.map(s => `${s.sceneNumber}: ${s.location} - ${s.timeOfDay} (${s.estimatedTime}min)`).join('\n')}

Create efficient shooting blocks minimizing company moves and crew turnarounds.`
      });

      const blockDuration = Date.now() - blockStart;
      stages.blockOptimizer = {
        completed: true,
        duration: blockDuration,
        data: blockResult.object
      };
      console.log(`✅ BlockOptimizer completed: ${blockDuration}ms`);
    } catch (error) {
      const blockDuration = Date.now() - blockStart;
      stages.blockOptimizer = {
        completed: false,
        duration: blockDuration,
        error: error instanceof Error ? error.message : 'Block optimization failed'
      };
      console.log(`❌ BlockOptimizer failed: ${error}`);
    }

    // SCHEDULE AGENT 3: LocationManager Agent
    console.log('🗺️ SCHEDULE AGENT 3: LocationManager Agent');
    const locationStart = Date.now();
    
    try {
      const locationResult = await generateObject({
        model,
        schema: z.object({
          locationGroups: z.array(z.object({
            groupId: z.string(),
            location: z.string(),
            scenes: z.array(z.string()),
            travelTime: z.number(),
            complexity: z.enum(['LOW', 'MEDIUM', 'HIGH'])
          })),
          travelPlan: z.object({
            totalLocations: z.number(),
            totalTravelTime: z.number(),
            recommendedSequence: z.array(z.string())
          }),
          confidence: z.number().min(0).max(1)
        }),
        prompt: `Create location-based shooting plan for ${scriptData.data.scriptName || 'film'}:

Locations: ${[...new Set(convertedScenes.map(s => s.location))].join(', ')}

Group scenes by location, optimize travel routes, and minimize company moves.`
      });

      const locationDuration = Date.now() - locationStart;
      stages.locationManager = {
        completed: true,
        duration: locationDuration,
        data: locationResult.object
      };
      console.log(`✅ LocationManager completed: ${locationDuration}ms`);
    } catch (error) {
      const locationDuration = Date.now() - locationStart;
      stages.locationManager = {
        completed: false,
        duration: locationDuration,
        error: error instanceof Error ? error.message : 'Location management failed'
      };
      console.log(`❌ LocationManager failed: ${error}`);
    }

    // SCHEDULE AGENT 4: MoveCalculator Agent
    console.log('🚛 SCHEDULE AGENT 4: MoveCalculator Agent');
    const moveStart = Date.now();
    
    try {
      const moveResult = await generateObject({
        model,
        schema: z.object({
          moves: z.array(z.object({
            moveId: z.string(),
            fromLocation: z.string(),
            toLocation: z.string(),
            equipment: z.array(z.string()),
            duration: z.number(),
            cost: z.string()
          })),
          summary: z.object({
            totalMoves: z.number(),
            totalMoveTime: z.number(),
            totalCost: z.string(),
            efficiency: z.number().min(0).max(1)
          }),
          confidence: z.number().min(0).max(1)
        }),
        prompt: `Calculate company moves for ${scriptData.data.scriptName || 'film'} production:

Equipment needed: ${convertedScenes.flatMap(s => s.specialEquipment).filter(Boolean).join(', ')}
Locations: ${[...new Set(convertedScenes.map(s => s.location))].join(', ')}

Plan efficient equipment moves between locations with cost and time estimates.`
      });

      const moveDuration = Date.now() - moveStart;
      stages.moveCalculator = {
        completed: true,
        duration: moveDuration,
        data: moveResult.object
      };
      console.log(`✅ MoveCalculator completed: ${moveDuration}ms`);
    } catch (error) {
      const moveDuration = Date.now() - moveStart;
      stages.moveCalculator = {
        completed: false,
        duration: moveDuration,
        error: error instanceof Error ? error.message : 'Move calculation failed'
      };
      console.log(`❌ MoveCalculator failed: ${error}`);
    }

    // SCHEDULE AGENT 5: ComplianceValidator Agent
    console.log('⚖️ SCHEDULE AGENT 5: ComplianceValidator Agent');
    const complianceStart = Date.now();
    
    try {
      const complianceResult = await generateObject({
        model,
        schema: z.object({
          complianceReport: z.object({
            sagCompliance: z.boolean(),
            crewCompliance: z.boolean(),
            safetyCompliance: z.boolean(),
            overtimeRisk: z.enum(['LOW', 'MEDIUM', 'HIGH'])
          }),
          violations: z.array(z.object({
            type: z.string(),
            description: z.string(),
            severity: z.enum(['WARNING', 'VIOLATION']),
            recommendation: z.string()
          })),
          recommendations: z.array(z.string()),
          confidence: z.number().min(0).max(1)
        }),
        prompt: `Validate union compliance and safety for ${scriptData.data.scriptName || 'film'} production:

Scenes with stunts: ${convertedScenes.filter(s => s.stunts.length > 0).length}
Scenes with VFX: ${convertedScenes.filter(s => s.vfx.length > 0).length}  
Night scenes: ${convertedScenes.filter(s => s.timeOfDay === 'NIGHT').length}
Complex scenes: ${convertedScenes.filter(s => s.complexity === 'COMPLEX').length}

Check SAG requirements, crew regulations, safety protocols, and overtime risks.`
      });

      const complianceDuration = Date.now() - complianceStart;
      stages.complianceValidator = {
        completed: true,
        duration: complianceDuration,
        data: complianceResult.object
      };
      console.log(`✅ ComplianceValidator completed: ${complianceDuration}ms`);
    } catch (error) {
      const complianceDuration = Date.now() - complianceStart;
      stages.complianceValidator = {
        completed: false,
        duration: complianceDuration,
        error: error instanceof Error ? error.message : 'Compliance validation failed'
      };
      console.log(`❌ ComplianceValidator failed: ${error}`);
    }

    // SCHEDULE AGENT 6: StripboardGenius Orchestrator
    console.log('🧠 SCHEDULE AGENT 6: StripboardGenius Orchestrator');
    const orchestratorStart = Date.now();
    
    try {
      const orchestratorResult = await generateObject({
        model,
        schema: z.object({
          finalSchedule: z.object({
            totalDays: z.number(),
            shootingBlocks: z.array(z.object({
              day: z.number(),
              location: z.string(),
              scenes: z.array(z.string()),
              timeOfDay: z.string(),
              estimatedHours: z.number()
            })),
            budget: z.object({
              estimated: z.string(),
              breakdown: z.record(z.string())
            })
          }),
          summary: z.object({
            efficiency: z.number().min(0).max(1),
            riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
            recommendations: z.array(z.string()),
            keyMetrics: z.record(z.union([z.string(), z.number()]))
          }),
          confidence: z.number().min(0).max(1)
        }),
        prompt: `Create final production schedule for ${scriptData.data.scriptName || 'film'}:

Project: ${scriptData.data.scriptName || 'film'}
Total Scenes: ${scriptData.data.scenes.length}
Genre: ${scriptData.data.genre || 'Feature Film'}
Budget Level: ${scriptData.data.budgetLevel || 'Medium'}

Sample scenes: ${convertedScenes.map(s => `${s.sceneNumber}: ${s.location} (${s.complexity})`).slice(0, 10).join(', ')}

Generate comprehensive shooting schedule with budget estimates, risk assessment, and optimization recommendations.`
      });

      const orchestratorDuration = Date.now() - orchestratorStart;
      stages.stripboardGenius = {
        completed: true,
        duration: orchestratorDuration,
        data: orchestratorResult.object
      };
      console.log(`✅ StripboardGenius completed: ${orchestratorDuration}ms`);
    } catch (error) {
      const orchestratorDuration = Date.now() - orchestratorStart;
      stages.stripboardGenius = {
        completed: false,
        duration: orchestratorDuration,
        error: error instanceof Error ? error.message : 'Schedule orchestration failed'
      };
      console.log(`❌ StripboardGenius failed: ${error}`);
    }

    const totalProcessingTime = Date.now() - startTime;
    const completedStages = Object.values(stages).filter((stage: any) => stage.completed).length;

    // Extract final schedule from completed stages
    const finalSchedule = completedStages > 0 ? {
      totalDays: stages.stripboardGenius?.completed ? 
        stages.stripboardGenius.data.finalSchedule.totalDays : 
        (stages.blockOptimizer?.completed ? stages.blockOptimizer.data.optimization.totalDays : 0),
      shootingBlocks: stages.stripboardGenius?.completed ? 
        stages.stripboardGenius.data.finalSchedule.shootingBlocks : [],
      efficiency: stages.stripboardGenius?.completed ? 
        stages.stripboardGenius.data.summary.efficiency : 
        (stages.blockOptimizer?.completed ? stages.blockOptimizer.data.optimization.efficiency : 0),
      riskLevel: stages.stripboardGenius?.completed ? 
        stages.stripboardGenius.data.summary.riskLevel : 'MEDIUM',
      estimatedBudget: stages.stripboardGenius?.completed ? 
        stages.stripboardGenius.data.finalSchedule.budget.estimated : 'TBD',
      complianceScore: stages.complianceValidator?.completed ? 
        (stages.complianceValidator.data.complianceReport.sagCompliance && 
         stages.complianceValidator.data.complianceReport.crewCompliance && 
         stages.complianceValidator.data.complianceReport.safetyCompliance ? 85 : 60) : 0,
      locationGroups: stages.locationManager?.completed ? 
        stages.locationManager.data.locationGroups.length : 0,
      companyMoves: stages.moveCalculator?.completed ? 
        stages.moveCalculator.data.moves.length : 0,
      confidence: Math.max(
        stages.stripCreator?.data?.confidence || 0,
        stages.blockOptimizer?.data?.confidence || 0,
        stages.locationManager?.data?.confidence || 0,
        stages.moveCalculator?.data?.confidence || 0,
        stages.complianceValidator?.data?.confidence || 0,
        stages.stripboardGenius?.data?.confidence || 0
      )
    } : null;

    return NextResponse.json({
      success: completedStages > 0,
      processingTime: totalProcessingTime,
      stages,
      finalSchedule
    });

  } catch (error) {
    console.error('Schedule analysis API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Schedule analysis failed',
        processingTime: 0,
        stages: {}
      },
      { status: 500 }
    );
  }
}

// Helper functions to extract information from scene content
function extractProps(content: string): string[] {
  const props = [];
  const propKeywords = ['gun', 'weapon', 'car', 'phone', 'briefcase', 'computer', 'sword', 'helmet', 'armor'];
  const lowerContent = content.toLowerCase();
  
  propKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      props.push(keyword);
    }
  });
  
  return props.length > 0 ? props : ['basic props'];
}

function extractEquipment(content: string): string[] {
  const equipment = [];
  const equipKeywords = ['camera', 'lighting', 'crane', 'steadicam', 'boom', 'harness'];
  const lowerContent = content.toLowerCase();
  
  equipKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      equipment.push(keyword);
    }
  });
  
  return equipment.length > 0 ? equipment : [];
}

function extractVFX(content: string): string[] {
  const vfx = [];
  const vfxKeywords = ['explosion', 'fire', 'magic', 'digital', 'cgi', 'effects'];
  const lowerContent = content.toLowerCase();
  
  vfxKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      vfx.push(keyword + ' effects');
    }
  });
  
  return vfx;
}

function extractStunts(content: string): string[] {
  const stunts = [];
  const stuntKeywords = ['fight', 'chase', 'jump', 'fall', 'crash', 'battle'];
  const lowerContent = content.toLowerCase();
  
  stuntKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      stunts.push(keyword + ' sequence');
    }
  });
  
  return stunts;
}

function extractVehicles(content: string): string[] {
  const vehicles = [];
  const vehicleKeywords = ['car', 'truck', 'motorcycle', 'plane', 'helicopter', 'ship'];
  const lowerContent = content.toLowerCase();
  
  vehicleKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      vehicles.push(keyword);
    }
  });
  
  return vehicles;
}

function determinePriority(content: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('fight') || lowerContent.includes('battle') || lowerContent.includes('explosion')) {
    return 'HIGH';
  } else if (lowerContent.includes('dialogue') || lowerContent.includes('conversation')) {
    return 'MEDIUM';
  }
  return 'MEDIUM';
}

function determineComplexity(content: string): 'SIMPLE' | 'MODERATE' | 'COMPLEX' {
  const lowerContent = content.toLowerCase();
  const complexKeywords = ['fight', 'chase', 'explosion', 'effects', 'crowd', 'vehicles'];
  const complexCount = complexKeywords.filter(keyword => lowerContent.includes(keyword)).length;
  
  if (complexCount >= 3) return 'COMPLEX';
  if (complexCount >= 1) return 'MODERATE';
  return 'SIMPLE';
}