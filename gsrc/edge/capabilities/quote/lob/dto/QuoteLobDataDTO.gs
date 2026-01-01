package edge.capabilities.quote.lob.dto

uses java.util.Map
uses java.util.HashMap

/**
 * Base class for draft LOB extensions. This class intended to be enhanced by particular LOBs.
 */
class QuoteLobDataDTO {
  /** Extension where enhancements could put its data. */
  protected var lobExtensions : Map<typekey.PolicyLine, IQuoteLobExtensionDTO> = new HashMap<typekey.PolicyLine, IQuoteLobExtensionDTO>()
}
