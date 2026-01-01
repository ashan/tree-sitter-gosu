package nz.co.acc.integration.ir.record.parser

uses nz.co.acc.integration.ir.record.CARA4Record
uses nz.co.acc.integration.ir.record.CARA5Record
uses nz.co.acc.integration.ir.record.CARA6Record
uses nz.co.acc.integration.ir.record.CREGRecord
uses nz.co.acc.integration.ir.record.parser.RecordParser.RecordParserResult

/**
 * Created by Mike Ourednik on 17/08/2019.
 */
interface IRecordParser {
  public function parseCREGPayload(
      inboundRecordPublicID : String, payload : String) : RecordParserResult<CREGRecord>

  public function parseCARA4Payload(
      inboundRecordPublicID : String, payload : String) : RecordParserResult<CARA4Record>

  public function parseCARA5Payload(
      inboundRecordPublicID : String, payload : String) : RecordParserResult<CARA5Record>

  public function parseCARA6Payload(
      inboundRecordPublicID : String, payload : String) : RecordParserResult<CARA6Record>
}