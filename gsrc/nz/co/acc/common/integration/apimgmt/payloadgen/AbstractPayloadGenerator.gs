package nz.co.acc.common.integration.apimgmt.payloadgen

/**
 * Base implementation of the {@linkplain PayloadGenerator}
 *
 * @param <T> JSON payload pojo type
 * @param <U> Guidewire entity type to map values from
 */
abstract class AbstractPayloadGenerator<T, U> implements PayloadGenerator<T, U> {
  protected var entity: U

  /**
   * Default constructor
   */
  construct() {
  }

  /**
   * Construct for a given entity
   */
  construct(e: U) {
    this.entity = e
  }

  /**
   * {@inheritDoc}
   */
  override function generate(e: U, flags: GenFlags[]): T {
    if (e == null) {
      return null
    }

    this.entity = e
    return generate(flags)
  }
}
