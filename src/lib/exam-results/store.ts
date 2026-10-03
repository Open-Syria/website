import { DatabaseSync } from "node:sqlite"

export type Budget = { key: string; limit: number; seconds: number }

/** Local durable volume shared by all slots on one host; never use a network filesystem. */
export class ResultsStore {
  private db: DatabaseSync
  constructor(path: string) {
    this.db = new DatabaseSync(path, { timeout: 1000 })
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA secure_delete=ON;
      CREATE TABLE IF NOT EXISTS budgets (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS tickets (key TEXT PRIMARY KEY, session TEXT NOT NULL, context TEXT NOT NULL, certificate TEXT NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires INTEGER NOT NULL);`)
  }
  close() {
    this.db.close()
  }
  private prune(now: number) {
    this.db.prepare("DELETE FROM budgets WHERE expires <= ?").run(now)
    this.db.prepare("DELETE FROM tickets WHERE expires <= ?").run(now)
    this.db.prepare("DELETE FROM metadata WHERE expires <= ?").run(now)
  }
  take(budgets: Budget[], now = Date.now()): boolean {
    this.db.exec("BEGIN IMMEDIATE")
    try {
      this.prune(now)
      for (const budget of budgets) {
        const row = this.db
          .prepare("SELECT count FROM budgets WHERE key = ?")
          .get(budget.key)
        if (row && Number(row.count) >= budget.limit) {
          this.db.exec("ROLLBACK")
          return false
        }
      }
      for (const budget of budgets)
        this.db
          .prepare(
            "INSERT INTO budgets VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1"
          )
          .run(budget.key, now + budget.seconds * 1000)
      this.db.exec("COMMIT")
      return true
    } catch (error) {
      this.db.exec("ROLLBACK")
      throw error
    }
  }
  issue(
    key: string,
    session: string,
    context: string,
    certificate: string,
    now = Date.now()
  ) {
    this.db
      .prepare("INSERT INTO tickets VALUES (?, ?, ?, ?, ?)")
      .run(key, session, context, certificate, now + 120_000)
  }
  consume(
    key: string,
    session: string,
    context: string,
    now = Date.now()
  ): string | null {
    const row = this.db
      .prepare(
        "DELETE FROM tickets WHERE key = ? AND session = ? AND context = ? AND expires > ? RETURNING certificate"
      )
      .get(key, session, context, now)
    return typeof row?.certificate === "string" ? row.certificate : null
  }
  cached(key: string, now = Date.now()): unknown {
    const row = this.db
      .prepare("SELECT value FROM metadata WHERE key = ? AND expires > ?")
      .get(key, now)
    return typeof row?.value === "string" ? JSON.parse(row.value) : null
  }
  cache(key: string, value: unknown, now = Date.now()) {
    this.db
      .prepare("INSERT OR REPLACE INTO metadata VALUES (?, ?, ?)")
      .run(key, JSON.stringify(value), now + 600_000)
  }
}
