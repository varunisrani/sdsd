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
  Layers,
  Calendar,
  MapPin,
  Truck,
  Database,
  Trash2,
  Eye
} from 'lucide-react';
import { BudgetAnalysisService, ScriptDataUtils as BudgetUtils, BudgetAnalysisResult, AgentTestResult, ScriptData, DEFAULT_BUDGET_CONFIG } from '../lib/budget-integration';
import { ScriptAnalysisService, ScriptDataUtils, ScriptAnalysisResult, AssetsData, DEFAULT_SCRIPT_CONFIG } from '../lib/script-integration';
import { ScheduleAnalysisService, ScriptDataUtils as ScheduleUtils, ScheduleAnalysisResult, ShotsData, SequenceData, DEFAULT_SCHEDULE_CONFIG } from '../lib/schedule-integration';
import { AnalysisStorageService, StoredAnalysis } from '../lib/storage-service';

type AnalysisType = 'budget' | 'script' | 'schedule';

interface DashboardStats {
  totalProjects: number;
  avgProcessingTime: string;
  successRate: string;
  totalBudgetAnalyzed: string;
}

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

  // Dashboard stats (mock data for now)
  const [dashboardStats] = useState<DashboardStats>({
    totalProjects: 0,
    avgProcessingTime: '0s',
    successRate: '0%',
    totalBudgetAnalyzed: '$0'
  });

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
      setCurrentScript(defaultData);
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
      setCurrentScript(scriptData);
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
      const projectName = budgetResult.finalBudget?.projectName || 'Budget-Analysis';
      downloadJSON(budgetResult, `${projectName}_Budget-Analysis_${timestamp}.json`);
    }
  };

  const handleExportScheduleAnalysis = () => {
    if (scheduleResult) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const projectName = scheduleResult.finalSchedule?.projectName || 'Schedule-Analysis';
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
          .reduce((sum, time) => sum + time, 0)
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
        const result = await service.analyzeScript(currentScript, currentAssets);
        setScriptResult(result);
        
        // Save to local storage
        if (result.success) {
          const projectName = currentScript.data?.scriptName || 'Script Analysis';
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
        
        const result = await service.analyzeScript(scriptForAnalysis, currentShots, currentSequence);
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
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Film Production Analysis Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Professional {analysisType} analysis using AI-powered agents
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="Google AI API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Analysis Type Selector */}
          <div className="mt-6">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAnalysisType('budget');
                  setBudgetResult(null);
                  setScriptResult(null);
                  setScheduleResult(null);
                  setError(null);
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  analysisType === 'budget'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  analysisType === 'script'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  analysisType === 'schedule'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Schedule Analysis
              </button>
              
              {/* Storage Management Button */}
              <button
                onClick={() => setShowStoragePanel(!showStoragePanel)}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 bg-gray-800 text-white hover:bg-gray-700"
              >
                <Database className="w-4 h-4" />
                Storage ({storedAnalyses.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Storage Management Panel */}
        {showStoragePanel && (
          <div className="mb-8 bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Stored AI Analysis Results</h3>
                    <p className="text-sm text-gray-500">
                      {storedAnalyses.length} stored analyses • 
                      Script: {storedAnalyses.filter(a => a.type === 'script').length} • 
                      Schedule: {storedAnalyses.filter(a => a.type === 'schedule').length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => AnalysisStorageService.exportAnalyses()}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={handleClearAllAnalyses}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
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
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No stored analyses</h4>
                  <p className="text-gray-500">Run script or schedule analysis to start storing results</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {storedAnalyses.map((analysis) => (
                    <div key={analysis.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              analysis.type === 'script' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {analysis.type === 'script' ? <Film className="w-3 h-3 mr-1" /> : <Calendar className="w-3 h-3 mr-1" />}
                              {analysis.type.toUpperCase()}
                            </span>
                            <h4 className="text-sm font-medium text-gray-900">{analysis.projectName}</h4>
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <p>📅 {new Date(analysis.timestamp).toLocaleString()}</p>
                            {analysis.metadata && (
                              <p>
                                ⏱️ {analysis.metadata.processingTime}ms • 
                                ✅ {analysis.metadata.stagesCompleted} stages • 
                                📊 {Math.round((analysis.metadata.confidence || 0) * 100)}% confidence
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleViewStoredAnalysis(analysis)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="View Analysis"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnalysis(analysis.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Processing</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.avgProcessingTime}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-md">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.successRate}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-md ${
                analysisType === 'budget' ? 'bg-purple-100' : 
                analysisType === 'script' ? 'bg-indigo-100' :
                'bg-green-100'
              }`}>
                {analysisType === 'budget' ? (
                  <DollarSign className="w-6 h-6 text-purple-600" />
                ) : analysisType === 'script' ? (
                  <Target className="w-6 h-6 text-indigo-600" />
                ) : (
                  <Calendar className="w-6 h-6 text-green-600" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {analysisType === 'budget' ? 'Total Budget' : 
                   analysisType === 'script' ? 'Total Elements' :
                   'Shooting Days'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analysisType === 'budget' ? dashboardStats.totalBudgetAnalyzed : 
                   analysisType === 'script' ? '0' :
                   '0'}
                </p>
              </div>
            </div>
          </div>
        </div>

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
                                  Project: {currentScheduleAnalysis.finalSchedule?.projectName || 'Unknown'}
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
                          <p><strong>Props:</strong> {scriptStats.props}</p>
                          <p><strong>Vehicles:</strong> {scriptStats.vehicles}</p>
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
                          <span><strong>Schedule Analysis:</strong> {currentScheduleAnalysis.finalSchedule?.projectName || 'Loaded'}</span>
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

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Budget Analysis Results</h4>
        <button
          onClick={onExport}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" />
          Export JSON
        </button>
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

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Script Analysis Results</h4>
        <button
          onClick={onExport}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" />
          Export JSON
        </button>
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
      </div>
    </div>
  );
}

// Schedule Results Display Component (new)
function ScheduleResults({ result, onExport }: { result: ScheduleAnalysisResult, onExport?: () => void }) {
  const completedStages = Object.values(result.stages).filter(stage => stage.completed).length;
  const totalStages = Object.keys(result.stages).length;
  const successRate = (completedStages / totalStages) * 100;

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Schedule Analysis Results</h4>
        <button
          onClick={onExport}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" />
          Export JSON
        </button>
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