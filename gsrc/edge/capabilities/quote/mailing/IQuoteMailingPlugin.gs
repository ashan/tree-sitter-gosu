package edge.capabilities.quote.mailing

uses edge.capabilities.quote.dto.QuoteDataDTO


/**
 * Plugin used to send the quote.
 */
interface IQuoteMailingPlugin {
  public function sendMail(sub : Submission, dto : QuoteDataDTO)
}
