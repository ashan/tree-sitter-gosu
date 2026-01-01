package nz.co.acc.integration.instruction.workqueue

uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses gw.pl.persistence.core.Bundle

uses nz.co.acc.integration.instruction.handler.InstructionRecordHandlerFactory
uses nz.co.acc.integration.instruction.recordmapper.InstructionRecordMapperFactory
uses nz.co.acc.integration.ir.record.util.InboundRecordStatusUtil
uses nz.co.acc.plm.integration.instruction.AutoSkippedError
uses nz.co.acc.plm.integration.instruction.handler.error.BlockedByUnprocessedIRRecordsException
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Processes all pending instruction records for an account
 * <p>
 * Created by Mike Ourednik on 5/02/2021.
 */
class InstructionWorkItemProcessor {
  static var _log = StructuredLogger.INTEGRATION.withClass(InstructionWorkItemProcessor)
  var _instructionRecordMapperFactory = new InstructionRecordMapperFactory()
  final var _instructionRecordHandlerFactory : InstructionRecordHandlerFactory
  final var _instructionTypes : Set<InstructionType_ACC>

  public construct(
      instructionTypes : Set<InstructionType_ACC>,
      instructionRecordHandlerFactory : InstructionRecordHandlerFactory) {
    _instructionTypes = instructionTypes
    _instructionRecordHandlerFactory = instructionRecordHandlerFactory
  }

  public function processWorkItem(accID : String) {
    _log.info("Processing instructions for ${accID}")

    var instructions = findUnprocessedInstructionRecords(accID)
    _log.info("Found ${instructions.Count} unprocessed instructions for ${accID}")

    var instructionLists = createInstructionLists(instructions)

    for (instructionList in instructionLists) {
      processInstructionList(instructionList)
    }

    _log.info("Finished processing instructions for ${accID}")
  }

  // Split instructions into lists that can be processed separately without blocking each other if errors occur.
  // E.g. split by InstructionType, and split further by Policy Type if applicable
  private function createInstructionLists(instructions : List<InstructionRecord_ACC>) : ArrayList<List<InstructionRecord_ACC>> {
    var instructionLists = new ArrayList<List<InstructionRecord_ACC>>()
    var instructionTypes = getInstructionTypes(instructions)

    for (instructionType in instructionTypes) {
      if (instructionType == InstructionType_ACC.TC_BULKMODIFIERUPLOAD) {
        var modifierInstructionLists = createModifierInstructionLists(instructions)
        instructionLists.addAll(modifierInstructionLists)

      } else {
        var instructionList = createGenericInstructionList(instructions, instructionType)
        instructionLists.add(instructionList)
      }
    }
    return instructionLists
  }

  private function createModifierInstructionLists(instructions : List<InstructionRecord_ACC>) : ArrayList<List<InstructionRecord_ACC>> {
    var instructionLists = new ArrayList<List<InstructionRecord_ACC>>()
    var instructionListCPCPX = instructions.where(\instruction -> instruction.Parameters.startsWith("S"))
    var instructionListWPC = instructions.where(\instruction -> instruction.Parameters.startsWith("E"))
    var instructionListWPS = instructions.where(\instruction -> instruction.Parameters.startsWith("D"))

    if (instructionListCPCPX.HasElements) {
      instructionLists.add(instructionListCPCPX)
    }
    if (instructionListWPC.HasElements) {
      instructionLists.add(instructionListWPC)
    }
    if (instructionListWPS.HasElements) {
      instructionLists.add(instructionListWPS)
    }

    return instructionLists
  }

  private function createGenericInstructionList(
      instructions : List<InstructionRecord_ACC>, instructionType : InstructionType_ACC) : List<InstructionRecord_ACC> {
    return instructions.where(\instruction -> instruction.InstructionType_ACC == instructionType)
  }

  private function getInstructionTypes(instructions : List<InstructionRecord_ACC>) : List<InstructionType_ACC> {
    return instructions
        .map(\instruction -> instruction.InstructionType_ACC)
        .toSet()
        .toList()
        .sortBy(\instructionType -> instructionType.Code)
  }

  private function processInstructionList(instructions : List<InstructionRecord_ACC>) {
    var instructionType = instructions.first().InstructionType_ACC
    var mapper = _instructionRecordMapperFactory.getInstructionRecordMapper(instructionType)
    instructions = instructions.where(\instruction -> instruction.InstructionType_ACC == instructionType)

    for (instructionEntity in instructions) {
      _log.info("Processing ${instructionEntity.DisplayName_ACC}")
      if (instructionEntity.Status == InstructionRecordStatus_ACC.TC_ERROR) {
        _log.info("${instructionEntity.DisplayName_ACC} has Error status. Processing will stop here.")
        return
      }
      try {
        checkInboundIRStatus(instructionEntity.ACCID)
        var instructionRecord = mapper.fromEntity(instructionEntity)
        var handler = _instructionRecordHandlerFactory.createInstructionRecordHandler(instructionRecord)
        gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
          handler.processInstructionRecord(bundle)
          updateProcessedStatus(bundle, instructionEntity)
        })
        _log.info("Finished processing ${instructionEntity.DisplayName_ACC}")

      } catch (e : BlockedByUnprocessedIRRecordsException) {
        _log.info(e.Message)
        updateBlockedStatus(instructionEntity)
        return

      } catch (e : AutoSkippedError) {
        _log.info("Skipping ${instructionEntity.DisplayName_ACC} : ${e.Message}")
        updateSkippedStatus(instructionEntity, e.Message)
        continue

      } catch (e : Exception) {
        _log.error_ACC("Error occurred when processing ${instructionEntity.DisplayName_ACC}", e)
        updateErrorStatus(instructionEntity, e)
        return
      }
    }
  }

  private function findUnprocessedInstructionRecords(accID : String) : List<InstructionRecord_ACC> {
    return Query.make(InstructionRecord_ACC)
        .compare(InstructionRecord_ACC#ACCID, Relop.Equals, accID)
        .compareNotIn(InstructionRecord_ACC#Status, {
            InstructionRecordStatus_ACC.TC_PROCESSED,
            InstructionRecordStatus_ACC.TC_SKIPPED})
        .compareIn(InstructionRecord_ACC#InstructionType_ACC, _instructionTypes.toArray())
        .select()
        .orderBy(QuerySelectColumns.path(Paths.make(InstructionRecord_ACC#RecordSequence)))
        .toList()
  }

  private function updateProcessedStatus(bundle : Bundle, instructionEntity : InstructionRecord_ACC) {
    instructionEntity = bundle.add(instructionEntity)
    instructionEntity.setStatus(InstructionRecordStatus_ACC.TC_PROCESSED)
    instructionEntity.setErrorMessage(null)
  }

  private function updateErrorStatus(instructionEntity : InstructionRecord_ACC, e : Exception) {
    instructionEntity.refresh()
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      instructionEntity = bundle.add(instructionEntity)
      instructionEntity.setStatus(InstructionRecordStatus_ACC.TC_ERROR)
      instructionEntity.setErrorMessage(e.StackTraceAsString?.truncate(512))
    })
  }

  private function updateBlockedStatus(instructionEntity : InstructionRecord_ACC) {
    instructionEntity.refresh()
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      instructionEntity = bundle.add(instructionEntity)
      instructionEntity.setStatus(InstructionRecordStatus_ACC.TC_BLOCKED)
      instructionEntity.setErrorMessage(null)
    })
  }

  private function updateSkippedStatus(instructionEntity : InstructionRecord_ACC, msg : String) {
    instructionEntity.refresh()
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      instructionEntity = bundle.add(instructionEntity)
      instructionEntity.setStatus(InstructionRecordStatus_ACC.TC_SKIPPED)
      instructionEntity.setErrorMessage(msg)
      instructionEntity.setSkippedBy(User.util.CurrentUser)
    })
  }

  private function checkInboundIRStatus(accID : String) {
    var inboundRecordStatusUtil = new InboundRecordStatusUtil()
    if (inboundRecordStatusUtil.hasUnprocessedRecords(accID)) {
      throw new BlockedByUnprocessedIRRecordsException("Unprocessed inbound IR records exist for account ${accID}. Cannot proceed.")
    }
  }

}