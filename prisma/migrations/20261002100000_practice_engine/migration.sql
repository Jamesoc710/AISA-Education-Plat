-- CreateTable
CREATE TABLE "review_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "box" INTEGER NOT NULL DEFAULT 1,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "lastResult" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "response" TEXT,
    "feedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_items_userId_dueAt_idx" ON "review_items"("userId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "review_items_userId_conceptId_key" ON "review_items"("userId", "conceptId");

-- CreateIndex
CREATE INDEX "practice_attempts_userId_createdAt_idx" ON "practice_attempts"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "practice_attempts_userId_conceptId_idx" ON "practice_attempts"("userId", "conceptId");

-- AddForeignKey
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- New tables must close the PostgREST anon API (see scripts/enable-rls.sql).
ALTER TABLE "review_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "practice_attempts" ENABLE ROW LEVEL SECURITY;
