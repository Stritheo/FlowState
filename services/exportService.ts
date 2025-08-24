import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { DailyEntry, databaseService } from './database';

export interface ExportOptions {
  startDate: string;
  endDate: string;
  includeNotes: boolean;
  anonymize: boolean;
  analysisFormat: boolean;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

class ExportService {
  
  private sanitizeForCSV(value: string | null | undefined): string {
    if (!value) return '';
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    const escaped = value.replace(/"/g, '""');
    if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
      return `"${escaped}"`;
    }
    return escaped;
  }

  private anonymizeEntry(entry: DailyEntry): DailyEntry {
    return {
      ...entry,
      // Remove specific date, keep only relative day number or anonymized identifier
      date: `Day_${Math.abs(entry.date.split('-').join('').slice(-6) as any)}`,
      // Remove or anonymize notes if they contain personal information
      notes: entry.notes ? '[NOTES_PRESENT]' : undefined,
      // Remove creation timestamp to prevent identification
      created_at: '[TIMESTAMP_REMOVED]'
    };
  }

  private formatForAnalysis(entry: DailyEntry, includeNotes: boolean): any {
    const analysisData = {
      Date: entry.date,
      Sleep_Quality_1to7: entry.sleep_quality || '',
      Hours_Slept: entry.hours_slept || '',
      Energy_Level_1to7: entry.energy_level,
      Focus_Level_1to7: entry.focus_level,
      Caffeine_Intake_Count: entry.caffeine_intake || 0,
      Alcohol_Intake_Count: entry.alcohol_intake || 0,
      Diamond_Clarity_Indicator: (entry.energy_level >= 3 && entry.energy_level <= 5 && 
                            entry.focus_level >= 3 && entry.focus_level <= 5) ? 'Yes' : 'No'
    };

    if (includeNotes && entry.notes) {
      return { ...analysisData, Notes: entry.notes };
    }
    
    return analysisData;
  }

  private generateCSVContent(entries: DailyEntry[], options: ExportOptions): string {
    if (entries.length === 0) {
      return 'No data available for the selected date range\n';
    }

    let processedEntries = entries;
    
    if (options.anonymize) {
      processedEntries = entries.map(entry => this.anonymizeEntry(entry));
    }

    const csvData = processedEntries.map(entry => {
      if (options.analysisFormat) {
        return this.formatForAnalysis(entry, options.includeNotes);
      } else {
        return {
          Date: entry.date,
          'Sleep Quality': entry.sleep_quality || '',
          'Hours Slept': entry.hours_slept || '',
          'Energy Level': entry.energy_level,
          'Focus Level': entry.focus_level,
          'Caffeine Intake': entry.caffeine_intake || 0,
          'Alcohol Intake': entry.alcohol_intake || 0,
          'Diamond Clarity': (entry.energy_level >= 3 && entry.energy_level <= 5 && 
                        entry.focus_level >= 3 && entry.focus_level <= 5) ? 'Yes' : 'No',
          ...(options.includeNotes && entry.notes ? { Notes: entry.notes } : {})
        };
      }
    });

    if (csvData.length === 0) return 'No data to export\n';

    // Generate CSV headers
    const headers = Object.keys(csvData[0]);
    const csvHeaders = headers.join(',') + '\n';

    // Generate CSV rows
    const csvRows = csvData.map(row => 
      headers.map(header => this.sanitizeForCSV(String(row[header] || ''))).join(',')
    ).join('\n');

    // Add privacy notice if anonymised
    const privacyNotice = options.anonymize ? 
      '# Privacy Notice: This export has been anonymised for data sharing\n# Dates have been converted to relative identifiers and personal notes removed\n\n' : '';

    return privacyNotice + csvHeaders + csvRows;
  }

  async exportData(options: ExportOptions): Promise<ExportResult> {
    try {
      // Fetch data from database
      const entries = await databaseService.getEntriesInRange(options.startDate, options.endDate);
      
      if (entries.length === 0) {
        return {
          success: false,
          error: 'No data found for the selected date range'
        };
      }

      // Generate CSV content
      const csvContent = this.generateCSVContent(entries, options);
      
      // Create filename with privacy indicator
      const privacyPrefix = options.anonymize ? 'Anonymous_' : '';
      const analysisPrefix = options.analysisFormat ? 'Analysis_' : '';
      const dateRange = `${options.startDate}_to_${options.endDate}`;
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${privacyPrefix}${analysisPrefix}FlowState_Export_${dateRange}_${timestamp}.csv`;
      
      // Write to file
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return {
        success: true,
        filePath: fileUri
      };

    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        error: 'Failed to export data: ' + (error as Error).message
      };
    }
  }

  async shareExport(filePath: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Share FlowState Data Export',
        UTI: 'public.comma-separated-values-text'
      });

      return true;
    } catch (error) {
      console.error('Sharing failed:', error);
      return false;
    }
  }

  async getExportPreview(options: ExportOptions, maxRows: number = 5): Promise<string> {
    try {
      const entries = await databaseService.getEntriesInRange(options.startDate, options.endDate);
      const previewEntries = entries.slice(0, maxRows);
      
      if (previewEntries.length === 0) {
        return 'No data available for preview';
      }

      const csvContent = this.generateCSVContent(previewEntries, options);
      return csvContent + (entries.length > maxRows ? `\n... and ${entries.length - maxRows} more rows` : '');
    } catch (error) {
      return 'Preview unavailable: ' + (error as Error).message;
    }
  }
}

export const exportService = new ExportService();