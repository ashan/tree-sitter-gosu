package edge.capabilities.quote

uses edge.di.annotations.InjectableNode
uses edge.capabilities.quote.session.ISessionPlugin
uses java.lang.IllegalArgumentException
uses edge.capabilities.quote.quoting.IQuotePlugin
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.jsonrpc.annotation.JsonRpcUnauthenticatedMethod
uses edge.capabilities.quote.quoting.dto.QuoteDTO
uses edge.capabilities.quote.lob.ILobMetadataPlugin
uses edge.capabilities.quote.dto.CustomQuoteDTO


class AgentCustomQuoteHandler extends CustomQuoteHandler {

  /**
   * Quoting plugin.
   */
  private var _quotingPlugin : IQuotePlugin

  @InjectableNode
  @Param("sessionPlugin", "Session management plugin")
  @Param("quotingPlugin", "Quoting process plugin implementation")
  @Param("lobMetadataPlugin", "Plugin used to extend metadata generation")
  construct(
      sessionPlugin : ISessionPlugin,
      quotingPlugin : IQuotePlugin,
      lobMetadataPlugin : ILobMetadataPlugin) {
    super(sessionPlugin, quotingPlugin, lobMetadataPlugin)
    this._quotingPlugin = quotingPlugin
  }


  /**
   * Updates the coverages and quoted premium on a custom quote.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>ISessionPlugin#validateAndRefreshSession(String,String)</code> - to pull the session id out of
   *       CustomQuoteDTO where it validates whether the session is valid or not</dd>
   *   <dd><code>IQuotePlugin#syncCustomQuoteCoverages(PolicyPeriod,QuoteDTO)</code> - to update the coverages for a custom quote
   *   and synchronize those coverages with the product model</dd>
   *   <dd><code>IQuotePlugin#toQuoteDTO(PolicyPeriod)</code> - to convert the quoted policy period to a QuoteDTO</dd>
   *   <dt>Throws:</dt>
   *   <dd><code>IllegalArgumentException</code> - If there is no matching custom quote found in a quoted status</dd>
   * </dl>
   *
   * @param customOffer data that captures an updated Custom Quote Offering
   * @returns the DTO for the updated Custom Quote
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function updateCustomQuoteCoverages(customOffer : CustomQuoteDTO) : QuoteDTO {
    if (customOffer == null) {
      throw new IllegalArgumentException("No offer specified")
    }

    final var policyPeriod = withBundledPolicyPeriod(customOffer, \ period -> {
      if (period.Status != PolicyPeriodStatus.TC_QUOTED && period.Status != PolicyPeriodStatus.TC_DRAFT) {
        // Throw an exception to prevent the custom period to be saved with UWIssues
        throw new IllegalArgumentException("Cannot update coverages on a period that does not have draft or quoted status "+period.Status)
      }
      _quotingPlugin.syncCustomQuoteCoverages(period, customOffer.Quote)
      return period
    })

    return _quotingPlugin.toQuoteDTO(policyPeriod, true)
  }


  /**
   * Updates the coverages on a custom quote without re-quoting
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>ISessionPlugin#validateAndRefreshSession(String,String)</code> - to pull the session id out of
   *       CustomQuoteDTO where it validates whether the session is valid or not</dd>
   *   <dd><code>IQuotePlugin#updateCustomQuote(PolicyPeriod,QuoteDTO)</code> - to try update the custom quote</dd>
   *   <dd><code>IQuotePlugin#toQuoteDTO(PolicyPeriod)</code> - to convert the quoted policy period to a QuoteDTO</dd>
   *   <dt>Throws:</dt>
   *   <dd><code>IllegalArgumentException</code> - If there is no matching custom quote found in a quoted status</dd>
   * </dl>
   *
   * @param customOffer data that captures an updated Custom Quote Offering
   * @returns the DTO for the updated Custom Quote
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function updateCustomQuote(customOffer : CustomQuoteDTO) : QuoteDTO {
    if (customOffer == null) {
      throw new IllegalArgumentException("No offer specified")
    }

    final var policyPeriod = withBundledPolicyPeriod(customOffer, \ period -> {
      if (period.Status != PolicyPeriodStatus.TC_QUOTED && period.Status != PolicyPeriodStatus.TC_DRAFT) {
        // Throw an exception to prevent the custom period to be saved with UWIssues
        throw new IllegalArgumentException("Cannot update coverages on a period that does not have draft or quoted status")
      }
      _quotingPlugin.updateCustomQuote(period, customOffer.Quote)
      return period
    })

    return _quotingPlugin.toQuoteDTO(policyPeriod, true)
  }

}
