-- CreateTable
CREATE TABLE "guest_try_usages" (
    "id" TEXT NOT NULL,
    "anonymous_id" TEXT NOT NULL,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_try_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_try_usages_anonymous_id_key" ON "guest_try_usages"("anonymous_id");
