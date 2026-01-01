package nz.co.acc.plm.integration.files.outbound

uses gw.pl.persistence.core.Bundle
uses nz.co.acc.common.integration.files.outbound.FullCapturableData
uses nz.co.acc.plm.integration.files.outbound.letter.CpxCancellationLetterAction
uses nz.co.acc.plm.integration.files.outbound.letter.CpxLetterAction

/**
 * Created by Nick on 27/03/2017.
 */
class RecordCaptureActionFactory {
  public static function getRecordCaptureAction(recordType: OutBoundRecordType_ACC, bundle: Bundle): FullCapturableData {
    switch (recordType) {
      case OutBoundRecordType_ACC.TC_CPX_OFFER:
      case OutBoundRecordType_ACC.TC_CPX_LAPSED_OFFER:
      case OutBoundRecordType_ACC.TC_CPX_RENEWAL:
      case OutBoundRecordType_ACC.TC_CPX_VARIATION:
        return new CpxLetterAction(recordType, bundle)
      case OutBoundRecordType_ACC.TC_CPX_CANCEL:
        return new CpxCancellationLetterAction(recordType, bundle)
      default:
        return null
    }
  }
}