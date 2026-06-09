-- Drop social tables in dependency order
DROP TABLE IF EXISTS "Comment";
DROP TABLE IF EXISTS "Like";
DROP TABLE IF EXISTS "Post";
DROP TABLE IF EXISTS "Follow";

-- Remove social columns from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "bio";
ALTER TABLE "User" DROP COLUMN IF EXISTS "displayName";
