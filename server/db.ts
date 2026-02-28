import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "data");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "botchie.db");

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS policies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    max_amount TEXT,
    limit_amount INTEGER DEFAULT 0,
    friction TEXT,
    intent TEXT,
    afas_code INTEGER,
    ledger TEXT,
    benchmark_score TEXT,
    benchmark_warning INTEGER DEFAULT 0,
    allowed_categories TEXT,
    source_document TEXT,
    start_date TEXT,
    end_date TEXT,
    valid_until TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TRIGGER IF NOT EXISTS update_policies_updated_at
    AFTER UPDATE ON policies
    FOR EACH ROW
  BEGIN
    UPDATE policies SET updated_at = datetime('now') WHERE id = OLD.id;
  END;
`);

export default db;
