-- DropIndex
DROP INDEX "note_chunks_embedding_idx";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "reset_token_expiry" TIMESTAMP(3),
ADD COLUMN     "reset_token_hash" TEXT,
ALTER COLUMN "google_id" DROP NOT NULL;

-- Recreate the HNSW embedding index (Prisma does not track it in the schema,
-- so it is dropped and recreated manually around model diffs).
CREATE INDEX "note_chunks_embedding_idx" ON "note_chunks"
  USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
