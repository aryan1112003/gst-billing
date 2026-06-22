/**
 * Seed script — adds sample data for meenakshi.vats88@gmail.com (agency_id=1, user_id=35)
 * Run: node scripts/seed-meenakshi.js
 */
const mysql = require('mysql2/promise');
const path  = require('path');
const fs    = require('fs');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...rest] = line.trim().split('=');
    if (key && !key.startsWith('#') && rest.length)
      process.env[key] = rest.join('=').replace(/^["']|["']$/g, '');
  });
}

const dbCfg = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'mawebtec_lms',
};

async function run() {
  const conn = await mysql.createConnection(dbCfg);
  const AGENCY = 1, USER = 35;
  const log = [];

  // ── CUSTOMERS ────────────────────────────────────────────────────────
  console.log('Seeding customers...');
  const customerRows = [
    ['Rajesh','Kumar','Tech Solutions Pvt Ltd','Tech Solutions Pvt Ltd','rajesh.kumar@techsol.in','9876543210','9876543210','22AABCT3518Q1ZX','AABCT3518Q','12 MG Road','Bengaluru','Karnataka','560001'],
    ['Priya','Sharma','Innovate Consulting','Innovate Consulting','priya.sharma@innovate.co','9988776655','9988776655','27AABCI4781R1Z9','AABCI4781R','45 Nariman Point','Mumbai','Maharashtra','400021'],
    ['Amit','Patel','Global Exports Ltd','Global Exports Ltd','amit.patel@globalexports.in','9123456789','9123456789','24AADCG1234P1ZA','AADCG1234P','78 Ring Road','Ahmedabad','Gujarat','380001'],
    ['Sunita','Rao','Medicare Pharma','Medicare Pharma','sunita.rao@medicarepharma.in','8765432109','8765432109','36AABCM5678Q1ZB','AABCM5678Q','23 Jubilee Hills','Hyderabad','Telangana','500033'],
    ['Vikram','Singh','BuildTech Construction','BuildTech Construction','vikram.singh@buildtech.in','7654321098','7654321098','07AABCB9012R1ZC','AABCB9012R','14 Connaught Place','New Delhi','Delhi','110001'],
  ];
  const custIds = [];
  for (const c of customerRows) {
    const [r] = await conn.query(
      `INSERT INTO customers (agency_id,customertype_id,salutation_id,fname,lname,company_name,cdisplay_name,
        customer_email,cwork_phone,cmobile_phone,gstin_number,pan_number,
        address,city,state,zip_code,is_active,created_by,created_date,updated_by,updated_date)
       VALUES (?,1,1,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,NOW(),?,NOW())`,
      [AGENCY, c[0],c[1],c[2],c[3],c[4],c[5],c[6],c[7],c[8],c[9],c[10],c[11],c[12],c[13],USER,USER]
    );
    custIds.push(r.insertId);
  }
  log.push(`Customers: ${custIds}`);

  // ── VENDORS ──────────────────────────────────────────────────────────
  console.log('Seeding vendors...');
  const vendorRows = [
    ['Tata Steel Ltd','procurement@tatasteel.com','022-66658888','022-66658888','Tata Steel Ltd','Jamshedpur Road','Mumbai','Maharashtra','400001','27AABCT3518Q1ZV','AABCT3518Q'],
    ['Infosys BPO','billing@infosys.com','080-28520261','080-28520261','Infosys BPO Ltd','Electronic City','Bengaluru','Karnataka','560100','29AABCI4781R1ZW','AABCI4781R'],
    ['Amazon Sellers','seller@amazon.in','1800-419-7355','1800-419-7355','Amazon India','Brigade Road','Bengaluru','Karnataka','560025','29AABCA1234P1ZX','AABCA1234P'],
    ['QuickSupplies India','hello@quicksupplies.in','9900112233','9900112233','QuickSupplies India','MG Road','Pune','Maharashtra','411001','27AADCQ5678R1ZY','AADCQ5678R'],
  ];
  const vendIds = [];
  for (const v of vendorRows) {
    const [r] = await conn.query(
      `INSERT INTO vendors (agency_id,vendor_name,vendor_email,vendor_phone,vendor_mobile,company_name,
        address,city,state,zip_code,gstin_number,pan_number,is_active,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,NOW(),?,NOW())`,
      [AGENCY,v[0],v[1],v[2],v[3],v[4],v[5],v[6],v[7],v[8],v[9],v[10],USER,USER]
    );
    vendIds.push(r.insertId);
  }
  log.push(`Vendors: ${vendIds}`);

  // ── ITEMS ─────────────────────────────────────────────────────────────
  console.log('Seeding items...');
  const itemRows = [
    ['ITM-001','Web Development Service','service','hrs','998314',null,18,5000,0,100,0,'Custom web application development'],
    ['ITM-002','SEO Monthly Package','service','month','998372',null,18,8000,0,50,0,'Search engine optimization monthly retainer'],
    ['ITM-003','Office Chair','goods','pcs','94011',null,12,4500,3200,30,5,'Ergonomic office chair'],
    ['ITM-004','Laptop Dell Inspiron','goods','pcs','84713',null,18,65000,52000,10,2,'Dell Inspiron 15 laptop'],
    ['ITM-005','A4 Paper Ream','goods','ream','48025',null,5,350,240,200,20,'A4 size 80 GSM paper 500 sheets'],
    ['ITM-006','Logo Design','service','hrs','998399',null,18,2500,0,0,0,'Corporate logo design service'],
    ['ITM-007','Domain Registration','service','yr','998315',null,18,999,0,0,0,'Annual domain registration'],
    ['ITM-008','Web Hosting Annual','service','yr','998315',null,18,3500,0,0,0,'Annual shared hosting plan'],
  ];
  const itemIds = [];
  for (const i of itemRows) {
    const [r] = await conn.query(
      `INSERT INTO items (agency_id,item_code,item_name,item_type,unit,hsn_code,sac_code,tax_rate,
        selling_price,purchase_price,opening_stock,reorder_point,description,is_active,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,NOW(),?,NOW())`,
      [AGENCY,i[0],i[1],i[2],i[3],i[4],i[5],i[6],i[7],i[8],i[9],i[10],i[11],USER,USER]
    );
    itemIds.push(r.insertId);
  }
  log.push(`Items: ${itemIds}`);

  // ── INVOICES + INVOICE_ITEMS ──────────────────────────────────────────
  console.log('Seeding invoices...');
  const invoiceData = [
    { num:'INV-0001', cid:custIds[0], date:'2026-04-01', due:'2026-04-15', sub:10000,  disc:0,   tax:1800,  total:11800, paid:11800, bal:0,     status:'paid',    type:'invoice',   notes:'Q1 web dev sprint',
      items:[{iid:itemIds[0],nm:'Web Development Service',qty:2,unit:'hrs',rate:5000,dp:0,tr:18,amt:11800}] },
    { num:'INV-0002', cid:custIds[1], date:'2026-04-10', due:'2026-04-25', sub:8000,   disc:0,   tax:1440,  total:9440,  paid:9440,  bal:0,     status:'paid',    type:'invoice',   notes:'April SEO package',
      items:[{iid:itemIds[1],nm:'SEO Monthly Package',qty:1,unit:'month',rate:8000,dp:0,tr:18,amt:9440}] },
    { num:'INV-0003', cid:custIds[2], date:'2026-04-15', due:'2026-04-30', sub:69500,  disc:500, tax:11880, total:80880, paid:0,     bal:80880, status:'sent',    type:'invoice',   notes:'Hardware procurement',
      items:[
        {iid:itemIds[3],nm:'Laptop Dell Inspiron',qty:1,unit:'pcs',rate:65000,dp:0,tr:18,amt:76700},
        {iid:itemIds[2],nm:'Office Chair',qty:1,unit:'pcs',rate:4500,dp:0,tr:12,amt:5040},
      ]},
    { num:'INV-0004', cid:custIds[0], date:'2026-05-01', due:'2026-05-15', sub:5000,   disc:0,   tax:900,   total:5900,  paid:5900,  bal:0,     status:'paid',    type:'invoice',   notes:'Logo design project',
      items:[{iid:itemIds[5],nm:'Logo Design',qty:2,unit:'hrs',rate:2500,dp:0,tr:18,amt:5900}] },
    { num:'INV-0005', cid:custIds[4], date:'2026-05-05', due:'2026-05-20', sub:16000,  disc:0,   tax:2880,  total:18880, paid:0,     bal:18880, status:'draft',   type:'invoice',   notes:'May development batch',
      items:[
        {iid:itemIds[0],nm:'Web Development Service',qty:2,unit:'hrs',rate:5000,dp:0,tr:18,amt:11800},
        {iid:itemIds[1],nm:'SEO Monthly Package',qty:1,unit:'month',rate:8000,dp:0,tr:18,amt:9440},
      ]},
    { num:'QUO-0001', cid:custIds[3], date:'2026-04-20', due:'2026-05-20', sub:12499,  disc:0,   tax:2250,  total:14749, paid:0,     bal:14749, status:'draft',   type:'quotation', notes:'Annual digital services quote',
      items:[
        {iid:itemIds[6],nm:'Domain Registration',qty:1,unit:'yr',rate:999,dp:0,tr:18,amt:1179},
        {iid:itemIds[7],nm:'Web Hosting Annual',qty:1,unit:'yr',rate:3500,dp:0,tr:18,amt:4130},
        {iid:itemIds[1],nm:'SEO Monthly Package',qty:1,unit:'month',rate:8000,dp:0,tr:18,amt:9440},
      ]},
    { num:'DC-0001',  cid:custIds[2], date:'2026-04-28', due:'2026-05-05', sub:4500,   disc:0,   tax:540,   total:5040,  paid:5040,  bal:0,     status:'paid',    type:'challan',   notes:'Dispatch challan for office chairs',
      items:[{iid:itemIds[2],nm:'Office Chair',qty:1,unit:'pcs',rate:4500,dp:0,tr:12,amt:5040}] },
  ];
  const invIds = [];
  for (const inv of invoiceData) {
    const [r] = await conn.query(
      `INSERT INTO invoices (agency_id,invoice_number,customer_id,invoice_date,due_date,
        subtotal,discount_amount,tax_amount,total_amount,paid_amount,balance_amount,
        type,status,customer_notes,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,NOW())`,
      [AGENCY,inv.num,inv.cid,inv.date,inv.due,
       inv.sub,inv.disc,inv.tax,inv.total,inv.paid,inv.bal,
       inv.type,inv.status,inv.notes,USER,USER]
    );
    const invId = r.insertId;
    invIds.push(invId);
    for (const it of inv.items) {
      await conn.query(
        `INSERT INTO invoice_items (invoice_id,item_id,item_name,quantity,unit,rate,discount_percent,tax_rate,amount)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [invId,it.iid,it.nm,it.qty,it.unit,it.rate,it.dp,it.tr,it.amt]
      );
    }
  }
  log.push(`Invoices: ${invIds}`);

  // ── PURCHASES + PURCHASE_ITEMS ────────────────────────────────────────
  console.log('Seeding purchases...');
  const purchaseData = [
    { num:'PUR-0001', vid:vendIds[0], date:'2026-04-05', due:'2026-04-20', sub:96000,  disc:0, tax:11520, total:107520, paid:107520, bal:0,      status:'received',
      items:[{iid:itemIds[3],nm:'Laptop Dell Inspiron',qty:2,unit:'pcs',rate:48000,dp:0,tr:12,amt:107520}] },
    { num:'PUR-0002', vid:vendIds[3], date:'2026-04-12', due:'2026-04-27', sub:4800,   disc:0, tax:240,   total:5040,   paid:0,      bal:5040,   status:'draft',
      items:[{iid:itemIds[4],nm:'A4 Paper Ream',qty:20,unit:'ream',rate:240,dp:0,tr:5,amt:5040}] },
    { num:'PUR-0003', vid:vendIds[2], date:'2026-05-03', due:'2026-05-18', sub:9600,   disc:0, tax:1152,  total:10752,  paid:10752,  bal:0,      status:'received',
      items:[{iid:itemIds[2],nm:'Office Chair',qty:3,unit:'pcs',rate:3200,dp:0,tr:12,amt:10752}] },
    { num:'PUR-0004', vid:vendIds[1], date:'2026-05-06', due:'2026-05-21', sub:15000,  disc:0, tax:2700,  total:17700,  paid:0,      bal:17700,  status:'sent',
      items:[{iid:itemIds[0],nm:'Web Development Service',qty:3,unit:'hrs',rate:5000,dp:0,tr:18,amt:17700}] },
  ];
  const purIds = [];
  for (const p of purchaseData) {
    const [r] = await conn.query(
      `INSERT INTO purchase (agency_id,purchase_number,vendor_id,purchase_date,due_date,
        subtotal,discount_amount,tax_amount,total_amount,paid_amount,balance_amount,
        status,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,NOW())`,
      [AGENCY,p.num,p.vid,p.date,p.due,p.sub,p.disc,p.tax,p.total,p.paid,p.bal,p.status,USER,USER]
    );
    const purId = r.insertId;
    purIds.push(purId);
    for (const it of p.items) {
      await conn.query(
        `INSERT INTO purchase_items (purchase_id,item_id,item_name,quantity,unit,rate,discount_percent,tax_rate,amount)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [purId,it.iid,it.nm,it.qty,it.unit,it.rate,it.dp,it.tr,it.amt]
      );
    }
  }
  log.push(`Purchases: ${purIds}`);

  // ── PAYMENTS RECEIVED ─────────────────────────────────────────────────
  console.log('Seeding payments...');
  const paymentRows = [
    ['PAY-0001',custIds[0],'2026-04-16','upi',11800,'','INV-0001 full payment'],
    ['PAY-0002',custIds[1],'2026-04-26','cheque',9440,'CHQ00123','INV-0002 April SEO'],
    ['PAY-0003',custIds[0],'2026-05-02','bank_transfer',5900,'TXN20260502001','INV-0004 logo design'],
    ['PAY-0004',custIds[2],'2026-04-28','upi',5040,'UPI2604001','DC-0001 delivery challan'],
  ];
  const payIds = [];
  for (const p of paymentRows) {
    const [r] = await conn.query(
      `INSERT INTO payments_received (agency_id,payment_number,customer_id,payment_date,payment_mode,
        amount,reference_number,notes,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,NOW(),?,NOW())`,
      [AGENCY,p[0],p[1],p[2],p[3],p[4],p[5],p[6],USER,USER]
    );
    payIds.push(r.insertId);
  }
  log.push(`Payments: ${payIds}`);

  // ── EXPENSES ──────────────────────────────────────────────────────────
  console.log('Seeding expenses...');
  const expenseRows = [
    ['EXP-0001','2026-04-03','Office Supplies',vendIds[3],350,17.5,367.5,'cash','Pens, notepads and markers'],
    ['EXP-0002','2026-04-08','Travel',null,2500,0,2500,'cash','Client visit to Bengaluru — auto + taxi'],
    ['EXP-0003','2026-04-15','Software Subscription',null,1499,269.82,1768.82,'card','Adobe Creative Cloud monthly'],
    ['EXP-0004','2026-04-30','Electricity Bill',null,3200,0,3200,'bank_transfer','Office electricity April 2026'],
    ['EXP-0005','2026-05-05','Internet & Phone',null,1200,0,1200,'bank_transfer','Broadband + mobile bill May'],
    ['EXP-0006','2026-05-07','Canteen / Meals',null,800,0,800,'cash','Team lunch — project completion'],
    ['EXP-0007','2026-04-20','Marketing',null,5000,900,5900,'card','Google Ads campaign — April'],
  ];
  const expIds = [];
  for (const e of expenseRows) {
    const [r] = await conn.query(
      `INSERT INTO expenses (agency_id,expense_number,expense_date,category,vendor_id,
        amount,tax_amount,total_amount,payment_mode,description,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),?,NOW())`,
      [AGENCY,e[0],e[1],e[2],e[3],e[4],e[5],e[6],e[7],e[8],USER,USER]
    );
    expIds.push(r.insertId);
  }
  log.push(`Expenses: ${expIds}`);

  // ── GATE PASSES ───────────────────────────────────────────────────────
  console.log('Seeding gate passes...');
  const gatePassRows = [
    ['GP-0001','inward','Tata Steel Ltd','MH-12-AB-1234','Ramesh Yadav','9876501234','Raw material delivery','Steel pipes and fittings — 50 kg',50,'kg','Verified by security','completed'],
    ['GP-0002','outward','Tech Solutions Pvt Ltd','KA-01-CD-5678','Suresh Kumar','8765012345','Dispatch of goods','Packaged product boxes — 20 units',20,'pcs','Delivery challan DC-0001 attached','approved'],
    ['GP-0003','inward','QuickSupplies India','DL-05-EF-9012','Mohan Lal','7654012345','Stationery purchase','A4 paper reams and pens — 10 boxes',10,'box','Purchase order ref: PUR-0002','pending'],
    ['GP-0004','outward','Global Exports Ltd','MH-12-AB-1234','Ramesh Yadav','9876501234','Export shipment','Laptop units for export',5,'pcs','Customs clearance ref SHIP-0002','approved'],
  ];
  const gpIds = [];
  for (const g of gatePassRows) {
    const [r] = await conn.query(
      `INSERT INTO gate_passes (gate_pass_number,type,party_name,vehicle_number,driver_name,driver_phone,
        purpose,items_description,quantity,unit,remarks,status,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,NOW())`,
      [g[0],g[1],g[2],g[3],g[4],g[5],g[6],g[7],g[8],g[9],g[10],g[11],USER,USER]
    );
    gpIds.push(r.insertId);
  }
  log.push(`GatePasses: ${gpIds}`);

  // ── PURCHASE ORDERS ───────────────────────────────────────────────────
  console.log('Seeding purchase orders...');
  const poRows = [
    ['PO-0001',vendIds[0],'Tata Steel Ltd','2026-04-20','2026-05-05','sent',45000,5400,50400,'Quarterly steel procurement — Q2'],
    ['PO-0002',vendIds[3],'QuickSupplies India','2026-05-01','2026-05-10','received',12000,600,12600,'Monthly office supplies restock'],
    ['PO-0003',vendIds[2],'Amazon India','2026-05-08','2026-05-15','draft',30000,5400,35400,'Computer peripherals — 3 units'],
  ];
  const poIds = [];
  for (const p of poRows) {
    const [r] = await conn.query(
      `INSERT INTO purchase_orders (po_number,vendor_id,vendor_name,order_date,expected_delivery,
        status,subtotal,tax_amount,total_amount,notes,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),?,NOW())`,
      [p[0],p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8],p[9],USER,USER]
    );
    poIds.push(r.insertId);
  }
  log.push(`PurchaseOrders: ${poIds}`);

  // ── PRODUCTION ORDERS ─────────────────────────────────────────────────
  console.log('Seeding production orders...');
  const prodRows = [
    ['PROD-0001','Website Theme Package',itemIds[0],5,'unit','2026-04-25','2026-05-10','in-progress','Custom website theme — 5 client variants'],
    ['PROD-0002','Marketing Kit Bundle',itemIds[5],10,'set','2026-05-01','2026-05-20','planned','Logo + brochure + visiting card for 10 clients'],
    ['PROD-0003','Annual Maintenance Bundle',itemIds[7],20,'unit','2026-05-10','2026-06-10','planned','Pre-packaged hosting + maintenance plans'],
  ];
  const prodIds = [];
  for (const p of prodRows) {
    const [r] = await conn.query(
      `INSERT INTO production_orders (order_number,product_name,item_id,quantity,unit,
        planned_date,completion_date,status,notes,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),?,NOW())`,
      [p[0],p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8],USER,USER]
    );
    prodIds.push(r.insertId);
  }
  log.push(`ProductionOrders: ${prodIds}`);

  // ── BOM ───────────────────────────────────────────────────────────────
  console.log('Seeding BOM...');
  const [bomR] = await conn.query(
    `INSERT INTO bom_headers (bom_number,product_name,item_id,quantity,unit,status,created_by,created_date,updated_by,updated_date)
     VALUES (?,?,?,?,?,?,?,NOW(),?,NOW())`,
    ['BOM-0001','Standard Website Package',itemIds[0],1,'unit','active',USER,USER]
  );
  const bomId1 = bomR.insertId;
  const bom1Components = [
    [bomId1,'Domain Registration',itemIds[6],1,'yr','Included in package'],
    [bomId1,'Web Hosting Annual',itemIds[7],1,'yr','1-year hosting plan'],
    [bomId1,'Web Development Hours',itemIds[0],20,'hrs','Base development effort'],
    [bomId1,'SEO Setup',itemIds[1],1,'month','Initial SEO configuration'],
  ];
  for (const b of bom1Components) {
    await conn.query('INSERT INTO bom_items (bom_id,component_name,item_id,quantity,unit,notes) VALUES (?,?,?,?,?,?)', b);
  }

  const [bomR2] = await conn.query(
    `INSERT INTO bom_headers (bom_number,product_name,item_id,quantity,unit,status,created_by,created_date,updated_by,updated_date)
     VALUES (?,?,?,?,?,?,?,NOW(),?,NOW())`,
    ['BOM-0002','Corporate Branding Kit',itemIds[5],1,'set','active',USER,USER]
  );
  const bomId2 = bomR2.insertId;
  const bom2Components = [
    [bomId2,'Logo Design',itemIds[5],4,'hrs','4 hours logo creation'],
    [bomId2,'Business Card Design',itemIds[5],2,'hrs','Card front & back'],
    [bomId2,'Letterhead Design',itemIds[5],1,'hrs','Corporate letterhead'],
  ];
  for (const b of bom2Components) {
    await conn.query('INSERT INTO bom_items (bom_id,component_name,item_id,quantity,unit,notes) VALUES (?,?,?,?,?,?)', b);
  }
  log.push(`BOM headers: ${bomId1}, ${bomId2}`);

  // ── RECURRING INVOICES ────────────────────────────────────────────────
  console.log('Seeding recurring invoices...');
  const recurringRows = [
    ['REC-0001',custIds[1],'Innovate Consulting','monthly','2026-06-01','2027-05-31',9440,18,'Monthly SEO retainer service','active',null],
    ['REC-0002',custIds[0],'Rajesh Kumar','quarterly','2026-07-01','2027-06-30',35400,18,'Quarterly website maintenance package','active',null],
    ['REC-0003',custIds[4],'Vikram Singh','monthly','2026-06-01',null,11800,18,'Monthly web development retainer','active',null],
  ];
  const recIds = [];
  for (const r of recurringRows) {
    const [res] = await conn.query(
      `INSERT INTO recurring_invoices (recurring_number,customer_id,customer_name,frequency,next_date,end_date,
        amount,tax_rate,description,status,last_generated,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,NOW())`,
      [r[0],r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8],r[9],r[10],USER,USER]
    );
    recIds.push(res.insertId);
  }
  log.push(`RecurringInvoices: ${recIds}`);

  // ── TIME ENTRIES ──────────────────────────────────────────────────────
  console.log('Seeding time entries...');
  const timeRows = [
    ['TE-0001',custIds[0],'Rajesh Kumar','E-Commerce Portal','2026-04-03',6,'Homepage design & development',1,0,5000],
    ['TE-0002',custIds[0],'Rajesh Kumar','E-Commerce Portal','2026-04-05',4,'Backend API integration — products & cart',1,0,5000],
    ['TE-0003',custIds[1],'Priya Sharma','SEO Campaign Q2','2026-04-08',3,'Keyword research & on-page audit',1,1,2500],
    ['TE-0004',custIds[2],'Amit Patel','Mobile App UI','2026-04-10',5,'UI wireframing & Figma prototype',1,0,4000],
    ['TE-0005',custIds[3],'Sunita Rao','Healthcare Portal','2026-05-02',8,'Patient portal development — sprint 1',1,0,5000],
    ['TE-0006',custIds[0],'Rajesh Kumar','E-Commerce Portal','2026-05-05',6,'Payment gateway integration — Razorpay',1,0,5000],
    ['TE-0007',custIds[4],'Vikram Singh','Construction CRM','2026-05-07',4,'CRM requirements gathering & documentation',0,0,3500],
  ];
  const teIds = [];
  for (const t of timeRows) {
    const [r] = await conn.query(
      `INSERT INTO time_entries (entry_number,customer_id,customer_name,project_name,work_date,
        hours,description,billable,billed,hourly_rate,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),?,NOW())`,
      [t[0],t[1],t[2],t[3],t[4],t[5],t[6],t[7],t[8],t[9],USER,USER]
    );
    teIds.push(r.insertId);
  }
  log.push(`TimeEntries: ${teIds}`);

  // ── PROJECTS ──────────────────────────────────────────────────────────
  console.log('Seeding projects...');
  const projectRows = [
    ['PRJ-0001','E-Commerce Portal',custIds[0],'Rajesh Kumar','2026-03-01','2026-06-30',150000,45000,'active','Full-stack e-commerce site with Razorpay payment gateway'],
    ['PRJ-0002','SEO Campaign Q2',custIds[1],'Priya Sharma','2026-04-01','2026-06-30',72000,18880,'active','3-month SEO campaign with fortnightly reporting'],
    ['PRJ-0003','Healthcare Patient Portal',custIds[3],'Sunita Rao','2026-05-01','2026-09-30',250000,0,'planning','Patient management, appointment booking and billing portal'],
    ['PRJ-0004','Mobile App UI Design',custIds[2],'Amit Patel','2026-04-08','2026-05-31',60000,0,'on-hold','Flutter UI design for export management mobile app'],
  ];
  const projIds = [];
  for (const p of projectRows) {
    const [r] = await conn.query(
      `INSERT INTO projects (project_number,project_name,customer_id,customer_name,start_date,end_date,
        budget,billed_amount,status,description,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),?,NOW())`,
      [p[0],p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8],p[9],USER,USER]
    );
    projIds.push(r.insertId);
  }
  log.push(`Projects: ${projIds}`);

  // ── TRIP SHEETS ───────────────────────────────────────────────────────
  console.log('Seeding trip sheets...');
  const tripRows = [
    ['TRIP-0001','MH-12-AB-1234','Ramesh Yadav','9876501234','Mumbai','Pune','2026-04-10 09:00:00','2026-04-10 20:00:00','Client delivery — hardware',148,1200,'completed'],
    ['TRIP-0002','KA-01-CD-5678','Suresh Kumar','8765012345','Bengaluru','Mysuru','2026-04-22 08:00:00','2026-04-22 22:00:00','Site inspection — BuildTech project',170,1500,'completed'],
    ['TRIP-0003','DL-05-EF-9012','Mohan Lal','7654012345','Delhi','Gurgaon','2026-05-03 10:00:00',null,'Client meeting — presentation',32,400,'in-transit'],
    ['TRIP-0004','MH-12-AB-1234','Ramesh Yadav','9876501234','Mumbai','Nashik','2026-05-08 07:30:00',null,'Delivery of packaged goods — Nashik distributor',167,1800,'planned'],
  ];
  const tripIds = [];
  for (const t of tripRows) {
    const [r] = await conn.query(
      `INSERT INTO trip_sheets (trip_number,vehicle_number,driver_name,driver_phone,from_location,to_location,
        departure_date,return_date,purpose,distance_km,fuel_cost,status,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,NOW())`,
      [t[0],t[1],t[2],t[3],t[4],t[5],t[6],t[7],t[8],t[9],t[10],t[11],USER,USER]
    );
    tripIds.push(r.insertId);
  }
  log.push(`TripSheets: ${tripIds}`);

  // ── VEHICLES ──────────────────────────────────────────────────────────
  console.log('Seeding vehicles...');
  const vehicleRows = [
    ['MH-12-AB-1234','Delivery Van','Tata','Ace HT',2022,'White','2022-03-15','2027-03-14','2027-03-14','RC1234MH','active'],
    ['KA-01-CD-5678','SUV','Mahindra','Scorpio N',2021,'Black','2021-07-01','2026-06-30','2026-06-30','RC5678KA','active'],
    ['DL-05-EF-9012','Hatchback','Maruti Suzuki','Swift',2023,'Silver','2023-01-20','2028-01-19','2028-01-19','RC9012DL','active'],
  ];
  const vehIds = [];
  for (const v of vehicleRows) {
    const [r] = await conn.query(
      `INSERT INTO vehicles (vehicle_number,vehicle_type,make,model,year,color,registration_date,
        insurance_expiry,fitness_expiry,rc_number,status,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,NOW())`,
      [v[0],v[1],v[2],v[3],v[4],v[5],v[6],v[7],v[8],v[9],v[10],USER,USER]
    );
    vehIds.push(r.insertId);
  }
  log.push(`Vehicles: ${vehIds}`);

  // ── BATCH TRACKING ────────────────────────────────────────────────────
  console.log('Seeding batches...');
  const batchRows = [
    ['BATCH-A001',itemIds[4],'A4 Paper Ream','2026-01-01','2028-01-01',500,'ream','QuickSupplies India',240,'active'],
    ['BATCH-A002',itemIds[2],'Office Chair','2025-12-01','2035-12-01',30,'pcs','FurniMart India',3200,'active'],
    ['BATCH-A003',itemIds[3],'Laptop Dell Inspiron','2026-03-01','2029-03-01',10,'pcs','Dell India',52000,'active'],
    ['BATCH-A004',itemIds[4],'A4 Paper Ream','2025-06-01','2027-06-01',200,'ream','QuickSupplies India',235,'active'],
  ];
  const batchIds = [];
  for (const b of batchRows) {
    const [r] = await conn.query(
      `INSERT INTO batches (batch_number,item_id,item_name,manufacturing_date,expiry_date,
        quantity,unit,supplier_name,purchase_rate,status,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),?,NOW())`,
      [b[0],b[1],b[2],b[3],b[4],b[5],b[6],b[7],b[8],b[9],USER,USER]
    );
    batchIds.push(r.insertId);
  }
  log.push(`Batches: ${batchIds}`);

  // ── CUSTOMS SHIPMENTS ─────────────────────────────────────────────────
  console.log('Seeding customs shipments...');
  const shipmentRows = [
    ['SHIP-0001','import','Alibaba Suppliers Co Ltd','China','JNPT Mumbai','BL202604001','2026-04-18','2026-04-28',45000,12000,180000,'USD','cleared'],
    ['SHIP-0002','export','UK Digital Agency Ltd','United Kingdom','JNPT Mumbai','BL202605002','2026-05-05',null,0,8500,75000,'GBP','in-transit'],
    ['SHIP-0003','import','Shenzhen Tech Parts','China','Chennai Sea Port','BL202605003','2026-05-10',null,18000,7500,95000,'USD','at-port'],
  ];
  const shipIds = [];
  for (const s of shipmentRows) {
    const [r] = await conn.query(
      `INSERT INTO customs_shipments (shipment_number,type,party_name,country,port,bill_of_lading,
        shipment_date,clearance_date,duty_amount,freight_amount,total_value,currency,status,
        created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,NOW())`,
      [s[0],s[1],s[2],s[3],s[4],s[5],s[6],s[7],s[8],s[9],s[10],s[11],s[12],USER,USER]
    );
    shipIds.push(r.insertId);
  }
  log.push(`CustomsShipments: ${shipIds}`);

  // ── POS SALES ─────────────────────────────────────────────────────────
  console.log('Seeding POS sales...');
  const posRows = [
    ['POS-0001',null,'Walk-in Customer','2026-04-12 11:30:00',350,17.5,0,367.5,'cash','completed',
      [{name:'A4 Paper Ream',qty:1,rate:350,total:367.5}]],
    ['POS-0002',custIds[0],'Rajesh Kumar','2026-04-18 15:45:00',4500,540,200,4840,'upi','completed',
      [{name:'Office Chair',qty:1,rate:4500,total:4840}]],
    ['POS-0003',null,'Walk-in Customer','2026-05-02 10:00:00',700,35,50,685,'cash','completed',
      [{name:'A4 Paper Ream',qty:2,rate:350,total:685}]],
    ['POS-0004',custIds[1],'Priya Sharma','2026-05-06 14:20:00',999,179.82,0,1178.82,'card','completed',
      [{name:'Domain Registration',qty:1,rate:999,total:1178.82}]],
    ['POS-0005',null,'Walk-in Customer','2026-05-08 09:15:00',3500,630,0,4130,'cash','completed',
      [{name:'Web Hosting Annual',qty:1,rate:3500,total:4130}]],
  ];
  const posIds = [];
  for (const p of posRows) {
    const [r] = await conn.query(
      `INSERT INTO pos_sales (sale_number,customer_id,customer_name,sale_date,items_json,
        subtotal,tax_amount,discount,total,payment_method,status,created_by,created_date,updated_by,updated_date)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?,NOW())`,
      [p[0],p[1],p[2],p[3],JSON.stringify(p[10]),p[4],p[5],p[6],p[7],p[8],p[9],USER,USER]
    );
    posIds.push(r.insertId);
  }
  log.push(`POSSales: ${posIds}`);

  await conn.end();

  console.log('\n✅ Seed complete! Summary:');
  log.forEach(l => console.log(' ', l));
}

run().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  if (err.sql) console.error('SQL:', err.sql);
  process.exit(1);
});
