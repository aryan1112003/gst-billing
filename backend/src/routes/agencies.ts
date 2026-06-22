import { Router, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { agencyService } from '../services/agencyService';
import { cloudinaryUpload, uploadToCloudinary, deleteFromCloudinary, extractPublicId, FOLDERS } from '../services/cloudinaryService';
import dbConnectionManager from '../services/databaseConnectionManager';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Routes
// Upload logo — Cloudinary
router.post('/:id/logo', cloudinaryUpload.single('logo'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const agencyId = parseInt(req.params.id);
  if (isNaN(agencyId)) throw createError('Invalid agency ID', 400);
  if (!req.file) throw createError('No file uploaded', 400);

  // Permission: admin can upload for any agency; agency user only for their own
  if (req.user!.role !== 'admin' && req.user!.agencyId !== agencyId) {
    throw createError('You do not have permission to upload logo for this agency', 403);
  }

  // Delete old logo from Cloudinary if it exists
  const existing = await agencyService.getAgencyById(agencyId);
  if (existing?.logo_url) {
    const oldPublicId = extractPublicId(existing.logo_url);
    if (oldPublicId) await deleteFromCloudinary(oldPublicId);
  }

  // Upload new logo to Cloudinary
  const result = await uploadToCloudinary(
    req.file.buffer,
    FOLDERS.logos,
    `agency-${agencyId}-${Date.now()}`
  );

  const logoUrl: string = result.secure_url;

  const agency = await agencyService.updateAgency(agencyId, { logoUrl });

  res.json({
    success: true,
    message: 'Logo uploaded to Cloudinary successfully',
    data: {
      logoUrl,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      agency: {
        id: agency.id,
        companyName: agency.company_name,
        logoUrl: agency.logo_url
      }
    }
  });
}));

/**
 * Create a new agency (System Admin only)
 * POST /api/agencies
 */
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  // Only system admin can create agencies
  if (req.user!.role !== 'admin') {
    throw createError('Only system administrators can create agencies', 403);
  }

  const { companyName, email, password, phone, address, gstNumber, panNumber, logoUrl, subscriptionPlan, userName, businessType } = req.body;

  // Validate required fields
  if (!companyName || !email || !password) {
    throw createError('Company name, email, and password are required', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createError('Invalid email format', 400);
  }

  // Validate password strength
  if (password.length < 6) {
    throw createError('Password must be at least 6 characters long', 400);
  }

  try {
    const agency = await agencyService.createAgency({
      companyName,
      email,
      password,
      phone,
      address,
      gstNumber,
      panNumber,
      logoUrl,
      subscriptionPlan,
      userName,
      businessType
    });

    res.status(201).json({
      success: true,
      message: 'Agency created successfully with dedicated database',
      data: {
        agency: {
          id: agency.id,
          companyName: agency.company_name,
          databaseName: agency.database_name,
          email: agency.email,
          phone: agency.phone,
          address: agency.address,
          gstNumber: agency.gst_number,
          panNumber: agency.pan_number,
          status: agency.status,
          subscriptionPlan: agency.subscription_plan,
          businessType: agency.business_type,
          createdAt: agency.created_at
        },
        user: {
          id: agency.user_id,
          email: agency.user_email,
          name: agency.user_name,
          role: 'agency'
        }
      }
    });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      throw createError(error.message, 409);
    }
    throw error;
  }
}));

/**
 * Get all agencies (System Admin only)
 * GET /api/agencies
 */
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  // Only system admin can view all agencies
  if (req.user!.role !== 'admin') {
    throw createError('Only system administrators can view all agencies', 403);
  }

  const agencies = await agencyService.getAllAgencies();

  res.json({
    success: true,
    data: {
      agencies: agencies.map(agency => ({
        id: agency.id,
        companyName: agency.company_name,
        databaseName: agency.database_name,
        email: agency.email,
        phone: agency.phone,
        status: agency.status,
        subscriptionPlan: agency.subscription_plan,
        createdAt: agency.created_at
      })),
      total: agencies.length
    }
  });
}));

/**
 * Get agency by ID (System Admin or Agency Owner)
 * GET /api/agencies/:id
 */
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const agencyId = parseInt(req.params.id);

  if (isNaN(agencyId)) {
    throw createError('Invalid agency ID', 400);
  }

  // Check permissions
  if (req.user!.role !== 'admin' && req.user!.agencyId !== agencyId) {
    throw createError('You do not have permission to view this agency', 403);
  }

  const agency = await agencyService.getAgencyById(agencyId);

  if (!agency) {
    throw createError('Agency not found', 404);
  }

  res.json({
    success: true,
    data: {
      agency: {
        id: agency.id,
        companyName: agency.company_name,
        databaseName: agency.database_name,
        email: agency.email,
        phone: agency.phone,
        address: agency.address,
        gstNumber: agency.gst_number,
        panNumber: agency.pan_number,
        logoUrl: agency.logo_url,
        businessType: agency.business_type,
        status: agency.status,
        subscriptionPlan: agency.subscription_plan,
        subscriptionExpiresAt: agency.subscription_expires_at,
        createdAt: agency.created_at,
        updatedAt: agency.updated_at
      }
    }
  });
}));

/**
 * Update agency (System Admin or Agency Owner)
 * PUT /api/agencies/:id
 */
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const agencyId = parseInt(req.params.id);

  if (isNaN(agencyId)) {
    throw createError('Invalid agency ID', 400);
  }

  // Check permissions
  if (req.user!.role !== 'admin' && req.user!.agencyId !== agencyId) {
    throw createError('You do not have permission to update this agency', 403);
  }

  const {
    companyName, email, phone, faxNumber, address, city, state, zipCode,
    gstNumber, panNumber, vatNumber, cstNumber, serviceTaxNumber,
    logoUrl, subscriptionPlan, businessType
  } = req.body;

  const updates: any = {};
  if (companyName !== undefined) updates.companyName = companyName;
  if (email !== undefined) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  if (faxNumber !== undefined) updates.faxNumber = faxNumber;
  if (address !== undefined) updates.address = address;
  if (city !== undefined) updates.city = city;
  if (state !== undefined) updates.state = state;
  if (zipCode !== undefined) updates.zipCode = zipCode;
  if (gstNumber !== undefined) updates.gstNumber = gstNumber;
  if (panNumber !== undefined) updates.panNumber = panNumber;
  if (vatNumber !== undefined) updates.vatNumber = vatNumber;
  if (cstNumber !== undefined) updates.cstNumber = cstNumber;
  if (serviceTaxNumber !== undefined) updates.serviceTaxNumber = serviceTaxNumber;
  if (logoUrl !== undefined) updates.logoUrl = logoUrl;
  if (businessType !== undefined) updates.businessType = businessType;

  // Only admin can update subscription plan
  if (subscriptionPlan !== undefined && req.user!.role === 'admin') {
    updates.subscriptionPlan = subscriptionPlan;
  }

  const agency = await agencyService.updateAgency(agencyId, updates);

  res.json({
    success: true,
    message: 'Agency updated successfully',
    data: {
      agency: {
        id: agency.id,
        companyName: agency.company_name,
        email: agency.email,
        phone: agency.phone,
        faxNumber: agency.fax_number,
        address: agency.address,
        city: agency.city,
        state: agency.state,
        zipCode: agency.zip_code,
        gstNumber: agency.gst_number,
        panNumber: agency.pan_number,
        vatNumber: agency.vat_number,
        cstNumber: agency.cst_number,
        serviceTaxNumber: agency.service_tax_number,
        logoUrl: agency.logo_url,
        businessType: agency.business_type,
        status: agency.status,
        subscriptionPlan: agency.subscription_plan,
        updatedAt: agency.updated_at
      }
    }
  });
}));

/**
 * Update agency status (System Admin only)
 * PATCH /api/agencies/:id/status
 */
router.patch('/:id/status', asyncHandler(async (req: AuthRequest, res: Response) => {
  // Only system admin can change status
  if (req.user!.role !== 'admin') {
    throw createError('Only system administrators can change agency status', 403);
  }

  const agencyId = parseInt(req.params.id);
  const { status } = req.body;

  if (isNaN(agencyId)) {
    throw createError('Invalid agency ID', 400);
  }

  if (!['active', 'inactive', 'suspended'].includes(status)) {
    throw createError('Invalid status. Must be active, inactive, or suspended', 400);
  }

  await agencyService.updateAgencyStatus(agencyId, status);

  res.json({
    success: true,
    message: `Agency status updated to ${status}`
  });
}));


/**
 * Delete agency (System Admin only)
 * DELETE /api/agencies/:id
 */
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  // Only system admin can delete agencies
  if (req.user!.role !== 'admin') {
    throw createError('Only system administrators can delete agencies', 403);
  }

  const agencyId = parseInt(req.params.id);

  if (isNaN(agencyId)) {
    throw createError('Invalid agency ID', 400);
  }

  await agencyService.deleteAgency(agencyId);

  res.json({
    success: true,
    message: 'Agency deleted successfully (marked as inactive)'
  });
}));

/**
 * Get agency settings (System Admin or Agency Owner)
 * GET /api/agencies/:id/settings
 */
router.get('/:id/settings', asyncHandler(async (req: AuthRequest, res: Response) => {
  const agencyId = parseInt(req.params.id);

  if (isNaN(agencyId)) {
    throw createError('Invalid agency ID', 400);
  }

  // Check permissions
  if (req.user!.role !== 'admin' && req.user!.agencyId !== agencyId) {
    throw createError('You do not have permission to view these settings', 403);
  }

  const settings = await agencyService.getAgencySettings(agencyId);

  res.json({
    success: true,
    data: settings
  });
}));

/**
 * Update agency settings (System Admin or Agency Owner)
 * PUT /api/agencies/:id/settings
 */
router.put('/:id/settings', asyncHandler(async (req: AuthRequest, res: Response) => {
  const agencyId = parseInt(req.params.id);

  if (isNaN(agencyId)) {
    throw createError('Invalid agency ID', 400);
  }

  // Check permissions
  if (req.user!.role !== 'admin' && req.user!.agencyId !== agencyId) {
    throw createError('You do not have permission to update these settings', 403);
  }

  // The body should be an object of key-value pairs
  await agencyService.updateAgencySettings(agencyId, req.body);

  res.json({
    success: true,
    message: 'Settings updated successfully'
  });
}));

/**
 * Default business types used as fallback
 */
const DEFAULT_BUSINESS_TYPES = [
  'Manufacturer',
  'Service Provider',
  'Machinery Solutions',
  'Manufacturing Services',
  'Manufacturing Tools & Company Service',
  'Auto Spare Parts',
  'Job Work-Manufacturer',
];

/**
 * Get business types list (public — no auth required)
 * GET /api/agencies/config/business-types
 */
router.get('/config/business-types', asyncHandler(async (req: AuthRequest, res: Response) => {
  const masterPool = dbConnectionManager.getMasterPool();

  // Ensure config table exists
  await masterPool.query(`
    CREATE TABLE IF NOT EXISTS platform_config (
      config_key VARCHAR(100) PRIMARY KEY,
      config_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [rows]: any = await masterPool.query(
    'SELECT config_value FROM platform_config WHERE config_key = ?',
    ['business_types']
  );

  let businessTypes = DEFAULT_BUSINESS_TYPES;
  if (rows.length > 0 && rows[0].config_value) {
    try {
      businessTypes = JSON.parse(rows[0].config_value);
    } catch {
      businessTypes = DEFAULT_BUSINESS_TYPES;
    }
  }

  res.json({ success: true, data: businessTypes });
}));

/**
 * Update business types list (System Admin only)
 * PUT /api/agencies/config/business-types
 */
router.put('/config/business-types', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    throw createError('Only system administrators can update business types', 403);
  }

  const { businessTypes } = req.body;
  if (!Array.isArray(businessTypes) || businessTypes.length === 0) {
    throw createError('businessTypes must be a non-empty array', 400);
  }

  const masterPool = dbConnectionManager.getMasterPool();

  await masterPool.query(`
    CREATE TABLE IF NOT EXISTS platform_config (
      config_key VARCHAR(100) PRIMARY KEY,
      config_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await masterPool.query(
    'INSERT INTO platform_config (config_key, config_value) VALUES (?, ?) ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = NOW()',
    ['business_types', JSON.stringify(businessTypes)]
  );

  res.json({ success: true, message: 'Business types updated successfully', data: businessTypes });
}));

export default router;
