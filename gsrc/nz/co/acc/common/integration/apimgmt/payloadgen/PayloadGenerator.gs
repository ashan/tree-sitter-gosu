package nz.co.acc.common.integration.apimgmt.payloadgen

/**
 * Generic interface for the JSON payload generators.
 *
 * @param <T> JSON payload pojo type
 * @param <U> Guidewire entity type to map values from
 */
interface PayloadGenerator<T, U> {
  /**
   * Generates json payload. Outputs the payload in the form of the corresponding json pojo.
   *
   * @param flags array of flags to control the payload generation. Pass empty array to
   * @return instance of corresponding json pojo
   */
  function generate(flags: GenFlags[]): T

  /**
   * Generates json payload. Outputs the payload in the form of the corresponding json pojo.
   *
   * @param entity entity to map the values from
   * @param flags array of flags to control the payload generation. Pass empty array to
   * @return instance of corresponding json pojo
   */
  function generate(entity: U, flags: GenFlags[]): T
}