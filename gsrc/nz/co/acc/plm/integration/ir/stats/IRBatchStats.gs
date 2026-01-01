package nz.co.acc.plm.integration.ir.stats

uses nz.co.acc.common.util.HikariJDBCConnectionPool

uses nz.co.acc.plm.integration.ir.exec.InboundRecordUtil
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.lang.invoke.MethodHandles

/**
 * Calculates stats for a given batch.
 */
class IRBatchStats {
  private static final var _log = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  var _batch : IRInboundBatch_ACC as IRBatch
  var _recordTypes = IRExtRecordType_ACC.AllTypeKeys
  var _recordStatuses = IRInboundRecordStatus_ACC.AllTypeKeys

  construct(batch : IRInboundBatch_ACC) {
    _batch = batch
  }

  public function rebuildStats() {
    _log.info("Rebuilding stats for batch publicID=${_batch.PublicID}, externalKey=${_batch.ExternalKey}")

    _batch.StatsUpdatedTimestamp = Date.Now

    var grossEarnings = 0.00bd
    var recordTypeMap = new HashMap<IRExtRecordType_ACC, Integer>()
    var recordStatusMap = new HashMap<IRInboundRecordStatus_ACC, Integer>()

    var connection = HikariJDBCConnectionPool.getInstance().getConnection()
    connection.setReadOnly(true)
    var sql = IRStatsQuery.renderToString(_batch.ID.toString())
    var statement = connection.prepareStatement(sql)

    try {
      var resultSet = statement.executeQuery()
      while (resultSet.next()) {
        var code = resultSet.getString(1)

        if (isGrossEarnings(code)) {
          grossEarnings = resultSet.getBigDecimal(2)

        } else if (isRecordStatus(code)) {
          recordStatusMap.put(IRInboundRecordStatus_ACC.get(code), resultSet.getInt(2))

        } else if (isRecordType(code)) {
          recordTypeMap.put(IRExtRecordType_ACC.get(code), resultSet.getInt(2))
        }
      }

    } catch (e : Exception) {
      throw e
    } finally {
      statement.close()
      connection.close()
    }

    _batch.setGrossEarnings(grossEarnings?.toMonetaryAmount())

    updateRecordStatusCounts(recordStatusMap)
    updateRecordTypeCounts(recordTypeMap)

    _log.info("Finished rebuilding stats for batch publicID=${_batch.PublicID}, externalKey=${_batch.ExternalKey}")
  }

  private function isRecordType(code : String) : Boolean {
    return _recordTypes.hasMatch(\recordType -> recordType.Code == code)
  }

  private function isRecordStatus(code : String) : Boolean {
    return _recordStatuses.hasMatch(\recordStatus -> recordStatus.Code == code)
  }

  private function isGrossEarnings(code : String) : Boolean {
    return code == "GrossEarnings"
  }

  private function updateRecordTypeCounts(recordTypeMap: HashMap<IRExtRecordType_ACC, Integer>) {
    _batch.CREGCount = recordTypeMap.getOrDefault(IRExtRecordType_ACC.TC_CREG1, 0)
    _batch.CARA4Count = recordTypeMap.getOrDefault(IRExtRecordType_ACC.TC_CARA4, 0)
    _batch.CARA5Count = recordTypeMap.getOrDefault(IRExtRecordType_ACC.TC_CARA5, 0)
    _batch.CARA6Count = recordTypeMap.getOrDefault(IRExtRecordType_ACC.TC_CARA6, 0)
  }

  private function updateRecordStatusCounts(recordStatusMap: HashMap<IRInboundRecordStatus_ACC, Integer>) {
    var processedCount = 0
    var unprocessedCount = 0
    var skippedCount = 0
    var errorCount = 0
    var unknownCount = 0

    for (recordStatus in recordStatusMap.Keys) {
      if (InboundRecordUtil.isProcessedStatus(recordStatus)) {
        processedCount += recordStatusMap.get(recordStatus)
      } else if (InboundRecordUtil.isUnprocessedStatus(recordStatus)) {
        unprocessedCount += recordStatusMap.get(recordStatus)
      } else if (InboundRecordUtil.isSkippedStatus(recordStatus)) {
        skippedCount += recordStatusMap.get(recordStatus)
      } else if (InboundRecordUtil.isErrorStatus(recordStatus)) {
        errorCount += recordStatusMap.get(recordStatus)
      } else {
        unknownCount += recordStatusMap.get(recordStatus)
        _log.error_ACC("Record status ${recordStatus} not handled")
      }
    }

    _batch.ProcessedCount = processedCount
    _batch.UnprocessedCount = unprocessedCount
    _batch.SkippedCount = skippedCount
    _batch.ErrorCount = errorCount
    _batch.TotalCount = (unknownCount + processedCount + unprocessedCount + skippedCount + errorCount)
  }

}
