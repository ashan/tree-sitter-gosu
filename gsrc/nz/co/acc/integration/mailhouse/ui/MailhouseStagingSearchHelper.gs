package nz.co.acc.integration.mailhouse.ui

uses nz.co.acc.plm.integration.ir.ui.IRInboundBatchUIHelper
uses nz.co.acc.plm.integration.ir.ui.IRUIHelperBase

class MailhouseStagingSearchHelper extends IRUIHelperBase {
  final static var MAX_ERROR_LENGTH = 120

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