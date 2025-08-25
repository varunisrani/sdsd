'use client';

import React, { useState, useCallback } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { BudgetAnalysisService, ScriptDataUtils, BudgetAnalysisResult, AgentTestResult, ScriptData, DEFAULT_BUDGET_CONFIG } from '../lib/budget-integration';

interface DashboardStats {
  totalProjects: number;
  avgProcessingTime: string;
  successRate: string;
  totalBudgetAnalyzed: string;
}

interface BudgetDashboardProps {
  className?: string;
}

export function BudgetDashboard({ className = '' }: BudgetDashboardProps) {
  // State management
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<BudgetAnalysisResult | null>(null);
  const [testResults, setTestResults] = useState<AgentTestResult[]>([]);
  const [orchestratorTest, setOrchestratorTest] = useState<AgentTestResult | null>(null);
  const [currentScript, setCurrentScript] = useState<ScriptData | null>(null);
  const [apiKey, setApiKey] = useState('AIzaSyA3JOFk4ZL7jiTtd-eodK_LgNS-nG0OcSI');
  const [error, setError] = useState<string | null>(null);

  // Dashboard stats (mock data for now)
  const [dashboardStats] = useState<DashboardStats>({
    totalProjects: 0,
    avgProcessingTime: '0s',
    successRate: '0%',
    totalBudgetAnalyzed: '$0'
  });

  // Initialize budget service
  const createBudgetService = useCallback(() => {
    if (!apiKey.trim()) {
      throw new Error('API key is required');
    }
    return new BudgetAnalysisService({
      ...DEFAULT_BUDGET_CONFIG,
      apiKey: apiKey.trim()
    });
  }, [apiKey]);

  // Load default SSD data
  const handleLoadDefaultScript = async () => {
    try {
      setError(null);
      const defaultData = await ScriptDataUtils.getDefaultSSDData();
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
      const scriptData = await ScriptDataUtils.loadSSDFile(file);
      setCurrentScript(scriptData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load script file');
    }
  };

  // Run budget analysis
  const handleAnalyzeScript = async () => {
    if (!currentScript) {
      setError('No script loaded. Please load a script first.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResult(null);

      const service = createBudgetService();
      const result = await service.analyzeScript(currentScript);
      setAnalysisResult(result);

      if (!result.success) {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Test individual agents
  const handleTestAgents = async () => {
    try {
      setIsTesting(true);
      setError(null);
      setTestResults([]);
      setOrchestratorTest(null);

      const service = createBudgetService();
      
      // Test individual agents
      const agentTests = await service.testIndividualAgents();
      setTestResults(agentTests);

      // Test orchestrator
      const orchTest = await service.testOrchestrator();
      setOrchestratorTest(orchTest);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Agent testing failed');
    } finally {
      setIsTesting(false);
    }
  };

  // Get script stats
  const scriptStats = currentScript ? ScriptDataUtils.getScriptStats(currentScript) : null;

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Film Budget Analysis Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Professional budget analysis using AI-powered agents
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
              <div className="p-2 bg-purple-100 rounded-md">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalBudgetAnalyzed}</p>
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
                <p className="text-sm text-gray-500">Load and manage your script files</p>
              </div>
              
              <div className="p-6 space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload SSD.json File
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">Click to upload SSD.json</p>
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

                <div className="text-center text-gray-500">or</div>

                {/* Load Default */}
                <button
                  onClick={handleLoadDefaultScript}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Load Default Test Script
                </button>

                {/* Script Info */}
                {currentScript && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Script Loaded</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Name:</strong> {currentScript.data.scriptName || 'Unknown'}</p>
                      <p><strong>Type:</strong> {currentScript.data.type || 'Unknown'}</p>
                      <p><strong>Genre:</strong> {currentScript.data.genre || 'Unknown'}</p>
                      {scriptStats && (
                        <>
                          <p><strong>Scenes:</strong> {scriptStats.totalScenes}</p>
                          <p><strong>Locations:</strong> {scriptStats.locations.length}</p>
                          <p><strong>Characters:</strong> {scriptStats.characters.length}</p>
                        </>
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
                  disabled={!currentScript || !apiKey.trim() || isAnalyzing}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing Script...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Analyze Budget
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
                      Test Budget Agents
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
                <p className="text-sm text-gray-500">Budget analysis and agent test results</p>
              </div>
              
              <div className="p-6">
                {!analysisResult && !testResults.length && !orchestratorTest ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No results yet. Load a script and run analysis or test agents.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Budget Analysis Results */}
                    {analysisResult && (
                      <div>
                        <h4 className="text-lg font-semibold mb-4">Budget Analysis Results</h4>
                        <BudgetResults result={analysisResult} />
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

// Budget Results Display Component
function BudgetResults({ result }: { result: BudgetAnalysisResult }) {
  const completedStages = Object.values(result.stages).filter(stage => stage.completed).length;
  const totalStages = Object.keys(result.stages).length;
  const successRate = (completedStages / totalStages) * 100;

  return (
    <div className="space-y-6">
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

// Agent Test Results Display Component  
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