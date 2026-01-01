package nz.co.acc.plm.integration.ir.load

/**
 * All the methods on "IRInboundRecord_ACC" related to initialisation.
 */
enhancement IRInboundRecordEnhancement: IRInboundRecord_ACC {

  /**
   * Sets PayloadString variable. Unicode characters from the input string will be escaped.
   * E.g. payload="Māori" is stored as this.PayloadString="M\u0101ori".
   * <p>
   * Access to PayloadString should be restricted to this setter in order to handle unicode characters.
   *
   * @param payload
   */
  function setPayloadFromUnicode(unicodePayload: String) {
    this.PayloadString = unicodePayload?.escaped_ACC()
  }

  function setPayloadFromAscii(asciiPayload: String) {
    this.PayloadString = asciiPayload
  }

  /**
   * Returns PayloadString with UTF-8 characters decoded from the underlying string with escape sequences.
   * E.g. this.PayloadString="M\u0101ori" is returned as "Māori".
   * <p>
   * Access to PayloadString should be restricted to this getter in order to handle unicode characters.
   *
   * @return
   */
  function getPayloadAsUnicode(): String {
    return this.PayloadString?.unescaped_ACC()
  }

  function getPayloadAsAscii(): String {
    return this.PayloadString
  }

}
