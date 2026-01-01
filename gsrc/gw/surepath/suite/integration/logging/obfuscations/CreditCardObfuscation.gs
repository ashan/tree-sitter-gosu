package gw.surepath.suite.integration.logging.obfuscations

uses gw.pl.util.StringUtil
uses gw.surepath.suite.integration.logging.IPIIObfuscation

public class CreditCardObfuscation implements IPIIObfuscation{

  /**
   * Obfuscate the Credit card data
   * @param piiData - data to be obfuscated
   * @return the obfuscated credit card #
   */
  override function obfuscatePII(piiData : String, key : String = null) : String {
    if(piiData == null || piiData.isBlank() || piiData.length()<=4)
      return piiData
    return StringUtil.preFill("X".charAt(0), 12, piiData.replaceAll("\\S","X").substring(0,piiData.length() - 4)+piiData.substring(piiData.length() - 4)).toString()
  }

  /**
   * We dont support reversing this PII
   * @return false to indicate we dont support
   */
  override function supportsReverseObfuscation() : boolean {
    return false
  }

  /**
   * We dont support it, so just return the original data as per spec.
   * @param data the obfuscated string to reverse the obfuscation on
   * @param key the encryption or obfuscation key used to encode the data (if required for this obfuscation)
   * @return
   */
  override function reverseObfuscation(data : String, key : String = null) : String {
    return data
  }

}