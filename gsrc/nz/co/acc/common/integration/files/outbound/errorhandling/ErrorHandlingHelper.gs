package nz.co.acc.common.integration.files.outbound.errorhandling

uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.plm.integration.files.outbound.utils.ActivityUtil_ACC


/**
 * Created by ChavezD on 13/12/2016.
 */
class ErrorHandlingHelper {

  private static var _log = StructuredLogger.INTEGRATION.withClass(ErrorHandlingHelper)

  // A specific record has failed
  static function createRecordFailedActivity(bundle: Bundle, obrHeader: OutBoundHeader_ACC, obrAcc: OutBoundRecord_ACC, t: Throwable) {
    if (_log.DebugEnabled) {
      _log.debug("Creating an 'Outbound Record Failed' activity...")
    }
    var subject = "Outbound Record Error: ${obrAcc.getPublicID()}"
    ActivityUtil_ACC.createOutboundFailureActivity(bundle, obrHeader, obrAcc, subject, t.getMessage())
  }

  static function createRecordFailedActivity(bundle: Bundle, outboundRecord: OutBoundRecord_ACC, msg: String): void {
    if (_log.DebugEnabled) {
      _log.debug( "Creating an 'Outbound Record Failed' activity...")
    }
    var subject = "Outbound Record Error: ${outboundRecord.getPublicID()}"
    ActivityUtil_ACC.createOutboundFailureActivity(bundle, null, outboundRecord, subject, msg)
  }

  static function createBatchFailedActivity(bundle: Bundle, outboundHeader: OutBoundHeader_ACC, ex: Exception, queueName: String = null): void {
    if (_log.DebugEnabled) {
      _log.debug("Creating an 'Outbound Batch Failed' activity...")
    }

    var subject = "File Outbound Batch Error: ${outboundHeader.getPublicID()}"
    ActivityUtil_ACC.createOutboundFailureActivity(bundle, outboundHeader, null, subject, ex.getMessage(), queueName)
  }
}