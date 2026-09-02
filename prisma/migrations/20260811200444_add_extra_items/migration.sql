-- CreateTable
CREATE TABLE "ExtraItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtraItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExtraItem" ADD CONSTRAINT "ExtraItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
