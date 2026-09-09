const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/solvelink.db');
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
      'ALTER TABLE disasters ADD COLUMN affected_radius_km REAL DEFAULT 15.0;',
      'ALTER TABLE disasters ADD COLUMN confirmed_by INTEGER;',
      'ALTER TABLE disasters ADD COLUMN confirmed_at DATETIME;',
      'ALTER TABLE disasters ADD COLUMN source_name TEXT;',
      'ALTER TABLE disasters ADD COLUMN source_alert_id TEXT;',
      'ALTER TABLE disasters ADD COLUMN verification_status TEXT DEFAULT "GOVERNMENT_CONFIRMED";',
      'ALTER TABLE disasters ADD COLUMN start_time DATETIME;',
      'ALTER TABLE disasters ADD COLUMN expected_end_time DATETIME;',
      'ALTER TABLE disasters ADD COLUMN required_capabilities_json TEXT;',
      'ALTER TABLE disasters ADD COLUMN required_resources_json TEXT;',
      'ALTER TABLE disasters ADD COLUMN immediate_actions_json TEXT;',
      'ALTER TABLE disasters ADD COLUMN conflict_notes TEXT;',
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
      );`,
      `CREATE TABLE IF NOT EXISTS disaster_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        type TEXT NOT NULL,
        endpoint_ref TEXT,
        enabled BOOLEAN DEFAULT 1,
        polling_interval_mins INTEGER DEFAULT 15,
        trust_level TEXT DEFAULT 'OFFICIAL_CRITICAL',
        last_sync_at DATETIME,
        last_status TEXT DEFAULT 'SUCCESS',
        last_alert_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS external_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER,
        source_name TEXT NOT NULL,
        external_alert_id TEXT NOT NULL,
        alert_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT CHECK(severity IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')) DEFAULT 'HIGH',
        issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        affected_radius_km REAL DEFAULT 15.0,
        raw_metadata_json TEXT,
        normalized_data_json TEXT,
        validation_status TEXT DEFAULT 'VALIDATED',
        review_status TEXT CHECK(review_status IN ('PENDING_REVIEW', 'CONFIRMED', 'REJECTED', 'DUPLICATE')) DEFAULT 'PENDING_REVIEW',
        linked_disaster_id INTEGER,
        conflict_notes TEXT,
        is_simulation INTEGER DEFAULT 0,
        simulation_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(source_name, external_alert_id)
      );`,
      `CREATE TABLE IF NOT EXISTS university_disaster_risks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        disaster_id INTEGER NOT NULL,
        university_id INTEGER NOT NULL,
        risk_level TEXT CHECK(risk_level IN ('HIGH', 'MEDIUM', 'LOW', 'SAFE')) DEFAULT 'MEDIUM',
        distance_km REAL NOT NULL,
        inside_impact_zone BOOLEAN DEFAULT 0,
        risk_reason TEXT NOT NULL,
        action_required BOOLEAN DEFAULT 0,
        acknowledged BOOLEAN DEFAULT 0,
        acknowledged_at DATETIME,
        acknowledged_by INTEGER,
        response_status TEXT CHECK(response_status IN ('NOT_ACTIVATED', 'ACTIVATING', 'ACTIVE', 'DEPLOYED', 'STANDBY', 'COMPLETED')) DEFAULT 'NOT_ACTIVATED',
        response_activated_at DATETIME,
        response_activated_by INTEGER,
        is_simulation INTEGER DEFAULT 0,
        simulation_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(disaster_id, university_id)
      );`,
      `ALTER TABLE external_alerts ADD COLUMN conflict_notes TEXT;`,
      `ALTER TABLE external_alerts ADD COLUMN is_simulation INTEGER DEFAULT 0;`,
      `ALTER TABLE external_alerts ADD COLUMN simulation_id TEXT;`,
      `ALTER TABLE disasters ADD COLUMN is_simulation INTEGER DEFAULT 0;`,
      `ALTER TABLE disasters ADD COLUMN simulation_id TEXT;`,
      `ALTER TABLE university_disaster_risks ADD COLUMN is_simulation INTEGER DEFAULT 0;`,
      `ALTER TABLE university_disaster_risks ADD COLUMN simulation_id TEXT;`,
      `ALTER TABLE notifications ADD COLUMN is_simulation INTEGER DEFAULT 0;`,
      `ALTER TABLE notifications ADD COLUMN simulation_id TEXT;`,
      `ALTER TABLE audit_logs ADD COLUMN is_simulation INTEGER DEFAULT 0;`,
      `ALTER TABLE audit_logs ADD COLUMN simulation_id TEXT;`,
      `ALTER TABLE audit_logs ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;`,
      `ALTER TABLE disasters ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;`,
      `ALTER TABLE disasters ADD COLUMN is_simulation INTEGER DEFAULT 0;`,
      `ALTER TABLE disasters ADD COLUMN simulation_id TEXT;`
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

    // Ensure Hackathon Evaluator Test Accounts exist and have correct password hashes (idempotent seed)
    const testAccounts = [
      {
        name: 'Commander Rajesh Sharma (Government)',
        email: 'government@sankalp.ai',
        password_hash: bcrypt.hashSync('Sankalp@Gov2026', 10),
        plainPassword: 'Sankalp@Gov2026',
        role: 'GOVERNMENT',
        organization_id: 2
      },
      {
        name: 'Dr. Sunita Deshmukh (Hospital Owner)',
        email: 'owner@sankalp.ai',
        password_hash: bcrypt.hashSync('Sankalp@Owner2026', 10),
        plainPassword: 'Sankalp@Owner2026',
        role: 'PROBLEM_OWNER',
        organization_id: 1
      },
      {
        name: 'Prof. Arvind Kulkarni (University Authority)',
        email: 'university@sankalp.ai',
        password_hash: bcrypt.hashSync('Sankalp@University2026', 10),
        plainPassword: 'Sankalp@University2026',
        role: 'UNIVERSITY_ADMIN',
        university_id: 1
      },
      {
        name: 'Aarav Mehta (Student Volunteer)',
        email: 'student@sankalp.ai',
        password_hash: bcrypt.hashSync('Sankalp@Student2026', 10),
        plainPassword: 'Sankalp@Student2026',
        role: 'STUDENT',
        university_id: 1
      },
      {
        name: 'Commander Rajesh Sharma (Government)',
        email: 'government@solvelink.demo',
        password_hash: bcrypt.hashSync('Sankalp@Gov2026', 10),
        plainPassword: 'Sankalp@Gov2026',
        role: 'GOVERNMENT',
        organization_id: 2
      },
      {
        name: 'Dr. Sunita Deshmukh (Hospital Owner)',
        email: 'owner@solvelink.demo',
        password_hash: bcrypt.hashSync('Sankalp@Owner2026', 10),
        plainPassword: 'Sankalp@Owner2026',
        role: 'PROBLEM_OWNER',
        organization_id: 1
      },
      {
        name: 'Prof. Arvind Kulkarni (University Authority)',
        email: 'university@solvelink.demo',
        password_hash: bcrypt.hashSync('Sankalp@University2026', 10),
        plainPassword: 'Sankalp@University2026',
        role: 'UNIVERSITY_ADMIN',
        university_id: 1
      },
      {
        name: 'Aarav Mehta (Student Volunteer)',
        email: 'student@solvelink.demo',
        password_hash: bcrypt.hashSync('Sankalp@Student2026', 10),
        plainPassword: 'Sankalp@Student2026',
        role: 'STUDENT',
        university_id: 1
      }
    ];

    for (const acc of testAccounts) {
      try {
        let userId;
        const existing = queryGet('SELECT id, password_hash FROM users WHERE LOWER(email) = ?', [acc.email]);
        if (!existing) {
          queryRun(
            `INSERT INTO users (name, email, password_hash, role, organization_id, university_id, status)
             VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
            [acc.name, acc.email, acc.password_hash, acc.role, acc.organization_id || null, acc.university_id || null]
          );
          const newlyCreated = queryGet('SELECT id FROM users WHERE LOWER(email) = ?', [acc.email]);
          userId = newlyCreated ? newlyCreated.id : null;
        } else {
          userId = existing.id;
          // Idempotently update user's password_hash if it does not match designated evaluator password
          const matchesDesignated = bcrypt.compareSync(acc.plainPassword, existing.password_hash);
          if (!matchesDesignated) {
            queryRun('UPDATE users SET password_hash = ?, status = "ACTIVE" WHERE id = ?', [acc.password_hash, existing.id]);
          }
        }

        // Ensure STUDENT role accounts have an associated row in students table
        if (acc.role === 'STUDENT' && userId) {
          const studentRecord = queryGet('SELECT id FROM students WHERE user_id = ?', [userId]);
          if (!studentRecord) {
            queryRun(
              `INSERT INTO students (user_id, university_id, department_id, roll_number, skills_json, nss_member, ncc_member, availability_status)
               VALUES (?, ?, 1, ?, ?, 1, 1, 'AVAILABLE')`,
              [userId, acc.university_id || 1, `NITD-${userId}-2026`, JSON.stringify(["First Aid", "Disaster Response", "GIS Mapping"])]
            );
          }
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
