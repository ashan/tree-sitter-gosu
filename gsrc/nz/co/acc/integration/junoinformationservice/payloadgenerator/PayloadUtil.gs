package nz.co.acc.integration.junoinformationservice.payloadgenerator

class PayloadUtil {

  /**
   * Remove brackets from ACCID
   *
   * @param accID
   * @return
   */
  static function normalizeID(accID : String) : String {
    if (accID.contains("(")) {
      return accID.replaceAll('\\(', '').replaceAll('\\)', '')
    } else {
      return accID
    }
  }

}