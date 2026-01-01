package nz.co.acc.integration.ir.workqueue


uses nz.co.acc.integration.ir.record.CARA4Record
uses nz.co.acc.integration.ir.record.CARA6Record
uses nz.co.acc.integration.ir.record.CREGRecord
uses nz.co.acc.integration.ir.record.handler.CARA4Handler
uses nz.co.acc.integration.ir.record.handler.CARA5Handler
uses nz.co.acc.integration.ir.record.handler.CARA6Handler
uses nz.co.acc.integration.ir.record.handler.CREGHandler
uses nz.co.acc.integration.ir.record.parser.IRecordParser
uses nz.co.acc.integration.ir.record.parser.RecordParser
uses nz.co.acc.integration.util.OpenPolicyTransactionBlockProgressException
uses nz.co.acc.plm.integration.ir.exec.handler.AddressValidationAPIException
uses nz.co.acc.plm.integration.ir.exec.handler.IRPolicyNotFoundException
uses nz.co.acc.plm.integration.ir.inbound.IRInboundWorkQueueHelper
uses nz.co.acc.plm.integration.validation.nzbnvalidation.MBIEApiClientException
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Processes CREG, CARA4, and CARA6 records from IR.
 * <p>
 * Created by Mike Ourednik on 11/08/2019.
 */
class IRInboundRecordProcessor {
  private final static var _log = StructuredLogger.INTEGRATION.withClass(IRInboundRecordProcessor)
  private final static var MAX_RETRY_ATTEMPTS = 2

  private var _dao : IRInboundRecordProcessorDAO
  private var _recordParser : IRecordParser
  private var _cara4Handler : CARA4Handler
  private var _cara5Handler : CARA5Handler
  private var _cara6Handler : CARA6Handler
  private var _cregHandler : CREGHandler
  private var _IRInboundRecordCARA5Processor : IRInboundRecordCARA5Processor

  construct() {
    this(new IRInboundRecordProcessorDAO(),
        new RecordParser(),
        new CARA4Handler(),
        new CARA5Handler(),
        new CARA6Handler(),
        new CREGHandler())
  }

  construct(
      dao : IRInboundRecordProcessorDAO,
      recordParser : IRecordParser,
      cara4Handler : CARA4Handler,
      cara5Handler : CARA5Handler,
      cara6Handler : CARA6Handler,
      cregHandler : CREGHandler) {
    this._dao = dao
    this._recordParser = recordParser
    this._cara4Handler = cara4Handler
    this._cara5Handler = cara5Handler
    this._cara6Handler = cara6Handler
    this._cregHandler = cregHandler
    this._IRInboundRecordCARA5Processor = new IRInboundRecordCARA5Processor(dao, recordParser, cara5Handler)
  }

  function processWorkItem(workItem : IRProcessorKey_ACC) {
    processWorkItem(workItem.ACCID)
  }

  function processWorkItem(accID: String) {
    var inboundRecords = _dao.loadIRInboundRecords(accID)

    var inboundCREG = inboundRecords.where(\_record -> _record.IRExtRecordType_ACC == IRExtRecordType_ACC.TC_CREG1)
    var inboundCARA4 = inboundRecords.where(\_record -> _record.IRExtRecordType_ACC == IRExtRecordType_ACC.TC_CARA4)
    var inboundCARA5 = inboundRecords.where(\_record -> _record.IRExtRecordType_ACC == IRExtRecordType_ACC.TC_CARA5)
    var inboundCARA6 = inboundRecords.where(\_record -> _record.IRExtRecordType_ACC == IRExtRecordType_ACC.TC_CARA6)

    _log.info("Processing records for ACCID=${accID}"
        + "(CREG=${inboundCREG.Count}, CARA4=${inboundCARA4.Count}, CARA5=${inboundCARA5.Count}, CARA6=${inboundCARA6.Count})")

    processCREGRecords(inboundCREG)
    processCARARecords(accID, inboundCARA4, inboundCARA5, inboundCARA6)
  }

  private function processCREGRecords(inboundRecordsCREG : List<IRInboundRecord_ACC>) {
    if (inboundRecordsCREG.Empty) {
      return
    }
    processRecordSequence(
        inboundRecordsCREG,
        \inbound -> _recordParser.parseCREGPayload(inbound.PublicID, inbound.deriveCurrentPayload()),
        \record -> processCREGRecord(record))
  }

  private function processCARARecords(
      accID : String,
      inboundCARA4 : List<IRInboundRecord_ACC>,
      inboundCARA5 : List<IRInboundRecord_ACC>,
      inboundCARA6 : List<IRInboundRecord_ACC>) {

    if (inboundCARA4.Empty and inboundCARA5.Empty and inboundCARA6.Empty) {
      return
    }

    var optionalAccount = _dao.findAccount(accID)

    if (!optionalAccount.Present) {
      _log.info("Can not process CARA records for ACCID=${accID}. Account not found.")
      _dao.setRecordStatusNoAccount(inboundCARA4)
      _dao.setRecordStatusNoAccount(inboundCARA5)
      _dao.setRecordStatusNoAccount(inboundCARA6)
      return
    }

    var account = optionalAccount.get()

    if (_dao.checkIfFailedCregExists(account.ACCID_ACC)) {
      _log.info("Cannot process CARA records for account ${account.ACCID_ACC} which has a CREG record in ERROR state")
      return
    }

    // CARA4
    processRecordSequence(
        inboundCARA4,
        \inbound -> _recordParser.parseCARA4Payload(inbound.PublicID, inbound.deriveCurrentPayload()),
        \record -> processCARA4Record(account, record))

    // CARA6
    processRecordSequence(
        inboundCARA6,
        \inbound -> _recordParser.parseCARA6Payload(inbound.PublicID, inbound.deriveCurrentPayload()),
        \record -> processCARA6Record(account, record))

    // CARA5
    _IRInboundRecordCARA5Processor.processCARA5Records(account, inboundCARA5)
  }

  /**
   * Processes a sequence of inbound records for an account.
   * <p>
   * For CREG, CARA4, and CARA6 only (not CARA5)
   * <p>
   *
   * @param inboundRecords Sorted by recordSequence
   */
  private function processRecordSequence<RecordType>(
      inboundRecords : List<IRInboundRecord_ACC>,
      parserFunction(inboundRecord : IRInboundRecord_ACC) : RecordParser.RecordParserResult<RecordType>,
      handlerFunction(record : RecordType)) {
    for (inboundRecord in inboundRecords) {
      var isSuccess = processRecord(inboundRecord, parserFunction, handlerFunction)
      if (not isSuccess) {
        // stop processing if one fails
        return
      }
    }
  }

  /**
   * Process an individual CREG, CARA4, or CARA6 record. Returns true if successful.
   *
   * @param inboundRecord
   * @param parserFunc
   * @param handlerFunc
   * @param <RecordType>
   * @return
   */
  private function processRecord<RecordType>(
      inboundRecord : IRInboundRecord_ACC,
      parserFunc(inboundRecord : IRInboundRecord_ACC) : RecordParser.RecordParserResult<RecordType>,
      handlerFunc(record : RecordType),
      retryCount : int = 0) : Boolean {

    _log.info("Processing ${inboundRecord.DisplayName_ACC}")

    if (inboundRecord.Status == IRInboundRecordStatus_ACC.TC_ERROR) {
      _log.info("Inbound record ${inboundRecord.DisplayName_ACC} has ERROR state")
      return false
    }

    var parseResult : RecordParser.RecordParserResult<RecordType>

    try {
      parseResult = parserFunc(inboundRecord)
    } catch (e : Exception) {
      _log.error_ACC("Exception when parsing record ${inboundRecord.DisplayName_ACC}", e)
      _dao.setRecordStatusPayloadInvalid(inboundRecord, e.StackTraceAsString.truncate(500))
      return false
    }

    if (!parseResult.IsPayloadValid) {
      var errors = parseResult.getValidationErrors()
      _log.error_ACC("Failed to parse record ${inboundRecord.DisplayName_ACC}")
      _dao.setRecordStatusPayloadInvalid(inboundRecord, errors)
      return false
    }

    _log.info("Processing ${parseResult.Record}")

    try {
      handlerFunc(parseResult.Record)
      return true
    } catch (e : IRPolicyNotFoundException) {
      _log.info("Policy not found for record ${inboundRecord.DisplayName_ACC}. ${e.Message}")
      if (inboundRecord.IRExtRecordType_ACC == IRExtRecordType_ACC.TC_CARA4
          and IRInboundWorkQueueHelper.isWageSalaryEarnerRecord(parseResult.Record as CARA4Record)) {
        _dao.setRecordStatusSkippedBySystem(inboundRecord)
      } else {
        if (inboundRecord.IRExtRecordType_ACC == IRExtRecordType_ACC.TC_CARA6 and retryCount < MAX_RETRY_ATTEMPTS) {
          _log.info("Creating employer policy for record ${inboundRecord.DisplayName_ACC}")
          new IREmployerPolicyUtil().createEmployerPolicy(inboundRecord.SequencerKey)
          processRecord(inboundRecord, parserFunc, handlerFunc, retryCount + 1)
        } else {
          _dao.setRecordStatusNoPolicy(inboundRecord)
        }
      }
      return false
    } catch (e : OpenPolicyTransactionBlockProgressException) {
      _log.info("Cannot proceed for record ${inboundRecord.DisplayName_ACC}. ${e.Message}")
      _dao.setRecordStatusError(inboundRecord, e)
      return false
    } catch (e : AddressValidationAPIException) {
      _log.info("Retryable error for record ${inboundRecord.DisplayName_ACC}. AddressValidationAPIException: ${e.Message}")
      _dao.setRecordStatusRetry(inboundRecord, e)
      return false
    } catch (e : MBIEApiClientException) {
      _log.info("Retryable error for record ${inboundRecord.DisplayName_ACC}. NZBNValidationAPIException: ${e.Message}")
      _dao.setRecordStatusRetry(inboundRecord, e)
      return false
    } catch (e : com.guidewire.pl.system.exception.ConcurrentDataChangeException) {
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        _log.warn_ACC("ConcurrentDataChangeException for record ${inboundRecord.DisplayName_ACC}. Retrying with attempt #${retryCount + 1} after 1000ms delay", e)
        Thread.sleep(1000)
        processRecord(inboundRecord, parserFunc, handlerFunc, retryCount + 1)
      } else {
        _log.error_ACC("ConcurrentDataChangeException for record ${inboundRecord.DisplayName_ACC}. Exceeded retry attempts: ${retryCount}. Failed to proceed record", e)
        _dao.setRecordStatusError(inboundRecord, e)
        return false
      }
      return false
    } catch (e : Exception) {
      _log.error_ACC("Failed to process record ${inboundRecord.DisplayName_ACC}", e)
      _dao.setRecordStatusError(inboundRecord, e)
      return false
    }

  }

  private function processCREGRecord(record : CREGRecord) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      _cregHandler.processRecord(bundle, record)
      _dao.setRecordStatusProcessed(bundle, record)
    })
  }

  private function processCARA4Record(account : Account, record : CARA4Record) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      _cara4Handler.processRecord(bundle, account, record)
      _dao.setRecordStatusProcessed(bundle, record)
    })
  }

  private function processCARA6Record(account : Account, record : CARA6Record) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      _cara6Handler.processRecord(bundle, account, record)
      _dao.setRecordStatusProcessed(bundle, record)
    })
  }

  function withCARA5Handler(cara5Handler : CARA5Handler) : IRInboundRecordProcessor {
    _cara5Handler = cara5Handler
    _IRInboundRecordCARA5Processor = new IRInboundRecordCARA5Processor(_dao, _recordParser, _cara5Handler)
    return this
  }
}
