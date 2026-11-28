-- Prevent duplicate execution of the same approved task.
CREATE TABLE IF NOT EXISTS execution_claims (
  task_id TEXT PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  claimed_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_execution_claims_order_id ON execution_claims(order_id);
