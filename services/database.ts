import * as SQLite from 'expo-sqlite';

export interface DailyEntry {
  id?: number;
  date: string;
  energy_level: number;
  focus_level: number;
  sleep_quality?: number;
  hours_slept?: number;
  caffeine_intake?: number;
  alcohol_intake?: number;
  notes?: string;
  created_at: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('flowstate.db');
    await this.createTables();
    await this.migrateDatabase();
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        energy_level INTEGER NOT NULL CHECK (energy_level BETWEEN 1 AND 10),
        focus_level INTEGER NOT NULL CHECK (focus_level BETWEEN 1 AND 10),
        sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 7),
        hours_slept REAL,
        caffeine_intake INTEGER DEFAULT 0,
        alcohol_intake INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // Add new columns if they don't exist (for existing databases)
    await this.db.execAsync(`
      ALTER TABLE daily_entries ADD COLUMN caffeine_intake INTEGER DEFAULT 0;
    `).catch(() => {}); // Ignore if column already exists
    
    await this.db.execAsync(`
      ALTER TABLE daily_entries ADD COLUMN alcohol_intake INTEGER DEFAULT 0;
    `).catch(() => {}); // Ignore if column already exists
    
    await this.db.execAsync(`
      ALTER TABLE daily_entries ADD COLUMN sleep_quality INTEGER;
    `).catch(() => {}); // Ignore if column already exists
    
    await this.db.execAsync(`
      ALTER TABLE daily_entries ADD COLUMN hours_slept REAL;
    `).catch(() => {}); // Ignore if column already exists
  }

  private async migrateDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    // Check if we need to migrate from the old UNIQUE constraint on date
    try {
      // Try to get table info to see if we need migration
      const tableInfo = await this.db.getAllAsync(`PRAGMA table_info(daily_entries)`);
      // For now, we'll keep the existing structure but add new methods
      // In future versions, we can remove the UNIQUE constraint to support multiple entries per day
    } catch (error) {
      console.log('Migration check failed:', error);
    }
  }

  async addDailyEntry(entry: Omit<DailyEntry, 'id' | 'created_at'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(
      `INSERT INTO daily_entries (date, energy_level, focus_level, sleep_quality, hours_slept, caffeine_intake, alcohol_intake, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.date, 
        entry.energy_level, 
        entry.focus_level, 
        entry.sleep_quality || null, 
        entry.hours_slept || null, 
        entry.caffeine_intake || 0, 
        entry.alcohol_intake || 0, 
        entry.notes || null, 
        new Date().toISOString()
      ]
    );

    return result.lastInsertRowId;
  }

  async getDailyEntry(date: string): Promise<DailyEntry | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<DailyEntry>(
      'SELECT * FROM daily_entries WHERE date = ?',
      [date]
    );

    return result || null;
  }

  async getDailyEntries(date: string): Promise<DailyEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync<DailyEntry>(
      'SELECT * FROM daily_entries WHERE date = ? ORDER BY created_at ASC',
      [date]
    );

    return result;
  }

  async getAllEntries(): Promise<DailyEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync<DailyEntry>(
      'SELECT * FROM daily_entries ORDER BY date DESC'
    );

    return result;
  }

  async updateDailyEntry(date: string, entry: Partial<Pick<DailyEntry, 'energy_level' | 'focus_level' | 'sleep_quality' | 'hours_slept' | 'caffeine_intake' | 'alcohol_intake' | 'notes'>>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const fields = [];
    const values = [];

    if (entry.energy_level !== undefined) {
      fields.push('energy_level = ?');
      values.push(entry.energy_level);
    }
    if (entry.focus_level !== undefined) {
      fields.push('focus_level = ?');
      values.push(entry.focus_level);
    }
    if (entry.sleep_quality !== undefined) {
      fields.push('sleep_quality = ?');
      values.push(entry.sleep_quality);
    }
    if (entry.hours_slept !== undefined) {
      fields.push('hours_slept = ?');
      values.push(entry.hours_slept);
    }
    if (entry.caffeine_intake !== undefined) {
      fields.push('caffeine_intake = ?');
      values.push(entry.caffeine_intake);
    }
    if (entry.alcohol_intake !== undefined) {
      fields.push('alcohol_intake = ?');
      values.push(entry.alcohol_intake);
    }
    if (entry.notes !== undefined) {
      fields.push('notes = ?');
      values.push(entry.notes);
    }

    if (fields.length === 0) return;

    values.push(date);

    await this.db.runAsync(
      `UPDATE daily_entries SET ${fields.join(', ')} WHERE date = ?`,
      values
    );
  }

  async deleteDailyEntry(date: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM daily_entries WHERE date = ?', [date]);
  }

  async getEntriesInRange(startDate: string, endDate: string): Promise<DailyEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync<DailyEntry>(
      'SELECT * FROM daily_entries WHERE date BETWEEN ? AND ? ORDER BY date ASC',
      [startDate, endDate]
    );

    return result;
  }

  private getDateRangeForTimeframe(range: 'day' | 'week' | 'month' | 'all'): { startDate: string; endDate: string } | null {
    const now = Date.now();
    
    switch (range) {
      case 'day': {
        // Today's data only - use start of today in Australian timezone
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = today.toISOString().split('T')[0];
        const endDate = new Date(now).toISOString().split('T')[0];
        return { startDate, endDate };
      }
      case 'week': {
        // Past 7 days including today
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const startDate = weekAgo.toISOString().split('T')[0];
        const endDate = new Date(now).toISOString().split('T')[0];
        return { startDate, endDate };
      }
      case 'month': {
        // Past 30 days including today
        const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const startDate = monthAgo.toISOString().split('T')[0];
        const endDate = new Date(now).toISOString().split('T')[0];
        return { startDate, endDate };
      }
      case 'all':
        // All data - no date range needed
        return null;
    }
  }

  async getEntryCountByRange(range: 'day' | 'week' | 'month' | 'all'): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT COUNT(*) as count FROM daily_entries';
    let params: string[] = [];

    if (range !== 'all') {
      const dateRange = this.getDateRangeForTimeframe(range);
      if (dateRange) {
        query += ' WHERE date BETWEEN ? AND ?';
        params = [dateRange.startDate, dateRange.endDate];
      }
    }

    const result = await this.db.getFirstAsync<{ count: number }>(query, params);
    return result?.count || 0;
  }

  async deleteDataByRange(range: 'day' | 'week' | 'month' | 'all'): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'DELETE FROM daily_entries';
    let params: string[] = [];

    if (range !== 'all') {
      const dateRange = this.getDateRangeForTimeframe(range);
      if (dateRange) {
        query += ' WHERE date BETWEEN ? AND ?';
        params = [dateRange.startDate, dateRange.endDate];
      }
    }

    const result = await this.db.runAsync(query, params);
    return result.changes;
  }
}

export const databaseService = new DatabaseService();