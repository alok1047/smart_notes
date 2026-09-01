-- CreateIndex
CREATE INDEX "note_chunks_embedding_idx" ON "note_chunks"
  USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);