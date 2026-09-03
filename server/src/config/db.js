const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/solvelink.db');
const schemaPath = path.join(__dirname, '../database/schema.sql');
const seedPath = path.join(__dirname, '../database/seed.sql');

let rawDb = null;
let isReady = false;

function saveToDisk() {
  if (!rawDb) return;
  try {
    const data = rawDb.export();
    const buffer = Buffer.from(data);
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

async function initDb() {
  try {
    const SQL = await initSqlJs();
    if (fs.existsSync(dbPath)) {
      const filebuffer = fs.readFileSync(dbPath);
      rawDb = new SQL.Database(filebuffer);
    } else {
      rawDb = new SQL.Database();
    }

    rawDb.exec('PRAGMA foreign_keys = ON;');

    // Migration helper: Ensure new columns & tables exist safely on existing database
    const migrations = [
      'ALTER TABLE university_problem_acceptances ADD COLUMN rejection_reason TEXT;',
      'ALTER TABLE problems ADD COLUMN responsibility_key TEXT;',
      'ALTER TABLE problems ADD COLUMN government_department TEXT;',
      'ALTER TABLE problems ADD COLUMN government_authority TEXT;',
      'ALTER TABLE problems ADD COLUMN jurisdiction TEXT;',
      'ALTER TABLE problems ADD COLUMN ai_responsibility_key TEXT;',
      'ALTER TABLE problems ADD COLUMN official_responsibility_key TEXT;',
      'ALTER TABLE problems ADD COLUMN routing_status TEXT DEFAULT "AI_ROUTED";',
      `CREATE TABLE IF NOT EXISTS government_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        problem_id INTEGER NOT NULL,
        proposal_id INTEGER,
        government_id INTEGER NOT NULL,
        decision TEXT CHECK(decision IN ('APPROVED', 'CHANGES_REQUESTED', 'REJECTED')) NOT NULL,
        feedback TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS problem_government_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        problem_id INTEGER NOT NULL,
        government_id INTEGER,
        responsibility_key TEXT,
        jurisdiction TEXT,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    ];

    for (const sql of migrations) {
      try {
        rawDb.exec(sql);
      } catch (e) {
        // Column or table already exists
      }
    }

    // Run full schema definitions
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    rawDb.exec(schemaSql);


    // Populate responsibility fields for existing problems if unpopulated
    try {
      rawDb.exec(`
        UPDATE problems SET
          responsibility_key = COALESCE(responsibility_key, category, 'COMMUNITY_DEVELOPMENT'),
          government_department = COALESCE(government_department, 
            CASE category 
              WHEN 'HEALTHCARE' THEN 'District Health Department'
              WHEN 'DISASTER_MANAGEMENT' THEN 'State Disaster Management Authority'
              WHEN 'CIVIC_INFRASTRUCTURE' THEN 'Municipal Public Works Department'
              WHEN 'EDUCATION' THEN 'District Education Department'
              ELSE 'District Administration Welfare Board'
            END),
          government_authority = COALESCE(government_authority, 'District Administration - District X'),
          jurisdiction = COALESCE(jurisdiction, 'District X'),
          ai_responsibility_key = COALESCE(ai_responsibility_key, category, 'COMMUNITY_DEVELOPMENT'),
          official_responsibility_key = COALESCE(official_responsibility_key, category, 'COMMUNITY_DEVELOPMENT'),
          routing_status = COALESCE(routing_status, 'AI_ROUTED')
        WHERE responsibility_key IS NULL OR government_department IS NULL;
      `);
    } catch (e) {
      console.warn('Migration update warning:', e.message);
    }

    // Seed full demo data if core demo accounts are missing or table is empty
    const coreGovUser = queryGet("SELECT id FROM users WHERE email = 'government@solvelink.demo'");
    if (!coreGovUser) {
      console.log('Database missing core demo users. Running seed SQL...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      rawDb.exec(seedSql);
      saveToDisk();
      console.log('Database successfully seeded with realistic demo data.');
    }

    // Ensure Hackathon Evaluator Test Accounts exist (idempotent seed)
    const testAccounts = [
      {
        name: 'Commander Rajesh Sharma (Government)',
        email: 'government@sankalp.ai',
        password_hash: '$2a$10$.8DJDf1GNL7pX.gqf4NaNOcVd9EFpbi7zxu/s2yAZiWPwzHVjI0Oa',
        role: 'GOVERNMENT',
        organization_id: 2
      },
      {
        name: 'Dr. Sunita Deshmukh (Hospital Owner)',
        email: 'owner@sankalp.ai',
        password_hash: '$2a$10$Wl5DEMuR2ubkVe2Jrf04WOo5PIRnGzBjXPBOI2voMloFESiJAPTOq',
        role: 'PROBLEM_OWNER',
        organization_id: 1
      },
      {
        name: 'Prof. Arvind Kulkarni (University Authority)',
        email: 'university@sankalp.ai',
        password_hash: '$2a$10$BVrW.FfeXCSNXcvVfiBxhumDlnE6Y5LiG/1xf65JeeuVtw2X5xMbu',
        role: 'UNIVERSITY_ADMIN',
        university_id: 1
      },
      {
        name: 'Aarav Mehta (Student Volunteer)',
        email: 'student@sankalp.ai',
        password_hash: '$2a$10$sfgCOByGQQlFsnB/tGhnc.60pM.V4S9fQK/GXKmILQ3jhbSaER5Hi',
        role: 'STUDENT',
        university_id: 1
      }
    ];

    for (const acc of testAccounts) {
      try {
        const existing = queryGet('SELECT id FROM users WHERE LOWER(email) = ?', [acc.email]);
        if (!existing) {
          queryRun(
            `INSERT INTO users (name, email, password_hash, role, organization_id, university_id, status)
             VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
            [acc.name, acc.email, acc.password_hash, acc.role, acc.organization_id || null, acc.university_id || null]
          );
        }
      } catch (e) {
        console.warn('Test account seed notice:', e.message);
      }
    }

    const userCountRes = queryGet('SELECT count(*) as count FROM users');
    console.log(`SQLite Database ready. Total registered users: ${userCountRes ? userCountRes.count : 0}`);
    isReady = true;
  } catch (err) {
    console.error('Failed to initialize SQLite Database:', err);
  }
}

function queryAll(sql, params = []) {
  if (!rawDb) return [];
  try {
    const stmt = rawDb.prepare(sql);
    if (Array.isArray(params) && params.length > 0) {
      stmt.bind(params);
    }
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (err) {
    console.error('SQL queryAll Error:', err.message, 'SQL:', sql);
    return [];
  }
}

function queryGet(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : undefined;
}

function queryRun(sql, params = []) {
  if (!rawDb) return { lastInsertRowid: 0, changes: 0 };
  try {
    rawDb.run(sql, params);
    const idRes = queryGet('SELECT last_insert_rowid() as id');
    const lastInsertRowid = idRes ? idRes.id : 0;
    saveToDisk();
    return { lastInsertRowid, changes: 1 };
  } catch (err) {
    console.error('SQL queryRun Error:', err.message, 'SQL:', sql);
    return { lastInsertRowid: 0, changes: 0 };
  }
}

function exec(sql) {
  if (!rawDb) return;
  rawDb.exec(sql);
  saveToDisk();
}

const dbWrapper = {
  prepare: (sql) => {
    return {
      get: (...params) => {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        return queryGet(sql, flatParams);
      },
      all: (...params) => {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        return queryAll(sql, flatParams);
      },
      run: (...params) => {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        return queryRun(sql, flatParams);
      }
    };
  },
  exec: (sql) => exec(sql),
  initPromise: initDb()
};

module.exports = dbWrapper;
