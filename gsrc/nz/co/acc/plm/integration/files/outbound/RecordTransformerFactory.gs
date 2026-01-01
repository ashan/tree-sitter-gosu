package nz.co.acc.plm.integration.files.outbound

uses nz.co.acc.common.integration.files.outbound.RecordTransformer
uses nz.co.acc.plm.integration.files.outbound.letter.CpxCancellationLetterRecordTransformer
uses nz.co.acc.plm.integration.files.outbound.letter.CpxLetterRecordTransformer

/**
 * Created by Nick on 27/03/2017.
 */
class RecordTransformerFactory {
  public static function getRecordTransformer(type: OutBoundRecordType_ACC): RecordTransformer {
    switch (type) {
      case OutBoundRecordType_ACC.TC_CPX_OFFER:
      case OutBoundRecordType_ACC.TC_CPX_LAPSED_OFFER:
      case OutBoundRecordType_ACC.TC_CPX_RENEWAL:
      case OutBoundRecordType_ACC.TC_CPX_VARIATION:
        return new CpxLetterRecordTransformer()
      case OutBoundRecordType_ACC.TC_CPX_CANCEL:
        return new CpxCancellationLetterRecordTransformer()
      default:
        return null
    }
  }
}