package gw.surepath.suite.integration.logging

/**
 *
 * An interface which should be implemented in order to register an obfuscation prior to logging
 * An obfuscation will scramble data going into logs in a pre-defined pattern, which you can control or create
 * For example if you are outputting a key named creditCard to the log and it needs to be obfuscated you
 * would register the obfuscation based on key name inside StructuredLogger by calling the function
 * public static function registerObfuscation(obfuscationKeyName:String, obfuscation : IPIIObfuscation)
 * with registerObfuscation("creditCard", new gw.surepath.suite.integration.logging.obfuscations.CreditCardObfuscation())
 *
 * An obfuscation only needs to be registered once per runtime (its statically cached). Its suggested that you register all known obfucations inside
 * the StructuredLogger.registerObfuscations() function, which gets called on class construction.
 *
 */
public interface IPIIObfuscation {

  /**
   * Send back an obfuscated set of PII. For example credit cards may return XXXX XXXX 3443
   * @param piiData - data to be obfuscated
   * @param key - optionally if obfuscation is reversible you may want to pass a key to the obfuscation algorithm, depending on the implementation
   * @return returns the obfuscated data
   */
  function obfuscatePII(piiData : String, key : String = null) : String

  /**
   * Does this type of obfuscation support reverse obfuscation?
   * @return true, you can reverse the data that was obfuscated, false you cannot reverse it
   */
  function supportsReverseObfuscation() : boolean

  /**
   * If we support reverse obfuscation, this function will reverse the obfuscated string
   * @param data the obfuscated string to reverse the obfuscation on
   * @param key the encryption or obfuscation key used to encode the data (if required for this obfuscation)
   * @return returns the original string if it doesnt support reverse obfuscation, otherwise it returns the reversed obfuscated string
   */
  function reverseObfuscation(data : String,key : String = null) : String

}
