package edge.capabilities.quote.lob.dto

uses java.util.Map
uses java.util.HashMap

/**
 * Base class for draft LOB extensions. This class intended to be enhanced by particular LOBs.
 */
class DraftLobDataDTO {
  /** Extension where enhancements could put its data. */
  protected var lobExtensions : Map<typekey.PolicyLine, IDraftLobExtensionDTO> = new HashMap<typekey.PolicyLine, IDraftLobExtensionDTO>()
}
