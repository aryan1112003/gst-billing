import dbConnectionManager from './databaseConnectionManager';
import bcrypt from 'bcryptjs';

interface AgencyData {
  companyName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  faxNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  vatNumber?: string;
  cstNumber?: string;
  serviceTaxNumber?: string;
  logoUrl?: string;
  subscriptionPlan?: string;
  userName?: string;
  businessType?: string;
}

interface Agency {
  id: number;
  company_name: string;
  database_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  fax_number?: string;
  gst_number?: string;
  pan_number?: string;
  vat_number?: string;
  cst_number?: string;
  service_tax_number?: string;
  logo_url?: string;
  status: string;
  subscription_plan: string;
  business_type?: string;
  subscription_expires_at?: Date;
  created_date: Date;
  updated_date: Date;
}

interface AgencyWithUser extends Agency {
  user_id: number;
  user_email: string;
  user_name: string;
}

class AgencyService {
  /**
   * Create a new agency with dedicated database and admin user
   */
  async createAgency(agencyData: AgencyData): Promise<AgencyWithUser> {
    const masterPool = dbConnectionManager.getMasterPool();
    const connection = await masterPool.getConnection();

    try {
      await connection.beginTransaction();

      // Check if agency email already exists
      const [existingAgency]: any = await connection.query(
        'SELECT id FROM agencies WHERE email = ?',
        [agencyData.email]
      );

      if (existingAgency.length > 0) {
        throw new Error('Agency with this email already exists');
      }

      // Check if user email already exists
      const [existingUser]: any = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [agencyData.email]
      );

      if (existingUser.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Insert agency record
      const [agencyResult] = await connection.query(
        `INSERT INTO agencies (
          company_name,
          database_name,
          email,
          phone,
          address,
          gst_number,
          pan_number,
          logo_url,
          subscription_plan,
          business_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          agencyData.companyName,
          'temp_placeholder', // Temporary, will be updated after creation
          agencyData.email,
          agencyData.phone || null,
          agencyData.address || null,
          agencyData.gstNumber || null,
          agencyData.panNumber || null,
          agencyData.logoUrl || null,
          agencyData.subscriptionPlan || 'basic',
          agencyData.businessType || null
        ]
      );

      const agencyId = agencyResult.insertId;

      // Create agency database with all tables
      const databaseName = await dbConnectionManager.createAgencyDatabase(
        agencyId,
        agencyData.companyName
      );

      // Update agency record with actual database name
      await connection.query(
        'UPDATE agencies SET database_name = ? WHERE id = ?',
        [databaseName, agencyId]
      );

      // Hash password
      const hashedPassword = await bcrypt.hash(agencyData.password, 10);

      // Create admin user for this agency
      const [userResult] = await connection.query(
        `INSERT INTO users (
          email,
          name,
          password,
          password_hash,
          roleId,
          role,
          agency_id,
          agecny_id,
          is_active,
          createdBy,
          createdDtm
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          agencyData.email,
          agencyData.userName || agencyData.companyName,
          hashedPassword,
          hashedPassword,
          2, // roleId 2 = agency admin
          'agency',
          agencyId,
          agencyId,
          1,
          1 // Created by system/first admin
        ]
      );

      const userId = userResult.insertId;

      await connection.commit();

      console.log(`âœ“ Agency created successfully: ${agencyData.companyName}`);
      console.log(`  - Agency ID: ${agencyId}`);
      console.log(`  - Database: ${databaseName}`);
      console.log(`  - Admin User ID: ${userId}`);
      console.log(`  - Admin Email: ${agencyData.email}`);

      // Fetch and return the created agency with user info
      const agency = await this.getAgencyById(agencyId);
      if (!agency) {
        throw new Error('Failed to retrieve created agency');
      }

      return {
        ...agency,
        user_id: userId,
        user_email: agencyData.email,
        user_name: agencyData.userName || agencyData.companyName
      };
    } catch (error) {
      await connection.rollback();
      console.error('Error creating agency:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get agency by ID
   */
  async getAgencyById(agencyId: number): Promise<Agency | null> {
    const masterPool = dbConnectionManager.getMasterPool();
    const [rows] = await masterPool.query(
      'SELECT * FROM agencies WHERE id = ?',
      [agencyId]
    );

    return (rows as any[]).length > 0 ? (rows as any[])[0] as Agency : null;
  }

  /**
   * Get agency by database name
   */
  async getAgencyByDatabaseName(databaseName: string): Promise<Agency | null> {
    const masterPool = dbConnectionManager.getMasterPool();
    const [rows] = await masterPool.query(
      'SELECT * FROM agencies WHERE database_name = ?',
      [databaseName]
    );

    return (rows as any[]).length > 0 ? (rows as any[])[0] as Agency : null;
  }

  /**
   * Get agency by email
   */
  async getAgencyByEmail(email: string): Promise<Agency | null> {
    const masterPool = dbConnectionManager.getMasterPool();
    const [rows] = await masterPool.query(
      'SELECT * FROM agencies WHERE email = ?',
      [email]
    );

    return (rows as any[]).length > 0 ? (rows as any[])[0] as Agency : null;
  }

  /**
   * Get all agencies
   */
  async getAllAgencies(): Promise<Agency[]> {
    const masterPool = dbConnectionManager.getMasterPool();
    const [rows] = await masterPool.query(
      'SELECT * FROM agencies ORDER BY created_date DESC'
    );

    return rows as Agency[];
  }

  /**
   * Update agency details
   */
  async updateAgency(agencyId: number, updates: Partial<AgencyData>): Promise<Agency> {
    const masterPool = dbConnectionManager.getMasterPool();
    const connection = await masterPool.getConnection();

    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.companyName !== undefined) {
        updateFields.push('company_name = ?');
        updateValues.push(updates.companyName);
      }
      if (updates.email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(updates.email);
      }
      if (updates.phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(updates.phone);
      }
      if (updates.faxNumber !== undefined) {
        updateFields.push('fax_number = ?');
        updateValues.push(updates.faxNumber);
      }
      if (updates.address !== undefined) {
        updateFields.push('address = ?');
        updateValues.push(updates.address);
      }
      if (updates.city !== undefined) {
        updateFields.push('city = ?');
        updateValues.push(updates.city);
      }
      if (updates.state !== undefined) {
        updateFields.push('state = ?');
        updateValues.push(updates.state);
      }
      if (updates.zipCode !== undefined) {
        updateFields.push('zip_code = ?');
        updateValues.push(updates.zipCode);
      }
      if (updates.gstNumber !== undefined) {
        updateFields.push('gst_number = ?');
        updateValues.push(updates.gstNumber);
      }
      if (updates.panNumber !== undefined) {
        updateFields.push('pan_number = ?');
        updateValues.push(updates.panNumber);
      }
      if (updates.vatNumber !== undefined) {
        updateFields.push('vat_number = ?');
        updateValues.push(updates.vatNumber);
      }
      if (updates.cstNumber !== undefined) {
        updateFields.push('cst_number = ?');
        updateValues.push(updates.cstNumber);
      }
      if (updates.serviceTaxNumber !== undefined) {
        updateFields.push('service_tax_number = ?');
        updateValues.push(updates.serviceTaxNumber);
      }
      if (updates.logoUrl !== undefined) {
        updateFields.push('logo_url = ?');
        updateValues.push(updates.logoUrl);
      }
      if (updates.subscriptionPlan !== undefined) {
        updateFields.push('subscription_plan = ?');
        updateValues.push(updates.subscriptionPlan);
      }
      if (updates.businessType !== undefined) {
        updateFields.push('business_type = ?');
        updateValues.push(updates.businessType);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateValues.push(agencyId);

      await connection.query(
        `UPDATE agencies SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      const agency = await this.getAgencyById(agencyId);
      if (!agency) {
        throw new Error('Agency not found after update');
      }

      return agency;
    } finally {
      connection.release();
    }
  }

  /**
   * Update agency status
   */
  async updateAgencyStatus(agencyId: number, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    const masterPool = dbConnectionManager.getMasterPool();
    await masterPool.query(
      'UPDATE agencies SET status = ? WHERE id = ?',
      [status, agencyId]
    );

    console.log(`âœ“ Agency ${agencyId} status updated to: ${status}`);
  }

  /**
   * Delete agency (soft delete by setting status to inactive)
   */
  async deleteAgency(agencyId: number): Promise<void> {
    await this.updateAgencyStatus(agencyId, 'inactive');
    console.log(`âœ“ Agency ${agencyId} deleted (marked as inactive)`);
  }

  /**
   * Get agency connection pool
   */
  async getAgencyConnection(agencyId: number) {
    const agency = await this.getAgencyById(agencyId);
    if (!agency) {
      throw new Error(`Agency with ID ${agencyId} not found`);
    }

    if (agency.status !== 'active') {
      throw new Error(`Agency is ${agency.status}. Access denied.`);
    }

    return await dbConnectionManager.getAgencyPool(agency.database_name);
  }

  /**
   * Ensure the settings table exists in the agency database
   */
  private async ensureSettingsTable(pool: any): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type VARCHAR(50) DEFAULT 'string',
        description TEXT,
        updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Get agency settings from its dedicated database
   */
  async getAgencySettings(agencyId: number): Promise<Record<string, any>> {
    const pool = await this.getAgencyConnection(agencyId);
    await this.ensureSettingsTable(pool);
    const [rows]: any = await pool.query('SELECT setting_key, setting_value FROM settings');

    const settings: Record<string, any> = {};
    rows.forEach((row: any) => {
      settings[row.setting_key] = row.setting_value;
    });

    return settings;
  }

  /**
   * Update agency settings in its dedicated database
   */
  async updateAgencySettings(agencyId: number, settings: Record<string, any>): Promise<void> {
    const pool = await this.getAgencyConnection(agencyId);
    await this.ensureSettingsTable(pool);

    for (const [key, value] of Object.entries(settings)) {
      // setting_value can be string or other types, but in DB it's TEXT
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      await pool.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value',
        [key, valueStr]
      );
    }
  }

  /**
   * Initialize agencies table in master database
   */
  async initializeAgenciesTable(): Promise<void> {
    const masterPool = dbConnectionManager.getMasterPool();
    const connection = await masterPool.getConnection();

    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS agencies (
          id SERIAL PRIMARY KEY,
          company_name VARCHAR(255) NOT NULL,
          database_name VARCHAR(100) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          address TEXT,
          gst_number VARCHAR(50),
          pan_number VARCHAR(50),
          logo_url VARCHAR(500),
          status VARCHAR(20) DEFAULT 'active',
          subscription_plan VARCHAR(50) DEFAULT 'basic',
          business_type VARCHAR(100),
          subscription_expires_at TIMESTAMP NULL,
          created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('âœ“ Agencies table initialized in master database');
    } catch (error) {
      console.error('Error initializing agencies table:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const agencyService = new AgencyService();
export default agencyService;

