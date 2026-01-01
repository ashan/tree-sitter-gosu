package nz.co.acc.plm.integration.ir.util

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.system.database.SequenceUtil
uses gw.api.util.DisplayableException
uses gw.api.util.StringUtil
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.File
uses java.text.SimpleDateFormat

/**
 * Helper class for IR Stubs.
 */
class StubsHelper {

  private var _propHelper = new ConstantPropertyHelper()

  /**
   * Based on the folders in StubsFolder, define which mode is available
   */
  public property get AvailableStubInboundModes() : List<IRInboundMode_ACC> {
    var stubFolder = new File(_propHelper.StubsFolder)
    var list = new ArrayList<IRInboundMode_ACC>()
    var folders = stubFolder.listFiles().where(\f -> !f.isFile())
    IRInboundMode_ACC.AllTypeKeys
        .where(\tk -> folders.hasMatch(\f -> f.Name == tk.Code)).each(\tk -> list.add(tk))
    return list
  }

  /**
   * Based on the given mode, list all the stubs for the mode
   */
  public function getAvailableStubs(mode : IRInboundMode_ACC) : List<File> {
    var fn = "getAvailableStubs"

    var path = _propHelper.StubsFolder + File.separator + mode.Code
    StructuredLogger.INTEGRATION.debug( this + " " +  fn + " " + "AbsoluteFilePath [${path}]")

    var modeFolder = new File(path)
    var list = new ArrayList<File>()
    modeFolder.listFiles().each(\f -> list.add(f))
    return list
  }

  /**
   * Load the stubs from the given file or folder
   */
  public function loadStubs(mode : IRInboundMode_ACC, folderOrFile : String) {
    loadStubs(mode, new File(_propHelper.StubsFolder + File.separator + mode.Code + File.separator + folderOrFile))
  }

  /**
   * Make sure sequenced stub files are in correct order
   */
  private function orderSequencedStubFiles(folder : File) : List<File> {
    var fileTable = new HashMap<Integer, File>()
    folder.listFiles().where(\f -> f.isFile()).each(\f -> {
      var tokens = f.Name.split("-")
      fileTable.put(Integer.valueOf(tokens[2]), f)
    })
    var results = new ArrayList<File>()
    fileTable.keySet().order().each(\orderKey ->
        results.add(fileTable.get(orderKey))
    )
    return results
  }

  /**
   * Load the stubs from the given file or folder
   */
  public function loadStubs(mode : IRInboundMode_ACC, folderOrFile : File) {
    var fn = "loadStubs"
    StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "Load stubs from [${folderOrFile.AbsolutePath}]")
    if (mode == IRInboundMode_ACC.TC_DEV_ONLY_MOCK_SEQUENCED_STUBS) {
      loadSequencedStubs(folderOrFile)
    } else if (mode == IRInboundMode_ACC.TC_DEV_ONLY_MOCK_SCHEDULE) {
      loadScheduleStubs(folderOrFile)
    } else if (mode == IRInboundMode_ACC.TC_DEV_ONLY_MOCK_AUTO) {
      loadAutoStubs(folderOrFile)
    } else if (mode == IRInboundMode_ACC.TC_DEV_ONLY_MOCK_STUBS_BY_KEY) {
      loadStubsByKey(folderOrFile)
    }
  }

  /**
   * Load stubs for "DEV_ONLY_MOCK_SEQUENCED_STUBS"
   */
  private function loadSequencedStubs(folderOrFile : File) {
    var fn = "loadSequencedStubs"
    var key = SequenceUtil.next(1, ConstantPropertyHelper.SEQUENCE_INBOUND)
    gw.transaction.Transaction.runWithNewBundle(\b -> {
      var batch = createBatch(IRInboundMode_ACC.TC_DEV_ONLY_MOCK_SEQUENCED_STUBS)
      orderSequencedStubFiles(folderOrFile).each(\f -> {
        StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "Load [${f.Name}]")
        createInboundRecord(batch, f, key)
      })
    })
  }

  /**
   * Load stubs for "TC_DEV_ONLY_MOCK_SCHEDULE"
   */
  private function loadScheduleStubs(folderOrFile : File) {
    var fn = "loadScheduleStubs"
    var schedule = IRSchedule_ACC.findNextSchedule()
    if (schedule == null) {
      throw new DisplayableException("No Schedule available!")
    }
    var tokens = folderOrFile.Name.split("-")
    var dateFormat = new SimpleDateFormat(ConstantPropertyHelper.DATE_FORMAT_yMd)
    var runDate = dateFormat.parse(tokens[0])
    var scheduleType = IRInboundFeedType_ACC.get(tokens[1])
    var scheduleYear = Short.valueOf(tokens[2])

    gw.transaction.Transaction.runWithNewBundle(\b -> {
      var scheduleEdit = BundleHelper.explicitlyAddBeanToBundle(b, schedule, false)
      if (scheduleEdit.match(runDate, scheduleType, scheduleYear)) {
        var batch = createBatch(IRInboundMode_ACC.TC_DEV_ONLY_MOCK_SCHEDULE)
        scheduleEdit.ExternalKey = batch.ExternalKey
        orderSequencedStubFiles(folderOrFile).each(\f -> {
          StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "Load [${f.Name}]")
          createInboundRecord(batch, f, null)
        })
      }
    })
  }

  /**
   * Load stubs for "TC_DEV_ONLY_MOCK_AUTO"
   */
  private function loadAutoStubs(folderOrFile : File) {
    var recordCount = ScriptParameters.DEVOnly_IRAutoBatchSize_ACC
    var batchCount = ScriptParameters.DEVOnly_IRAutoBatchNumber_ACC
    var externalKey = ConstantPropertyHelper.IR_EXTERNAL_KEY_PREFIX +
        (SequenceUtil.next(100000, ConstantPropertyHelper.SEQUENCE_BATCH) as String)
    for (1..batchCount) {
      gw.transaction.Transaction.runWithNewBundle(\b -> {
        var batch = createBatch(IRInboundMode_ACC.TC_DEV_ONLY_MOCK_AUTO, externalKey)
        var uniqueKey : String
        var seqKey : String
        var exKey : String
        var payloadStr = folderOrFile.read()
        var fileName = folderOrFile.NameSansExtension

        for (1..recordCount) {
          var key = SequenceUtil.next(1, ConstantPropertyHelper.SEQUENCE_INBOUND)
          uniqueKey = key as String
          seqKey = "A${StringUtil.formatNumber(key, "0000000")}"
          exKey = "ES_${uniqueKey}"
          createInboundRecord(batch, payloadStr, fileName, seqKey, exKey)
        }
      })
    }
  }

  /**
   * Load stubs for "TC_DEV_ONLY_MOCK_STUBS_BY_KEY"
   */
  private function loadStubsByKey(folderOrFile : File) {
    gw.transaction.Transaction.runWithNewBundle(\b -> {
      var fileName = folderOrFile.NameSansExtension
      var tokes = fileName.split("-")
      var batch : IRInboundBatch_ACC
      if (tokes.length == 6) {
        batch = createBatch(IRInboundMode_ACC.TC_DEV_ONLY_MOCK_STUBS_BY_KEY, tokes[4] + "-" + tokes[5])
      } else {
        batch = createBatch(IRInboundMode_ACC.TC_DEV_ONLY_MOCK_STUBS_BY_KEY)
      }
      var uniqueKey = SequenceUtil.next(1, ConstantPropertyHelper.SEQUENCE_INBOUND) as String
      var exKey = "ES_${uniqueKey}"
      var payloadStr = folderOrFile.read()

      createInboundRecord(batch, payloadStr, fileName, null, exKey)
    })
  }

  /**
   * Create a batch based on the mode
   */
  private function createBatch(mode : IRInboundMode_ACC) : IRInboundBatch_ACC {
    var batch = new IRInboundBatch_ACC()
    batch.BatchId = SequenceUtil.next(100000, ConstantPropertyHelper.SEQUENCE_BATCH) as String
    batch.BatchDate = Date.CurrentDate
    batch.IRInboundMode_ACC = mode
    batch.ExternalKey = ConstantPropertyHelper.IR_EXTERNAL_KEY_PREFIX + batch.BatchId
    batch.Status = IRInboundBatchStatus_ACC.TC_LOADED
    return batch
  }

  /**
   * Create a batch based on the mode and external key
   */
  private function createBatch(mode : IRInboundMode_ACC, externalKey : String) : IRInboundBatch_ACC {
    var batch = createBatch(mode)
    batch.ExternalKey = externalKey
    return batch
  }

  /**
   * Create inbound by payload
   */
  private function createInboundRecord(batch : IRInboundBatch_ACC, payload : File, key : Long) : IRInboundRecord_ACC {
    var uniqueKey = SequenceUtil.next(1, ConstantPropertyHelper.SEQUENCE_INBOUND) as String
    var seqKey = "A${StringUtil.formatNumber(key, "0000000")}"
    var exKey = "ES_${uniqueKey}"
    var payloadStr = payload.read()
    var fileName = payload.NameSansExtension

    return createInboundRecord(batch, payloadStr, fileName, seqKey, exKey)
  }

  /**
   * Create inbound record by given params
   */
  private function createInboundRecord(batch : IRInboundBatch_ACC,
                                       payload : String,
                                       fileName : String,
                                       seqKey : String,
                                       exKey : String) : IRInboundRecord_ACC {
    var fn = "createInboundRecord"
    var tokens = fileName.split("-")
    StructuredLogger.INTEGRATION.debug( this + " " + fn + " " + "[${tokens.toList()}]")

    var inbound = new IRInboundRecord_ACC()
    inbound.IRInboundBatch_ACC = batch
    inbound.IRExtRecordType_ACC = IRExtRecordType_ACC.get(tokens[3])

    if (batch.IRInboundMode_ACC == IRInboundMode_ACC.TC_DEV_ONLY_MOCK_STUBS_BY_KEY) {
      var key = tokens[2]
      inbound.SequencerKey = key
      inbound.RecordSequence = getNextStubRecordSequence(key)

    } else {
      inbound.RecordSequence = new Integer(tokens[2])
      inbound.SequencerKey = seqKey
    }

    inbound.ExternalKey = exKey
    inbound.setPayloadFromUnicode(payload)

    createIRProcessorKey(inbound.SequencerKey)

    return inbound
  }

  private function createIRProcessorKey(accID: String) {
    var seq = Query.make(IRProcessorKey_ACC).compare(IRProcessorKey_ACC#ACCID, Equals, accID).select().AtMostOneRow
    if (seq == null) {
      seq = new IRProcessorKey_ACC()
      seq.ACCID = accID
    }
  }

  public function getNextStubRecordSequence(sequencerKey : String) : Long {
    var currentMaxRecordSequence = Query.make(IRInboundRecord_ACC)
        .compare(IRInboundRecord_ACC#SequencerKey, Relop.Equals, sequencerKey)
        .select()
        .maxBy(\elt -> elt.RecordSequence)
        ?.RecordSequence

    if (currentMaxRecordSequence != null) {
      return currentMaxRecordSequence + 1
    } else {
      return 1
    }
  }
}