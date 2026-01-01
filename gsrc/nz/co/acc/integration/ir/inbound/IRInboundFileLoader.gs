package nz.co.acc.integration.ir.inbound

uses com.guidewire.pl.system.exception.DBDuplicateKeyException
uses com.google.common.base.Stopwatch
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.integration.ir.inbound.transformer.CARAFile
uses nz.co.acc.integration.ir.inbound.transformer.IRFile
uses nz.co.acc.integration.ir.inbound.transformer.IRFileHeaderRecord
uses nz.co.acc.integration.ir.inbound.transformer.IRFileRecord
uses nz.co.acc.integration.ir.inbound.transformer.InboundIRUtil
uses nz.co.acc.plm.integration.ir.inbound.IRFeedDTO
uses nz.co.acc.plm.integration.ir.inbound.IRInboundWorkQueueHelper

uses java.math.BigDecimal
uses java.math.RoundingMode
uses java.util.concurrent.TimeUnit

class IRInboundFileLoader {
  private var _logger = StructuredLogger.INTEGRATION.withClass(this)

  function loadIRFile(irFile : IRFile) {
    _logger.info("Loading IR file '${irFile}'")
    var schedule = findMatchingSchedule(irFile)
    var batch = createBatchRecord(irFile.Header)

    try {
      loadRecords(batch, irFile.Records)
      batch = setBatchStatusLoaded(irFile.Header, batch)
      var history = createHistory(irFile.FilePath, Optional.empty())
      markScheduleAsCompleted(schedule, history, batch)
      _logger.info("Finished loading IR file '${irFile}'")

    } catch (e : Exception) {
      _logger.error_ACC("Failed to load IR file '${irFile}'", e)
      setBatchStatusFailed(batch, e)
      createHistory(irFile.FilePath, Optional.of(e))
      throw e
    }
  }

  function findMatchingSchedule(irFile : IRFile) : IRSchedule_ACC {
    var levyYear : Integer = null

    if (irFile typeis CARAFile) {
      levyYear = irFile.deriveLevyYear()
    }

    var feedDTO = new IRFeedDTO(
        irFile.Header.RunDate,
        irFile.Header.IRInboundFeedType,
        levyYear)

    _logger.info("Validating schedule for ${feedDTO}")

    var schedule = IRSchedule_ACC.validate(feedDTO)

    if (schedule == null) {
      throw new RuntimeException("Schedule validation failed for ${feedDTO}")
    } else if (schedule.IsBlocked) {
      throw new RuntimeException("Schedule validation failed for ${feedDTO}. Schedule is blocked: ${schedule.RuntimeMessage}")
    } else {
      _logger.info("Schedule is valid for ${feedDTO}")
      return schedule
    }
  }

  function markScheduleAsCompleted(schedule : IRSchedule_ACC, history : IRInboundFileHistory_ACC, batch : IRInboundBatch_ACC) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      schedule = bundle.add(schedule)
      schedule.IRInboundFileHistory = history
      schedule.ExternalKey = batch.BatchId
    })
  }

  function createBatchRecord(headerRecord : IRFileHeaderRecord) : IRInboundBatch_ACC {
    try {
      var runDate = InboundIRUtil.parseIRDate(headerRecord.RunDate).toDate()
      var batchID = headerRecord.IRInboundBatchID
      verifyBatchNotExists(batchID)
      var temporaryBatchID = batchID + "-tmp-" + Date.Now.toISOTimestamp()

      var newBatch : IRInboundBatch_ACC
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        newBatch = new IRInboundBatch_ACC()
        newBatch.BatchId = temporaryBatchID
        newBatch.BatchDate = runDate
        newBatch.IRInboundMode_ACC = IRInboundMode_ACC.TC_REGULAR_FEED
        newBatch.ExternalKey = headerRecord.ExternalKey
        newBatch.Status = IRInboundBatchStatus_ACC.TC_LOADING
      })
      _logger.info("Created IRInboundBatch_ACC record with temporary BatchID=${temporaryBatchID}, ExternalKey=${headerRecord.ExternalKey}")
      return newBatch
    } catch (e : Exception) {
      _logger.error_ACC("Failed to create IRInboundBatch_ACC record", e)
      throw e
    }
  }

  function loadRecords(batch : IRInboundBatch_ACC, records : List<IRFileRecord>) {
    _logger.info("Loading ${records.Count} records for batch ${batch.BatchId}")
    var stopwatch = Stopwatch.createStarted()
    for (record in records index i) {
      var recordNumber = i + 1
      if (recordNumber % 100 == 0) {
        _logger.info("Loading record ${recordNumber} of ${records.Count}")
      }
      try {
        createIRProcessorKey(record.AccNumber)
        var status = getInitialStatusForInboundRecord(record)
        var asciiPayload = record.generatePayload().escaped_ACC()

        gw.transaction.Transaction.runWithNewBundle(\bundle -> {
          var inboundRecord = new IRInboundRecord_ACC()
          inboundRecord.IRExtRecordType_ACC = record.RecordType
          inboundRecord.IRInboundBatch_ACC = batch
          inboundRecord.SequencerKey = record.AccNumber
          inboundRecord.setPayloadFromAscii(asciiPayload)
          inboundRecord.RecordSequence = i
          inboundRecord.Status = status
        })
      } catch (e : Exception) {
        _logger.error_ACC("Failed to insert record ${recordNumber} of ${records.Count}", e)
        throw e
      }
    }
    var elapsedSeconds = new BigDecimal(stopwatch.elapsed(TimeUnit.MILLISECONDS) / 1000.0).setScale(1, RoundingMode.HALF_UP)
    _logger.info("Loading ${records.Count} records for batch ${batch.BatchId} in ${elapsedSeconds} seconds")

  }

  function setBatchStatusLoaded(headerRecord : IRFileHeaderRecord, irInboundBatch : IRInboundBatch_ACC) : IRInboundBatch_ACC {
    var finalBatchID = headerRecord.IRInboundBatchID

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      irInboundBatch = bundle.add(irInboundBatch)
      irInboundBatch.BatchId = finalBatchID
      irInboundBatch.Status = IRInboundBatchStatus_ACC.TC_LOADED
    })

    return irInboundBatch
  }

  function setBatchStatusFailed(irInboundBatch : IRInboundBatch_ACC, e : Exception) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      irInboundBatch = bundle.add(irInboundBatch)
      irInboundBatch.Status = IRInboundBatchStatus_ACC.TC_FAILED
      irInboundBatch.ErrorMessage = e.StackTraceAsString?.truncate(1300)
    })
  }

  function getInitialStatusForInboundRecord(record : IRFileRecord) : IRInboundRecordStatus_ACC {
    if (record.RecordType == IRExtRecordType_ACC.TC_CREG1) {
      // CREG record
      return IRInboundRecordStatus_ACC.TC_UNPROCESSED
    } else {
      // CARA record
      if (Account.exists_ACC(record.AccNumber)) {
        return IRInboundRecordStatus_ACC.TC_UNPROCESSED
      } else {
        if (record.RecordType == IRExtRecordType_ACC.TC_CARA4) {
          // test it for a wage/salary earner which returns skippedbysystem if it is
          return new IRInboundWorkQueueHelper().determineCARA4RecordStatus(record.generatePayload(), "null")
        } else {
          return IRInboundRecordStatus_ACC.TC_NOACCOUNT
        }
      }
    }
  }

  /**
   * Creates an entry in the IRProcessorKey table representing an ACC ID.
   * <p>
   * IRProcessorWorkQueue needs a source of work items for accounts that may not exist in PC yet.
   *
   * @param sequencerKey
   */
  function createIRProcessorKey(sequencerKey : String) {
    var exists = Query.make(IRProcessorKey_ACC)
        .compare(IRProcessorKey_ACC#ACCID, Relop.Equals, sequencerKey)
        .select().getCountLimitedBy(1) > 0

    if (not exists) {
      try {
        gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
          var irProcessorKey = new IRProcessorKey_ACC()
          irProcessorKey.ACCID = sequencerKey
        })
      } catch (e : DBDuplicateKeyException) {
        _logger.info("createIRProcessorKey: Ignoring DBDuplicateKeyException: ${e.Message}")
      } catch (e : Exception) {
        _logger.info("createIRProcessorKey: Ignoring Exception: ${e.Message}")
      }
    }
  }

  function verifyBatchNotExists(batchID : String) {
    var existingBatch = Query.make(IRInboundBatch_ACC).compare(IRInboundBatch_ACC#BatchId, Relop.Equals, batchID).select().FirstResult
    if (existingBatch != null) {
      throw new RuntimeException("Batch already exists with BatchID=${batchID}")
    }
  }


  private function createHistory(filePath : String, error : Optional<Throwable>) : IRInboundFileHistory_ACC {
    var history : IRInboundFileHistory_ACC
    if (error.Present) {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        history = new IRInboundFileHistory_ACC()
        history.Filename = filePath
        history.Failed = true
        history.Exception = error.get().StackTraceAsString
      })
    } else {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        history = new IRInboundFileHistory_ACC()
        history.Filename = filePath
        history.Failed = false
      })
    }
    return history
  }

}