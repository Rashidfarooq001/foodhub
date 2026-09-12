-- Migrate existing admins to standard password hash using their P1
UPDATE "User"
SET "password_hash" = "password1_hash"
WHERE "role" IN ('SUPER_ADMIN', 'ADMIN') 
  AND "password1_hash" IS NOT NULL;

-- Mark admins as unverified if phone is not set (failsafe)
UPDATE "User"
SET "is_verified" = false
WHERE "role" IN ('SUPER_ADMIN', 'ADMIN')
  AND ("phone" IS NULL OR "phone" = '');

-- Drop legacy columns
ALTER TABLE "User" DROP COLUMN "password1_hash";
ALTER TABLE "User" DROP COLUMN "password2_hash";
ALTER TABLE "User" DROP COLUMN "admin_dob_hash";
ALTER TABLE "User" DROP COLUMN "admin_favorite_person_hash";
ALTER TABLE "User" DROP COLUMN "admin_recovery_token";
ALTER TABLE "User" DROP COLUMN "admin_recovery_expires_at";
