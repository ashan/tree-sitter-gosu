package nz.co.acc.plm.integration.ir.exec

/**
 * Created by Mike Ourednik on 4/03/20.
 */
class InboundRecordUtil {

  public static function isErrorStatus(status : IRInboundRecordStatus_ACC) : Boolean {
    return status == IRInboundRecordStatus_ACC.TC_ERROR
        or status == IRInboundRecordStatus_ACC.TC_INVALIDPAYLOAD
        or status == IRInboundRecordStatus_ACC.TC_NOACCOUNT
        or status == IRInboundRecordStatus_ACC.TC_NOPOLICY
  }

  public static function isPayloadOverridableStatus(status : IRInboundRecordStatus_ACC) : Boolean {
    return status == IRInboundRecordStatus_ACC.TC_ERROR
        or status == IRInboundRecordStatus_ACC.TC_INVALIDPAYLOAD
        or status == IRInboundRecordStatus_ACC.TC_RETRY
  }

  public static function isRetryableStatus(status : IRInboundRecordStatus_ACC) : Boolean {
    return status == IRInboundRecordStatus_ACC.TC_ERROR
        or status == IRInboundRecordStatus_ACC.TC_INVALIDPAYLOAD
  }

  public static function isCompletedStatus(status : IRInboundRecordStatus_ACC) : Boolean {
    return isProcessedStatus(status) or isSkippedStatus(status)
  }

  public static function isProcessedStatus(status : IRInboundRecordStatus_ACC) : Boolean {
    return status == IRInboundRecordStatus_ACC.TC_PROCESSED
  }

  public static function isUnprocessedStatus(status : IRInboundRecordStatus_ACC) : Boolean {
    return status == IRInboundRecordStatus_ACC.TC_UNPROCESSED or status == IRInboundRecordStatus_ACC.TC_RETRY
  }

  public static function isSkippedStatus(status : IRInboundRecordStatus_ACC) : Boolean {
    return status == IRInboundRecordStatus_ACC.TC_SKIPPEDBYSYSTEM
        or status == IRInboundRecordStatus_ACC.TC_SKIPPEDBYUSER
  }
}