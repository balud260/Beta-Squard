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

    // Run schema
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    rawDb.exec(schemaSql);

    // Migration helper: Ensure rejection_reason exists
    try {
      rawDb.exec('ALTER TABLE university_problem_acceptances ADD COLUMN rejection_reason TEXT;');
    } catch (e) {}

    // Seed if empty
    const userCheck = queryGet('SELECT count(*) as count FROM users');
    if (!userCheck || userCheck.count === 0) {
      console.log('Database empty. Running seed SQL...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      rawDb.exec(seedSql);
      saveToDisk();
      console.log('Database successfully seeded with realistic demo data.');
    } else {
      console.log(`SQLite Database ready. Existing users: ${userCheck.count}`);
    }
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
