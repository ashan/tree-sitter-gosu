package edge.capabilities.policychange.dto

uses java.util.Map
uses java.util.HashMap

class DraftLobDataDTO {
  /** Extension where enhancements could put its data. */
  protected var lobExtensions : Map<typekey.PolicyLine, IDraftLobExtensionDTO> = new HashMap<typekey.PolicyLine, IDraftLobExtensionDTO>()
}
