-- CreateIndex
CREATE INDEX note_chunks_content_tsv_idx ON "note_chunks"
  USING gin (to_tsvector('english', "content"));