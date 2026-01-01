package nz.co.acc.plm.integration.webservices.inbound.account.datatypes

uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.util.GosuStringUtil
uses nz.co.acc.constants.ProductSuffix


/**
 * Represents the pair of an ACC ID and ACC product code suffix
 * <p>
 * Created by OurednM on 3/04/2018.
 */
class ACCIDAndSuffix {

  var _accID: String as ACCID
  var _accSuffix: String as Suffix

  construct(accIdWithSuffix: String) {

    if (GosuStringUtil.isBlank(accIdWithSuffix)) {
      throw new IllegalArgumentException("AccountAPI webservice client is searching for an invalid ACCID/suffix. (It is blank/null)")
    }

    if (accIdWithSuffix.length < 2) {
      throw new IllegalArgumentException("AccountAPI webservice client is searching for an invalid ACCID/suffix [${accIdWithSuffix}]")
    }

    var suffix = accIdWithSuffix.charAt(accIdWithSuffix.length - 1) as String
    if (!isValidACCSuffix(suffix)) {
      throw new IllegalArgumentException("AccountAPI webservice client is searching for an invalid ACCID/suffix [${accIdWithSuffix}]")
    }

    this.ACCID = accIdWithSuffix.chop()
    this.Suffix = suffix
  }

  construct(accId: String, suffix: String) {
    this._accID = accId
    this._accSuffix = suffix
  }

  construct(accId: String, suffix: ProductSuffix) {
    this._accID = accId
    this._accSuffix = suffix.toString()
  }

  property get joinedString(): String {
    return ACCID + Suffix
  }

  private function isValidACCSuffix(suffix: String): boolean {
    return (suffix == "D" || suffix == "E" || suffix == "S")
  }

  override function toString(): String {
    return "ACCIDAndSuffix(ACCID=${ACCID}, Suffix=${Suffix})"
  }

  public static function parse(input: String): Optional<ACCIDAndSuffix> {
    try {
      return Optional.of(new ACCIDAndSuffix(input))
    } catch (e: Exception) {
      StructuredLogger.INTEGRATION.info( "ACCIDAndSuffix" + " " + "parse" + " " + e.Message)
      return Optional.empty()
    }
  }

}