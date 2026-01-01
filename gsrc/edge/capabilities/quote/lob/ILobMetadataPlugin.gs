package edge.capabilities.quote.lob
/**
 * Interface used by LOBs to extend metadata generation for quote handler. At this moment only question set extensions
 * are supported.
 */
interface ILobMetadataPlugin {
  /**
   * Returns list of question set names used by a LOB.
   */
  public function getQuestionSetCodes() : String[]
}
