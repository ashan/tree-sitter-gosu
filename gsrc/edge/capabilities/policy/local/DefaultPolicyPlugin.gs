package edge.capabilities.policy.local

uses edge.capabilities.policy.lob.ILobPolicyPlugin
uses edge.capabilities.policy.document.local.IIdCardPlugin
uses edge.capabilities.policy.document.IPolicyDocumentsPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.policy.dto.PolicyPeriodDTO
uses edge.capabilities.document.dto.DocumentReferenceDTO
uses edge.capabilities.policy.lob.dto.PolicyLobDataDTO

/**
 * Default implementation of policy plugin.
 */
final class DefaultPolicyPlugin implements IPolicyPlugin {
  
  private var _cardPlugin : IIdCardPlugin
  private var _documentPlugin : IPolicyDocumentsPlugin
  private var _policyLinePlugin : ILobPolicyPlugin<PolicyLobDataDTO>

  @ForAllGwNodes
  @Param("cardPlugin", "Plugin used to fetch information about id cards")
  @Param("documentPlugin", "Plugin used to work with policy documents")
  @Param("policyLinePlugin", "Plugin used to support different LOBs")
  construct(cardPlugin : IIdCardPlugin, documentPlugin : IPolicyDocumentsPlugin,
            policyLinePlugin : ILobPolicyPlugin <PolicyLobDataDTO>) {
    this._cardPlugin = cardPlugin
    this._documentPlugin = documentPlugin
    this._policyLinePlugin = policyLinePlugin
  }

  override function getPolicyPeriodDetails(info : PolicyPeriod) : PolicyPeriodDTO {
    final var res = new PolicyPeriodDTO()
    fillBaseInfo(res, info)
    fillIdCardInfo(res, _cardPlugin.getIdCardDocument(info))
    
    res.DocumentDTOs = _documentPlugin.getPolicyDocuments(info)
      .map(\doc -> _documentPlugin.getDocumentDetails(doc))

    res.Lobs = _policyLinePlugin.getPolicyLineInfo(info)
    return res
  }


  /** Fills a base policy prorpety which are directly available on policy period. */
  public static function fillBaseInfo(result : PolicyPeriodDTO, info : PolicyPeriod) {
    result.Effective = info.PeriodStart
    result.CanUploadDocument = perm.Document.create
    result.Expiration = info.EndOfCoverageDate
  }
  
  /** Fills a card infor on the policy summary. */
  public static function fillIdCardInfo(result : PolicyPeriodDTO, info : DocumentReferenceDTO) {
    if (info != null) {
      result.idCardPublicID = info.DocumentId
      result.idCardSessionID = info.SessionId
    }
  }
}
