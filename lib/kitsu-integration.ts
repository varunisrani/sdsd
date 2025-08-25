/**
 * Kitsu Integration Service
 * Handles PostMessage communication with parent Kitsu application
 * to receive localStorage data (script breakdown, assets, shots)
 */

import { ScriptData, AssetsData } from './script-integration';
import { ShotsData, SequenceData } from './schedule-integration';

export interface KitsuMessage {
  type: 'KITSU_LOCALSTORAGE_DATA';
  data: {
    assets?: string;
    scriptBreakdown?: string;
    aiShotsSessions?: string;
    shotsData?: string;
    sequenceData?: string;
    scheduleAnalysis?: string;
    scriptAnalysis?: string;
    timestamp: string;
  };
}

export interface ParsedKitsuData {
  scriptBreakdown?: ScriptData;
  assets?: AssetsData;
  aiShotsSessions?: any[];
  shotsData?: ShotsData;
  sequenceData?: SequenceData;
  scheduleAnalysis?: any;
  scriptAnalysis?: any;
  timestamp: string;
  source: 'kitsu';
}

export interface KitsuConnectionStatus {
  connected: boolean;
  lastUpdate?: string;
  availableData: {
    scriptBreakdown: boolean;
    assets: boolean;
    aiShots: boolean;
    shotsData: boolean;
    sequenceData: boolean;
    scheduleAnalysis: boolean;
    scriptAnalysis: boolean;
  };
  errors: string[];
}

export class KitsuIntegrationService {
  private static instance: KitsuIntegrationService;
  private listeners: ((data: ParsedKitsuData) => void)[] = [];
  private statusListeners: ((status: KitsuConnectionStatus) => void)[] = [];
  private currentData: ParsedKitsuData | null = null;
  private connectionStatus: KitsuConnectionStatus = {
    connected: false,
    availableData: {
      scriptBreakdown: false,
      assets: false,
      aiShots: false,
      shotsData: false,
      sequenceData: false,
      scheduleAnalysis: false,
      scriptAnalysis: false
    },
    errors: []
  };

  private constructor() {
    this.initializeMessageListener();
  }

  static getInstance(): KitsuIntegrationService {
    if (!KitsuIntegrationService.instance) {
      KitsuIntegrationService.instance = new KitsuIntegrationService();
    }
    return KitsuIntegrationService.instance;
  }

  /**
   * Initialize PostMessage listener for Kitsu data
   */
  private initializeMessageListener(): void {
    if (typeof window === 'undefined') return;

    console.log('🔗 Initializing Kitsu PostMessage listener');

    window.addEventListener('message', (event) => {
      try {
        // Security: Validate origin (add your Kitsu domain here)
        const trustedOrigins = [
          'http://localhost:3000',
          'http://localhost:3001', 
          'https://your-kitsu-domain.com',
          // Add other trusted origins as needed
        ];

        // For development, allow any localhost origin
        const isDevelopment = event.origin.startsWith('http://localhost') || 
                             event.origin.startsWith('http://127.0.0.1');
        
        if (!trustedOrigins.includes(event.origin) && !isDevelopment) {
          console.warn('🚫 Ignored message from untrusted origin:', event.origin);
          return;
        }

        const message = event.data as KitsuMessage;
        
        if (message.type === 'KITSU_LOCALSTORAGE_DATA') {
          console.log('📨 Received Kitsu data:', Object.keys(message.data));
          this.processKitsuData(message.data);
        }
      } catch (error) {
        console.error('❌ Failed to process Kitsu message:', error);
        this.updateConnectionStatus({ 
          connected: false, 
          errors: ['Failed to process message from Kitsu'] 
        });
      }
    });

    // Check if we're in an iframe (likely embedded in Kitsu)
    if (window.parent !== window) {
      console.log('🖼️ Running in iframe - requesting Kitsu data');
      this.requestKitsuData();
    }
  }

  /**
   * Process received data from Kitsu
   */
  private processKitsuData(data: KitsuMessage['data']): void {
    const errors: string[] = [];
    const parsedData: ParsedKitsuData = {
      timestamp: data.timestamp,
      source: 'kitsu'
    };

    // Parse script breakdown data
    if (data.scriptBreakdown) {
      try {
        parsedData.scriptBreakdown = JSON.parse(data.scriptBreakdown);
        console.log('✅ Parsed script breakdown data');
      } catch (error) {
        console.warn('❌ Failed to parse script breakdown data:', error);
        errors.push('Invalid script breakdown data format');
      }
    }

    // Parse assets data
    if (data.assets) {
      try {
        parsedData.assets = JSON.parse(data.assets);
        console.log('✅ Parsed assets data');
      } catch (error) {
        console.warn('❌ Failed to parse assets data:', error);
        errors.push('Invalid assets data format');
      }
    }

    // Parse AI shots sessions
    if (data.aiShotsSessions) {
      try {
        parsedData.aiShotsSessions = JSON.parse(data.aiShotsSessions);
        console.log('✅ Parsed AI shots sessions data');
      } catch (error) {
        console.warn('❌ Failed to parse AI shots sessions:', error);
        errors.push('Invalid AI shots data format');
      }
    }

    // Parse shots data
    if (data.shotsData) {
      try {
        parsedData.shotsData = JSON.parse(data.shotsData);
        console.log('✅ Parsed shots data');
      } catch (error) {
        console.warn('❌ Failed to parse shots data:', error);
        errors.push('Invalid shots data format');
      }
    }

    // Parse sequence data
    if (data.sequenceData) {
      try {
        parsedData.sequenceData = JSON.parse(data.sequenceData);
        console.log('✅ Parsed sequence data');
      } catch (error) {
        console.warn('❌ Failed to parse sequence data:', error);
        errors.push('Invalid sequence data format');
      }
    }

    // Parse schedule analysis
    if (data.scheduleAnalysis) {
      try {
        parsedData.scheduleAnalysis = JSON.parse(data.scheduleAnalysis);
        console.log('✅ Parsed schedule analysis data');
      } catch (error) {
        console.warn('❌ Failed to parse schedule analysis:', error);
        errors.push('Invalid schedule analysis format');
      }
    }

    // Parse script analysis
    if (data.scriptAnalysis) {
      try {
        parsedData.scriptAnalysis = JSON.parse(data.scriptAnalysis);
        console.log('✅ Parsed script analysis data');
      } catch (error) {
        console.warn('❌ Failed to parse script analysis:', error);
        errors.push('Invalid script analysis format');
      }
    }

    // Update current data
    this.currentData = parsedData;

    // Update connection status
    this.updateConnectionStatus({
      connected: true,
      lastUpdate: new Date().toISOString(),
      availableData: {
        scriptBreakdown: !!parsedData.scriptBreakdown,
        assets: !!parsedData.assets,
        aiShots: !!(parsedData.aiShotsSessions?.length),
        shotsData: !!parsedData.shotsData,
        sequenceData: !!parsedData.sequenceData,
        scheduleAnalysis: !!parsedData.scheduleAnalysis,
        scriptAnalysis: !!parsedData.scriptAnalysis
      },
      errors
    });

    // Notify listeners
    this.notifyDataListeners(parsedData);
  }

  /**
   * Request fresh data from Kitsu
   */
  private requestKitsuData(): void {
    if (window.parent === window) return;

    try {
      window.parent.postMessage({
        type: 'REQUEST_KITSU_DATA',
        timestamp: new Date().toISOString()
      }, '*');
    } catch (error) {
      console.warn('Failed to request Kitsu data:', error);
    }
  }

  /**
   * Update connection status and notify listeners
   */
  private updateConnectionStatus(updates: Partial<KitsuConnectionStatus>): void {
    this.connectionStatus = { ...this.connectionStatus, ...updates };
    this.notifyStatusListeners(this.connectionStatus);
  }

  /**
   * Notify all data listeners
   */
  private notifyDataListeners(data: ParsedKitsuData): void {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in Kitsu data listener:', error);
      }
    });
  }

  /**
   * Notify all status listeners
   */
  private notifyStatusListeners(status: KitsuConnectionStatus): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in Kitsu status listener:', error);
      }
    });
  }

  /**
   * Subscribe to Kitsu data updates
   */
  onDataReceived(callback: (data: ParsedKitsuData) => void): () => void {
    this.listeners.push(callback);
    
    // If we already have data, send it immediately
    if (this.currentData) {
      callback(this.currentData);
    }

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Subscribe to connection status updates
   */
  onStatusChanged(callback: (status: KitsuConnectionStatus) => void): () => void {
    this.statusListeners.push(callback);
    
    // Send current status immediately
    callback(this.connectionStatus);

    // Return unsubscribe function
    return () => {
      this.statusListeners = this.statusListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Get current Kitsu data
   */
  getCurrentData(): ParsedKitsuData | null {
    return this.currentData;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): KitsuConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Check if we're running in Kitsu iframe
   */
  isInKitsuIframe(): boolean {
    return window.parent !== window;
  }

  /**
   * Check if specific data type is available
   */
  hasDataType(type: 'scriptBreakdown' | 'assets' | 'aiShots'): boolean {
    return this.connectionStatus.availableData[type];
  }

  /**
   * Get formatted data for script analysis
   */
  getScriptBreakdownForAnalysis(): ScriptData | null {
    if (!this.currentData?.scriptBreakdown) return null;

    return this.currentData.scriptBreakdown;
  }

  /**
   * Get formatted assets data for analysis
   */
  getAssetsForAnalysis(): AssetsData | null {
    if (!this.currentData?.assets) return null;

    return this.currentData.assets;
  }

  /**
   * Get shots data for schedule analysis
   */
  getShotsDataForAnalysis(): ShotsData | null {
    if (!this.currentData?.shotsData) return null;

    return this.currentData.shotsData;
  }

  /**
   * Get sequence data for schedule analysis
   */
  getSequenceDataForAnalysis(): SequenceData | null {
    if (!this.currentData?.sequenceData) return null;

    return this.currentData.sequenceData;
  }

  /**
   * Get schedule analysis results
   */
  getScheduleAnalysis(): any | null {
    if (!this.currentData?.scheduleAnalysis) return null;

    return this.currentData.scheduleAnalysis;
  }

  /**
   * Get script analysis results
   */
  getScriptAnalysis(): any | null {
    if (!this.currentData?.scriptAnalysis) return null;

    return this.currentData.scriptAnalysis;
  }

  /**
   * Request fresh data from Kitsu
   */
  refreshData(): void {
    console.log('🔄 Requesting fresh data from Kitsu');
    this.requestKitsuData();
  }

  /**
   * Clear current data and reset connection
   */
  reset(): void {
    this.currentData = null;
    this.updateConnectionStatus({
      connected: false,
      lastUpdate: undefined,
      availableData: {
        scriptBreakdown: false,
        assets: false,
        aiShots: false,
        shotsData: false,
        sequenceData: false,
        scheduleAnalysis: false,
        scriptAnalysis: false
      },
      errors: []
    });
  }

  /**
   * Get statistics about received data
   */
  getDataStats(): {
    scriptBreakdown?: { scenes: number; characters: number; locations: number };
    assets?: { total: number; categories: number };
    aiShots?: { sessions: number; totalShots: number };
  } {
    if (!this.currentData) return {};

    const stats: any = {};

    if (this.currentData.scriptBreakdown) {
      const script = this.currentData.scriptBreakdown.data;
      stats.scriptBreakdown = {
        scenes: script.totalScenes || script.scenes?.length || 0,
        characters: script.characters?.length || 0,
        locations: script.locations?.length || 0
      };
    }

    if (this.currentData.assets) {
      const assets = this.currentData.assets.data;
      stats.assets = {
        total: assets.totalAssets || 0,
        categories: Object.keys(assets.categories || {}).length
      };
    }

    if (this.currentData.aiShotsSessions) {
      stats.aiShots = {
        sessions: this.currentData.aiShotsSessions.length,
        totalShots: this.currentData.aiShotsSessions.reduce((acc, session) => {
          return acc + (session.metadata?.totalShots || 0);
        }, 0)
      };
    }

    return stats;
  }
}

/**
 * Convenience function to get the Kitsu integration instance
 */
export const getKitsuIntegration = () => KitsuIntegrationService.getInstance();

/**
 * React hook for using Kitsu integration
 */
export const useKitsuIntegration = () => {
  if (typeof window === 'undefined') {
    return {
      data: null,
      status: {
        connected: false,
        availableData: { 
          scriptBreakdown: false, 
          assets: false, 
          aiShots: false,
          shotsData: false,
          sequenceData: false,
          scheduleAnalysis: false,
          scriptAnalysis: false
        },
        errors: []
      },
      refreshData: () => {},
      isInIframe: false
    };
  }

  const kitsu = getKitsuIntegration();
  
  return {
    data: kitsu.getCurrentData(),
    status: kitsu.getConnectionStatus(),
    refreshData: () => kitsu.refreshData(),
    isInIframe: kitsu.isInKitsuIframe(),
    hasScriptBreakdown: kitsu.hasDataType('scriptBreakdown'),
    hasAssets: kitsu.hasDataType('assets'),
    hasAiShots: kitsu.hasDataType('aiShots')
  };
};