package nz.co.acc.plm.integration.ir.ui

/**
 * Created by Chris Anderson on 26/02/2020.
 * JUNO-1856 Simplified IR Inbound Record search
 */
class IRInboundRecordsSearchHelper extends IRUIHelperBase {

  final static var MAX_ERROR_LENGTH = 120

  /**
   * Go to the IR Inbound record detail page, select the given inbound record
   */
  public function gotoInboundRecordDetails(inbound : IRInboundRecord_ACC) {
    var uiHelper = new IRInboundBatchUIHelper(inbound)
    pcf.IRInboundRecordsRepair_ACCPopup.push(uiHelper)
  }

  public static function shortenErrorMessage(message : String) : String {
    if (message == null) {
      return null
    } else {
      return message
          .truncate(MAX_ERROR_LENGTH)
          .replaceAll('\n', ' ')
          .replaceAll('\r', '')
    }
  }
  
}