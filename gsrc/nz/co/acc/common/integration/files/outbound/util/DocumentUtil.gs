package nz.co.acc.common.integration.files.outbound.util

uses com.guidewire.commons.entity.type.ThreadLocalBundleProvider
uses com.guidewire.pl.system.bundle.NeverPersistedBundle
uses com.guidewire.pl.system.dependency.PLDependencies
uses gw.document.DocumentContentsInfo
uses gw.pl.persistence.core.Bundle
uses gw.plugin.Plugins
uses gw.plugin.document.IDocumentContentSourceBase
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Utils for Documents.
 */
class DocumentUtil {
  private static var _log = StructuredLogger.INTEGRATION_FILE.withClass(DocumentUtil)

  public static function getLevyInvoiceDocument(docUID : String, mimeType : String) : DocumentContentsInfo {
    try {
      var dmsPlugin = Plugins.get("IDocumentContentSource") as IDocumentContentSourceBase
      var document = runInThrowAwayBundle(\bundle -> {
        var document = new Document(bundle)
        document.DocUID = docUID
        document.MimeType = mimeType
        return document
      }, PLDependencies.getUserFinder().findByCredentialName("sys"))
      var documentContentsInfo = dmsPlugin.getDocumentContentsInfo(document, true)
      return documentContentsInfo
    } catch (e : Exception) {
      _log.error_ACC("nz.co.acc.common.integration.files.outbound.util.DocumentUtil ->>  ${e.Message}", e)
    }
    return null
  }

  private static function runInThrowAwayBundle(apiBlock (bundle : Bundle) : Document, user : User) : Document {
    var bundle = new NeverPersistedBundle()
    // logon as user
    var serviceToken = PLDependencies.getServiceTokenManager().createAuthenticatedToken(user)
    PLDependencies.CommonDependencies.setServiceToken(serviceToken)
    ThreadLocalBundleProvider.set(bundle)
    try {
      return apiBlock(bundle)
    } finally {
      ThreadLocalBundleProvider.clear()
    }
  }
}