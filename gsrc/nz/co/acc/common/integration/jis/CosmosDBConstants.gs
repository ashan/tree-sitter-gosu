package nz.co.acc.common.integration.jis

/**
 * Created by Mike Ourednik on 13/07/20.
 */
class CosmosDBConstants {
  public final static var ACCOUNTS_COLLECTION : String = "accounts"
  public final static var POLICYTERMS_COLLECTION : String = "policyterms"
  public final static var DOCUMENTS_COLLECTION : String = "documents"
  public final static var INVOICES_COLLECTION: String = "invoices"
  public final static var TRANSACTIONS_COLLECTION: String = "transactions"

  enum Actions {
    upsert,
    delete
  }
}