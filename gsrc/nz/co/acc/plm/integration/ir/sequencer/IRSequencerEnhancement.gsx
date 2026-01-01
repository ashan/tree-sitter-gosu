package nz.co.acc.plm.integration.ir.sequencer

uses gw.api.database.Query
uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.plm.integration.instruction.data.InstructionUtil
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.integration.ir.util.BundleHelper
uses gw.surepath.suite.integration.logging.StructuredLogger


/**
 * All the methods on "IRSequencer_ACC" related to sequencer.
 *
 */
enhancement IRSequencerEnhancement: IRSequencer_ACC {

  /**
   * The current running record if exists
   */
  public property get Record_Current() : SequencedDelegate_ACC {
    return this.deriveOrderedInstructionWorkers.firstWhere(\r -> ! r.Completed
        && r.InstructionExecStatus_ACC == InstructionExecStatus_ACC.TC_PROCESSING)
  }

  /**
   * The next record can be processed.
   */
  public function deriveNextSequencedRecord(scheduleAsOfDate:InstructionScheduler_ACC) : SequencedDelegate_ACC {

    if(ScriptParameters.CheckInstructionSchedule_ACC) {
      var instructionWorkers : List<InstructionWorker_ACC> = null

      if(scheduleAsOfDate != null and scheduleAsOfDate.InstructionExecType == InstructionExecType_ACC.TC_PROCESSING) {
        instructionWorkers = this.deriveOrderedInstructionWorkers
            .where(\r -> r.InstructionExecStatus_ACC == InstructionExecStatus_ACC.TC_SEQUENCED and
                r.Instruction_ACC.InstructionType_ACC == scheduleAsOfDate.InstructionType)

        if(scheduleAsOfDate.ProductType != null) {
          instructionWorkers = instructionWorkers
              .where(\r -> r.Parameters.split(InstructionConstantHelper.CSV_DELIMITER)[0] == scheduleAsOfDate.ProductType.Code)
        }

        if(scheduleAsOfDate.ERType != null) {
          instructionWorkers = instructionWorkers
              .where(\r -> r.Parameters.split(InstructionConstantHelper.CSV_DELIMITER)[4] == scheduleAsOfDate.ERType.Description)
        }

        if(instructionWorkers == null) {
          instructionWorkers = this.deriveOrderedInstructionWorkers
              .where(\r -> r.InstructionExecStatus_ACC == InstructionExecStatus_ACC.TC_SEQUENCED and
                  r.Instruction_ACC.InstructionType_ACC != scheduleAsOfDate.InstructionType)
        }

        return instructionWorkers.first()
      } else {
        return this.deriveOrderedInstructionWorkers
            .firstWhere(\r -> r.InstructionExecStatus_ACC == InstructionExecStatus_ACC.TC_SEQUENCED and
                              r.Instruction_ACC.InstructionType_ACC != InstructionType_ACC.TC_BULKMODIFIERUPLOAD)
      }
    }
    return this.deriveOrderedInstructionWorkers
        .firstWhere(\r -> r.InstructionExecStatus_ACC == InstructionExecStatus_ACC.TC_SEQUENCED)
  }

  /**
   * Get all the record ordering by sequence order.
   */
  public property get deriveOrderedInstructionWorkers() : List<InstructionWorker_ACC> {
    return this.InstructionWorker_ACCs.orderBy(\r -> r.RecordSequence)
  }

  /**
   * This method makes sure the next available record is started
   */
  public function resetSequencerPointerToExecNextRecord() {
    var instructionUtil = new InstructionUtil()
    var scheduleAsOfDate = instructionUtil.getInstructionScheduleAsOfDate(Date.CurrentDate, null, Boolean.TRUE)

    var fn = "resetSequencerPointerToExecNextRecord"

    var currentExecRecord = this.Record_Current
    StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "Current Execing[${currentExecRecord.RecordSequence}]")

    //++++++++++++++++++++
    // Check state of currentExecRecord
    //+++++++++++++++++++
    if (currentExecRecord == null) { //If we dont have a Pointer
      StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "There are no records Executing Work .... will try to Find next record to create WF")
    } else if (ScriptParameters.CheckInstructionSchedule_ACC) {
      if(currentExecRecord typeis InstructionWorker_ACC and
         currentExecRecord.Instruction_ACC.InstructionType_ACC == scheduleAsOfDate.InstructionType) {
        if (scheduleAsOfDate != null and scheduleAsOfDate.InstructionExecType == InstructionExecType_ACC.TC_PROCESSING) {
          currentExecRecord.resumeWorkflowIfPossible()
          StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "No More to do here, 'Current-Execution' stays at Record[${currentExecRecord.RecordSequence}], until thie record is Completed")
          return
        } else {
          // do nothing
        }
      }
    } else { //If we have aPointer and  its Not completed --> dont do anything, or resume current WF
      currentExecRecord.resumeWorkflowIfPossible()
      StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "No More to do here, 'Current-Execution' stays at Record[${currentExecRecord.RecordSequence}], until thie record is Completed")
      return
    }

    //++++++++++++++++++++++++++
    // Find Next Record to execute
    //++++++++++++++++++++++++++
    var nextSequencedExecRecord = deriveNextSequencedRecord(scheduleAsOfDate)
    if (nextSequencedExecRecord == null) {
      StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "Did not find nextRecord for Execution - No more to do here")
    } else {
      //make sure its Writable, and in Bundle
      nextSequencedExecRecord = BundleHelper.explicitlyAddBeanToBundle(this.Bundle, nextSequencedExecRecord as KeyableBean, false) as SequencedDelegate_ACC
      StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "Found next record for Execution - Record[${nextSequencedExecRecord.RecordSequence}]")
    }

    //++++++++++++++++++++++++++
    // Create new WF, if needed
    //++++++++++++++++++++++++++
    if(nextSequencedExecRecord != null && nextSequencedExecRecord.canCreateWorkflow()) {
      StructuredLogger.INTEGRATION.debug(this + " " + fn + " " + "Record [${nextSequencedExecRecord.RecordSequence}] does not started!, Started it")
      nextSequencedExecRecord.createWorkflow()
    }
  }

  /**
   * For logger, static method
   */
  private static property get LogThis() : String{
    return IRSequencer_ACC.Type.DisplayName
  }

  //////////////////////////////////////////////////////////////////
  // SEQUENCER -  FINDERS
  //////////////////////////////////////////////////////////////////

  /**
   * Finds Single [IRSequencer_ACC]  in Database, otherwise creates a new instance
   */
  public static function findSequencerOrCreateNew(sequenceKey : String,
                                          bundle : Bundle) : IRSequencer_ACC {
    var fn = "findSequencerOrCreateNew"
    var keyFieldsDesc = "IRSequencer_ACC[${sequenceKey}]"
    StructuredLogger.INTEGRATION.debug(LogThis + " " + fn + " " + "Start for ${keyFieldsDesc}")

    var s  = findSingleSequencer(sequenceKey, bundle, false)

    if(s != null){
      StructuredLogger.INTEGRATION.debug(LogThis + " " + fn + " " + "Found Existing Sequencer: PublicId[${s.PublicID}] - using this")
      s = BundleHelper.explicitlyAddBeanToBundle(bundle, s, false)
      //make writable, by default bean from Query its read-only
    } else {
      StructuredLogger.INTEGRATION.debug(LogThis + " " + fn + " " + "Creating New Sequencer")
      s = new IRSequencer_ACC(bundle)
      s.SequencerKey = sequenceKey
    }

    return s
  }

  /**
   * Finds Single [IRSequencer_ACC] in Database.
   */
  public static function findSingleSequencer(sequenceKey : String,
                                      bundle : Bundle,
                                      mustFind : boolean) : IRSequencer_ACC{
    var fn = "findSingleSequencer"
    var keyFieldsDesc = "IRSequencer_ACC[${sequenceKey}]"

    StructuredLogger.INTEGRATION.debug( LogThis + " " + fn + " " +  "Start for [${keyFieldsDesc}]")
    var sequencer = bundle?.InsertedBeans
        ?.firstWhere(\seq -> seq typeis entity.IRSequencer_ACC
        and seq.SequencerKey == sequenceKey) as IRSequencer_ACC
    if(sequencer != null) {
      return sequencer
    }
    var s =  Query.make(IRSequencer_ACC)
        .compare(IRSequencer_ACC#SequencerKey, Equals , sequenceKey)
        .select()
        .getAtMostOneRow()

    if (s == null && mustFind) {
      var msg = "FAILED to FIND Exactly [1] ${keyFieldsDesc}"
      StructuredLogger.INTEGRATION.error_ACC(msg)
      throw new DisplayableException(msg)

    }
    return s
  }

  /**
   * Finds Single [IRSequencer_ACC] in Database via accNumber
   */
  public static function findSequencerByAccNumber(accNumber : String) : IRSequencer_ACC{
    var fn = "findSequencerByAccNumber"
    var keyFieldsDesc = "IRSequencer_ACC[${accNumber}]"

    StructuredLogger.INTEGRATION.debug( LogThis + " " + fn + " " + "Start for [${keyFieldsDesc}]")
    if (accNumber == null || accNumber.trim().length ==0) {
      return null
    }
    var s =  Query.make(IRSequencer_ACC)
        .compare(IRSequencer_ACC#SequencerKey, Equals , accNumber)
        .select()
        .getAtMostOneRow()
    return s
  }
}
