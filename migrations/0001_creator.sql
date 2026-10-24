CREATE TABLE IF NOT EXISTS membership_grants (
  provider_ref TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('purchaser','recurring')),
  status TEXT NOT NULL CHECK(status IN ('active','revoked')),
  price_id TEXT NOT NULL,
  customer_id TEXT,
  payment_intent TEXT,
  invoice_id TEXT,
  subscription_id TEXT,
  event_created INTEGER NOT NULL,
  period_end INTEGER,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS membership_user_status ON membership_grants(user_id,status);
CREATE INDEX IF NOT EXISTS membership_payment ON membership_grants(payment_intent);
CREATE INDEX IF NOT EXISTS membership_customer ON membership_grants(customer_id);
CREATE TABLE IF NOT EXISTS provider_events (
  id TEXT PRIMARY KEY,
  created INTEGER NOT NULL,
  processed INTEGER NOT NULL
);
