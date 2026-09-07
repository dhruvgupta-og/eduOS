import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import provisionSchoolRouter from './routes/provisionSchool';
import provisionStaffRouter from './routes/provisionStaff';
import provisionStudentParentRouter from './routes/provisionStudentParent';
import resetPasswordRouter from './routes/resetPassword';
import studentsRouter from './routes/students';
import attendanceRouter from './routes/attendance';
import announcementsRouter from './routes/announcements';
import vendorRouter from './routes/vendor';
import statusRouter from './routes/status';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// -------------------------------------------------------------
// API Routes registration
// -------------------------------------------------------------
app.use('/api/provision', provisionSchoolRouter);
app.use('/api/provision', provisionStaffRouter);
app.use('/api/provision', provisionStudentParentRouter);
app.use('/api/provision', resetPasswordRouter);

app.use('/api/students', studentsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/vendor', vendorRouter);

app.use('/api', statusRouter);
app.use('/', statusRouter);

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

  if (process.env.NODE_ENV === 'production') {
    console.log('--- STARTING UP IN PRODUCTION MODE ---');
    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
      console.warn('⚠️ Warning: Supabase credentials (SUPABASE_URL and SUPABASE_SECRET_KEY) are not set. API endpoints requiring Supabase admin access will return configuration errors.');
    } else {
      // Validate secret key with remote REST API
      try {
        const restResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          headers: {
            apikey: SUPABASE_SECRET_KEY,
            Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
          },
        });
        if (!restResponse.ok && restResponse.status === 401) {
          const errorText = await restResponse.text().catch(() => '');
          console.warn(`⚠️ Warning: Supabase Secret Key returned 401 Unauthorized: ${errorText}`);
        } else {
          console.log('✔ Supabase Secret Key validated successfully on remote instance.');
        }
      } catch (err: any) {
        console.warn(`⚠️ Warning connecting to Supabase during startup: ${err.message}`);
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets compiled under 'dist/' directory
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
