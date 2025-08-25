'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  FileText, 
  Play, 
  Settings, 
  BarChart3, 
  Clock, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Upload,
  Download,
  RefreshCw,
  Film,
  Target,
  Calendar,
  Database,
  Trash2,
  Eye,
  Users,
  Package,
  MapPin,
  Car,
  Building
} from 'lucide-react';
import { BudgetAnalysisService, ScriptDataUtils as BudgetUtils, BudgetAnalysisResult, AgentTestResult, ScriptData, DEFAULT_BUDGET_CONFIG } from '../lib/budget-integration';
import { ScriptAnalysisService, ScriptDataUtils, ScriptAnalysisResult, AssetsData, DEFAULT_SCRIPT_CONFIG } from '../lib/script-integration';
import { ScheduleAnalysisService, ScriptDataUtils as ScheduleUtils, ScheduleAnalysisResult, ShotsData, SequenceData, DEFAULT_SCHEDULE_CONFIG } from '../lib/schedule-integration';
import { AnalysisStorageService, StoredAnalysis } from '../lib/storage-service';

type AnalysisType = 'budget' | 'script' | 'schedule';


interface AnalysisDashboardProps {
  className?: string;
}

export function AnalysisDashboard({ className = '' }: AnalysisDashboardProps) {
  // State management
  const [analysisType, setAnalysisType] = useState<AnalysisType>('budget');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [budgetResult, setBudgetResult] = useState<BudgetAnalysisResult | null>(null);
  const [scriptResult, setScriptResult] = useState<ScriptAnalysisResult | null>(null);
  const [scheduleResult, setScheduleResult] = useState<ScheduleAnalysisResult | null>(null);
  const [testResults, setTestResults] = useState<AgentTestResult[]>([]);
  const [orchestratorTest, setOrchestratorTest] = useState<AgentTestResult | null>(null);
  const [currentScript, setCurrentScript] = useState<ScriptData | null>(null);
  const [currentAssets, setCurrentAssets] = useState<AssetsData | null>(null);
  const [currentShots, setCurrentShots] = useState<ShotsData | null>(null);
  const [currentSequence, setCurrentSequence] = useState<SequenceData | null>(null);
  const [currentScriptAnalysis, setCurrentScriptAnalysis] = useState<ScriptAnalysisResult | null>(null);
  const [currentScheduleAnalysis, setCurrentScheduleAnalysis] = useState<ScheduleAnalysisResult | null>(null);
  const [apiKey, setApiKey] = useState('AIzaSyABISxaNzifdIcZUCe408LoKnEz0bia8cI');
  const [error, setError] = useState<string | null>(null);
  const [storedAnalyses, setStoredAnalyses] = useState<StoredAnalysis[]>([]);
  const [showStoragePanel, setShowStoragePanel] = useState(false);

  // Load stored analyses on component mount
  useEffect(() => {
    const loadStoredAnalyses = () => {
      const analyses = AnalysisStorageService.getStoredAnalyses();
      setStoredAnalyses(analyses);
    };

    // Load stored shots and sequence data
    const loadStoredData = () => {
      try {
        const storedShots = localStorage.getItem('currentShots');
        if (storedShots) {
          const shotsData = JSON.parse(storedShots);
          setCurrentShots(shotsData);
          console.log('Loaded stored shots data:', shotsData);
        }

        const storedSequence = localStorage.getItem('currentSequence');
        if (storedSequence) {
          const sequenceData = JSON.parse(storedSequence);
          setCurrentSequence(sequenceData);
          console.log('Loaded stored sequence data:', sequenceData);
        }

        const storedScriptAnalysis = localStorage.getItem('currentScriptAnalysis');
        if (storedScriptAnalysis) {
          const scriptAnalysisData = JSON.parse(storedScriptAnalysis);
          setCurrentScriptAnalysis(scriptAnalysisData);
          console.log('Loaded stored script analysis data:', scriptAnalysisData);
        }

        const storedScheduleAnalysis = localStorage.getItem('currentScheduleAnalysis');
        if (storedScheduleAnalysis) {
          const scheduleAnalysisData = JSON.parse(storedScheduleAnalysis);
          setCurrentScheduleAnalysis(scheduleAnalysisData);
          console.log('Loaded stored schedule analysis data:', scheduleAnalysisData);
        }
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    };

    loadStoredAnalyses();
    loadStoredData();
    
    // Set up storage event listener to sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ai_analysis_results') {
        loadStoredAnalyses();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  // Initialize services
  const createBudgetService = useCallback(() => {
    if (!apiKey.trim()) {
      throw new Error('API key is required');
    }
    return new BudgetAnalysisService({
      ...DEFAULT_BUDGET_CONFIG,
      apiKey: apiKey.trim()
    });
  }, [apiKey]);

  const createScriptService = useCallback(() => {
    if (!apiKey.trim()) {
      throw new Error('API key is required');
    }
    return new ScriptAnalysisService({
      ...DEFAULT_SCRIPT_CONFIG,
      apiKey: apiKey.trim()
    });
  }, [apiKey]);

  const createScheduleService = useCallback(() => {
    if (!apiKey.trim()) {
      throw new Error('API key is required');
    }
    return new ScheduleAnalysisService({
      ...DEFAULT_SCHEDULE_CONFIG,
      apiKey: apiKey.trim()
    });
  }, [apiKey]);

  // Load default SSD data
  const handleLoadDefaultScript = async () => {
    try {
      setError(null);
      const defaultData = analysisType === 'budget' 
        ? await BudgetUtils.getDefaultSSDData()
        : analysisType === 'script'
        ? await ScriptDataUtils.getDefaultSSDData()
        : await ScheduleUtils.getDefaultSSDData();
      setCurrentScript(defaultData as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load default script');
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const scriptData = analysisType === 'budget'
        ? await BudgetUtils.loadSSDFile(file)
        : analysisType === 'script'
        ? await ScriptDataUtils.loadSSDFile(file)
        : await ScheduleUtils.loadSSDFile(file);
      setCurrentScript(scriptData as any);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load script file');
    }
  };

  const handleAssetsUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const text = await file.text();
      const assetsData = JSON.parse(text) as AssetsData;
      setCurrentAssets(assetsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets file');
    }
  };

  const handleShotsUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const text = await file.text();
      const rawData = JSON.parse(text);
      console.log('Raw shots data loaded:', rawData);
      
      // Transform to expected format
      const shotsData: ShotsData = {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          projectName: rawData.project_title || 'Unknown Project',
          totalShots: rawData.shots_breakdown?.total_shots || rawData.production_summary?.total_shots || 0,
          shots: rawData.shots_breakdown?.shots || [],
          coverage: rawData.shots_breakdown?.coverage || {},
          equipment: rawData.shots_breakdown?.equipment || {}
        }
      };
      
      console.log('Transformed shots data:', shotsData);
      setCurrentShots(shotsData);
      localStorage.setItem('currentShots', JSON.stringify(shotsData));
      event.target.value = ''; // Clear the input
    } catch (err) {
      console.error('Failed to load shots file:', err);
      setError(err instanceof Error ? err.message : 'Failed to load shots file');
    }
  };

  const handleSequenceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const text = await file.text();
      const rawData = JSON.parse(text);
      console.log('Raw sequence data loaded:', rawData);
      
      // Transform to expected format
      const sequenceData: SequenceData = {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          projectName: rawData.project_title || 'Unknown Project',
          totalSequences: rawData.sequences_breakdown?.total_sequences || rawData.production_summary?.total_sequences || 0,
          sequences: rawData.sequences_breakdown?.sequences || [],
          continuity: rawData.sequences_breakdown?.continuity || {},
          transitions: rawData.sequences_breakdown?.transitions || {}
        }
      };
      
      console.log('Transformed sequence data:', sequenceData);
      setCurrentSequence(sequenceData);
      localStorage.setItem('currentSequence', JSON.stringify(sequenceData));
      event.target.value = ''; // Clear the input
    } catch (err) {
      console.error('Failed to load sequence file:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sequence file');
    }
  };

  const handleScriptAnalysisUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const text = await file.text();
      const analysisData = JSON.parse(text) as ScriptAnalysisResult;
      console.log('Script analysis data loaded:', analysisData);
      setCurrentScriptAnalysis(analysisData);
      localStorage.setItem('currentScriptAnalysis', JSON.stringify(analysisData));
      event.target.value = ''; // Clear the input
    } catch (err) {
      console.error('Failed to load script analysis file:', err);
      setError(err instanceof Error ? err.message : 'Failed to load script analysis file');
    }
  };

  const handleScheduleAnalysisUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const text = await file.text();
      const analysisData = JSON.parse(text) as ScheduleAnalysisResult;
      console.log('Schedule analysis data loaded:', analysisData);
      setCurrentScheduleAnalysis(analysisData);
      localStorage.setItem('currentScheduleAnalysis', JSON.stringify(analysisData));
      event.target.value = ''; // Clear the input
    } catch (err) {
      console.error('Failed to load schedule analysis file:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schedule analysis file');
    }
  };

  // Storage management functions
  const handleDeleteAnalysis = (id: string) => {
    if (confirm('Are you sure you want to delete this analysis?')) {
      AnalysisStorageService.deleteAnalysis(id);
      setStoredAnalyses(AnalysisStorageService.getStoredAnalyses());
    }
  };

  const handleClearAllAnalyses = () => {
    if (confirm('Are you sure you want to clear all stored analyses? This cannot be undone.')) {
      AnalysisStorageService.clearAllAnalyses();
      setStoredAnalyses([]);
    }
  };

  const handleClearByType = (type: 'script' | 'schedule') => {
    if (confirm(`Are you sure you want to clear all ${type} analyses?`)) {
      AnalysisStorageService.clearAnalysesByType(type);
      setStoredAnalyses(AnalysisStorageService.getStoredAnalyses());
    }
  };

  const handleViewStoredAnalysis = (analysis: StoredAnalysis) => {
    if (analysis.type === 'script') {
      setScriptResult(analysis.result);
      setBudgetResult(null);
      setScheduleResult(null);
      setAnalysisType('script');
    } else if (analysis.type === 'schedule') {
      setScheduleResult(analysis.result);
      setBudgetResult(null);
      setScriptResult(null);
      setAnalysisType('schedule');
    } else if (analysis.type === 'budget') {
      setBudgetResult(analysis.result);
      setScriptResult(null);
      setScheduleResult(null);
      setAnalysisType('budget');
    }
    setShowStoragePanel(false);
  };

  // Export utility functions
  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportScriptAnalysis = () => {
    if (scriptResult) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const projectName = scriptResult.finalAnalysis?.scriptClassification?.title || 'Script-Analysis';
      downloadJSON(scriptResult, `${projectName}_Script-Analysis_${timestamp}.json`);
    }
  };

  const handleExportBudgetAnalysis = () => {
    if (budgetResult) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const projectName = 'Budget-Analysis';
      downloadJSON(budgetResult, `${projectName}_Budget-Analysis_${timestamp}.json`);
    }
  };

  const handleExportScheduleAnalysis = () => {
    if (scheduleResult) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const projectName = 'Schedule-Analysis';
      downloadJSON(scheduleResult, `${projectName}_Schedule-Analysis_${timestamp}.json`);
    }
  };

  const handleExportAllResults = () => {
    const allResults = {
      exportTimestamp: new Date().toISOString(),
      exportType: 'combined-analysis-results',
      version: '1.0',
      results: {
        ...(scriptResult && { scriptAnalysis: scriptResult }),
        ...(budgetResult && { budgetAnalysis: budgetResult }),
        ...(scheduleResult && { scheduleAnalysis: scheduleResult })
      },
      metadata: {
        totalResults: [scriptResult, budgetResult, scheduleResult].filter(Boolean).length,
        analysisTypes: [
          scriptResult && 'script',
          budgetResult && 'budget', 
          scheduleResult && 'schedule'
        ].filter(Boolean),
        combinedProcessingTime: [scriptResult?.processingTime, budgetResult?.processingTime, scheduleResult?.processingTime]
          .filter(Boolean)
          .reduce((sum, time) => (sum || 0) + (time || 0), 0)
      }
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadJSON(allResults, `Combined-Analysis-Results_${timestamp}.json`);
  };

  // Run analysis based on selected type
  const handleAnalyzeScript = async () => {
    console.log('🚀 handleAnalyzeScript called with:', {
      analysisType,
      currentScript: !!currentScript,
      currentShots: !!currentShots,
      currentSequence: !!currentSequence,
      apiKey: !!apiKey.trim()
    });

    // Validate required data based on analysis type
    if (analysisType === 'schedule') {
      if (!currentShots && !currentSequence) {
        console.error('❌ Schedule analysis validation failed: no shots or sequence data');
        setError('No shots or sequence data loaded. Please upload shots.json or sequences.json first.');
        return;
      }
      console.log('✅ Schedule analysis validation passed');
    } else if (analysisType === 'budget') {
      if (!currentScriptAnalysis || !currentScheduleAnalysis) {
        console.error('❌ Budget analysis validation failed: missing script or schedule analysis');
        setError('Budget analysis requires both script analysis and schedule analysis results. Please upload both files.');
        return;
      }
      console.log('✅ Budget analysis validation passed');
    } else {
      if (!currentScript) {
        console.error('❌ Script analysis validation failed: no script');
        setError('No script loaded. Please load a script first.');
        return;
      }
      console.log('✅ Script analysis validation passed');
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      setBudgetResult(null);
      setScriptResult(null);
      setScheduleResult(null);

      if (analysisType === 'budget') {
        const service = createBudgetService();
        const result = await service.analyzeScript(currentScriptAnalysis!, currentScheduleAnalysis!);
        setBudgetResult(result);
        
        // Save to local storage
        if (result.success) {
          const projectName = currentScriptAnalysis!.finalAnalysis?.scriptClassification?.title || 'Budget Analysis';
          AnalysisStorageService.saveAnalysis('budget', projectName, result);
          setStoredAnalyses(AnalysisStorageService.getStoredAnalyses());
        }
        
        if (!result.success) {
          setError(result.error || 'Budget analysis failed');
        }
      } else if (analysisType === 'script') {
        const service = createScriptService();
        const result = await service.analyzeScript(currentScript!, currentAssets || undefined);
        setScriptResult(result);
        
        // Save to local storage
        if (result.success) {
          const projectName = currentScript?.data?.scriptName || 'Script Analysis';
          AnalysisStorageService.saveAnalysis('script', projectName, result);
          setStoredAnalyses(AnalysisStorageService.getStoredAnalyses());
        }
        
        if (!result.success) {
          setError(result.error || 'Script analysis failed');
        }
      } else {
        // Schedule analysis
        if (!currentShots && !currentSequence) {
          setError('No shots or sequence data loaded for schedule analysis');
          return;
        }
        
        const service = createScheduleService();
        
        // Create minimal script data if none provided
        const scriptForAnalysis = currentScript || {
          success: true,
          data: {
            scriptName: currentShots?.data?.projectName || currentSequence?.data?.projectName || 'Schedule Analysis',
            genre: 'Feature Film',
            type: 'Feature',
            budgetLevel: 'Medium',
            scenes: []
          }
        };
        
        console.log('Starting schedule analysis with:', {
          script: scriptForAnalysis,
          shots: currentShots,
          sequence: currentSequence
        });
        
        const result = await service.analyzeScript(scriptForAnalysis, currentShots || undefined, currentSequence || undefined);
        setScheduleResult(result);
        
        // Save to local storage
        if (result.success) {
          const projectName = scriptForAnalysis.data?.scriptName || 'Schedule Analysis';
          AnalysisStorageService.saveAnalysis('schedule', projectName, result);
          setStoredAnalyses(AnalysisStorageService.getStoredAnalyses());
        }
        
        if (!result.success) {
          setError(result.error || 'Schedule analysis failed');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Test agents based on selected type
  const handleTestAgents = async () => {
    try {
      setIsTesting(true);
      setError(null);
      setTestResults([]);
      setOrchestratorTest(null);

      if (analysisType === 'budget') {
        const service = createBudgetService();
        const agentTests = await service.testIndividualAgents();
        setTestResults(agentTests);
        const orchTest = await service.testOrchestrator();
        setOrchestratorTest(orchTest);
      } else if (analysisType === 'script') {
        const service = createScriptService();
        const agentTests = await service.testIndividualAgents();
        setTestResults(agentTests);
        const orchTest = await service.testOrchestrator();
        setOrchestratorTest(orchTest);
      } else {
        const service = createScheduleService();
        const agentTests = await service.testIndividualAgents();
        setTestResults(agentTests);
        const orchTest = await service.testOrchestrator();
        setOrchestratorTest(orchTest);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Agent testing failed');
    } finally {
      setIsTesting(false);
    }
  };

  // Get script stats
  const scriptStats = currentScript ? (analysisType === 'budget' 
    ? BudgetUtils.getScriptStats(currentScript)
    : analysisType === 'script'
    ? ScriptDataUtils.getScriptStats(currentScript)
    : ScheduleUtils.getScriptStats(currentScript)) : null;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 ${className}`}>
      {/* Modern Header with Glass Effect */}
      <div className="glass sticky top-0 z-50 border-b border-border/50 animate-slideDown">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="animate-fadeIn">
              <h1 className="text-4xl font-bold gradient-text mb-2">Film Production Analysis</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-success rounded-full animate-pulse"></span>
                Professional {analysisType} analysis using AI-powered agents
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/50">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Google AI API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="input-base bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
          </div>
          
          {/* Modern Analysis Type Selector with Pills */}
          <div className="mt-8">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setAnalysisType('budget');
                  setBudgetResult(null);
                  setScriptResult(null);
                  setScheduleResult(null);
                  setError(null);
                }}
                className={`btn px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  analysisType === 'budget'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-glow scale-105'
                    : 'bg-card hover:bg-accent text-foreground border border-border/50 hover:border-primary/30'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Budget Analysis
              </button>
              <button
                onClick={() => {
                  setAnalysisType('script');
                  setBudgetResult(null);
                  setScriptResult(null);
                  setScheduleResult(null);
                  setError(null);
                }}
                className={`btn px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  analysisType === 'script'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-glow scale-105'
                    : 'bg-card hover:bg-accent text-foreground border border-border/50 hover:border-primary/30'
                }`}
              >
                <Film className="w-4 h-4" />
                Script Analysis
              </button>
              <button
                onClick={() => {
                  setAnalysisType('schedule');
                  setBudgetResult(null);
                  setScriptResult(null);
                  setScheduleResult(null);
                  setError(null);
                }}
                className={`btn px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  analysisType === 'schedule'
                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-glow scale-105'
                    : 'bg-card hover:bg-accent text-foreground border border-border/50 hover:border-primary/30'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Schedule Analysis
              </button>
              
              {/* Modern Storage Management Button */}
              <button
                onClick={() => setShowStoragePanel(!showStoragePanel)}
                className={`btn px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  showStoragePanel
                    ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-glow'
                    : 'bg-card hover:bg-accent text-foreground border border-border/50 hover:border-primary/30'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Storage</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-primary/20 text-primary rounded-full">
                  {storedAnalyses.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Error Display */}
        {error && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4 animate-slideIn">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-destructive animate-pulse" />
              </div>
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Modern Storage Management Panel */}
        {showStoragePanel && (
          <div className="mb-8 bg-card rounded-xl shadow-lg border border-border/50 animate-scaleIn card-hover">
            <div className="border-b border-border/50 px-6 py-5 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Stored AI Analysis Results</h3>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">{storedAnalyses.length}</span> stored analyses • 
                      Script: <span className="text-purple-600 font-medium">{storedAnalyses.filter(a => a.type === 'script').length}</span> • 
                      Schedule: <span className="text-green-600 font-medium">{storedAnalyses.filter(a => a.type === 'schedule').length}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => AnalysisStorageService.exportAnalyses()}
                    className="btn px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={handleClearAllAnalyses}
                    className="btn px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {storedAnalyses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-muted/50 rounded-full mb-4">
                    <Database className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">No stored analyses</h4>
                  <p className="text-muted-foreground">Run script or schedule analysis to start storing results</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {storedAnalyses.map((analysis) => (
                    <div key={analysis.id} className="group bg-secondary/30 border border-border/50 rounded-lg p-4 hover:bg-accent/50 hover:border-primary/30 transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              analysis.type === 'script' 
                                ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' 
                                : 'bg-green-500/10 text-green-600 border border-green-500/20'
                            }`}>
                              {analysis.type === 'script' ? <Film className="w-3 h-3 mr-1.5" /> : <Calendar className="w-3 h-3 mr-1.5" />}
                              {analysis.type.toUpperCase()}
                            </span>
                            <h4 className="text-sm font-semibold text-foreground">{analysis.projectName}</h4>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1.5">
                            <p className="flex items-center gap-2">
                              <span className="opacity-60">📅</span>
                              {new Date(analysis.timestamp).toLocaleString()}
                            </p>
                            {analysis.metadata && (
                              <p className="flex items-center gap-2 flex-wrap">
                                <span className="opacity-60">⏱️</span>
                                <span className="font-medium">{analysis.metadata.processingTime}ms</span>
                                <span className="opacity-40">•</span>
                                <span className="opacity-60">✅</span>
                                <span className="font-medium">{analysis.metadata.stagesCompleted} stages</span>
                                <span className="opacity-40">•</span>
                                <span className="opacity-60">📊</span>
                                <span className="font-medium">{Math.round((analysis.metadata.confidence || 0) * 100)}%</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewStoredAnalysis(analysis)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="View Analysis"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnalysis(analysis.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                            title="Delete Analysis"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {storedAnalyses.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleClearByType('script')}
                    className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                  >
                    Clear Script Analyses ({storedAnalyses.filter(a => a.type === 'script').length})
                  </button>
                  <button
                    onClick={() => handleClearByType('schedule')}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                  >
                    Clear Schedule Analyses ({storedAnalyses.filter(a => a.type === 'schedule').length})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Script Management Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Script Management</h3>
                <p className="text-sm text-gray-500">Load and manage your script files for {analysisType} analysis</p>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Script File Upload - Only for Script Analysis */}
                {analysisType === 'script' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Script Breakdown (SSD.json)
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">Click to upload script breakdown</p>
                          {currentScript && currentScript.data && (
                            <p className="text-xs text-green-600 mt-1">✓ Script loaded: {currentScript.data?.scriptName || 'Unknown'}</p>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".json"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Budget Analysis Inputs */}
                {analysisType === 'budget' && (
                  <div className="space-y-4">
                    {/* Script Analysis JSON Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Script Analysis JSON
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer ${
                          currentScriptAnalysis 
                            ? 'border-blue-500 bg-blue-100 hover:bg-blue-200' 
                            : 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                        }`}>
                          <div className="flex flex-col items-center justify-center pt-3 pb-3">
                            <Upload className={`w-6 h-6 mb-1 ${
                              currentScriptAnalysis ? 'text-blue-600' : 'text-blue-400'
                            }`} />
                            {currentScriptAnalysis ? (
                              <>
                                <p className="text-xs text-blue-700 font-semibold">✓ Script Analysis Loaded</p>
                                <p className="text-xs text-blue-600">
                                  Project: {currentScriptAnalysis.finalAnalysis?.scriptClassification?.title || 'Unknown'}
                                </p>
                                <p className="text-xs text-blue-500 mt-1">Click to replace script analysis file</p>
                              </>
                            ) : (
                              <p className="text-xs text-blue-600">Upload script analysis results from script agents</p>
                            )}
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".json"
                            onChange={handleScriptAnalysisUpload}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Schedule Analysis JSON Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Schedule Analysis JSON
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer ${
                          currentScheduleAnalysis 
                            ? 'border-green-500 bg-green-100 hover:bg-green-200' 
                            : 'border-green-300 bg-green-50 hover:bg-green-100'
                        }`}>
                          <div className="flex flex-col items-center justify-center pt-3 pb-3">
                            <Upload className={`w-6 h-6 mb-1 ${
                              currentScheduleAnalysis ? 'text-green-600' : 'text-green-400'
                            }`} />
                            {currentScheduleAnalysis ? (
                              <>
                                <p className="text-xs text-green-700 font-semibold">✓ Schedule Analysis Loaded</p>
                                <p className="text-xs text-green-600">
                                  Project: {'Unknown'}
                                </p>
                                <p className="text-xs text-green-500 mt-1">Click to replace schedule analysis file</p>
                              </>
                            ) : (
                              <p className="text-xs text-green-600">Upload schedule analysis results from schedule agents</p>
                            )}
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".json"
                            onChange={handleScheduleAnalysisUpload}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assets File Upload (Optional for Script Analysis) */}
                {analysisType === 'script' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Assets Data (Optional)
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100">
                        <div className="flex flex-col items-center justify-center pt-3 pb-3">
                          <Upload className="w-6 h-6 mb-1 text-blue-400" />
                          <p className="text-xs text-blue-600">Upload assets.json for enhanced analysis</p>
                          {currentAssets && currentAssets.data && (
                            <p className="text-xs text-green-600 mt-1">✓ Assets loaded: {currentAssets.data?.totalAssets || 0} items</p>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".json"
                          onChange={handleAssetsUpload}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Shots & Sequence Files Upload (Optional for Schedule Analysis) */}
                {analysisType === 'schedule' && (
                  <div className="space-y-3">
                    {/* Shots File Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Shots Data (Optional)
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer ${
                          currentShots && currentShots.data 
                            ? 'border-green-500 bg-green-100 hover:bg-green-200' 
                            : 'border-green-300 bg-green-50 hover:bg-green-100'
                        }`}>
                          <div className="flex flex-col items-center justify-center pt-2 pb-2">
                            <Upload className={`w-5 h-5 mb-1 ${
                              currentShots && currentShots.data ? 'text-green-600' : 'text-green-400'
                            }`} />
                            {currentShots && currentShots.data ? (
                              <>
                                <p className="text-xs text-green-700 font-semibold">✓ Shots Data Loaded</p>
                                <p className="text-xs text-green-600">
                                  {currentShots.data?.totalShots || 0} shots | Project: {currentShots.data?.projectName || 'Unknown'}
                                </p>
                                <p className="text-xs text-green-500 mt-1">Click to replace shots.json file</p>
                              </>
                            ) : (
                              <p className="text-xs text-green-600">Upload shots.json for shot-aware scheduling</p>
                            )}
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".json"
                            onChange={handleShotsUpload}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Sequence File Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Sequence Data (Optional)
                      </label>
                      <div className="flex items-center justify-center w-full">
                        <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer ${
                          currentSequence && currentSequence.data 
                            ? 'border-purple-500 bg-purple-100 hover:bg-purple-200' 
                            : 'border-purple-300 bg-purple-50 hover:bg-purple-100'
                        }`}>
                          <div className="flex flex-col items-center justify-center pt-2 pb-2">
                            <Upload className={`w-5 h-5 mb-1 ${
                              currentSequence && currentSequence.data ? 'text-purple-600' : 'text-purple-400'
                            }`} />
                            {currentSequence && currentSequence.data ? (
                              <>
                                <p className="text-xs text-purple-700 font-semibold">✓ Sequence Data Loaded</p>
                                <p className="text-xs text-purple-600">
                                  {currentSequence.data?.totalSequences || 0} sequences | Project: {currentSequence.data?.projectName || 'Unknown'}
                                </p>
                                <p className="text-xs text-purple-500 mt-1">Click to replace sequences.json file</p>
                              </>
                            ) : (
                              <p className="text-xs text-purple-600">Upload sequences.json for enhanced coordination</p>
                            )}
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".json"
                            onChange={handleSequenceUpload}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center text-gray-500">or</div>

                {/* Load Default - Only for Script and Schedule Analysis */}
                {analysisType !== 'budget' && (
                  <button
                    onClick={handleLoadDefaultScript}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Load Default Test Script
                  </button>
                )}

                {/* Script Info */}
                {currentScript && analysisType === 'script' && (
                  <div className="mt-6 p-4 rounded-lg bg-purple-50">
                    <h4 className="font-medium mb-2 text-purple-900">
                      Script Loaded
                    </h4>
                    <div className="text-sm space-y-1 text-purple-700">
                      <p><strong>Name:</strong> {currentScript.data?.scriptName || 'Unknown'}</p>
                      <p><strong>Type:</strong> {currentScript.data?.type || 'Unknown'}</p>
                      <p><strong>Genre:</strong> {currentScript.data?.genre || 'Unknown'}</p>
                      {scriptStats && (
                        <>
                          <p><strong>Scenes:</strong> {scriptStats.totalScenes}</p>
                          <p><strong>Characters:</strong> {scriptStats.characters}</p>
                          <p><strong>Locations:</strong> {scriptStats.locations}</p>
                          <p><strong>Props:</strong> {(scriptStats as any).props || 'N/A'}</p>
                          <p><strong>Vehicles:</strong> {(scriptStats as any).vehicles || 'N/A'}</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Budget Analysis Info */}
                {analysisType === 'budget' && (currentScriptAnalysis || currentScheduleAnalysis) && (
                  <div className="mt-6 p-4 rounded-lg bg-blue-50">
                    <h4 className="font-medium mb-2 text-blue-900">
                      Budget Analysis Inputs
                    </h4>
                    <div className="text-sm space-y-2 text-blue-700">
                      {currentScriptAnalysis && (
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span><strong>Script Analysis:</strong> {currentScriptAnalysis.finalAnalysis?.scriptClassification?.title || 'Loaded'}</span>
                        </div>
                      )}
                      {currentScheduleAnalysis && (
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span><strong>Schedule Analysis:</strong> {'Loaded'}</span>
                        </div>
                      )}
                      {currentScriptAnalysis && currentScheduleAnalysis && (
                        <p className="text-green-600 font-medium">✓ Ready for budget analysis</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Panel */}
            <div className="mt-6 bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Actions</h3>
              </div>
              
              <div className="p-6 space-y-3">
                <button
                  onClick={handleAnalyzeScript}
                  disabled={
                    !apiKey.trim() || 
                    isAnalyzing || 
                    (analysisType === 'schedule' 
                      ? (!currentShots && !currentSequence)  // Schedule needs shots OR sequences
                      : analysisType === 'budget'
                      ? (!currentScriptAnalysis || !currentScheduleAnalysis)  // Budget needs both analysis results
                      : !currentScript  // Script needs script file
                    )
                  }
                  className={`w-full px-4 py-3 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${
                    analysisType === 'budget' ? 'bg-blue-600 hover:bg-blue-700' : 
                    analysisType === 'script' ? 'bg-purple-600 hover:bg-purple-700' :
                    'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing {analysisType === 'budget' ? 'Budget' : 
                                 analysisType === 'script' ? 'Script' : 'Schedule'}...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Analyze {analysisType === 'budget' ? 'Budget' : 
                                analysisType === 'script' ? 'Script' : 'Schedule'}
                    </>
                  )}
                </button>

                <button
                  onClick={handleTestAgents}
                  disabled={!apiKey.trim() || isTesting}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Testing Agents...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Test {analysisType === 'budget' ? 'Budget' : 
                            analysisType === 'script' ? 'Script' : 'Schedule'} Agents
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Analysis Results</h3>
                <p className="text-sm text-gray-500">
                  {analysisType === 'budget' ? 'Budget analysis' : 
                   analysisType === 'script' ? 'Script breakdown' :
                   'Schedule optimization'} and agent test results
                </p>
              </div>
              
              <div className="p-6">
                {!budgetResult && !scriptResult && !scheduleResult && !testResults.length && !orchestratorTest ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No results yet. Load a script and run {analysisType} analysis or test agents.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Export All Button - Show only when we have results */}
                    {(budgetResult || scriptResult || scheduleResult) && (
                      <div className="flex justify-center pb-4 border-b border-gray-200">
                        <button
                          onClick={handleExportAllResults}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 text-lg font-semibold shadow-lg"
                        >
                          <Download className="w-5 h-5" />
                          Export All Results (Combined JSON)
                        </button>
                      </div>
                    )}

                    {/* Analysis Results */}
                    {analysisType === 'budget' && budgetResult && (
                      <div>
                        <BudgetResults result={budgetResult} onExport={handleExportBudgetAnalysis} />
                      </div>
                    )}

                    {analysisType === 'script' && scriptResult && (
                      <div>
                        <ScriptResults result={scriptResult} onExport={handleExportScriptAnalysis} />
                      </div>
                    )}

                    {analysisType === 'schedule' && scheduleResult && (
                      <div>
                        <ScheduleResults result={scheduleResult} onExport={handleExportScheduleAnalysis} />
                      </div>
                    )}

                    {/* Agent Test Results */}
                    {(testResults.length > 0 || orchestratorTest) && (
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Agent Test Results</h4>
                        <AgentTestResults 
                          testResults={testResults} 
                          orchestratorTest={orchestratorTest} 
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Budget Results Display Component (existing)
function BudgetResults({ result, onExport }: { result: BudgetAnalysisResult, onExport?: () => void }) {
  const completedStages = Object.values(result.stages).filter(stage => stage.completed).length;
  const totalStages = Object.keys(result.stages).length;
  const successRate = (completedStages / totalStages) * 100;
  const [showUIView, setShowUIView] = useState(false);

  return (
    <div className="space-y-6">
      {/* Export and UI Toggle Buttons */}
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Budget Analysis Results</h4>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUIView(!showUIView)}
            className={`px-5 py-3 ${showUIView ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg' : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg'} text-white rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-bold border-0`}
          >
            <Eye className="w-5 h-5" />
            {showUIView ? 'Show Raw JSON' : 'Show in UI'}
          </button>
          <button
            onClick={onExport}
            className="px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-bold shadow-lg border-0"
          >
            <Download className="w-5 h-5" />
            Export JSON
          </button>
        </div>
      </div>
      {/* Overall Status */}
      <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center">
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          )}
          <div>
            <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              Analysis {result.success ? 'Completed' : 'Failed'}
            </p>
            <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
              Processing time: {(result.processingTime / 1000).toFixed(2)}s | 
              Success rate: {successRate.toFixed(1)}% ({completedStages}/{totalStages} stages)
            </p>
          </div>
        </div>
      </div>

      {/* Budget Summary */}
      {result.finalBudget && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Total Budget</p>
            <p className="text-xl font-bold text-blue-900">{result.finalBudget.totalBudget}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">ATL Budget</p>
            <p className="text-xl font-bold text-green-900">{result.finalBudget.atlBudget}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">BTL Budget</p>
            <p className="text-xl font-bold text-orange-900">{result.finalBudget.btlBudget}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Contingency</p>
            <p className="text-xl font-bold text-purple-900">{result.finalBudget.contingency}</p>
          </div>
        </div>
      )}

      {/* Stage Results */}
      <div>
        <h5 className="font-medium text-gray-900 mb-3">Processing Stages</h5>
        <div className="space-y-2">
          {Object.entries(result.stages).map(([stageName, stage]) => (
            <div key={stageName} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                {stage.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                )}
                <span className="font-medium capitalize">{stageName.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
              <div className="text-sm text-gray-500">
                {stage.duration}ms
                {stage.error && <span className="text-red-500 ml-2">({stage.error})</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Results Display */}
      <div>
        <h5 className="font-medium text-gray-900 mb-3">
          {showUIView ? 'Budget Analysis Details' : 'Raw AI Agent Responses'}
        </h5>
        
        {showUIView ? (
          // UI-Friendly Budget Display
          <BudgetUIDisplay result={result} />
        ) : (
          // Raw JSON Display
          <div className="space-y-4">
            {Object.entries(result.stages).map(([stageName, stage]) => (
              <div key={stageName}>
                {stage.completed && stage.data ? (
                  <details className="border border-gray-200 rounded-lg" open>
                    <summary className="cursor-pointer p-4 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-gray-900 flex items-center justify-between">
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 text-blue-500 mr-2" />
                        {stageName.replace(/([A-Z])/g, ' $1').trim()} Agent Raw JSON Response
                      </span>
                      <span className="text-sm text-gray-500">{stage.duration}ms</span>
                    </summary>
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="mb-2 text-sm font-medium text-gray-700">Raw JSON Output:</div>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-xs font-mono">
                        <code>{JSON.stringify(stage.data, null, 2)}</code>
                      </pre>
                    </div>
                  </details>
                ) : (
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                      <span className="font-medium text-red-800">
                        {stageName.replace(/([A-Z])/g, ' $1').trim()} Agent Failed
                      </span>
                    </div>
                    {stage.error && (
                      <p className="text-sm text-red-700 mt-2">{stage.error}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Details */}
      {result.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h5 className="font-medium text-red-800 mb-2">Error Details</h5>
          <p className="text-sm text-red-700">{result.error}</p>
        </div>
      )}
    </div>
  );
}

// Script Results Display Component (new)
function ScriptResults({ result, onExport }: { result: ScriptAnalysisResult, onExport?: () => void }) {
  const completedStages = Object.values(result.stages).filter(stage => stage.completed).length;
  const totalStages = Object.keys(result.stages).length;
  const successRate = (completedStages / totalStages) * 100;
  const [showUIView, setShowUIView] = useState(false);

  return (
    <div className="space-y-6">
      {/* Export and UI Toggle Buttons */}
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Script Analysis Results</h4>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUIView(!showUIView)}
            className={`px-5 py-3 ${showUIView ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg' : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg'} text-white rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-bold border-0`}
          >
            <Eye className="w-5 h-5" />
            {showUIView ? 'Show Raw JSON' : 'Show in UI'}
          </button>
          <button
            onClick={onExport}
            className="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-bold shadow-lg border-0"
          >
            <Download className="w-5 h-5" />
            Export JSON
          </button>
        </div>
      </div>
      {/* Overall Status */}
      <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center">
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          )}
          <div>
            <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              Analysis {result.success ? 'Completed' : 'Failed'}
            </p>
            <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
              Processing time: {(result.processingTime / 1000).toFixed(2)}s | 
              Success rate: {successRate.toFixed(1)}% ({completedStages}/{totalStages} stages)
            </p>
          </div>
        </div>
      </div>

      {/* Script Analysis Summary */}
      {result.finalAnalysis && (
        <>
          {/* Script Classification */}
          {result.finalAnalysis.scriptClassification && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Genre</p>
                <p className="text-lg font-bold text-purple-900">{result.finalAnalysis.scriptClassification.genre}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-indigo-600 font-medium">Complexity</p>
                <p className="text-lg font-bold text-indigo-900">{result.finalAnalysis.scriptClassification.complexity}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Est. Pages</p>
                <p className="text-lg font-bold text-blue-900">{result.finalAnalysis.scriptClassification.estimatedPages}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Confidence</p>
                <p className="text-lg font-bold text-green-900">{(result.finalAnalysis.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
          )}

          {/* Element Breakdown */}
          {result.finalAnalysis.elementBreakdown && (
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Element Breakdown</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Cast</p>
                  <p className="text-xl font-bold text-red-900">{result.finalAnalysis.elementBreakdown.cast.length}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Props</p>
                  <p className="text-xl font-bold text-green-900">{result.finalAnalysis.elementBreakdown.props.length}</p>
                </div>
                <div className="bg-pink-50 p-3 rounded-lg">
                  <p className="text-sm text-pink-600 font-medium">Locations</p>
                  <p className="text-xl font-bold text-pink-900">{result.finalAnalysis.elementBreakdown.locations.length}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">Vehicles</p>
                  <p className="text-xl font-bold text-orange-900">{result.finalAnalysis.elementBreakdown.vehicles.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Production Requirements */}
          {result.finalAnalysis.productionRequirements && (
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Production Requirements</h5>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estimated Budget:</span>
                  <span className="font-medium">{result.finalAnalysis.productionRequirements.estimatedBudget}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Shooting Days:</span>
                  <span className="font-medium">{result.finalAnalysis.productionRequirements.shootingDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Prep Weeks:</span>
                  <span className="font-medium">{result.finalAnalysis.productionRequirements.prepWeeks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Crew Size:</span>
                  <span className="font-medium">{result.finalAnalysis.productionRequirements.crewSize}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Stage Results */}
      <div>
        <h5 className="font-medium text-gray-900 mb-3">Processing Stages</h5>
        <div className="space-y-2">
          {Object.entries(result.stages).map(([stageName, stage]) => (
            <div key={stageName} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                {stage.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                )}
                <span className="font-medium capitalize">{stageName.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
              <div className="text-sm text-gray-500">
                {stage.duration}ms
                {stage.error && <span className="text-red-500 ml-2">({stage.error})</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Details */}
      {result.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h5 className="font-medium text-red-800 mb-2">Error Details</h5>
          <p className="text-sm text-red-700">{result.error}</p>
        </div>
      )}

      {/* Agent Results Display */}
      <div>
        <h5 className="font-medium text-gray-900 mb-3">
          {showUIView ? 'Script Analysis Details' : 'Raw AI Agent Responses'}
        </h5>
        
        {showUIView ? (
          // UI-Friendly Script Display
          <ScriptUIDisplay result={result} />
        ) : (
          // Raw JSON Display
          <div className="space-y-4">
            {Object.entries(result.stages).map(([stageName, stage]) => (
              <div key={stageName}>
                {stage.completed && stage.data ? (
                  <details className="border border-gray-200 rounded-lg" open>
                    <summary className="cursor-pointer p-4 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-gray-900 flex items-center justify-between">
                      <span className="flex items-center">
                        <Film className="w-4 h-4 text-purple-500 mr-2" />
                        {stageName.replace(/([A-Z])/g, ' $1').trim()} Agent Raw JSON Response
                      </span>
                      <span className="text-sm text-gray-500">{stage.duration}ms</span>
                    </summary>
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="mb-2 text-sm font-medium text-gray-700">Raw JSON Output:</div>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-xs font-mono">
                        <code>{JSON.stringify(stage.data, null, 2)}</code>
                      </pre>
                    </div>
                  </details>
                ) : (
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                      <span className="font-medium text-red-800">
                        {stageName.replace(/([A-Z])/g, ' $1').trim()} Agent Failed
                      </span>
                    </div>
                    {stage.error && (
                      <p className="text-sm text-red-700 mt-2">{stage.error}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Schedule Results Display Component (new)
function ScheduleResults({ result, onExport }: { result: ScheduleAnalysisResult, onExport?: () => void }) {
  const [showUIView, setShowUIView] = useState(false);
  const completedStages = Object.values(result.stages).filter(stage => stage.completed).length;
  const totalStages = Object.keys(result.stages).length;
  const successRate = (completedStages / totalStages) * 100;

  return (
    <div className="space-y-6">
      {/* Export and Toggle Buttons */}
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">
          {showUIView ? 'Schedule Analysis Details' : 'Raw AI Agent Responses'}
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUIView(!showUIView)}
            className={`px-5 py-3 ${showUIView ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg' : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg'} text-white rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-bold border-0`}
          >
            <Eye className="w-5 h-5" />
            {showUIView ? 'Show Raw JSON' : 'Show in UI'}
          </button>
          <button
            onClick={onExport}
            className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-bold shadow-lg border-0"
          >
            <Download className="w-5 h-5" />
            Export JSON
          </button>
        </div>
      </div>
      {/* Overall Status */}
      <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center">
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          )}
          <div>
            <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              Schedule Analysis {result.success ? 'Completed' : 'Failed'}
            </p>
            <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
              Processing time: {(result.processingTime / 1000).toFixed(2)}s | 
              Success rate: {successRate.toFixed(1)}% ({completedStages}/{totalStages} stages)
            </p>
          </div>
        </div>
      </div>

      {showUIView ? (
        // UI-Friendly Schedule Display
        <ScheduleUIDisplay result={result} />
      ) : (
        <>
        {/* Schedule Summary */}
        {result.finalSchedule && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Total Days</p>
              <p className="text-xl font-bold text-green-900">{result.finalSchedule.totalDays}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Shooting Blocks</p>
              <p className="text-xl font-bold text-blue-900">{result.finalSchedule.shootingBlocks.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Efficiency</p>
              <p className="text-xl font-bold text-yellow-900">{(result.finalSchedule.efficiency * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Risk Level</p>
              <p className="text-xl font-bold text-purple-900">{result.finalSchedule.riskLevel}</p>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Location Groups</p>
              <p className="text-xl font-bold text-orange-900">{result.finalSchedule.locationGroups}</p>
            </div>
            <div className="bg-pink-50 p-3 rounded-lg">
              <p className="text-sm text-pink-600 font-medium">Company Moves</p>
              <p className="text-xl font-bold text-pink-900">{result.finalSchedule.companyMoves}</p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg">
              <p className="text-sm text-indigo-600 font-medium">Compliance Score</p>
              <p className="text-xl font-bold text-indigo-900">{result.finalSchedule.complianceScore}</p>
            </div>
            <div className="bg-teal-50 p-3 rounded-lg">
              <p className="text-sm text-teal-600 font-medium">Confidence</p>
              <p className="text-xl font-bold text-teal-900">{(result.finalSchedule.confidence * 100).toFixed(0)}%</p>
            </div>
          </div>

          {/* Budget Information */}
          {result.finalSchedule.estimatedBudget && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-3">Budget Estimate</h5>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Estimated Schedule Budget:</span>
                <span className="font-bold text-lg">{result.finalSchedule.estimatedBudget}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Stage Results */}
      <div>
        <h5 className="font-medium text-gray-900 mb-3">Processing Stages</h5>
        <div className="space-y-2">
          {Object.entries(result.stages).map(([stageName, stage]) => (
            <div key={stageName} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                {stage.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                )}
                <span className="font-medium capitalize">{stageName.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
              <div className="text-sm text-gray-500">
                {stage.duration}ms
                {stage.error && <span className="text-red-500 ml-2">({stage.error})</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw AI Agent Responses */}
      <div>
        <h5 className="font-medium text-gray-900 mb-3">Raw AI Agent Responses</h5>
        <div className="space-y-4">
          {Object.entries(result.stages).map(([stageName, stage]) => (
            <div key={stageName}>
              {stage.completed && stage.data ? (
                <details className="border border-gray-200 rounded-lg" open>
                  <summary className="cursor-pointer p-4 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-gray-900 flex items-center justify-between">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 text-blue-500 mr-2" />
                      {stageName.replace(/([A-Z])/g, ' $1').trim()} Agent Raw JSON Response
                    </span>
                    <span className="text-sm text-gray-500">{stage.duration}ms</span>
                  </summary>
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="mb-2 text-sm font-medium text-gray-700">Raw JSON Output:</div>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-xs font-mono">
                      <code>{JSON.stringify(stage.data, null, 2)}</code>
                    </pre>
                  </div>
                </details>
              ) : (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                    <span className="font-medium text-red-800">
                      {stageName.replace(/([A-Z])/g, ' $1').trim()} Agent Failed
                    </span>
                  </div>
                  {stage.error && (
                    <p className="text-sm text-red-700 mt-2">{stage.error}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Details */}
      {result.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h5 className="font-medium text-red-800 mb-2">Error Details</h5>
          <p className="text-sm text-red-700">{result.error}</p>
        </div>
      )}
        </>
      )}
    </div>
  );
}

// Agent Test Results Display Component (existing)
function AgentTestResults({ 
  testResults, 
  orchestratorTest 
}: { 
  testResults: AgentTestResult[]
  orchestratorTest: AgentTestResult | null 
}) {
  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;

  return (
    <div className="space-y-4">
      {/* Orchestrator Test */}
      {orchestratorTest && (
        <div className={`p-4 rounded-lg ${orchestratorTest.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {orchestratorTest.passed ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              )}
              <div>
                <p className={`font-medium ${orchestratorTest.passed ? 'text-green-800' : 'text-red-800'}`}>
                  {orchestratorTest.name}
                </p>
                {orchestratorTest.details && (
                  <p className={`text-sm ${orchestratorTest.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {orchestratorTest.details}
                  </p>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {orchestratorTest.duration}ms
              {orchestratorTest.stagesCompleted && (
                <span className="ml-2">({orchestratorTest.stagesCompleted} stages)</span>
              )}
            </div>
          </div>
          {orchestratorTest.error && (
            <p className="mt-2 text-sm text-red-700">{orchestratorTest.error}</p>
          )}
        </div>
      )}

      {/* Individual Agent Tests */}
      {testResults.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-medium text-gray-900">Individual Agent Tests</h5>
            <span className={`text-sm px-2 py-1 rounded ${passedTests === totalTests ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {passedTests}/{totalTests} Passed
            </span>
          </div>
          
          <div className="space-y-2">
            {testResults.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  {test.passed ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  )}
                  <span className="font-medium">{test.name}</span>
                  {test.details && (
                    <span className="ml-2 text-sm text-gray-600">- {test.details}</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {test.duration}ms
                  {test.error && <span className="text-red-500 ml-2">({test.error})</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// UI-Friendly Budget Display Component
function BudgetUIDisplay({ result }: { result: BudgetAnalysisResult }) {
  const stages = result.stages || {};
  
  // Get individual agent data
  const ratingsData = (stages as any).ratingsAgent?.data;
  const preliminaryBudgetData = (stages as any).preliminaryBudget?.data;
  const productionBudgetData = (stages as any).productionBudget?.data;
  const realTimeMonitorData = (stages as any).realTimeMonitor?.data;

  return (
    <div className="space-y-6">
      
      {/* Union Rates & Equipment Costs Agent */}
      {ratingsData && (
        <div className="bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 p-6 rounded-2xl shadow-xl border-0">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-xl font-bold text-white flex items-center">
              <Users className="w-6 h-6 text-white mr-3" />
              Union Rates & Equipment Costs Agent
            </h6>
            <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full font-bold border border-white/30">
              Confidence: {Math.round((ratingsData.confidence || 0) * 100)}%
            </span>
          </div>
          
          {/* Union Rates */}
          {ratingsData.unionRates && (
            <div className="mb-6">
              <h4 className="font-bold text-white mb-4 text-xl">Union Rates</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ratingsData.unionRates.sagAftra && (
                  <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/50">
                    <h5 className="font-bold text-gray-900 mb-3 text-lg">SAG-AFTRA</h5>
                    <p className="text-sm text-gray-700 font-medium">Daily Rate: <span className="text-emerald-600 font-bold">{ratingsData.unionRates.sagAftra.dailyRate}</span></p>
                    <p className="text-sm text-gray-700 font-medium">Weekly Rate: <span className="text-emerald-600 font-bold">{ratingsData.unionRates.sagAftra.weeklyRate}</span></p>
                    <p className="text-sm text-gray-700 font-medium">Pension & Health: <span className="text-emerald-600 font-bold">{ratingsData.unionRates.sagAftra.pensionHealth}</span></p>
                  </div>
                )}
                {ratingsData.unionRates.iatse && (
                  <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/50">
                    <h5 className="font-bold text-gray-900 mb-3 text-lg">IATSE</h5>
                    <p className="text-sm text-gray-700 font-medium">Base Rate: <span className="text-blue-600 font-bold">{ratingsData.unionRates.iatse.baseRate}</span></p>
                    <p className="text-sm text-gray-700 font-medium">Overtime: <span className="text-blue-600 font-bold">{ratingsData.unionRates.iatse.overtimeMultiplier}x</span></p>
                    <p className="text-sm text-gray-700 font-medium">Fringe: <span className="text-blue-600 font-bold">{Math.round((ratingsData.unionRates.iatse.fringePercentage || 0) * 100)}%</span></p>
                  </div>
                )}
                {ratingsData.unionRates.dga && (
                  <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/50">
                    <h5 className="font-bold text-gray-900 mb-3 text-lg">DGA</h5>
                    <p className="text-sm text-gray-700 font-medium">Director Weekly: <span className="text-purple-600 font-bold">{ratingsData.unionRates.dga.directorWeekly}</span></p>
                    <p className="text-sm text-gray-700 font-medium">Assistant Daily: <span className="text-purple-600 font-bold">{ratingsData.unionRates.dga.assistantDaily}</span></p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Equipment Costs */}
          {ratingsData.equipmentCosts && (
            <div className="mb-4">
              <h4 className="font-bold text-white mb-4 text-xl">Equipment Costs</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ratingsData.equipmentCosts.camera && (
                  <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/50">
                    <h5 className="font-bold text-gray-900 mb-3 text-lg">Camera Equipment</h5>
                    {ratingsData.equipmentCosts.camera.map((item: any, index: number) => (
                      <div key={index} className="mb-2 text-sm">
                        <p className="font-medium text-gray-700">{item.item}</p>
                        <p className="text-gray-600">Daily: {item.dailyRate} | Weekly: {item.weeklyRate}</p>
                      </div>
                    ))}
                  </div>
                )}
                {ratingsData.equipmentCosts.lighting && (
                  <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/50">
                    <h5 className="font-bold text-gray-900 mb-3 text-lg">Lighting Equipment</h5>
                    {ratingsData.equipmentCosts.lighting.map((item: any, index: number) => (
                      <div key={index} className="mb-2 text-sm">
                        <p className="font-medium text-gray-700">{item.item}</p>
                        <p className="text-gray-600">Daily: {item.dailyRate} | Weekly: {item.weeklyRate}</p>
                      </div>
                    ))}
                  </div>
                )}
                {ratingsData.equipmentCosts.grip && (
                  <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/50">
                    <h5 className="font-bold text-gray-900 mb-3 text-lg">Grip Equipment</h5>
                    {ratingsData.equipmentCosts.grip.map((item: any, index: number) => (
                      <div key={index} className="mb-2 text-sm">
                        <p className="font-medium text-gray-700">{item.item}</p>
                        <p className="text-gray-600">Daily: {item.dailyRate} | Weekly: {item.weeklyRate}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Location Costs */}
          {ratingsData.locationCosts && (
            <div>
              <h4 className="font-bold text-white mb-4 text-xl">Location Costs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ratingsData.locationCosts.map((location: any, index: number) => (
                  <div key={index} className="bg-white p-3 rounded-lg border">
                    <h5 className="font-medium text-gray-800 mb-1">{location.location}</h5>
                    <p className="text-xs text-gray-600">Permit: {location.permitFee}</p>
                    <p className="text-xs text-gray-600">Insurance: {location.insuranceRate}</p>
                    <p className="text-xs text-gray-600">Security: {location.securityCost}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preliminary Budget Agent */}
      {preliminaryBudgetData && (
        <div className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 p-6 rounded-2xl shadow-xl border-0">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-xl font-bold text-white flex items-center">
              <DollarSign className="w-6 h-6 text-white mr-3" />
              Preliminary Budget Agent
            </h6>
            <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full font-bold border border-white/30">
              Confidence: {Math.round((preliminaryBudgetData.confidence || 0) * 100)}%
            </span>
          </div>
          
          {/* Top Sheet */}
          {preliminaryBudgetData.topSheet && (
            <div className="mb-6">
              <h4 className="font-bold text-white mb-4 text-xl">Budget Top Sheet</h4>
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-black text-emerald-600">{preliminaryBudgetData.topSheet.totalBudget}</p>
                    <p className="text-sm text-gray-700 font-bold">Total Budget</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-blue-600">{preliminaryBudgetData.topSheet.atlBudget}</p>
                    <p className="text-sm text-gray-700 font-bold">ATL ({preliminaryBudgetData.topSheet.atlPercentage}%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-purple-600">{preliminaryBudgetData.topSheet.btlBudget}</p>
                    <p className="text-sm text-gray-700 font-bold">BTL ({preliminaryBudgetData.topSheet.btlPercentage}%)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-orange-600">{preliminaryBudgetData.topSheet.contingency}</p>
                    <p className="text-sm text-gray-700 font-bold">Contingency</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* ATL Breakdown */}
          {preliminaryBudgetData.atlBreakdown && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Above-The-Line Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(preliminaryBudgetData.atlBreakdown).map(([key, value], index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border">
                    <h5 className="font-medium text-gray-800 capitalize mb-1">{key}</h5>
                    <p className="text-sm text-gray-600">{value as string}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* BTL Breakdown */}
          {preliminaryBudgetData.btlBreakdown && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Below-The-Line Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(preliminaryBudgetData.btlBreakdown).map(([key, value], index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border">
                    <h5 className="font-medium text-gray-800 capitalize mb-1">{key}</h5>
                    <p className="text-sm text-gray-600">{value as string}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Budget Tier and Investor Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {preliminaryBudgetData.budgetTier && (
              <div className="bg-white p-4 rounded-lg border">
                <h5 className="font-medium text-gray-800 mb-2">Budget Tier</h5>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  preliminaryBudgetData.budgetTier === 'BASIC' ? 'bg-blue-100 text-blue-800' :
                  preliminaryBudgetData.budgetTier === 'PREMIUM' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {preliminaryBudgetData.budgetTier}
                </span>
              </div>
            )}
            {preliminaryBudgetData.investorSummary && (
              <div className="bg-white p-4 rounded-lg border">
                <h5 className="font-medium text-gray-800 mb-2">Investor Summary</h5>
                <p className="text-sm text-gray-600">{preliminaryBudgetData.investorSummary}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Production Budget Agent */}
      {productionBudgetData && (
        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-6 rounded-2xl shadow-xl border-0">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-xl font-bold text-white flex items-center">
              <Package className="w-6 h-6 text-white mr-3" />
              Production Budget Agent
            </h6>
            <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full font-bold border border-white/30">
              Confidence: {Math.round((productionBudgetData.confidence || 0) * 100)}%
            </span>
          </div>
          
          {/* Department Budgets */}
          {productionBudgetData.departmentBudgets && (
            <div className="mb-6">
              <h4 className="font-bold text-white mb-4 text-xl">Department Budgets</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {productionBudgetData.departmentBudgets.map((dept: any, index: number) => (
                  <div key={index} className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/50">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-gray-900 text-lg">{dept.department}</h5>
                      <span className="text-xl font-black text-purple-600">{dept.budget}</span>
                    </div>
                    
                    {dept.keyPersonnel && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">Key Personnel:</p>
                        <div className="flex flex-wrap gap-1">
                          {dept.keyPersonnel.slice(0, 3).map((person: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded">{person}</span>
                          ))}
                          {dept.keyPersonnel.length > 3 && (
                            <span className="px-2 py-1 bg-gray-200 text-xs rounded">+{dept.keyPersonnel.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {dept.equipmentNeeds && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">Equipment:</p>
                        <ul className="text-xs text-gray-600">
                          {dept.equipmentNeeds.slice(0, 2).map((item: string, i: number) => (
                            <li key={i}>• {item}</li>
                          ))}
                          {dept.equipmentNeeds.length > 2 && (
                            <li className="text-gray-500">...+{dept.equipmentNeeds.length - 2} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {dept.specialRequirements && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Special Requirements:</p>
                        <ul className="text-xs text-gray-600">
                          {dept.specialRequirements.slice(0, 2).map((req: string, i: number) => (
                            <li key={i}>• {req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Cast and Crew Costs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {productionBudgetData.castCosts && (
              <div className="bg-white p-4 rounded-lg border">
                <h5 className="font-medium text-gray-800 mb-3">Cast Costs</h5>
                <div className="space-y-2">
                  {Object.entries(productionBudgetData.castCosts).map(([key, value], index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="capitalize text-gray-600">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="font-medium">{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {productionBudgetData.crewCosts && (
              <div className="bg-white p-4 rounded-lg border">
                <h5 className="font-medium text-gray-800 mb-3">Crew Costs</h5>
                <div className="space-y-2">
                  {Object.entries(productionBudgetData.crewCosts).map(([key, value], index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="capitalize text-gray-600">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="font-medium">{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Shooting Schedule */}
          {productionBudgetData.shootingSchedule && (
            <div className="bg-white p-4 rounded-lg border">
              <h5 className="font-medium text-gray-800 mb-3">Shooting Schedule</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-purple-600">{productionBudgetData.shootingSchedule.estimatedDays}</p>
                  <p className="text-sm text-gray-600">Estimated Days</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600">{productionBudgetData.shootingSchedule.averageDailyBudget}</p>
                  <p className="text-sm text-gray-600">Daily Budget</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-orange-600">{productionBudgetData.shootingSchedule.overtimeRisk}</p>
                  <p className="text-sm text-gray-600">Overtime Risk</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-blue-600">{productionBudgetData.shootingSchedule.weatherDays}</p>
                  <p className="text-sm text-gray-600">Weather Days</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real Time Monitor Agent */}
      {realTimeMonitorData && (
        <div className="bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 p-6 rounded-2xl shadow-xl border-0">
          <div className="flex items-center justify-between mb-4">
            <h6 className="text-xl font-bold text-white flex items-center">
              <AlertCircle className="w-6 h-6 text-white mr-3" />
              Real Time Monitor Agent
            </h6>
            <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full font-bold border border-white/30">
              Confidence: {Math.round((realTimeMonitorData.confidence || 0) * 100)}%
            </span>
          </div>
          
          {/* Expense Categories */}
          {realTimeMonitorData.expenseCategories && (
            <div className="mb-6">
              <h4 className="font-bold text-white mb-4 text-xl">Expense Categories Monitoring</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {realTimeMonitorData.expenseCategories.map((category: any, index: number) => (
                  <div key={index} className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-800">{category.category}</h5>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        category.budgetAllocation === 'High' ? 'bg-red-100 text-red-800' :
                        category.budgetAllocation === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {category.budgetAllocation}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Tracking: {category.trackingFrequency}</p>
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Alert Thresholds:</p>
                      <div className="flex flex-wrap gap-1">
                        {category.alertThresholds.map((threshold: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded">{threshold}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Recommendations */}
          {realTimeMonitorData.recommendations && (
            <div>
              <h4 className="font-bold text-white mb-4 text-xl">Monitoring Recommendations</h4>
              <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/50">
                <ul className="space-y-2">
                  {realTimeMonitorData.recommendations.map((recommendation: string, index: number) => (
                    <li key={index} className="flex items-start text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// UI-Friendly Script Display Component - Showing ALL Agents Data Separately
function ScriptUIDisplay({ result }: { result: ScriptAnalysisResult }) {
  const stages = result.stages || {};
  
  // Get individual agent data
  const scriptParserData = (stages as any).scriptParser?.data;
  const elementDetectionData = (stages as any).elementDetection?.data;
  const categorizationData = (stages as any).categorization?.data;
  const reportGeneratorData = (stages as any).reportGenerator?.data;

  return (
    <div className="space-y-8">
      
      {/* Script Parser Agent Results */}
      {scriptParserData && (
        <div className="bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 p-6 rounded-2xl shadow-xl border-0">
          <h6 className="text-xl font-bold text-white mb-4 flex items-center">
            <Film className="w-6 h-6 text-white mr-3" />
            Script Parser Agent Results
          </h6>
          
          {/* Script Details */}
          {scriptParserData.script && (
            <div className="mb-6">
              <div className="text-xl font-bold text-white mb-4">Script Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/50">
                  <p className="text-sm font-bold text-gray-700">Title</p>
                  <p className="text-xl font-black text-gray-900">{scriptParserData.script.title}</p>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/50">
                  <p className="text-sm font-bold text-gray-700">Genre</p>
                  <p className="text-xl font-black text-blue-600">{scriptParserData.script.genre}</p>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/50">
                  <p className="text-sm font-bold text-gray-700">Type</p>
                  <p className="text-xl font-black text-green-600">{scriptParserData.script.type}</p>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/50">
                  <p className="text-sm font-bold text-gray-700">Complexity</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    scriptParserData.script.complexity === 'HIGH' ? 'bg-red-100 text-red-800' :
                    scriptParserData.script.complexity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {scriptParserData.script.complexity}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Total Scenes</p>
                  <p className="text-2xl font-bold text-purple-600">{scriptParserData.script.totalScenes}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Estimated Pages</p>
                  <p className="text-2xl font-bold text-orange-600">{scriptParserData.script.estimatedPages}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Confidence</p>
                  <p className="text-2xl font-bold text-blue-600">{(scriptParserData.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
              {scriptParserData.script.logline && (
                <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600 mb-2">Logline:</p>
                  <p className="text-gray-800 italic">{scriptParserData.script.logline}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Script Parser - Cast, Props, Locations, Vehicles */}
          {scriptParserData.elements && (
            <div className="space-y-6">
              {/* Cast */}
              {scriptParserData.elements.cast && scriptParserData.elements.cast.length > 0 && (
                <div>
                  <div className="text-md font-medium text-gray-800 mb-3">Cast Members ({scriptParserData.elements.cast.length})</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                    {scriptParserData.elements.cast.map((castMember: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-blue-500">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-900 text-sm">{castMember.name}</div>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            castMember.importance === 'LEAD' ? 'bg-red-100 text-red-800' :
                            castMember.importance === 'SUPPORTING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {castMember.importance}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{castMember.role}</p>
                        <p className="text-xs text-gray-500">Scenes: {castMember.scenes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Props */}
              {scriptParserData.elements.props && scriptParserData.elements.props.length > 0 && (
                <div>
                  <div className="text-md font-medium text-gray-800 mb-3">Props ({scriptParserData.elements.props.length})</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scriptParserData.elements.props.map((prop: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-orange-500">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-900 text-sm">{prop.name}</div>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            prop.complexity === 'COMPLEX' ? 'bg-red-100 text-red-800' :
                            prop.complexity === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {prop.complexity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">Category: {prop.category}</p>
                        <p className="text-xs text-gray-500">Department: {prop.department}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Locations */}
              {scriptParserData.elements.locations && scriptParserData.elements.locations.length > 0 && (
                <div>
                  <div className="text-md font-medium text-gray-800 mb-3">Locations ({scriptParserData.elements.locations.length})</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scriptParserData.elements.locations.map((location: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-purple-500">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-900 text-sm">{location.name}</div>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            location.cost === 'HIGH' ? 'bg-red-100 text-red-800' :
                            location.cost === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {location.cost}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">Type: {location.type}</p>
                        <p className="text-xs text-gray-500">Complexity: {location.complexity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicles */}
              {scriptParserData.elements.vehicles && scriptParserData.elements.vehicles.length > 0 && (
                <div>
                  <div className="text-md font-medium text-gray-800 mb-3">Vehicles ({scriptParserData.elements.vehicles.length})</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scriptParserData.elements.vehicles.map((vehicle: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-cyan-500">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-900 text-sm">{vehicle.name}</div>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            vehicle.complexity === 'COMPLEX' ? 'bg-red-100 text-red-800' :
                            vehicle.complexity === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {vehicle.complexity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">Type: {vehicle.type}</p>
                        <p className="text-xs text-gray-500">Purpose: {vehicle.purpose}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Production Requirements */}
          {scriptParserData.production && (
            <div className="mt-6">
              <div className="text-md font-medium text-gray-800 mb-3">Production Requirements</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Estimated Budget</p>
                  <p className="text-lg font-bold text-green-600">{scriptParserData.production.estimatedBudget}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Shooting Days</p>
                  <p className="text-lg font-bold text-blue-600">{scriptParserData.production.shootingDays}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Prep Weeks</p>
                  <p className="text-lg font-bold text-orange-600">{scriptParserData.production.prepWeeks}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Crew Size</p>
                  <p className="text-lg font-bold text-purple-600">{scriptParserData.production.crewSize}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Element Detection Agent Results */}
      {elementDetectionData && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border">
          <h6 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 text-green-600 mr-2" />
            Element Detection Agent Results
          </h6>
          
          {elementDetectionData.elementBreakdown && (
            <div>
              <div className="text-md font-medium text-gray-800 mb-3">Element Summary</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Total Elements</p>
                  <p className="text-2xl font-bold text-green-600">{elementDetectionData.elementBreakdown.totalElements}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Cast</p>
                  <p className="text-2xl font-bold text-blue-600">{elementDetectionData.elementBreakdown.cast?.length || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Wardrobe Items</p>
                  <p className="text-2xl font-bold text-orange-600">{elementDetectionData.elementBreakdown.categoryCounts?.wardrobe || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Makeup Items</p>
                  <p className="text-2xl font-bold text-purple-600">{elementDetectionData.elementBreakdown.categoryCounts?.makeup || 0}</p>
                </div>
              </div>

              {/* Detailed Cast from Element Detection */}
              {elementDetectionData.elementBreakdown.cast && elementDetectionData.elementBreakdown.cast.length > 0 && (
                <div>
                  <div className="text-md font-medium text-gray-800 mb-3">Detailed Cast Analysis ({elementDetectionData.elementBreakdown.cast.length})</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                    {elementDetectionData.elementBreakdown.cast.map((castMember: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-green-500">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-900 text-sm">{castMember.name}</div>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            castMember.importance === 'Principal' || castMember.category === 'Principal' ? 'bg-red-100 text-red-800' :
                            castMember.importance === 'Supporting' || castMember.category === 'Supporting' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {castMember.category || castMember.importance}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">Scenes: {castMember.sceneCount || 1}</p>
                        {castMember.colorCode && (
                          <p className="text-xs text-gray-500">Color: {castMember.colorCode}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Department Breakdown */}
          {elementDetectionData.departmentBreakdown && (
            <div className="mt-6">
              <div className="text-md font-medium text-gray-800 mb-3">Department Breakdown</div>
              <div className="space-y-4">
                {elementDetectionData.departmentBreakdown.map((dept: any, index: number) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-bold text-gray-900">{dept.department}</div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          dept.complexity === 'HIGH' ? 'bg-red-100 text-red-800' :
                          dept.complexity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {dept.complexity}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                          {dept.budget} Budget
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Elements: {dept.elements?.length || 0}</p>
                    {dept.specialRequirements && dept.specialRequirements.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Special Requirements:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {dept.specialRequirements.slice(0, 3).map((req: string, i: number) => (
                            <li key={i}>• {req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Categorization Agent Results */}
      {categorizationData && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-lg border">
          <h6 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building className="w-5 h-5 text-orange-600 mr-2" />
            Categorization Agent Results
          </h6>
          
          {/* Department Analysis */}
          {categorizationData.departmentAnalysis && (
            <div className="mb-6">
              <div className="text-md font-medium text-gray-800 mb-3">Department Analysis</div>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {categorizationData.departmentAnalysis.map((dept: any, index: number) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-bold text-gray-900">{dept.name}</div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          dept.complexity === 'HIGH' ? 'bg-red-100 text-red-800' :
                          dept.complexity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {dept.complexity}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                          {dept.budget}
                        </span>
                      </div>
                    </div>
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-1">Budget: <span className="font-medium">{dept.budget}</span></p>
                      <p className="text-sm text-gray-600">Prep Time: <span className="font-medium">{dept.prepTime}</span></p>
                    </div>
                    {dept.keyRequirements && dept.keyRequirements.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">Key Requirements:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {dept.keyRequirements.slice(0, 3).map((req: string, i: number) => (
                            <li key={i}>• {req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {dept.riskFactors && dept.riskFactors.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-red-700 mb-1">Risk Factors:</p>
                        <ul className="text-xs text-red-600 space-y-1">
                          {dept.riskFactors.slice(0, 2).map((risk: string, i: number) => (
                            <li key={i}>• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {categorizationData.timeline && (
            <div className="mb-6">
              <div className="text-md font-medium text-gray-800 mb-3">Production Timeline</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Pre-Production</p>
                  <p className="text-xl font-bold text-orange-600">{categorizationData.timeline.preProduction}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Production</p>
                  <p className="text-xl font-bold text-blue-600">{categorizationData.timeline.production}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Post-Production</p>
                  <p className="text-xl font-bold text-green-600">{categorizationData.timeline.postProduction}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Total Duration</p>
                  <p className="text-xl font-bold text-purple-600">{categorizationData.timeline.totalDuration}</p>
                </div>
              </div>
            </div>
          )}

          {/* Budget Analysis */}
          {categorizationData.budget && (
            <div>
              <div className="text-md font-medium text-gray-800 mb-3">Budget Analysis</div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                  <span className="text-lg font-bold text-gray-900">Total Budget</span>
                  <span className="text-2xl font-bold text-orange-600">{categorizationData.budget.total}</span>
                </div>
                {categorizationData.budget.breakdown && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(categorizationData.budget.breakdown).map(([category, amount]) => (
                      <div key={category} className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                        <span className="capitalize text-sm font-medium">{category}:</span>
                        <span className="text-sm font-bold">{String(amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {categorizationData.budget.contingency && (
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="font-medium text-gray-700">Contingency:</span>
                    <span className="font-bold text-green-600">{categorizationData.budget.contingency}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report Generator Agent Results */}
      {reportGeneratorData && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border">
          <h6 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 text-purple-600 mr-2" />
            Report Generator Agent Results
          </h6>
          
          {/* Executive Summary */}
          {reportGeneratorData.executiveSummary && (
            <div className="mb-6">
              <div className="text-md font-medium text-gray-800 mb-3">Executive Summary</div>
              <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Project Overview:</p>
                  <p className="text-sm text-gray-600">{reportGeneratorData.executiveSummary.projectOverview}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Key Findings:</p>
                  <p className="text-sm text-gray-600">{reportGeneratorData.executiveSummary.keyFindings}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Budget Highlights:</p>
                  <p className="text-sm text-gray-600">{reportGeneratorData.executiveSummary.budgetHighlights}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {reportGeneratorData.recommendations && (
            <div className="mb-6">
              <div className="text-md font-medium text-gray-800 mb-3">Recommendations</div>
              <div className="space-y-2">
                {reportGeneratorData.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-purple-500">
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Factors */}
          {reportGeneratorData.successFactors && (
            <div>
              <div className="text-md font-medium text-gray-800 mb-3">Success Factors</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reportGeneratorData.successFactors.map((factor: string, index: number) => (
                  <div key={index} className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-700 flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      {factor}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// UI-Friendly Schedule Display Component - Showing All Schedule Agents Data Separately
function ScheduleUIDisplay({ result }: { result: ScheduleAnalysisResult }) {
  const stages = result.stages || {};
  
  // Get individual agent data from all schedule agents
  const blockOptimizerData = (stages as any).blockOptimizer?.data;
  const locationManagerData = (stages as any).locationManager?.data;
  const moveCalculatorData = (stages as any).moveCalculator?.data;
  const complianceValidatorData = (stages as any).complianceValidator?.data;
  const stripboardGeniusData = (stages as any).stripboardGenius?.data || (stages as any).stripboardGeniusAgent?.data;
  
  return (
    <div className="space-y-8">
      
      {/* Block Optimizer Agent Results */}
      {blockOptimizerData && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
          <h6 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="w-5 h-5 text-blue-600 mr-2" />
            Block Optimizer Agent Results
          </h6>
          
          {/* Day Blocks */}
          {blockOptimizerData.dayBlocks && Array.isArray(blockOptimizerData.dayBlocks) && (
            <div className="mb-6">
              <div className="text-md font-medium text-gray-800 mb-3">Day Blocks ({blockOptimizerData.dayBlocks.length})</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blockOptimizerData.dayBlocks.map((block: any, index: number) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-gray-900">{block.blockId}</div>
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        {block.estimatedDuration} min
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">📍 {block.location}</p>
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">Scenes:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {block.scenes.map((scene: string, i: number) => (
                          <li key={i}>{scene}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Night Blocks */}
          {blockOptimizerData.nightBlocks && Array.isArray(blockOptimizerData.nightBlocks) && (
            <div className="mb-6">
              <div className="text-md font-medium text-gray-800 mb-3">Night Blocks ({blockOptimizerData.nightBlocks.length})</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blockOptimizerData.nightBlocks.map((block: any, index: number) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-indigo-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-gray-900">{block.blockId}</div>
                      <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                        {block.estimatedDuration} min
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">🌙 {block.location}</p>
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">Scenes:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {block.scenes.map((scene: string, i: number) => (
                          <li key={i}>{scene}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimization Summary */}
          {blockOptimizerData.optimization && (
            <div>
              <div className="text-md font-medium text-gray-800 mb-3">Optimization Results</div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Total Days</p>
                    <p className="text-2xl font-bold text-blue-600">{blockOptimizerData.optimization.totalDays}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Efficiency</p>
                    <p className="text-2xl font-bold text-green-600">{(blockOptimizerData.optimization.efficiency * 100).toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Cost Savings</p>
                    <p className="text-lg font-bold text-orange-600">{blockOptimizerData.optimization.costSavings}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(blockOptimizerData.confidence * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-blue-600">
                      Confidence: {(blockOptimizerData.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Location Manager Agent Results */}
      {locationManagerData && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border">
          <h6 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 text-green-600 mr-2" />
            Location Manager Agent Results
          </h6>
          
          {/* Location Groups */}
          {locationManagerData.locationGroups && Array.isArray(locationManagerData.locationGroups) && (
            <div className="mb-6">
              <div className="text-md font-medium text-gray-800 mb-3">Location Groups ({locationManagerData.locationGroups.length})</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {locationManagerData.locationGroups.map((group: any, index: number) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-gray-900">{group.groupId}</div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        group.complexity === 'HIGH' ? 'bg-red-100 text-red-800' :
                        group.complexity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {group.complexity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">📍 {group.location}</p>
                    <p className="text-sm text-gray-600 mb-2">🚗 Travel: {group.travelTime} mins</p>
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">Scenes:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {group.scenes.map((scene: string, i: number) => (
                          <li key={i}>{scene}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Travel Plan */}
          {locationManagerData.travelPlan && (
            <div>
              <div className="text-md font-medium text-gray-800 mb-3">Travel Plan</div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Total Locations</p>
                    <p className="text-2xl font-bold text-green-600">{locationManagerData.travelPlan.totalLocations}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Total Travel Time</p>
                    <p className="text-2xl font-bold text-blue-600">{locationManagerData.travelPlan.totalTravelTime} mins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Confidence</p>
                    <p className="text-2xl font-bold text-orange-600">{(locationManagerData.confidence * 100).toFixed(0)}%</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Recommended Sequence:</p>
                  <div className="flex flex-wrap gap-2">
                    {locationManagerData.travelPlan.recommendedSequence.map((location: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {index + 1}. {location}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Move Calculator Agent Results */}
      {moveCalculatorData && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-lg border">
          <h6 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Car className="w-5 h-5 text-orange-600 mr-2" />
            Move Calculator Agent Results
          </h6>
          
          {/* Individual Moves */}
          {moveCalculatorData.moves && Array.isArray(moveCalculatorData.moves) && (
            <div className="mb-6">
              <div className="text-md font-medium text-gray-800 mb-3">Equipment Moves ({moveCalculatorData.moves.length})</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                {moveCalculatorData.moves.map((move: any, index: number) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-gray-900">{move.moveId}</div>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                          {move.duration}h
                        </span>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          {move.cost}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">📍 From: {move.fromLocation}</p>
                    <p className="text-sm text-gray-600 mb-2">📍 To: {move.toLocation}</p>
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">Equipment:</p>
                      <div className="flex flex-wrap gap-1">
                        {move.equipment.map((item: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Move Summary */}
          {moveCalculatorData.summary && (
            <div>
              <div className="text-md font-medium text-gray-800 mb-3">Move Summary</div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Total Moves</p>
                    <p className="text-2xl font-bold text-orange-600">{moveCalculatorData.summary.totalMoves}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Total Time</p>
                    <p className="text-2xl font-bold text-blue-600">{moveCalculatorData.summary.totalMoveTime}h</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Total Cost</p>
                    <p className="text-2xl font-bold text-green-600">{moveCalculatorData.summary.totalCost}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Efficiency</p>
                    <p className="text-2xl font-bold text-purple-600">{(moveCalculatorData.summary.efficiency * 100).toFixed(0)}%</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ width: `${(moveCalculatorData.confidence * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-orange-600">
                      Confidence: {(moveCalculatorData.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compliance Validator Agent Results */}
      {complianceValidatorData && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border">
          <h6 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-purple-600 mr-2" />
            Compliance Validator Agent Results
          </h6>
          
          {/* Compliance Report */}
          {complianceValidatorData.complianceReport && (
            <div className="mb-6">
              <div className="text-md font-medium text-gray-800 mb-3">Compliance Status</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <div className={`text-2xl mb-2 ${complianceValidatorData.complianceReport.sagCompliance ? 'text-green-600' : 'text-red-600'}`}>
                    {complianceValidatorData.complianceReport.sagCompliance ? '✅' : '❌'}
                  </div>
                  <p className="text-sm font-medium text-gray-600">SAG Compliance</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <div className={`text-2xl mb-2 ${complianceValidatorData.complianceReport.crewCompliance ? 'text-green-600' : 'text-red-600'}`}>
                    {complianceValidatorData.complianceReport.crewCompliance ? '✅' : '❌'}
                  </div>
                  <p className="text-sm font-medium text-gray-600">Crew Compliance</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <div className={`text-2xl mb-2 ${complianceValidatorData.complianceReport.safetyCompliance ? 'text-green-600' : 'text-red-600'}`}>
                    {complianceValidatorData.complianceReport.safetyCompliance ? '✅' : '❌'}
                  </div>
                  <p className="text-sm font-medium text-gray-600">Safety Compliance</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <div className={`text-2xl font-bold mb-2 ${
                    complianceValidatorData.complianceReport.overtimeRisk === 'LOW' ? 'text-green-600' :
                    complianceValidatorData.complianceReport.overtimeRisk === 'MEDIUM' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {complianceValidatorData.complianceReport.overtimeRisk}
                  </div>
                  <p className="text-sm font-medium text-gray-600">Overtime Risk</p>
                </div>
              </div>
            </div>
          )}

          {/* Violations */}
          {complianceValidatorData.violations && complianceValidatorData.violations.length > 0 ? (
            <div className="mb-6">
              <div className="text-md font-medium text-gray-800 mb-3">Violations</div>
              <div className="space-y-2">
                {complianceValidatorData.violations.map((violation: string, index: number) => (
                  <div key={index} className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
                    <p className="text-sm text-red-700">⚠️ {violation}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <p className="text-sm text-green-700 font-medium">✅ No violations found</p>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {complianceValidatorData.recommendations && (
            <div>
              <div className="text-md font-medium text-gray-800 mb-3">Recommendations</div>
              <div className="space-y-2">
                {complianceValidatorData.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-purple-500">
                    <p className="text-sm text-gray-700">💡 {rec}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center">
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${(complianceValidatorData.confidence * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-purple-600">
                    Confidence: {(complianceValidatorData.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stripboard Genius Agent Results */}
      {stripboardGeniusData && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-lg border">
          <h6 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 text-red-600 mr-2" />
            Stripboard Genius Agent Results
          </h6>
          
          {/* Final Schedule Overview */}
          {stripboardGeniusData.finalSchedule && (
            <div className="mb-6">
              <div className="text-md font-medium text-gray-800 mb-3">Final Schedule Overview</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <p className="text-sm font-medium text-gray-600">Total Days</p>
                  <p className="text-3xl font-bold text-red-600">{stripboardGeniusData.finalSchedule.totalDays}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <p className="text-sm font-medium text-gray-600">Shooting Blocks</p>
                  <p className="text-3xl font-bold text-blue-600">{stripboardGeniusData.finalSchedule.shootingBlocks.length}</p>
                </div>
              </div>
              
              {/* Budget Breakdown */}
              {stripboardGeniusData.finalSchedule.budget && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b">
                    <span className="text-lg font-bold text-gray-900">Estimated Budget</span>
                    <span className="text-2xl font-bold text-red-600">{stripboardGeniusData.finalSchedule.budget.estimated}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(stripboardGeniusData.finalSchedule.budget.breakdown).map(([category, amount]) => (
                      <div key={category} className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                        <span className="capitalize text-sm font-medium">{category}:</span>
                        <span className="text-sm font-bold">{String(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary and Metrics */}
          {stripboardGeniusData.summary && (
            <div className="mb-6">
              <div className="text-md font-medium text-gray-800 mb-3">Key Metrics</div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Efficiency</p>
                    <p className="text-2xl font-bold text-green-600">{(stripboardGeniusData.summary.efficiency * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Risk Level</p>
                    <p className={`text-2xl font-bold ${
                      stripboardGeniusData.summary.riskLevel === 'LOW' ? 'text-green-600' :
                      stripboardGeniusData.summary.riskLevel === 'MEDIUM' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {stripboardGeniusData.summary.riskLevel}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Night Shoots</p>
                    <p className="text-2xl font-bold text-indigo-600">{stripboardGeniusData.summary.keyMetrics.nightShoots}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Company Moves</p>
                    <p className="text-2xl font-bold text-orange-600">{stripboardGeniusData.summary.keyMetrics.companyMoves}</p>
                  </div>
                </div>
                
                {/* Additional Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Avg Scenes/Day</p>
                    <p className="text-lg font-bold text-purple-600">{stripboardGeniusData.summary.keyMetrics.avgScenesPerDay}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Crew Size</p>
                    <p className="text-lg font-bold text-teal-600">{stripboardGeniusData.summary.keyMetrics.crewSize}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">Risk Score</p>
                    <p className="text-lg font-bold text-red-600">{stripboardGeniusData.summary.keyMetrics.riskScore}/10</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {stripboardGeniusData.summary?.recommendations && (
            <div>
              <div className="text-md font-medium text-gray-800 mb-3">Recommendations</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stripboardGeniusData.summary.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-red-500">
                    <p className="text-sm text-gray-700">💡 {rec}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center">
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${(stripboardGeniusData.confidence * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-red-600">
                    Confidence: {(stripboardGeniusData.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
    </div>
  );
}
