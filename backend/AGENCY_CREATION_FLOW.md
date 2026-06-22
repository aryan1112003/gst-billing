# Agency Creation Flow Diagram

## Overview
This document visualizes how the multi-tenant agency database system works.

## 1. User Creation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN CREATES NEW USER                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Check roleId  │
                    └────────┬───────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
      ┌──────────────┐              ┌──────────────┐
      │  roleId = 2? │              │ roleId ≠ 2? │
      │   (Agency)   │              │ (Admin/User) │
      └──────┬───────┘              └──────┬───────┘
             │                             │
             │ YES                         │ NO
             │                             │
             ▼                             ▼
   ┌──────────────────┐          ┌──────────────────┐
   │ Validate Company │          │  Create User     │
   │   Data Required  │          │  in Master DB    │
   └─────────┬────────┘          └──────────────────┘
             │                             │
             │ Valid                       ▼
             ▼                        ┌─────────┐
   ┌──────────────────┐              │ Success │
   │ Create Agency    │              └─────────┘
   │   & Database     │
   └─────────┬────────┘
             │
             ▼
   ┌──────────────────┐
   │ Link User to     │
   │    Agency ID     │
   └─────────┬────────┘
             │
             ▼
        ┌─────────┐
        │ Success │
        │ + Agency│
        │  Info   │
        └─────────┘
```

## 2. Agency Database Creation Process

```
┌─────────────────────────────────────────────────────────────────────┐
│               agencyService.createAgency(companyData)                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Step 1: Validate│
                    │ Email Uniqueness│
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Step 2: Insert  │
                    │ Agency Record   │
                    │ (Master DB)     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Step 3: Get     │
                    │  Agency ID      │
                    └────────┬────────┘
                             │
                             ▼
     ┌─────────────────────────────────────────────────────┐
     │ databaseConnectionManager.createAgencyDatabase()     │
     └────────────────────┬────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │ Sanitize Company Name          │
         │ "My Company" → "my_company"    │
         │ Create DB Name:                │
         │ "agency_{id}_{sanitized_name}" │
         └────────────┬───────────────────┘
                      │
                      ▼
         ┌────────────────────────────────┐
         │ Execute SQL:                   │
         │ CREATE DATABASE                │
         │ agency_1_my_company            │
         └────────────┬───────────────────┘
                      │
                      ▼
         ┌────────────────────────────────┐
         │ Connect to New Database        │
         └────────────┬───────────────────┘
                      │
                      ▼
         ┌────────────────────────────────┐
         │ Read schema.mysql.sql          │
         │ Execute Each Statement:        │
         │  - CREATE TABLE customers      │
         │  - CREATE TABLE items          │
         │  - CREATE TABLE invoices       │
         │  - CREATE TABLE vendors        │
         │  - CREATE TABLE purchases      │
         │  - CREATE TABLE payments       │
         │  - CREATE TABLE expenses       │
         │  - ... (all tables)            │
         └────────────┬───────────────────┘
                      │
                      ▼
         ┌────────────────────────────────┐
         │ Update Agency Record           │
         │ SET database_name = ...        │
         └────────────┬───────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │   Success!   │
              │ Return Agency│
              └──────────────┘
```

## 3. Database Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MASTER DATABASE                               │
│                       (mawebtec_lms)                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │     users       │  │    agencies      │  │  refresh_tokens  │  │
│  ├─────────────────┤  ├──────────────────┤  ├──────────────────┤  │
│  │ id              │  │ id               │  │ id               │  │
│  │ email           │  │ company_name     │  │ user_id          │  │
│  │ name            │  │ database_name    │  │ token            │  │
│  │ password        │  │ email            │  │ expires_at       │  │
│  │ roleId          │  │ phone            │  └──────────────────┘  │
│  │ agecny_id ─────┼─>│ address          │                         │
│  └─────────────────┘  │ gst_number       │                         │
│                       │ pan_number       │                         │
│   Admin Users         │ status           │                         │
│   Agency Users        │ subscription_plan│                         │
│   Regular Users       └──────────────────┘                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
┌───────────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  AGENCY DATABASE 1    │ │ AGENCY DATABASE 2│ │ AGENCY DATABASE N│
│ agency_1_company_a    │ │agency_2_company_b│ │agency_N_company_n│
├───────────────────────┤ ├──────────────────┤ ├──────────────────┤
│                       │ │                  │ │                  │
│ ┌─────────────────┐   │ │ ┌──────────────┐ │ │ ┌──────────────┐ │
│ │   customers     │   │ │ │  customers   │ │ │ │  customers   │ │
│ └─────────────────┘   │ │ └──────────────┘ │ │ └──────────────┘ │
│ ┌─────────────────┐   │ │ ┌──────────────┐ │ │ ┌──────────────┐ │
│ │     items       │   │ │ │    items     │ │ │ │    items     │ │
│ └─────────────────┘   │ │ └──────────────┘ │ │ └──────────────┘ │
│ ┌─────────────────┐   │ │ ┌──────────────┐ │ │ ┌──────────────┐ │
│ │   invoices      │   │ │ │   invoices   │ │ │ │   invoices   │ │
│ └─────────────────┘   │ │ └──────────────┘ │ │ └──────────────┘ │
│ ┌─────────────────┐   │ │ ┌──────────────┐ │ │ ┌──────────────┐ │
│ │    vendors      │   │ │ │   vendors    │ │ │ │   vendors    │ │
│ └─────────────────┘   │ │ └──────────────┘ │ │ └──────────────┘ │
│ ┌─────────────────┐   │ │ ┌──────────────┐ │ │ ┌──────────────┐ │
│ │   purchases     │   │ │ │  purchases   │ │ │ │  purchases   │ │
│ └─────────────────┘   │ │ └──────────────┘ │ │ └──────────────┘ │
│ ┌─────────────────┐   │ │ ┌──────────────┐ │ │ ┌──────────────┐ │
│ │    payments     │   │ │ │   payments   │ │ │ │   payments   │ │
│ └─────────────────┘   │ │ └──────────────┘ │ │ └──────────────┘ │
│ ┌─────────────────┐   │ │ ┌──────────────┐ │ │ ┌──────────────┐ │
│ │    expenses     │   │ │ │   expenses   │ │ │ │   expenses   │ │
│ └─────────────────┘   │ │ └──────────────┘ │ │ └──────────────┘ │
│                       │ │                  │ │                  │
│  Company A's Data     │ │ Company B's Data │ │ Company N's Data │
│                       │ │                  │ │                  │
└───────────────────────┘ └──────────────────┘ └──────────────────┘
```

## 4. Connection Pool Management

```
┌─────────────────────────────────────────────────────────────────────┐
│              DatabaseConnectionManager                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Master Pool (mawebtec_lms)                                 │    │
│  │ ┌──────┐ ┌──────┐ ┌──────┐           ┌──────┐            │    │
│  │ │Conn 1│ │Conn 2│ │Conn 3│    ...    │Conn50│            │    │
│  │ └──────┘ └──────┘ └──────┘           └──────┘            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Agency Pools (Map)                                         │    │
│  │                                                            │    │
│  │  agency_1_company_a:                                      │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐      ┌──────┐               │    │
│  │  │Conn 1│ │Conn 2│ │Conn 3│ ...  │Conn20│               │    │
│  │  └──────┘ └──────┘ └──────┘      └──────┘               │    │
│  │                                                            │    │
│  │  agency_2_company_b:                                      │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐      ┌──────┐               │    │
│  │  │Conn 1│ │Conn 2│ │Conn 3│ ...  │Conn20│               │    │
│  │  └──────┘ └──────┘ └──────┘      └──────┘               │    │
│  │                                                            │    │
│  │  ... (created on demand)                                  │    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Auto-cleanup: Close pools unused for 30+ minutes                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## 5. API Request Flow

```
┌────────────────────────────────────────────────────────────────────┐
│  POST /api/v1/users                                                │
│  Body: { roleId: 2, companyData: {...} }                          │
└───────────────────────┬────────────────────────────────────────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │   authenticate         │
           │   (JWT middleware)     │
           └────────────┬───────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │   requireRole('admin') │
           │   (Auth check)         │
           └────────────┬───────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │  Validate Request      │
           │  - email exists?       │
           │  - password length?    │
           │  - companyData valid?  │
           └────────────┬───────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │ Check roleId = 2?      │
           └────────┬───────────────┘
                    │
                    │ YES (Agency)
                    ▼
        ┌───────────────────────────┐
        │ agencyService.createAgency│
        └───────────┬───────────────┘
                    │
                    ├─► Create agency record
                    ├─► Create database
                    ├─► Initialize schema
                    └─► Return agency info
                    │
                    ▼
        ┌───────────────────────────┐
        │ Create User in Master DB  │
        │ with agency_id            │
        └───────────┬───────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │ Return Response:          │
        │ {                         │
        │   user: {...},            │
        │   agency: {...}           │
        │ }                         │
        └───────────────────────────┘
```

## 6. Query Routing

```
┌────────────────────────────────────────────────────────────────────┐
│                     Application Query                               │
└───────────────────────┬────────────────────────────────────────────┘
                        │
                        ▼
           ┌────────────────────────┐
           │   query() function     │
           └────────┬───────────────┘
                    │
                    │
        ┌───────────┴──────────────┐
        │                          │
        │ agencyDbName provided?   │
        │                          │
        └───────┬──────────────┬───┘
                │              │
           NO   │              │   YES
                │              │
                ▼              ▼
    ┌──────────────────┐  ┌──────────────────┐
    │  Use Master Pool │  │ Get Agency Pool  │
    │  (mawebtec_lms)  │  │ from Manager     │
    └─────────┬────────┘  └────────┬─────────┘
              │                    │
              │                    │
              └──────────┬─────────┘
                         │
                         ▼
                ┌────────────────┐
                │ Execute Query  │
                └────────┬───────┘
                         │
                         ▼
                ┌────────────────┐
                │ Return Results │
                └────────────────┘
```

## 7. Data Isolation Example

```
┌─────────────────────────────────────────────────────────────────────┐
│                    User Login & Data Access                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌────────────────┐            ┌────────────────┐
     │ Company A User │            │ Company B User │
     │ (agency_id: 1) │            │ (agency_id: 2) │
     └────────┬───────┘            └────────┬───────┘
              │                             │
              │ Queries customers           │ Queries customers
              │                             │
              ▼                             ▼
   ┌────────────────────┐        ┌────────────────────┐
   │ agency_1_company_a │        │ agency_2_company_b │
   ├────────────────────┤        ├────────────────────┤
   │ customers:         │        │ customers:         │
   │  - Alice           │        │  - Bob             │
   │  - Carol           │        │  - Dave            │
   │  - Eve             │        │  - Frank           │
   └────────────────────┘        └────────────────────┘
           │                              │
           │                              │
           ▼                              ▼
    ┌─────────────┐               ┌─────────────┐
    │ Returns:    │               │ Returns:    │
    │ Alice       │               │ Bob         │
    │ Carol       │               │ Dave        │
    │ Eve         │               │ Frank       │
    └─────────────┘               └─────────────┘

    ❌ Cannot see Bob                ❌ Cannot see Alice
    ❌ Cannot see Dave               ❌ Cannot see Carol
    ❌ Cannot see Frank              ❌ Cannot see Eve
```

## 8. Database Naming Sanitization

```
Company Name Input          →  Sanitized DB Name
─────────────────────────────────────────────────────────
"Tech Corporation"          →  agency_1_tech_corporation
"ABC & Co."                 →  agency_2_abc_co
"My-Super-Store!"           →  agency_3_my_super_store
"Retail Store Ltd."         →  agency_4_retail_store_ltd
"999 Shop"                  →  agency_5_999_shop
"XYZ   Multi   Space"       →  agency_6_xyz_multi_space

Rules:
1. Convert to lowercase
2. Replace non-alphanumeric with underscore
3. Remove multiple consecutive underscores
4. Trim leading/trailing underscores
5. Limit to 50 characters
6. Prefix with "agency_{id}_"
```

---

**Tip:** Use these diagrams as reference when implementing or debugging the multi-tenant system.
