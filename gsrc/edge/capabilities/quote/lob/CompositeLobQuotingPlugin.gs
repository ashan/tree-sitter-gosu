package edge.capabilities.quote.lob
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.quote.lob.dto.QuoteLobDataDTO
uses java.util.Map
uses edge.di.boot.Bootstrap
uses edge.di.CapabilityAndPath
uses edge.di.Path
uses gw.api.productmodel.PolicyLinePattern

/**
 * Composite LOB dispatch.
 */
class CompositeLobQuotingPlugin implements ILobQuotingPlugin <QuoteLobDataDTO> {

  private var _lobMap : Map<String, ILobQuotingPlugin >

  /**
   * Creates a new composite quote plugin
   */
  @ForAllGwNodes
  construct() {
    //Using Bootstrap as a service locator until DI framework evolves to support injecting a map of dependencies
    _lobMap = Bootstrap.forceCreateMap< ILobQuotingPlugin >(new CapabilityAndPath("quote", Path.parse("quote.quoting.lob")))
  }


  override function getQuoteDetails(pp : PolicyPeriod) : QuoteLobDataDTO {
    final var res = new QuoteLobDataDTO()
    for (e in _lobMap.entrySet()) {
      res[e.Key] = e.Value.getQuoteDetails(pp)
    }
    return res
  }

  override function updateCustomQuote(pp: PolicyPeriod, update: QuoteLobDataDTO) {
    for (e in _lobMap.entrySet()) {
      e.Value.updateCustomQuote(pp, update[e.Key])
    }
  }

  override function generateVariants(base: PolicyPeriod) {
    if ( base.Lines.Count == 1 ) {
      for (e in _lobMap.entrySet()) {
        e.Value.generateVariants(base)
      }
    } else {
      doGenerateVariants(base)
    }
  }

  protected function doGenerateVariants(base: PolicyPeriod) {
    // Extension point used to generate quote variants for submissions with more than one policy line.
    //    base.Policy.ProductCode
  }
}
