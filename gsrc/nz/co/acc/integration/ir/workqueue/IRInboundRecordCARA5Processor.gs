package nz.co.acc.integration.ir.workqueue


uses nz.co.acc.integration.ir.record.CARA5Record
uses nz.co.acc.integration.ir.record.handler.CARA5Handler
uses nz.co.acc.integration.ir.record.handler.exception.CARA5Exception
uses nz.co.acc.integration.ir.record.parser.IRecordParser
uses nz.co.acc.integration.ir.record.parser.RecordParser
uses nz.co.acc.integration.util.OpenPolicyTransactionBlockProgressException
uses nz.co.acc.plm.integration.ir.exec.handler.IRPolicyNotFoundException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses org.apache.commons.lang3.StringUtils

/**
 * Processes CARA5 (shareholder) records from IR.
 * <p>
 * Created by Mike Ourednik on 11/08/2019.
 */
class IRInboundRecordCARA5Processor {
  private var _dao : IRInboundRecordProcessorDAO
  private var _recordParser : IRecordParser
  private var _cara5Handler : CARA5Handler
  static private var _log = StructuredLogger.INTEGRATION.withClass(IRInboundRecordCARA5Processor)

  construct() {
    this(new IRInboundRecordProcessorDAO(),
        new RecordParser(),
        new CARA5Handler())
  }

  construct(
      dao : IRInboundRecordProcessorDAO,
      recordParser : IRecordParser,
      cara5Handler : CARA5Handler) {
    this._dao = dao
    this._recordParser = recordParser
    this._cara5Handler = cara5Handler
  }


  /**
   * Processes CARA5/Shareholder records for an account.
   * <p>
   * Shareholder earnings records are grouped by levy year
   * and processed as a single policy transaction per levy year
   */
  public function processCARA5Records(account : Account, inboundRecords : List<IRInboundRecord_ACC>) {

    if (inboundRecords.Empty) {
      return
    }

    var cara5Records = parseCARA5Records(account, inboundRecords)

    if (cara5Records.HasElements) {

      var recordExternalKeyMap = buildRecordExternalKeyMap(inboundRecords)
      var recordSequenceMap = buildRecordSequenceMap(inboundRecords)
      var recordStatusMap = buildRecordStatusMap(inboundRecords)

      var recordsGroupedByLevyYear : List<Map.Entry<Integer, Set<CARA5Record>>> =
          cara5Records
              .partition(\record -> record.PremiumYear)
              .mapValues(\value -> value.toSet())
              .entrySet()
              .toList()
              .orderBy(\entry -> entry.Key)

      for (recordGroup in recordsGroupedByLevyYear) {
        _log.info("Processing ${recordGroup.Value.Count} CARA5 records for account ${account.ACCID_ACC}, year ${recordGroup.Key}")

        var errorRecord = recordGroup.Value.firstWhere(\record -> isErrorStatus(recordStatusMap.get(record.InboundRecordPublicID)))

        if (errorRecord != null) {
          var errorRecordStatus = recordStatusMap.get(errorRecord.InboundRecordPublicID)
          _log.info("Cannot process CARA5 records for account ${account.ACCID_ACC}, year ${recordGroup.Key}. "
              + "Record ${errorRecord.InboundRecordPublicID} has status '${errorRecordStatus}'")
        } else {
          processCARA5RecordsForLevyYear(
              account, recordGroup.Key, recordGroup.Value.toList(), recordExternalKeyMap, recordSequenceMap)
        }
      }
    }
  }

  private function isErrorStatus(status : IRInboundRecordStatus_ACC) : Boolean {
    return status == IRInboundRecordStatus_ACC.TC_ERROR
        or status == IRInboundRecordStatus_ACC.TC_INVALIDPAYLOAD
  }

  private function buildRecordExternalKeyMap(inboundRecords : List<IRInboundRecord_ACC>) : HashMap<String, String> {
    var map = new HashMap<String, String>(inboundRecords.Count)
    for (inbound in inboundRecords) {
      var externalKey = inbound.IRInboundBatch_ACC.ExternalKey
      if (StringUtils.isBlank(externalKey)) {
        throw new RuntimeException("ExternalKey is null for batch ${inbound.IRInboundBatch_ACC.PublicID}")
      }
      map.put(inbound.PublicID, externalKey)
    }
    return map
  }

  private function buildRecordSequenceMap(inboundRecords : List<IRInboundRecord_ACC>) : HashMap<String, Long> {
    var map = new HashMap<String, Long>(inboundRecords.Count)
    for (inbound in inboundRecords) {
      map.put(inbound.PublicID, inbound.RecordSequence)
    }
    return map
  }

  private function buildRecordStatusMap(inboundRecords : List<IRInboundRecord_ACC>) : HashMap<String, IRInboundRecordStatus_ACC> {
    var map = new HashMap<String, IRInboundRecordStatus_ACC>(inboundRecords.Count)
    for (inbound in inboundRecords) {
      inbound.refresh()
      map.put(inbound.PublicID, inbound.Status)
    }
    return map
  }

  private function verifyNoDuplicateShareholders(records : Collection<CARA5Record>) {

    var accIDs = records
        .map(\record -> record.ACCNumberShareholder?.trim())
        .where(\accID -> StringUtils.isNotBlank(accID))

    if (accIDs.Count > accIDs.toSet().Count) {
      throw new RuntimeException("Duplicates in list of shareholder ACCIDs: ${accIDs}")
    }

  }

  /**
   * Parses and returns list of CARA5 records only if there were no parsing errors
   *
   * @param inboundRecords
   * @return
   */
  private function parseCARA5Records(account : Account, inboundRecords : List<IRInboundRecord_ACC>) : HashSet<CARA5Record> {

    var result = new HashSet<CARA5Record>(inboundRecords.Count)

    for (inboundRecord in inboundRecords) {
      var parseResult : RecordParser.RecordParserResult<CARA5Record>

      try {
        parseResult = _recordParser.parseCARA5Payload(inboundRecord.PublicID, inboundRecord.deriveCurrentPayload())
      } catch (e : Exception) {
        _log.error_ACC("Aborting CARA5 processing for ${account.ACCID_ACC}. Exception when parsing record ${inboundRecord.DisplayName_ACC}", e)
        _dao.setRecordStatusPayloadInvalid(inboundRecord, e.StackTraceAsString.truncate(500))
        return {}
      }

      if (not parseResult.IsPayloadValid) {
        _log.warn_ACC("Aborting CARA5 processing for ${account.ACCID_ACC}. Failed to parse record ${inboundRecord.DisplayName_ACC}")
        _dao.setRecordStatusPayloadInvalid(inboundRecord, parseResult.getValidationErrors())
        return {}
      } else {
        result.add(parseResult.Record)
      }


    }

    return result
  }

  private function getLatestSetOfRecordsAndSupersede(
      records : List<CARA5Record>,
      recordExternalKeyMap : HashMap<String, String>) : List<CARA5Record> {

    var externalKeys = records.map(\record -> recordExternalKeyMap.get(record.InboundRecordPublicID)).toSet()

    if (externalKeys.Count == 1) {
      return records

    } else {
      var latestExternalKey = externalKeys.max()
      _log.info("Multiple external keys ${externalKeys}. Using latest ${latestExternalKey}")

      // supersede
      var recordsToProcess = records.where(\record ->
          recordExternalKeyMap.get(record.InboundRecordPublicID) == latestExternalKey)

      var recordsToSupersede = records.where(\record ->
          recordExternalKeyMap.get(record.InboundRecordPublicID) != latestExternalKey)

      _log.info("Superseding records ${recordsToSupersede.map(\record -> record.InboundRecordPublicID)}")
      _dao.setRecordStatusSkipped(recordsToSupersede)

      return recordsToProcess
    }
  }

  private function processCARA5RecordsForLevyYear(
      account : Account,
      year : Integer,
      records : List<CARA5Record>,
      recordExternalKeyMap : HashMap<String, String>,
      recordSequenceMap : HashMap<String, Long>) {

    var publicIDs = records.map(\record -> record.InboundRecordPublicID)

    _log.info("Processing CARA5 records ${publicIDs}")
    try {
      records = getLatestSetOfRecordsAndSupersede(records, recordExternalKeyMap)
      verifyNoDuplicateShareholders(records)

      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        // process records
        _cara5Handler.processRecordSet(bundle, account, records.toSet())
        // update status to processed
        records.each(\record -> _dao.setRecordStatusProcessed(bundle, record))
      })
    } catch (e : CARA5Exception) {
      // this exception captures details of the specific shareholder record that failed
      _log.error_ACC("Cannot process CARA5 record ${e.InboundRecordPublicID} for account=${account.ACCID_ACC}, year=${year}", e)
      var record = records.firstWhere(\record -> record.InboundRecordPublicID == e.InboundRecordPublicID)
      _dao.setRecordStatusError(record.InboundRecordPublicID, e)

    } catch (e : OpenPolicyTransactionBlockProgressException) {
      _log.info("Cannot process CARA5 records for account=${account.ACCID_ACC}, year=${year}. ${e.Message}")
      var earliestRecord = records.minBy(\record -> recordSequenceMap.get(record.InboundRecordPublicID))
      _dao.setRecordStatusError(earliestRecord.InboundRecordPublicID, e)

    } catch (e : IRPolicyNotFoundException) {
      _log.info("Cannot process CARA5 records for account=${account.ACCID_ACC}, year=${year}. ${e.Message}")
      records.each(\record -> _dao.setRecordStatusNoPolicy(record.InboundRecordPublicID))

    } catch (e : Exception) {
      _log.error_ACC("Failed to process CARA5 records for account=${account.ACCID_ACC}, year=${year}", e)
      var earliestRecord = records.minBy(\record -> recordSequenceMap.get(record.InboundRecordPublicID))
      _dao.setRecordStatusError(earliestRecord.InboundRecordPublicID, e)

    }
  }
}