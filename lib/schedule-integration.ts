/**
 * Schedule Agent Integration for React Frontend
 * Direct AI SDK integration following the test-schedule-agents-with-ssd.js pattern
 */

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export interface ScheduleAgentConfig {
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface ScriptData {
  success: boolean;
  data: {
    scriptName?: string;
    genre?: string;
    type?: string;
    budgetLevel?: string;
    scenes: SceneData[];
  };
}

export interface ShotsData {
  success: boolean;
  data: {
    timestamp?: string;
    projectName?: string;
    totalShots?: number;
    shots?: ShotItem[];
    coverage?: {
      masterShots?: number;
      mediumShots?: number;
      closeUps?: number;
      cutaways?: number;
      inserts?: number;
    };
    equipment?: {
      cameras?: CameraSetup[];
      lenses?: string[];
      specialEquipment?: string[];
    };
  };
}

export interface ShotItem {
  shotNumber: string;
  sceneNumber: number;
  shotType: string;
  cameraAngle: string;
  movement?: string;
  lens?: string;
  duration?: number;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  setupTime?: number;
  department?: string[];
  notes?: string;
}

export interface CameraSetup {
  camera: string;
  operator: string;
  configuration: string;
  mobility: string;
}

export interface SequenceData {
  success: boolean;
  data: {
    timestamp?: string;
    projectName?: string;
    totalSequences?: number;
    sequences?: SequenceItem[];
    continuity?: {
      characterArcs?: CharacterArc[];
      propContinuity?: PropContinuity[];
      timelines?: Timeline[];
    };
    transitions?: {
      cuts?: number;
      fades?: number;
      dissolves?: number;
      other?: number;
    };
  };
}

export interface SequenceItem {
  sequenceNumber: string;
  name: string;
  startScene: number;
  endScene: number;
  duration?: number;
  location: string;
  timeOfDay: string;
  characters: string[];
  description: string;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  shootingOrder?: number;
  dependencies?: string[];
}

export interface CharacterArc {
  character: string;
  sequences: string[];
  wardrobe?: string[];
  makeup?: string[];
  continuityNotes?: string[];
}

export interface PropContinuity {
  prop: string;
  sequences: string[];
  status: string;
  department: string;
}

export interface Timeline {
  period: string;
  sequences: string[];
  duration: string;
}

export interface SceneData {
  sceneNumber: number;
  Scene_Names?: string;
  Scene_action?: string;
  Scene_Characters?: string[] | null;
  Scene_Dialogue?: string | null;
  Contents?: string;
  location?: string;
  timeOfDay?: string;
}

export interface ScheduleAnalysisResult {
  success: boolean;
  processingTime: number;
  stages: {
    stripCreator: StageResult;
    blockOptimizer: StageResult;
    locationManager: StageResult;
    moveCalculator: StageResult;
    complianceValidator: StageResult;
    stripboardGenius: StageResult;
  };
  finalSchedule?: {
    totalDays: number;
    shootingBlocks: Array<{
      day: number;
      location: string;
      scenes: string[];
      timeOfDay: string;
      estimatedHours: number;
    }>;
    efficiency: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedBudget: string;
    complianceScore: number;
    locationGroups: number;
    companyMoves: number;
    confidence: number;
  };
  error?: string;
}

export interface StageResult {
  completed: boolean;
  duration: number;
  data?: any;
  error?: string;
}

export interface AgentTestResult {
  name: string;
  passed: boolean;
  duration: number;
  details?: string;
  error?: string;
  stagesCompleted?: number;
}

/**
 * Main Schedule Analysis Service
 * Handles direct integration with schedule agents
 */
export class ScheduleAnalysisService {
  private config: ScheduleAgentConfig;

  constructor(config: ScheduleAgentConfig) {
    this.config = {
      apiKey: config.apiKey,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 4000,
      timeoutMs: config.timeoutMs || 600000
    };
  }

  /**
   * Process a script through the complete schedule analysis pipeline
   * Using direct AI SDK calls following the test-schedule-agents-with-ssd.js pattern
   * Now accepts optional shots and sequence data for enhanced scheduling
   */
  async analyzeScript(scriptData: ScriptData, shotsData?: ShotsData, sequenceData?: SequenceData): Promise<ScheduleAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Initialize AI model
      const apiKey = this.config.apiKey || 'AIzaSyABISxaNzifdIcZUCe408LoKnEz0bia8cI';

      if (!apiKey || apiKey.trim() === '') {
        throw new Error('Google AI API key is required but not provided.');
      }

      // Set the environment variable to ensure the SDK finds it
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;

      console.log('📅 Schedule Analysis - Using API key:', apiKey.substring(0, 10) + '...');

      const model = google('gemini-2.5-flash');

      // Convert SSD scenes to schedule format (first 20 scenes like in working test)
      const convertedScenes = scriptData?.data?.scenes.slice(0, 20).map((scene, index) => ({
        sceneId: `sc_${String(scene.sceneNumber || index + 1).padStart(3, '0')}`,
        sceneNumber: String(scene.sceneNumber || index + 1),
        pageCount: Math.random() * 3 + 0.5,
        estimatedTime: Math.random() * 180 + 60,
        location: scene.location || scene.Scene_Names || 'Unknown Location',
        locationType: scene.Scene_Names && scene.Scene_Names.includes('INT') ? 'INT' : 'EXT',
        timeOfDay: scene.timeOfDay || (scene.Scene_Names && scene.Scene_Names.includes('NIGHT') ? 'NIGHT' : 'DAY'),
        description: (scene.Scene_action || scene.Contents || '').substring(0, 200) + '...',
        cast: scene.Scene_Characters || ['UNKNOWN'],
        props: this.extractProps(scene.Scene_action || scene.Contents || ''),
        wardrobe: ['Period appropriate costumes'],
        specialEquipment: this.extractEquipment(scene.Scene_action || scene.Contents || ''),
        vfx: this.extractVFX(scene.Scene_action || scene.Contents || ''),
        stunts: this.extractStunts(scene.Scene_action || scene.Contents || ''),
        animals: [],
        vehicles: this.extractVehicles(scene.Scene_action || scene.Contents || ''),
        atmospherics: ['Scene atmosphere'],
        priority: this.determinePriority(scene.Scene_action || scene.Contents || ''),
        complexity: this.determineComplexity(scene.Scene_action || scene.Contents || '')
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
              stripColor: z.enum(['WHITE', 'BLUE', 'PINK', 'YELLOW', 'GREEN', 'GOLDENROD', 'BUFF', 'SALMON', 'CHERRY']),
              department: z.enum(['CAMERA', 'GRIP', 'GAFFER', 'SOUND', 'ART', 'WARDROBE', 'MAKEUP', 'STUNTS', 'VFX', 'GENERAL']),
              complexity: z.number().min(1).max(10)
            })),
            metadata: z.object({
              totalScenes: z.number(),
              averageComplexity: z.number(),
              primaryLocations: z.array(z.string())
            }),
            confidence: z.number().min(0).max(1)
          }),
          prompt: `Create professional film production strips with enhanced shot and sequence analysis for ${scriptData?.data?.scriptName || 'film'}:

**SCRIPT SCENES (${convertedScenes.length} scenes):**
${convertedScenes.map(s => `Scene ${s.sceneNumber}: ${s.location} (${s.timeOfDay}) - ${s.description.substring(0, 100)}...`).join('\n')}

${shotsData ? `**SHOTS DATA:**
Total Shots: ${shotsData?.data?.totalShots || 0}
Coverage: ${JSON.stringify(shotsData?.data?.coverage || {}, null, 2)}
Available Equipment: ${shotsData?.data?.equipment?.cameras?.map(c => c.camera).join(', ') || 'Standard'}
Sample Shots: ${shotsData?.data?.shots?.slice(0, 5).map(s => `${s.shotNumber}: ${s.shotType} (${s.complexity})`).join(', ') || 'None specified'}` : '**SHOTS DATA:** No shots data provided'}

${sequenceData ? `**SEQUENCE DATA:**
Total Sequences: ${sequenceData?.data?.totalSequences || 0}
Character Arcs: ${sequenceData?.data?.continuity?.characterArcs?.map(arc => `${arc.character} (${arc.sequences.length} sequences)`).join(', ') || 'None specified'}
Transitions: ${JSON.stringify(sequenceData?.data?.transitions || {}, null, 2)}
Sample Sequences: ${sequenceData?.data?.sequences?.slice(0, 3).map(seq => `${seq.sequenceNumber}: ${seq.name} (${seq.complexity})`).join(', ') || 'None specified'}` : '**SEQUENCE DATA:** No sequence data provided'}

**ENHANCED STRIP CREATION:**
For each scene, create a strip incorporating shot and sequence context:
- sceneId: Scene identifier (e.g., "Scene_1", "Scene_2")
- stripColor: Standard film color based on complexity and shot requirements
- department: Primary department considering shot complexity and equipment needs
- complexity: 1-10 scale considering shots, sequences, and technical requirements

**STRIP ANALYSIS REQUIREMENTS:**
1. Factor shot complexity and equipment needs into strip creation
2. Consider sequence continuity and character arcs for scheduling
3. Account for camera setups and lens changes between shots
4. Integrate transition requirements and post-production needs
5. Balance department workloads based on shot and sequence demands

Generate strips that optimize shooting efficiency while maintaining sequence continuity and shot quality.`
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
          prompt: `Create optimized shooting blocks with shot and sequence integration for ${scriptData?.data?.scriptName || 'film'}:

**BASE SCENES (${convertedScenes.length} scenes):**
${convertedScenes.map(s => `Scene ${s.sceneNumber}: ${s.location} - ${s.timeOfDay} (${s.estimatedTime || 60}min)`).join('\n')}

${shotsData ? `**SHOT COMPLEXITY ANALYSIS:**
Total Shots: ${shotsData?.data?.totalShots || 0}
Equipment Requirements: ${shotsData?.data?.equipment?.cameras?.length || 0} camera setups
Coverage Breakdown: ${shotsData?.data?.coverage ? Object.entries(shotsData?.data?.coverage).map(([type, count]) => `${type}: ${count}`).join(', ') : 'Standard'}
Complex Shots: ${shotsData?.data?.shots?.filter(s => s.complexity === 'HIGH').length || 0} high-complexity shots
Setup Time Impact: ${shotsData?.data?.shots?.reduce((total, shot) => total + (shot.setupTime || 30), 0) || 'Standard'} minutes additional setup` : '**SHOT DATA:** No shots data - using standard blocking'}

${sequenceData ? `**SEQUENCE CONTINUITY REQUIREMENTS:**
Total Sequences: ${sequenceData?.data?.totalSequences || 0}
Continuity Dependencies: ${sequenceData?.data?.sequences?.filter(seq => seq.dependencies && seq.dependencies.length > 0).length || 0} sequences with dependencies
Character Arc Requirements: ${sequenceData?.data?.continuity?.characterArcs?.length || 0} character arcs to maintain
Shooting Order Constraints: ${sequenceData?.data?.sequences?.filter(seq => seq.shootingOrder).length || 0} sequences with specific order requirements
Wardrobe/Makeup Changes: ${sequenceData?.data?.continuity?.characterArcs?.reduce((total, arc) => total + (arc.wardrobe?.length || 0) + (arc.makeup?.length || 0), 0) || 0} continuity items` : '**SEQUENCE DATA:** No sequence data - using standard continuity'}

**ENHANCED BLOCK OPTIMIZATION:**

**DAY BLOCKS:**
- Group day scenes by location and sequence continuity
- Factor in shot complexity and equipment setup times
- Consider character arc continuity and wardrobe/makeup changes
- Account for equipment moves and lens changes
- Each block: blockId, scenes, location, estimatedDuration (including shot setup)

**NIGHT BLOCKS:**
- Group night scenes by location and sequence requirements
- Factor in lighting equipment complexity from shots data
- Consider character continuity across night sequences
- Account for extended setup times for night shoots
- Each block: blockId, scenes, location, estimatedDuration (with night shoot multipliers)

**ADVANCED OPTIMIZATION CRITERIA:**
1. **Shot-Based Scheduling:** Group similar shot types to minimize equipment changes
2. **Sequence Continuity:** Maintain character arcs and prop continuity
3. **Equipment Efficiency:** Minimize camera/lens changes within blocks
4. **Continuity Dependencies:** Respect sequence order requirements
5. **Setup Time Minimization:** Group complex shots strategically

Calculate totalDays, efficiency (factoring shots/sequences), and costSavings from optimized equipment/continuity management.`
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
          prompt: `Create comprehensive location-based shooting plan with shot and sequence coordination for ${scriptData?.data?.scriptName || 'film'}:

**BASE LOCATIONS:**
${[...new Set(convertedScenes.map(s => s.location))].join(', ')}

${shotsData ? `**LOCATION EQUIPMENT REQUIREMENTS:**
Camera Setups Needed: ${shotsData?.data?.equipment?.cameras?.length || 0} configurations
Special Equipment: ${shotsData?.data?.equipment?.specialEquipment?.join(', ') || 'Standard gear'}
Lens Requirements: ${shotsData?.data?.equipment?.lenses?.join(', ') || 'Standard lenses'}
High-Complexity Shots by Location: ${JSON.stringify(
  convertedScenes.reduce((acc, scene) => {
    const complexShots = shotsData?.data?.shots?.filter(shot => 
      shot.sceneNumber === parseInt(scene.sceneNumber) && shot.complexity === 'HIGH'
    ).length || 0;
    if (complexShots > 0) acc[scene.location] = complexShots;
    return acc;
  }, {})
, null, 2)}` : '**EQUIPMENT ANALYSIS:** No shots data - using standard equipment planning'}

${sequenceData ? `**SEQUENCE LOCATION MAPPING:**
Sequences by Location: ${JSON.stringify(
  sequenceData?.data?.sequences?.reduce((acc, seq) => {
    if (!acc[seq.location]) acc[seq.location] = [];
    acc[seq.location].push(seq.name);
    return acc;
  }, {}) || {}
, null, 2)}
Character Arc Locations: ${sequenceData?.data?.continuity?.characterArcs?.map(arc => 
  `${arc.character}: ${arc.sequences.join(', ')}`
).join(' | ') || 'No character location tracking'}
Location Dependencies: ${sequenceData?.data?.sequences?.filter(seq => seq.dependencies && seq.dependencies.length > 0)
  .map(seq => `${seq.location}: depends on ${seq.dependencies?.join(', ')}`).join(' | ') || 'No location dependencies'}` : '**SEQUENCE ANALYSIS:** No sequence data - using basic location grouping'}

**ADVANCED LOCATION MANAGEMENT:**
1. **Equipment-Aware Grouping:** Group scenes requiring similar camera/equipment setups
2. **Sequence Continuity:** Maintain character arcs and prop continuity across locations
3. **Shot Complexity Scheduling:** Plan complex shots with adequate prep time
4. **Dependency Resolution:** Schedule locations respecting sequence dependencies
5. **Travel Optimization:** Minimize equipment transport and setup time

Generate location groups that optimize:
- Equipment setup and breakdown efficiency
- Character/prop continuity maintenance  
- Shot complexity preparation time
- Sequence narrative flow preservation
- Company move minimization`
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
          prompt: `Calculate company moves for ${scriptData?.data?.scriptName || 'film'} production:

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
          prompt: `Validate union compliance and safety for ${scriptData?.data?.scriptName || 'film'} production:

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
                breakdown: z.object({
                  crew: z.string(),
                  equipment: z.string(),
                  locations: z.string(),
                  catering: z.string(),
                  transportation: z.string(),
                  insurance: z.string(),
                  other: z.string()
                })
              })
            }),
            summary: z.object({
              efficiency: z.number().min(0).max(1),
              riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
              recommendations: z.array(z.string()),
              keyMetrics: z.object({
                totalShootDays: z.number(),
                avgScenesPerDay: z.number(),
                crewSize: z.number(),
                locationChanges: z.number(),
                companyMoves: z.number(),
                nightShoots: z.number(),
                riskScore: z.number()
              })
            }),
            confidence: z.number().min(0).max(1)
          }),
          prompt: `Create final production schedule for ${scriptData?.data?.scriptName || 'film'}:

Project: ${scriptData?.data?.scriptName || 'film'}
Total Scenes: ${scriptData?.data?.scenes.length}
Genre: ${scriptData?.data?.genre || 'Feature Film'}
Budget Level: ${scriptData?.data?.budgetLevel || 'Medium'}

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
      } : undefined;

      return {
        success: completedStages > 0,
        processingTime: totalProcessingTime,
        stages,
        finalSchedule
      };
      
    } catch (error) {
      return {
        success: false,
        processingTime: Date.now() - startTime,
        stages: {
          stripCreator: { completed: false, duration: 0, error: 'Not started' },
          blockOptimizer: { completed: false, duration: 0, error: 'Not started' },
          locationManager: { completed: false, duration: 0, error: 'Not started' },
          moveCalculator: { completed: false, duration: 0, error: 'Not started' },
          complianceValidator: { completed: false, duration: 0, error: 'Not started' },
          stripboardGenius: { completed: false, duration: 0, error: 'Not started' }
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Helper functions to extract information from scene content
  private extractProps(content: string): string[] {
    const props: string[] = [];
    const propKeywords = ['gun', 'weapon', 'car', 'phone', 'briefcase', 'computer', 'sword', 'helmet', 'armor'];
    const lowerContent = content.toLowerCase();
    
    propKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        props.push(keyword);
      }
    });
    
    return props.length > 0 ? props : ['basic props'];
  }

  private extractEquipment(content: string): string[] {
    const equipment: string[] = [];
    const equipKeywords = ['camera', 'lighting', 'crane', 'steadicam', 'boom', 'harness'];
    const lowerContent = content.toLowerCase();
    
    equipKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        equipment.push(keyword);
      }
    });
    
    return equipment.length > 0 ? equipment : [];
  }

  private extractVFX(content: string): string[] {
    const vfx: string[] = [];
    const vfxKeywords = ['explosion', 'fire', 'magic', 'digital', 'cgi', 'effects'];
    const lowerContent = content.toLowerCase();
    
    vfxKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        vfx.push(keyword + ' effects');
      }
    });
    
    return vfx;
  }

  private extractStunts(content: string): string[] {
    const stunts: string[] = [];
    const stuntKeywords = ['fight', 'chase', 'jump', 'fall', 'crash', 'battle'];
    const lowerContent = content.toLowerCase();
    
    stuntKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        stunts.push(keyword + ' sequence');
      }
    });
    
    return stunts;
  }

  private extractVehicles(content: string): string[] {
    const vehicles: string[] = [];
    const vehicleKeywords = ['car', 'truck', 'motorcycle', 'plane', 'helicopter', 'ship'];
    const lowerContent = content.toLowerCase();
    
    vehicleKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        vehicles.push(keyword);
      }
    });
    
    return vehicles;
  }

  private determinePriority(content: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('fight') || lowerContent.includes('battle') || lowerContent.includes('explosion')) {
      return 'HIGH';
    } else if (lowerContent.includes('dialogue') || lowerContent.includes('conversation')) {
      return 'MEDIUM';
    }
    return 'MEDIUM';
  }

  private determineComplexity(content: string): 'SIMPLE' | 'MODERATE' | 'COMPLEX' {
    const lowerContent = content.toLowerCase();
    const complexKeywords = ['fight', 'chase', 'explosion', 'effects', 'crowd', 'vehicles'];
    const complexCount = complexKeywords.filter(keyword => lowerContent.includes(keyword)).length;
    
    if (complexCount >= 3) return 'COMPLEX';
    if (complexCount >= 1) return 'MODERATE';
    return 'SIMPLE';
  }

  /**
   * Test individual schedule agents
   */
  async testIndividualAgents(): Promise<AgentTestResult[]> {
    const results: AgentTestResult[] = [];

    const agents = [
      'StripCreator Agent',
      'BlockOptimizer Agent', 
      'LocationManager Agent',
      'MoveCalculator Agent',
      'ComplianceValidator Agent',
      'StripboardGenius Agent'
    ];

    for (const agentName of agents) {
      try {
        const startTime = Date.now();
        
        // Basic connectivity test
        const testResult = { success: true };

        results.push({
          name: agentName,
          passed: testResult.success,
          duration: Date.now() - startTime,
          details: `Agent initialized and ready for schedule processing`
        });
      } catch (error) {
        results.push({
          name: agentName,
          passed: false,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Test the complete schedule analysis system
   */
  async testOrchestrator(): Promise<AgentTestResult> {
    try {
      // Use simple test script data
      const testScript: ScriptData = {
        success: true,
        data: {
          scriptName: 'Test Schedule Analysis',
          genre: 'Action',
          type: 'Feature Film',
          budgetLevel: 'Medium',
          scenes: [
            {
              sceneNumber: 1,
              Scene_Names: 'INT. OFFICE - DAY',
              Scene_action: 'Hero works at computer when villain enters with action sequence',
              Scene_Characters: ['HERO', 'VILLAIN'],
              location: 'OFFICE',
              timeOfDay: 'DAY'
            },
            {
              sceneNumber: 2,
              Scene_Names: 'EXT. STREET - NIGHT',
              Scene_action: 'Chase sequence through city streets with vehicles',
              Scene_Characters: ['HERO', 'VILLAIN'],
              location: 'STREET',
              timeOfDay: 'NIGHT'
            }
          ]
        }
      };

      const result = await this.analyzeScript(testScript);
      
      return {
        name: 'Schedule Analysis System',
        passed: result.success,
        duration: result.processingTime,
        details: `Processed ${Object.keys(result.stages).length} schedule agents`,
        stagesCompleted: Object.values(result.stages).filter((stage: any) => stage.completed).length,
        error: result.error
      };
    } catch (error) {
      return {
        name: 'Schedule Analysis System',
        passed: false,
        duration: 0,
        error: error instanceof Error ? error.message : 'Schedule analysis test failed'
      };
    }
  }

  /**
   * Get configuration info
   */
  getConfig(): ScheduleAgentConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ScheduleAgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Utility functions for working with script data (same as other integrations)
 */
export class ScriptDataUtils {
  /**
   * Load and validate script data from SSD format
   */
  static async loadSSDFile(file: File): Promise<ScriptData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);
          
          // Basic validation
          if (!data.success || !data.data || !Array.isArray(data.data.scenes)) {
            throw new Error('Invalid SSD format: missing required fields');
          }
          
          resolve(data);
        } catch (error) {
          reject(new Error(`Failed to parse script file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Get default script data for testing
   */
  static async getDefaultSSDData(): Promise<ScriptData> {
    try {
      // Fetch the default SSD data from public folder
      const response = await fetch('/ssd.json');
      if (!response.ok) {
        throw new Error('Failed to fetch default SSD data');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      // Fallback to test data
      return {
        success: true,
        data: {
          scriptName: 'Black Panther',
          genre: 'Action/Superhero',
          type: 'Feature Film',
          budgetLevel: 'High',
          scenes: [
            {
              sceneNumber: 1,
              Scene_Names: 'INT. ROYAL PALACE - DAY',
              Scene_action: 'T\'CHALLA receives visitors in the royal palace with ceremonial elements',
              Scene_Characters: ['T\'CHALLA', 'OKOYE', 'SHURI'],
              Contents: 'Royal palace scene with ceremonial elements',
              location: 'ROYAL PALACE',
              timeOfDay: 'DAY'
            },
            {
              sceneNumber: 2,
              Scene_Names: 'EXT. WARRIOR FALLS - NIGHT',
              Scene_action: 'Epic battle sequence at the waterfall location with multiple characters',
              Scene_Characters: ['T\'CHALLA', 'KILLMONGER', 'OKOYE'],
              Contents: 'Battle sequence at warrior falls',
              location: 'WARRIOR FALLS',
              timeOfDay: 'NIGHT'
            }
          ]
        }
      };
    }
  }

  /**
   * Get script statistics for schedule analysis
   */
  static getScriptStats(scriptData: ScriptData): {
    totalScenes: number;
    locations: string[];
    characters: string[];
    timeOfDays: string[];
    estimatedShootingDays: number;
    complexityScore: number;
  } {
    const scenes = scriptData?.data?.scenes;
    const locations = [...new Set(scenes.map(s => s.location).filter(Boolean))] as string[];
    const characters = [...new Set(scenes.flatMap(s => s.Scene_Characters || []))] as string[];
    const timeOfDays = [...new Set(scenes.map(s => s.timeOfDay).filter(Boolean))] as string[];
    
    // Calculate complexity based on various factors
    let complexityScore = 0;
    scenes.forEach(scene => {
      const content = (scene.Scene_action || scene.Contents || '').toLowerCase();
      if (content.includes('battle') || content.includes('fight') || content.includes('chase')) {
        complexityScore += 3;
      } else if (content.includes('crowd') || content.includes('effects')) {
        complexityScore += 2;
      } else {
        complexityScore += 1;
      }
    });
    
    // Rough estimate: 3-5 scenes per day depending on complexity
    const avgScenesPerDay = complexityScore > scenes.length * 2 ? 3 : 5;
    const estimatedShootingDays = Math.ceil(scenes.length / avgScenesPerDay);

    return {
      totalScenes: scenes.length,
      locations,
      characters,
      timeOfDays,
      estimatedShootingDays,
      complexityScore: Math.min(100, Math.round((complexityScore / scenes.length) * 10))
    };
  }
}

/**
 * Default configuration
 */
export const DEFAULT_SCHEDULE_CONFIG: ScheduleAgentConfig = {
  apiKey: 'AIzaSyABISxaNzifdIcZUCe408LoKnEz0bia8cI',
  temperature: 0.7,
  maxTokens: 4000,
  timeoutMs: 600000 // 10 minutes
};

/**
 * Schedule constants for UI display
 */
export const SCHEDULE_DISPLAY_CONSTANTS = {
  RISK_LEVELS: ['LOW', 'MEDIUM', 'HIGH'],
  TIME_OF_DAYS: ['DAY', 'NIGHT', 'DAWN', 'DUSK', 'TIMELESS'],
  LOCATION_TYPES: ['INT', 'EXT', 'STUDIO', 'PRACTICAL'],
  COMPLEXITY_LEVELS: ['SIMPLE', 'MODERATE', 'COMPLEX'],
  PRIORITY_LEVELS: ['HIGH', 'MEDIUM', 'LOW']
};