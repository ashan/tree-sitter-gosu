package nz.co.acc.edge.capabilities.gpa.document

uses edge.capabilities.document.IDocumentSessionPlugin
uses edge.capabilities.document.util.DocumentUtil
uses edge.capabilities.gpa.account.IAccountRetrievalPlugin
uses edge.capabilities.gpa.document.DefaultDocumentPlugin
uses edge.capabilities.gpa.document.dto.DocumentDTO
uses edge.capabilities.helpers.JobUtil
uses edge.capabilities.helpers.PolicyUtil
uses edge.di.annotations.ForAllNodes
uses edge.security.authorization.Authorizer
uses edge.security.authorization.IAuthorizerProviderPlugin

/**
 * Created by lee.teoh on 26/06/2017.
 */
class DocumentPlugin_ACC extends DefaultDocumentPlugin implements IDocumentPlugin_ACC {

  private var _sessionProvider: IDocumentSessionPlugin
  private var _documentAuthorizer : Authorizer<Document>

  @ForAllNodes
  construct(sessionProvider: IDocumentSessionPlugin, aPolicyHelper: PolicyUtil, aJobHelper: JobUtil,
            authorizerProvider: IAuthorizerProviderPlugin, anAccountRetrievalPlugin: IAccountRetrievalPlugin) {
    super(sessionProvider, aPolicyHelper, aJobHelper, authorizerProvider, anAccountRetrievalPlugin)
    this._sessionProvider = sessionProvider
    this._documentAuthorizer = authorizerProvider.authorizerFor(Document)
  }

  override function toDTO(document: Document): DocumentDTO_ACC {
    ensureAccess(document)
    final var dto = new DocumentDTO_ACC()
    DocumentUtil.fillDocumentBase(dto, document)
    dto.PolicyNumber = document?.Policy.LatestPeriod.PolicyNumber
    dto.JobNumber = document?.Job.JobNumber
    dto.Level = document.Level.toString()
    dto.SessionID = _sessionProvider.getDocumentSession()
    dto.InvoiceNumber = document.TaxInvoiceNumber_ACC
    dto.CreatedDate = document?.getCreateTime()
    dto.AccountNumber = document?.getAccID()

    return dto
  }

  /**
   * creates DocumentDTO_ACC for provided Document array
   * @author nitesh.gautam
   * @param Document[]
   * @return DocumentDTO_ACC
   */
  override function toDTOArray(documents: Document[]): DocumentDTO_ACC[] {
    if (documents != null && documents.HasElements) {
      return documents.map(\document -> toDTO(document))
    }

    return new DocumentDTO_ACC[]{}
  }

  /**
   * returns all documents for provided policy
   * @author nitesh.gautam
   * @param policy
   * @return Document
   */
  override function getDocumentsForPolicy(aPolicy: Policy): Document[] {
    if (aPolicy == null) {
      throw new IllegalArgumentException ("Policy must not be null.")
    }
    final var unfilteredDocs = gw.api.database.Query.make(Document).compare("Policy", Equals, aPolicy).select()
    return unfilteredDocs.where(\doc ->  _documentAuthorizer.canAccess(doc)).toTypedArray()
  }
}