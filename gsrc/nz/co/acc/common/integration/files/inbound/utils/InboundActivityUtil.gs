package nz.co.acc.common.integration.files.inbound.utils

uses gw.pl.persistence.core.Bundle
uses nz.co.acc.plm.integration.files.inbound.utils.ActivityUtil_ACC

/**
 * Created by Nithy on 26/06/2017.
 */
class InboundActivityUtil {

  static function noAcceptableNonGNAAddressActivity(bundle: Bundle, account: Account, message: String): void {
    var subject = message
    ActivityUtil_ACC.createInboundFailureActivity(bundle, account, subject)
  }

  static function noMatchingdocumentActivity(bundle: Bundle, fileDocumentID: String, documentType: String, account: Account, message: String): void {
    var subject = message
    ActivityUtil_ACC.createInboundFailureActivity(bundle, account, subject)
  }
}
