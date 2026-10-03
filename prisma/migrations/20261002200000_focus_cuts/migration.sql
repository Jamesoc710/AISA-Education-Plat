-- Focus cuts (2026-10-02): Trends, Benchmarks + Use cases, Homework/Assignments,
-- formal assessments, MentorNote, Bookmark, and the empty Field Guides track.
--
-- DESTRUCTIVE. Apply only AFTER the code that stopped using these tables is
-- deployed, and only after backing the tables up (see DEPLOY.md).

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_conceptId_fkey";

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_createdById_fkey";

-- DropForeignKey
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_conceptId_fkey";

-- DropForeignKey
ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_userId_fkey";

-- DropForeignKey
ALTER TABLE "formal_quiz_answers" DROP CONSTRAINT "formal_quiz_answers_attemptId_fkey";

-- DropForeignKey
ALTER TABLE "formal_quiz_answers" DROP CONSTRAINT "formal_quiz_answers_questionId_fkey";

-- DropForeignKey
ALTER TABLE "formal_quiz_attempts" DROP CONSTRAINT "formal_quiz_attempts_formalQuizId_fkey";

-- DropForeignKey
ALTER TABLE "formal_quiz_attempts" DROP CONSTRAINT "formal_quiz_attempts_userId_fkey";

-- DropForeignKey
ALTER TABLE "formal_quiz_questions" DROP CONSTRAINT "formal_quiz_questions_formalQuizId_fkey";

-- DropForeignKey
ALTER TABLE "formal_quiz_questions" DROP CONSTRAINT "formal_quiz_questions_questionId_fkey";

-- DropForeignKey
ALTER TABLE "formal_quizzes" DROP CONSTRAINT "formal_quizzes_createdById_fkey";

-- DropForeignKey
ALTER TABLE "homework_submissions" DROP CONSTRAINT "homework_submissions_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "homework_submissions" DROP CONSTRAINT "homework_submissions_userId_fkey";

-- DropForeignKey
ALTER TABLE "mentor_notes" DROP CONSTRAINT "mentor_notes_mentorId_fkey";

-- DropForeignKey
ALTER TABLE "mentor_notes" DROP CONSTRAINT "mentor_notes_recruitId_fkey";

-- DropForeignKey
ALTER TABLE "trend_updates" DROP CONSTRAINT "trend_updates_trendId_fkey";

-- AlterTable
ALTER TABLE "team_drops" DROP COLUMN "trendSlug";

-- DropTable
DROP TABLE "assignments";

-- DropTable
DROP TABLE "benchmarks";

-- DropTable
DROP TABLE "bookmarks";

-- DropTable
DROP TABLE "formal_quiz_answers";

-- DropTable
DROP TABLE "formal_quiz_attempts";

-- DropTable
DROP TABLE "formal_quiz_questions";

-- DropTable
DROP TABLE "formal_quizzes";

-- DropTable
DROP TABLE "homework_submissions";

-- DropTable
DROP TABLE "mentor_notes";

-- DropTable
DROP TABLE "trend_updates";

-- DropTable
DROP TABLE "trends";

-- DropTable
DROP TABLE "use_cases";


-- Field Guides never got content. Remove the track only if nothing points at it.
UPDATE "users" SET "activeTrackId" = NULL
WHERE "activeTrackId" IN (SELECT "id" FROM "tracks" WHERE "slug" = 'field-guides');

DELETE FROM "tracks" t
WHERE t."slug" = 'field-guides'
  AND NOT EXISTS (SELECT 1 FROM "tiers" WHERE "trackId" = t."id")
  AND NOT EXISTS (SELECT 1 FROM "projects" WHERE "trackId" = t."id");
