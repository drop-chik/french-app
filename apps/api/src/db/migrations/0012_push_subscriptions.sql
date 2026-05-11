CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"       uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "endpoint"      text NOT NULL,
  "p256dh"        text NOT NULL,
  "auth"          text NOT NULL,
  "user_agent"    varchar(255),
  "created_at"    timestamp DEFAULT now() NOT NULL,
  "last_used_at"  timestamp,
  CONSTRAINT "push_subscriptions_endpoint_uq" UNIQUE ("endpoint")
);

CREATE INDEX IF NOT EXISTS "idx_push_subs_user" ON "push_subscriptions" ("user_id");
