package nz.co.acc.migration.util

uses entity.Job

/**
 * Migration utility functions
 */
abstract class MigrationUtil_ACC {

  static function copyMigrationJobInfoToJob(sourceMigrationJobInfo : MigrationJobInfo_ACC, targetJob : Job) {
    targetJob.MigrationJobInfo_ACC = (sourceMigrationJobInfo.copy() as MigrationJobInfo_ACC)
    targetJob.MigrationJobInfo_ACC.AEPMigrationInfo = (sourceMigrationJobInfo.AEPMigrationInfo.copy() as AEPMigrationInfo_ACC)
  }
}
