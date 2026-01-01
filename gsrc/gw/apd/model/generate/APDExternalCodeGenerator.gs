package gw.apd.model.generate

/**
 * Allows additional processing to be done when an APD product is generated to produce an installed product. This
 * will only be executed after the product has passed generation-time validations.
 */
@Export
class APDExternalCodeGenerator {
  var _product : APDProduct

  construct(product : APDProduct) {
    _product = product
  }

  /**
   * Hook to perform additional tasks when an APD product is generated.
   */
  function generateConfig() {
    // Empty by default
  }
}