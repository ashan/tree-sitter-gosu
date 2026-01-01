package nz.co.acc.plm.integration.ir.inbound


uses nz.co.acc.integration.ir.record.CARA4Record
uses nz.co.acc.integration.ir.record.parser.RecordParser
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.lang.invoke.MethodHandles
uses java.math.BigDecimal

/**
 * Created by Chris Anderson on 14/05/2020.
 * JUNO-1304 skip salary/wage earner record
 */
class IRInboundWorkQueueHelper {
  var _recordParser : RecordParser
  private static final var _log = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  construct() {
    _recordParser = new RecordParser()
  }

  /**
   * ChrisA 14/05/2020 JUNO-3104 if this is a salary/wage earner; set to skipped by system
   * Checks a payload when creating the new inbound record.
   * <p>
   * For CARA4 only
   * <p>
   *
   * @param inboundRecords Sorted by recordSequence
   */
  public function determineCARA4RecordStatus(payload : String, externalKey : String) : IRInboundRecordStatus_ACC {
    // Parse a payload when creating the inbound record
    var parseResult = _recordParser.parseCARA4Payload(externalKey, payload)
    if (!parseResult.IsPayloadValid) {
      _log.error_ACC("Failed to parse CARA4 record: externalKey=${externalKey}, validationErrors=${parseResult.getValidationErrors()}")
      return IRInboundRecordStatus_ACC.TC_INVALIDPAYLOAD
    } else {
      // Check for earnings
      var recordDetails = parseResult.Record
      if (isWageSalaryEarnerRecord(recordDetails)) {
        _log.info("Skipping salary/wage earner CARA4 record: ACCID=${recordDetails.AccNumber}, externalKey=${externalKey}")
        return IRInboundRecordStatus_ACC.TC_SKIPPEDBYSYSTEM
      } else {
        return IRInboundRecordStatus_ACC.TC_NOACCOUNT
      }
    }
  }

  /**
   * ChrisA 5/04/2020 JUNO-3104 if this is a salary/wage earner; set to skipped by system
   * Processes a passed CARA4 inbound record to determine if a salary/Wage earner that should be
   * skipped by system.
   * <p>
   * For CARA4 only
   * <p>
   *
   * @param inboundRecord
   */
  public static function isWageSalaryEarnerRecord(parsedRecord : CARA4Record) : Boolean {
      // The remaining values must be 0
      if (isZeroOrNullOrEmpty(parsedRecord.EarningsToPAYE)) {
        if (isZeroOrNullOrEmpty(parsedRecord.LTCIncome)) {
          if (isZeroOrNullOrEmpty(parsedRecord.OtherIncome)) {
            if (isZeroOrNullOrEmpty(parsedRecord.OverseasIncome)) {
              if (isZeroOrNullOrEmpty(parsedRecord.PartnershipIncome)) {
                if (isZeroOrNullOrEmpty(parsedRecord.ShareholderEmployeeSalaryNotLiable)) {
                  if (isZeroOrNullOrEmpty(parsedRecord.TotalGrossPayments)) {
                      // This record satisfies the criteria for a salary/wage earner CARA4 file
                      return true
                  }
                }
              }
            }
          }
        }
      }
    return false
  }

  private static function isZeroOrNullOrEmpty(valueToEvaluate : BigDecimal) : Boolean {
    return valueToEvaluate == null or valueToEvaluate.IsZero
  }
}