package nz.co.acc.edge.capabilities.document.util

uses edge.jsonrpc.exception.JsonRpcInvalidParamsException
uses gw.api.database.Query
uses java.lang.UnsupportedOperationException

/**
 * Created by stzhang on 10/26/2017.
 */
class DocumentUtil_ACC {

  private construct() {
    throw new UnsupportedOperationException()
  }

  /**
   * Fetches a document given public document id.
   */
  @Throws(JsonRpcInvalidParamsException, "If document was not found")
  public static function getDocumentByPublicId(publicID : String) : Document {
    final var q = Query.make(Document)
    q.compare("PublicID",Equals, publicID)
    final var doc = q.select().AtMostOneRow
    if ( doc == null ) {
      throw new JsonRpcInvalidParamsException(){: Message = "Invalid Document Public ID"}
    }
    return doc
  }
}