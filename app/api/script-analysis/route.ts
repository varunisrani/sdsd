import { NextRequest, NextResponse } from 'next/server';
import { google } from '@ai-sdk/google';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

interface ScriptData {
  success: boolean;
  data: {
    timestamp?: string;
    scriptName?: string;
    genre?: string;
    type?: string;
    budgetLevel?: string;
    totalScenes?: number;
    characters?: string[];
    locations?: string[];
    props?: string[];
    vehicles?: string[];
    scenes?: Array<{
      sceneNumber: number;
      Scene_Names?: string;
      Scene_action?: string;
      Scene_Characters?: string[] | null;
      Scene_Dialogue?: string | null;
      Contents?: string;
      location?: string;
      timeOfDay?: string;
    }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { scriptData } = await request.json() as { scriptData: ScriptData };
    
    // Use direct API key
    const apiKey = 'AIzaSyABISxaNzifdIcZUCe408LoKnEz0bia8cI';

    const startTime = Date.now();
    
    // Initialize AI model
    const model = google('gemini-2.5-flash', {
      apiKey: apiKey
    });

    const stages: any = {};

    // SCRIPT AGENT 1: Script Parser Agent
    console.log('📝 SCRIPT AGENT 1: Script Parser & Analysis');
    const parserStart = Date.now();
    
    try {
      const scriptAnalysis = await generateObject({
        model,
        schema: z.object({
          script: z.object({
            title: z.string(),
            genre: z.string(),
            type: z.string(),
            complexity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
            totalScenes: z.number(),
            estimatedPages: z.number(),
            logline: z.string()
          }),
          elements: z.object({
            cast: z.array(z.object({
              name: z.string(),
              role: z.string(),
              importance: z.enum(['LEAD', 'SUPPORTING', 'BACKGROUND']),
              scenes: z.number()
            })),
            props: z.array(z.object({
              name: z.string(),
              category: z.string(),
              complexity: z.enum(['SIMPLE', 'MODERATE', 'COMPLEX']),
              department: z.string()
            })),
            locations: z.array(z.object({
              name: z.string(),
              type: z.enum(['INTERIOR', 'EXTERIOR', 'STUDIO', 'PRACTICAL']),
              complexity: z.enum(['SIMPLE', 'MODERATE', 'COMPLEX']),
              cost: z.string()
            })),
            vehicles: z.array(z.object({
              name: z.string(),
              type: z.string(),
              purpose: z.string(),
              complexity: z.enum(['SIMPLE', 'MODERATE', 'COMPLEX'])
            }))
          }),
          production: z.object({
            estimatedBudget: z.string(),
            shootingDays: z.number(),
            prepWeeks: z.number(),
            crewSize: z.number(),
            complexity: z.enum(['LOW', 'MEDIUM', 'HIGH'])
          }),
          confidence: z.number()
        }),
        prompt: `Analyze this script breakdown data:

Title: ${scriptData.data.scriptName || 'Unknown'}
Genre: ${scriptData.data.genre || 'Unknown'}
Total Scenes: ${scriptData.data.totalScenes || scriptData.data.scenes?.length || 0}

Characters: ${scriptData.data.characters?.join(', ') || 'Unknown'}
Locations: ${scriptData.data.locations?.join(', ') || 'Unknown'}
Props: ${scriptData.data.props?.join(', ') || 'Unknown'}
Vehicles: ${scriptData.data.vehicles?.join(', ') || 'Unknown'}

Provide comprehensive script parsing analysis including:
1. Script classification and complexity assessment
2. Detailed element breakdown with departments
3. Production requirements and budget estimation
4. Cast analysis with role importance
5. Location complexity and cost estimates
6. Vehicle requirements and complexity

Generate professional film industry analysis with accurate classifications.`
      });

      const parserDuration = Date.now() - parserStart;
      stages.scriptParser = {
        completed: true,
        duration: parserDuration,
        data: scriptAnalysis.object
      };
      console.log(`✅ Script Parser completed: ${parserDuration}ms`);
    } catch (error) {
      const parserDuration = Date.now() - parserStart;
      stages.scriptParser = {
        completed: false,
        duration: parserDuration,
        error: error instanceof Error ? error.message : 'Script parsing failed'
      };
      console.log(`❌ Script Parser failed: ${error}`);
    }

    // SCRIPT AGENT 2: Element Detection Agent
    console.log('🔍 SCRIPT AGENT 2: Element Detection');
    const elementStart = Date.now();
    
    try {
      const elementDetection = await generateObject({
        model,
        schema: z.object({
          elementBreakdown: z.object({
            totalElements: z.number(),
            cast: z.array(z.object({
              name: z.string(),
              category: z.string(),
              colorCode: z.string(),
              sceneCount: z.number(),
              importance: z.string()
            })),
            props: z.array(z.object({
              name: z.string(),
              category: z.string(),
              department: z.string(),
              complexity: z.string()
            })),
            locations: z.array(z.object({
              name: z.string(),
              type: z.string(),
              shootingRequirements: z.string()
            })),
            vehicles: z.array(z.object({
              name: z.string(),
              type: z.string(),
              requirements: z.string()
            })),
            categoryCounts: z.record(z.number())
          }),
          departmentBreakdown: z.array(z.object({
            department: z.string(),
            elements: z.array(z.string()),
            complexity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
            budget: z.string(),
            specialRequirements: z.array(z.string())
          })),
          confidence: z.number()
        }),
        prompt: `Perform detailed element detection for script: ${scriptData.data.scriptName || 'Unknown'}

Key Elements to Analyze:
- Characters: ${scriptData.data.characters?.join(', ') || 'Unknown'}
- Locations: ${scriptData.data.locations?.join(', ') || 'Unknown'}  
- Props: ${scriptData.data.props?.join(', ') || 'Unknown'}
- Vehicles: ${scriptData.data.vehicles?.join(', ') || 'Unknown'}

Detect and categorize ALL elements with proper color coding:
- CAST (RED): All speaking characters, background characters
- PROPS (GREEN): Hand props, set props, action props
- LOCATIONS (MAGENTA): Filming locations, set requirements
- VEHICLES (PINK): Cars, trucks, specialized vehicles
- WARDROBE (BLUE): Costume requirements
- MAKEUP/HAIR (PURPLE): Special effects, period styling
- SPECIAL EQUIPMENT (GREY): Technical equipment needed

Provide department-specific breakdowns with budget estimates and complexity assessments.`
      });

      const elementDuration = Date.now() - elementStart;
      stages.elementDetection = {
        completed: true,
        duration: elementDuration,
        data: elementDetection.object
      };
      console.log(`✅ Element Detection completed: ${elementDuration}ms`);
    } catch (error) {
      const elementDuration = Date.now() - elementStart;
      stages.elementDetection = {
        completed: false,
        duration: elementDuration,
        error: error instanceof Error ? error.message : 'Element detection failed'
      };
      console.log(`❌ Element Detection failed: ${error}`);
    }

    // SCRIPT AGENT 3: Categorization Agent  
    console.log('🏷️ SCRIPT AGENT 3: Element Categorization');
    const categorizationStart = Date.now();
    
    try {
      const categorization = await generateObject({
        model,
        schema: z.object({
          departmentAnalysis: z.array(z.object({
            name: z.string(),
            elements: z.array(z.string()),
            budget: z.string(),
            prepTime: z.string(),
            complexity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
            keyRequirements: z.array(z.string()),
            riskFactors: z.array(z.string())
          })),
          timeline: z.object({
            preProduction: z.string(),
            production: z.string(),
            postProduction: z.string(),
            totalDuration: z.string()
          }),
          riskAssessment: z.object({
            high: z.array(z.string()),
            medium: z.array(z.string()),
            low: z.array(z.string())
          }),
          budget: z.object({
            total: z.string(),
            breakdown: z.record(z.string()),
            contingency: z.string()
          }),
          confidence: z.number()
        }),
        prompt: `Create detailed department breakdown and categorization for script: ${scriptData.data.scriptName || 'Unknown'}

Script Details:
- Genre: ${scriptData.data.genre || 'Unknown'}
- Scenes: ${scriptData.data.totalScenes || 0}
- Budget Level: ${scriptData.data.budgetLevel || 'Medium'}

Key Production Elements:
- Advanced technology, special effects, or unique requirements
- Multiple locations requiring different setups
- Complex action sequences or stunts
- Costume design for different periods/styles
- Specialized equipment or vehicles

Generate categorization for:
1. VFX Department (digital effects, compositing)
2. Stunts Department (coordinated action, safety)  
3. Props Department (specialized items, weapons)
4. Costume Department (period pieces, special wardrobe)
5. Locations Department (permits, logistics)
6. Transportation Department (picture vehicles)
7. Cast Department (talent coordination)

Provide realistic film industry budget estimates and risk assessments.`
      });

      const categorizationDuration = Date.now() - categorizationStart;
      stages.categorization = {
        completed: true,
        duration: categorizationDuration,
        data: categorization.object
      };
      console.log(`✅ Categorization completed: ${categorizationDuration}ms`);
    } catch (error) {
      const categorizationDuration = Date.now() - categorizationStart;
      stages.categorization = {
        completed: false,
        duration: categorizationDuration,
        error: error instanceof Error ? error.message : 'Categorization failed'
      };
      console.log(`❌ Categorization failed: ${error}`);
    }

    // SCRIPT AGENT 4: Report Generator Agent
    console.log('📊 SCRIPT AGENT 4: Report Generation');
    const reportStart = Date.now();
    
    try {
      const reportGeneration = await generateObject({
        model,
        schema: z.object({
          executiveSummary: z.object({
            projectOverview: z.string(),
            keyFindings: z.string(),
            budgetHighlights: z.string(),
            recommendations: z.string()
          }),
          schedule: z.object({
            phases: z.array(z.object({
              phase: z.string(),
              duration: z.string(),
              keyMilestones: z.array(z.string())
            })),
            criticalPath: z.array(z.string()),
            bufferTime: z.string()
          }),
          recommendations: z.array(z.string()),
          successFactors: z.array(z.string()),
          confidence: z.number()
        }),
        prompt: `Generate comprehensive script breakdown report for: ${scriptData.data.scriptName || 'Unknown'}

Production Complexity:
- Total scenes: ${scriptData.data.totalScenes || 0}
- Genre: ${scriptData.data.genre || 'Unknown'}
- Budget level: ${scriptData.data.budgetLevel || 'Medium'}

Create executive-level reporting with:
1. Project overview and scope analysis
2. Key findings from script breakdown
3. Budget highlights and cost drivers
4. Production schedule recommendations
5. Risk mitigation strategies
6. Success factors for on-time delivery

Format as professional production report suitable for investors and department heads.`
      });

      const reportDuration = Date.now() - reportStart;
      stages.reportGenerator = {
        completed: true,
        duration: reportDuration,
        data: reportGeneration.object
      };
      console.log(`✅ Report Generation completed: ${reportDuration}ms`);
    } catch (error) {
      const reportDuration = Date.now() - reportStart;
      stages.reportGenerator = {
        completed: false,
        duration: reportDuration,
        error: error instanceof Error ? error.message : 'Report generation failed'
      };
      console.log(`❌ Report Generation failed: ${error}`);
    }

    const totalProcessingTime = Date.now() - startTime;
    const completedStages = Object.values(stages).filter((stage: any) => stage.completed).length;

    // Extract final analysis from completed stages
    const finalAnalysis = completedStages > 0 ? {
      scriptClassification: stages.scriptParser?.completed ? {
        title: stages.scriptParser.data.script.title,
        genre: stages.scriptParser.data.script.genre,
        complexity: stages.scriptParser.data.script.complexity,
        estimatedPages: stages.scriptParser.data.script.estimatedPages,
        logline: stages.scriptParser.data.script.logline
      } : null,
      elementBreakdown: stages.elementDetection?.completed ? {
        totalElements: stages.elementDetection.data.elementBreakdown.totalElements,
        categoryCounts: stages.elementDetection.data.elementBreakdown.categoryCounts,
        cast: stages.elementDetection.data.elementBreakdown.cast,
        props: stages.elementDetection.data.elementBreakdown.props,
        locations: stages.elementDetection.data.elementBreakdown.locations,
        vehicles: stages.elementDetection.data.elementBreakdown.vehicles
      } : null,
      productionRequirements: stages.scriptParser?.completed ? {
        estimatedBudget: stages.scriptParser.data.production.estimatedBudget,
        shootingDays: stages.scriptParser.data.production.shootingDays,
        prepWeeks: stages.scriptParser.data.production.prepWeeks,
        crewSize: stages.scriptParser.data.production.crewSize,
        complexity: stages.scriptParser.data.production.complexity
      } : null,
      departmentBreakdown: stages.categorization?.completed ? 
        stages.categorization.data.departmentAnalysis : [],
      riskAssessment: stages.categorization?.completed ? 
        stages.categorization.data.riskAssessment : null,
      recommendations: stages.reportGenerator?.completed ? 
        stages.reportGenerator.data.recommendations : [],
      confidence: Math.max(
        stages.scriptParser?.data?.confidence || 0,
        stages.elementDetection?.data?.confidence || 0,
        stages.categorization?.data?.confidence || 0,
        stages.reportGenerator?.data?.confidence || 0
      )
    } : null;

    return NextResponse.json({
      success: completedStages > 0,
      processingTime: totalProcessingTime,
      stages,
      finalAnalysis
    });

  } catch (error) {
    console.error('Script analysis API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Script analysis failed',
        processingTime: 0,
        stages: {
          scriptParser: { completed: false, duration: 0, error: 'Not started' },
          elementDetection: { completed: false, duration: 0, error: 'Not started' },
          categorization: { completed: false, duration: 0, error: 'Not started' },
          reportGenerator: { completed: false, duration: 0, error: 'Not started' }
        }
      },
      { status: 500 }
    );
  }
}