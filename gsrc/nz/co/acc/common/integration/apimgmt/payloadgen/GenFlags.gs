package nz.co.acc.common.integration.apimgmt.payloadgen

/**
 * Flags to control json payload generation. <br/>
 * The flags can be used to decide which fields to include in the payload.
 */
enum GenFlags {
  /**
   * Only include the root-level fields of the payload. In other words, no embedded/associated json payload objects
   * should be generated if this flag is passed into a generator.
   */
  ROOT_ONLY
}