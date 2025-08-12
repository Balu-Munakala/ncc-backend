// // server.js
// const express      = require('express');
// const cors         = require('cors');
// const dotenv       = require('dotenv');
// const cookieParser = require('cookie-parser');
// const path         = require('path');
// const pool         = require('./config/db');

// dotenv.config();

// ;(async () => {
//   // Test DB connection
//   try {
//     const conn = await pool.getConnection();
//     console.log('✅ MySQL connected');
//     conn.release();
//   } catch (err) {
//     console.error('❌ MySQL connection error:', err);
//     process.exit(1);
//   }

//   const app = express();

//   // In dev, front is on :3000, back on :5000
//   const allowedOrigins = process.env.CLIENT_URL;

//   app.use(cors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (like mobile apps or curl)
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error(`Origin ${origin} not allowed by CORS`));
//       }
//     },
//     credentials: true
//   }));
//   app.use(express.json());
//   app.use(express.urlencoded({ extended: true }));
//   app.use(cookieParser());
//   app.use(express.static(path.join(__dirname, 'public')));

//   // Mount our auth router
//   app.use('/auth', require('./routes/auth'));

//   // ...and any other /api routes
//   app.use('/api/users', require('./routes/user'));
//   app.use('/api/admin', require('./routes/admin'));
//   app.use('/api/master', require('./routes/master'));
//   app.use('/api/fallin', require('./routes/fallin'));
//   app.use('/api/attendance', require('./routes/attendance'));
//   app.use('/uploads', express.static('uploads'));
//   app.use('/api/admin/manage-users', require('./routes/manageUsers'));
//   app.use('/api/achievements', require('./routes/achievements'));
//   app.use('/api/events', require('./routes/events'));
//   app.use('/api/admin/reports', require('./routes/adminReports'));
//   app.use('/api/support-queries', require('./routes/supportQueries'));
//   app.use('/api', require('./routes/changePassword'));
  
//     // … above your existing app.use() calls …
//   app.use('/api/master/manage-admins',    require('./routes/master/manageAdmins'));
//   app.use('/api/master/manage-users',     require('./routes/master/manageUsers'));
//   app.use('/api/master/notification-manager', require('./routes/master/notificationManager'));
//   app.use('/api/master/platform-config',  require('./routes/master/platformConfig'));
//   app.use('/api/master/global-search',    require('./routes/master/globalSearch'));
//   app.use('/api/master/support-queries',  require('./routes/master/supportQueries'));
//   app.use('/api/master/system-logs',      require('./routes/master/systemLogs'));
//   app.use('/api/master/system-reports',   require('./routes/master/systemReports'));
//   app.use('/api/master/backup-restore',   require('./routes/master/backupRestore'));


//   // At the bottom of all your other app.use(...) calls:
//   app.use('/api/notifications', require('./routes/notifications'));



//   // Health check
//   app.get('/', (req, res) => res.send('GITAM NCC API is live!'));

//   const PORT = process.env.PORT;
//   app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
// })();

// server.js
const express      = require('express');
const cors         = require('cors');
const dotenv       = require('dotenv');
const cookieParser = require('cookie-parser');
const path         = require('path');
const pool         = require('./config/db');

dotenv.config();

;(async () => {
  // Test DB connection
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection error:', err);
    process.exit(1);
  }

  const app = express();

  // FRONTEND PRODUCTION URL(S) ONLY
  // Example: CLIENT_URL=https://your-frontend.netlify.app,https://another-domain.com
  const allowedOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0); // remove empty entries

  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl) only if you want
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  // Routes
  app.use('/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/user'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/master', require('./routes/master'));
  app.use('/api/fallin', require('./routes/fallin'));
  app.use('/api/attendance', require('./routes/attendance'));
  app.use('/uploads', express.static('uploads'));
  app.use('/api/admin/manage-users', require('./routes/manageUsers'));
  app.use('/api/achievements', require('./routes/achievements'));
  app.use('/api/events', require('./routes/events'));
  app.use('/api/admin/reports', require('./routes/adminReports'));
  app.use('/api/support-queries', require('./routes/supportQueries'));
  app.use('/api', require('./routes/changePassword'));
  
  app.use('/api/master/manage-admins', require('./routes/master/manageAdmins'));
  app.use('/api/master/manage-users', require('./routes/master/manageUsers'));
  app.use('/api/master/notification-manager', require('./routes/master/notificationManager'));
  app.use('/api/master/platform-config', require('./routes/master/platformConfig'));
  app.use('/api/master/global-search', require('./routes/master/globalSearch'));
  app.use('/api/master/support-queries', require('./routes/master/supportQueries'));
  app.use('/api/master/system-logs', require('./routes/master/systemLogs'));
  app.use('/api/master/system-reports', require('./routes/master/systemReports'));
  app.use('/api/master/backup-restore', require('./routes/master/backupRestore'));
  
  app.use('/api/notifications', require('./routes/notifications'));

  // Health check route
  app.get('/', (req, res) => res.send('GITAM NCC API is live!'));

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})();
