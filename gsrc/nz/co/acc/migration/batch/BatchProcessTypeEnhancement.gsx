package nz.co.acc.migration.batch

uses gw.api.database.Query

/**
 * Methods to put on enhancement to simply UI logic
 *    or hide the details from caller...
 */
enhancement BatchProcessTypeEnhancement: BatchProcessType {

  /**
   * Based on queue type to derive the latest targets count
   * @return
   */
  public function deriveTargetCountInfo() : String {
    var theCount : Long = null
    var info : String = null
    var q = Query.make(MigrationQueueTargetCount_ACC)
    q.compare(MigrationQueueTargetCount_ACC#QueueType, Equals, this)
    var countRec = q.select().AtMostOneRow
    if (countRec != null) {
      theCount = countRec.TargetsCount
      info = "[${theCount}]"
    }
    return info
  }

}
