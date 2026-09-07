import { Router, Response, Request } from 'express';

const router = Router();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sayxiucjqrerffpwxqkd.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_qDljetLwMsDaLoYAl_BblA_k322sgxG';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';
const SUPABASE_JWKS_URL = process.env.SUPABASE_JWKS_URL || `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`;

// Health check with DB connectivity & uptime
router.get('/health', async (req: Request, res: Response) => {
  let dbConnected = false;
  let dbLatencyMs = 0;
  
  const startTime = Date.now();
  if (SUPABASE_SECRET_KEY && SUPABASE_URL) {
    try {
      const pingRes = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY || SUPABASE_SECRET_KEY },
      });
      dbConnected = pingRes.ok;
      dbLatencyMs = Date.now() - startTime;
    } catch {
      dbConnected = false;
    }
  }

  res.status(200).json({
    status: 'ok',
    service: 'EduOS Multi-Tenant School Management Platform',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: dbConnected,
      latencyMs: dbLatencyMs,
      type: 'Supabase PostgreSQL (RFC-4122 UUID)'
    }
  });
});

// Supabase Status & Telemetry
router.get('/supabase/status', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    // 1. Test Auth / GoTrue health endpoint
    let authHealthy = false;
    try {
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      });
      authHealthy = authRes.ok;
    } catch {
      authHealthy = false;
    }

    // 2. Test JWKS endpoint
    let jwksStatus = false;
    try {
      const jwksRes = await fetch(SUPABASE_JWKS_URL);
      jwksStatus = jwksRes.ok;
    } catch {
      jwksStatus = false;
    }

    // 3. Test REST endpoint with secret key
    let restStatus = 0;
    let tablesFound: string[] = [];
    let secretKeyValid = false;
    let secretKeyMessage = '';

    try {
      if (SUPABASE_SECRET_KEY) {
        const restResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          headers: {
            apikey: SUPABASE_SECRET_KEY,
            Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
          },
        });
        restStatus = restResponse.status;

        if (restResponse.ok) {
          secretKeyValid = true;
          const openApiSpec = (await restResponse.json()) as any;
          if (openApiSpec?.paths) {
            tablesFound = Object.keys(openApiSpec.paths)
              .filter((p) => p !== '/' && !p.startsWith('/rpc/'))
              .map((p) => p.replace('/', ''));
          }
        } else {
          const errorData = (await restResponse.json().catch(() => ({}))) as any;
          secretKeyMessage =
            errorData.message ||
            (restResponse.status === 401 ? 'Unregistered or masked secret key' : 'REST check failed');
        }
      } else {
        secretKeyMessage = 'Secret key missing in environment';
      }
    } catch (err: any) {
      secretKeyMessage = err.message || 'REST connection error';
    }

    const latencyMs = Date.now() - startTime;
    const isConnected = authHealthy || jwksStatus || secretKeyValid;

    res.json({
      connected: isConnected,
      statusCode: isConnected ? 200 : restStatus || 500,
      latencyMs,
      supabaseUrl: SUPABASE_URL,
      publishableKeyConfigured: !!SUPABASE_PUBLISHABLE_KEY,
      secretKeyConfigured: !!SUPABASE_SECRET_KEY,
      secretKeyValid,
      secretKeyMessage: secretKeyValid ? 'Secret key active' : secretKeyMessage,
      authHealthy,
      jwksUrl: SUPABASE_JWKS_URL,
      jwksVerified: jwksStatus,
      tablesFound,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      connected: false,
      error: err.message || 'Failed to connect to Supabase',
      latencyMs: Date.now() - startTime,
    });
  }
});

// Generate PostgreSQL DDL Schema for Supabase SQL Editor
router.get('/supabase/schema', (req: Request, res: Response) => {
  const sql = `
-- =============================================================
-- EduOS School Management System - Supabase Production Schema
-- Generated for: https://sayxiucjqrerffpwxqkd.supabase.co
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Schools Table (Multi-tenant Root)
CREATE TABLE IF NOT EXISTS public.schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#E63946',
  subscription_tier TEXT DEFAULT 'pro',
  feature_flags JSONB DEFAULT '{}'::jsonb,
  grading_config JSONB DEFAULT '{"type":"letter"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  section TEXT NOT NULL,
  capacity INT DEFAULT 40,
  class_teacher_id TEXT,
  room_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Students Table (SIS)
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES public.classes(id) ON DELETE SET NULL,
  admission_no TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  gender TEXT,
  dob DATE,
  blood_group TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  status TEXT DEFAULT 'active',
  custom_fields JSONB DEFAULT '{}'::jsonb,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, admission_no)
);

-- 4. Staff / Faculty Table
CREATE TABLE IF NOT EXISTS public.staff (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'teacher',
  department TEXT,
  phone TEXT,
  joining_date DATE,
  subjects JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, employee_id)
);
`;
  res.setHeader('Content-Type', 'text/plain');
  res.send(sql);
});

export default router;
