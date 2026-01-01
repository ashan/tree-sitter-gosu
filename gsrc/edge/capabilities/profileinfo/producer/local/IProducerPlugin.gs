package edge.capabilities.profileinfo.producer.local

uses edge.capabilities.profileinfo.producer.dto.ProducerSummaryDTO

/**
 * Plugin used to access producer contacts.
 */
interface IProducerPlugin {
  /** Fetches producer contact summary for the given account. */
  /**/
  function getProducerSummary(account: Account) : ProducerSummaryDTO
}
