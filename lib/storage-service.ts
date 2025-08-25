/**
 * Local Storage Service for AI Analysis Results
 * Manages storage and retrieval of script and schedule analysis responses
 */

export interface StoredAnalysis {
  id: string;
  type: 'script' | 'schedule' | 'budget';
  timestamp: string;
  projectName: string;
  result: any;
  metadata?: {
    processingTime?: number;
    stagesCompleted?: number;
    confidence?: number;
    [key: string]: any;
  };
}

export class AnalysisStorageService {
  private static readonly STORAGE_KEY = 'ai_analysis_results';
  private static readonly MAX_STORED_ANALYSES = 50; // Limit storage

  /**
   * Save an analysis result to local storage
   */
  static saveAnalysis(type: 'script' | 'schedule' | 'budget', projectName: string, result: any): string {
    if (typeof window === 'undefined') return ''; // SSR safety

    const analysisId = this.generateId();
    const storedAnalysis: StoredAnalysis = {
      id: analysisId,
      type,
      timestamp: new Date().toISOString(),
      projectName: projectName || `${type}_analysis_${Date.now()}`,
      result,
      metadata: {
        processingTime: result.processingTime,
        stagesCompleted: result.stages ? Object.values(result.stages).filter((stage: any) => stage.completed).length : 0,
        confidence: result.confidence || (result.finalAnalysis?.confidence)
      }
    };

    const stored = this.getStoredAnalyses();
    stored.unshift(storedAnalysis); // Add to beginning

    // Keep only the most recent analyses
    if (stored.length > this.MAX_STORED_ANALYSES) {
      stored.splice(this.MAX_STORED_ANALYSES);
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
      console.log(`✅ Saved ${type} analysis to local storage:`, analysisId);
      return analysisId;
    } catch (error) {
      console.warn('Failed to save analysis to localStorage:', error);
      return '';
    }
  }

  /**
   * Get all stored analyses
   */
  static getStoredAnalyses(): StoredAnalysis[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load analyses from localStorage:', error);
      return [];
    }
  }

  /**
   * Get analyses filtered by type
   */
  static getAnalysesByType(type: 'script' | 'schedule' | 'budget'): StoredAnalysis[] {
    return this.getStoredAnalyses().filter(analysis => analysis.type === type);
  }

  /**
   * Get a specific analysis by ID
   */
  static getAnalysisById(id: string): StoredAnalysis | null {
    const analyses = this.getStoredAnalyses();
    return analyses.find(analysis => analysis.id === id) || null;
  }

  /**
   * Delete a specific analysis
   */
  static deleteAnalysis(id: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const analyses = this.getStoredAnalyses();
      const filteredAnalyses = analyses.filter(analysis => analysis.id !== id);
      
      if (filteredAnalyses.length === analyses.length) {
        return false; // ID not found
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredAnalyses));
      console.log(`🗑️ Deleted analysis from storage:`, id);
      return true;
    } catch (error) {
      console.warn('Failed to delete analysis:', error);
      return false;
    }
  }

  /**
   * Clear all stored analyses
   */
  static clearAllAnalyses(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🧹 Cleared all stored analyses');
      return true;
    } catch (error) {
      console.warn('Failed to clear analyses:', error);
      return false;
    }
  }

  /**
   * Clear analyses by type
   */
  static clearAnalysesByType(type: 'script' | 'schedule' | 'budget'): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const analyses = this.getStoredAnalyses();
      const filteredAnalyses = analyses.filter(analysis => analysis.type !== type);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredAnalyses));
      console.log(`🧹 Cleared all ${type} analyses`);
      return true;
    } catch (error) {
      console.warn(`Failed to clear ${type} analyses:`, error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  static getStorageStats() {
    const analyses = this.getStoredAnalyses();
    const scriptCount = analyses.filter(a => a.type === 'script').length;
    const scheduleCount = analyses.filter(a => a.type === 'schedule').length;
    const budgetCount = analyses.filter(a => a.type === 'budget').length;
    
    return {
      total: analyses.length,
      script: scriptCount,
      schedule: scheduleCount,
      budget: budgetCount,
      oldestDate: analyses.length > 0 ? analyses[analyses.length - 1].timestamp : null,
      newestDate: analyses.length > 0 ? analyses[0].timestamp : null,
      storageUsed: this.getStorageSize()
    };
  }

  /**
   * Estimate storage size (approximate)
   */
  private static getStorageSize(): string {
    if (typeof window === 'undefined') return '0 KB';

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY) || '';
      const sizeBytes = new Blob([stored]).size;
      
      if (sizeBytes < 1024) return `${sizeBytes} B`;
      if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
      return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * Generate unique ID for analysis
   */
  private static generateId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export analyses as JSON file
   */
  static exportAnalyses(): void {
    if (typeof window === 'undefined') return;

    const analyses = this.getStoredAnalyses();
    const dataStr = JSON.stringify(analyses, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai_analysis_results_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Import analyses from JSON file
   */
  static importAnalyses(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          
          if (!Array.isArray(importedData)) {
            reject(new Error('Invalid file format'));
            return;
          }

          const existingAnalyses = this.getStoredAnalyses();
          const mergedAnalyses = [...importedData, ...existingAnalyses]
            .slice(0, this.MAX_STORED_ANALYSES); // Respect limit

          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mergedAnalyses));
          resolve(importedData.length);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}