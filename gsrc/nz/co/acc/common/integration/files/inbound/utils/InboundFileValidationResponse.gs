package nz.co.acc.common.integration.files.inbound.utils

/**
 * Created by Nithy on 1/12/2016.
 */
public enum InboundFileValidationResponse {

  VALID("SUCCESS - File validated successfully"),
  DUPLICATE_FILE("FAILED - File already processed - Rejected"),
  EMPTY("FAILED - FILE CONTENT IS EMPTY"),
  HEADER_LENGTH("FAILED - Header record length is not correct"),
  DETAIL_LENGTH("FAILED - Detail record length is not correct"),
  TAIL_LENGTH("FAILED - Tail record length is not correct"),
  HEADER_RECORD_TYPE("FAILED - Header record type is not correct"),
  DETAIL_RECORD_TYPE("FAILED - Detail record type is not correct"),
  TAIL_RECORD_TYPE("FAILED - Tail record type is not correct"),
  NO_OF_RECORDS("FAILED - Total number of records not matching with tail content"),
  INVALID_FILE("FAILED - Invalid file name"),
  DETAIL_LINE_COUNT("FAILED - Detail Line count is not correct"),
  HEADER_DATE_FORMAT("FAILED - Header Date format is not correct"),
  //INVALID_DATE_LENGTH("FAILED - Invalid Date Length")
// US453 Geoff Infield 2017-02-26 accommodate valid files that are immediately processed without breaking into messages
  PROCESSING("PROCESSING - file validated, now performing updates..."),
  INVALID_FILE_FORMAT("FAILED - Invalid file name format"),
  INVALID_GNA_FILE_FORMAT("FAILED - Invalid filename, must start either GNAW or GNANZP"),
  INVALID_CREDID("FAILED - credential id is not either Western or NZPost"),
  CREATED_DATE_NOMATCH("FAILED - Creation date and date in file name are not matching"),
  CREATED_DATE_FORMAT_ERROR("FAILED - Creation date or file posted date format error"),
  INVALID_INVOICE_FORMAT("FAILED - One of the invoice is not in correct format"),
  INVALID_VERSION("FAILED - Version number is not one of 0, 1, or 2"),
  INVALID_ENDOFJOB_DESC("FAILED - End of Job description not matching as End of Job"),
  INVALID_ENDOFRUN_DATE_FORMAT("FAILED - End of run date is not in correct format (dd MMMM yyyy hh:mm:ss)"),
  INVALID_SETTLEMENT_DATE_FORMAT("FAILED - Settlement date is not in correct format (dd/mm/yyyy)")
      private final var value : String;

  private construct(msgIndex:String){
      this.value = msgIndex;
  }

  @Override
  public function toString() : String {
      return value;
}
}