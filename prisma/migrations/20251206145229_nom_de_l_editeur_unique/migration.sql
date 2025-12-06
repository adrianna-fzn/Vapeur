/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `editors` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Editor_name_key" ON "Editor"("name");
