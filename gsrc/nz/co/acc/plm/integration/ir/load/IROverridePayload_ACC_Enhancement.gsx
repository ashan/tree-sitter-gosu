package nz.co.acc.plm.integration.ir.load

/**
 * Created by OurednM on 28/09/2018.
 */
enhancement IROverridePayload_ACC_Enhancement: IROverridePayload_ACC {
  /**
   * Stores PayloadString with UTF-8 characters encoded as escape sequences.
   * E.g. payload="Māori" is stored as this.PayloadString="M\u0101ori".
   * <p>
   * Access to PayloadString should be restricted to this setter in order to handle unicode characters.
   *
   * @param payload
   */
  function setPayloadFromUnicode(payload: String) {
    this.PayloadString = payload?.escaped_ACC()
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
