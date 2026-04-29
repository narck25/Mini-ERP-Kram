-- AddForeignKey
ALTER TABLE "job_vacancies" ADD CONSTRAINT "job_vacancies_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_vacancies" ADD CONSTRAINT "job_vacancies_autorizadoPorId_fkey" FOREIGN KEY ("autorizadoPorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_vacancies" ADD CONSTRAINT "job_vacancies_voBoPorId_fkey" FOREIGN KEY ("voBoPorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
