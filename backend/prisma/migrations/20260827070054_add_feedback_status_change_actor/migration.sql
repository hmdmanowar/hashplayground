-- AddForeignKey
ALTER TABLE "FeedbackStatusChange" ADD CONSTRAINT "FeedbackStatusChange_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;
