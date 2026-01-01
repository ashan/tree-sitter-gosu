package nz.co.acc.plm.integration.instruction.data

uses entity.InstructionScheduler_ACC
uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Key
uses gw.api.locale.DisplayKey
uses org.apache.commons.io.IOUtils
uses typekey.InstructionExecType_ACC
uses typekey.InstructionType_ACC

uses java.io.File
uses java.io.FileOutputStream

/**
 * Created by ManubaF on 15/04/2019.
 */
class InstructionUtil {
  function getAllScheduledInstructions() : IQueryBeanResult<InstructionScheduler_ACC> {
    return Query.make(InstructionScheduler_ACC).select()
  }

  function getAllScheduledInstructionsAfterDate(dateTime : Date) : IQueryBeanResult<InstructionScheduler_ACC> {
    var scheduleQuery = Query.make(InstructionScheduler_ACC)
    scheduleQuery.compare(InstructionScheduler_ACC#ExecutionStartDateTime, Relop.GreaterThanOrEquals, dateTime)
    return scheduleQuery.select()
  }

  function getInstructionScheduleAsOfDate(dateTime : Date) : InstructionScheduler_ACC {
    return getInstructionScheduleAsOfDate(dateTime, null, null, null)
  }

  function getInstructionScheduleAsOfDate(dateTime : Date, instructionType : InstructionType_ACC, isProcessing:Boolean) : InstructionScheduler_ACC {
    return getInstructionScheduleAsOfDate(dateTime, instructionType, null, isProcessing)
  }

  function getInstructionScheduleAsOfDate(dateTime : Date, instructionType : InstructionType_ACC, id:Key, isProcessing:Boolean) : InstructionScheduler_ACC {
    var scheduleQuery = Query.make(InstructionScheduler_ACC)

    scheduleQuery.compare(InstructionScheduler_ACC#ExecutionEndDateTime, Relop.GreaterThanOrEquals, dateTime)
    scheduleQuery.compare(InstructionScheduler_ACC#ExecutionStartDateTime, Relop.LessThanOrEquals, dateTime)

    if(id != null) {
      scheduleQuery.compare(InstructionScheduler_ACC#ID, Relop.NotEquals, id)
    }

    if(instructionType != null) {
      scheduleQuery.compare(InstructionScheduler_ACC#InstructionType, Relop.Equals, instructionType)
    }

    if(isProcessing) {
      scheduleQuery.compare(InstructionScheduler_ACC#InstructionExecType, Relop.Equals, InstructionExecType_ACC.TC_PROCESSING)
    }
    return scheduleQuery.select().FirstResult
  }

  function deleteInstructionSchedule(instructionSchedules: InstructionScheduler_ACC[]) {
    var bundle = gw.transaction.Transaction.getCurrent()

    for (var instructionSchedule in instructionSchedules) {
      var newInstructionSchedule =  bundle.loadBean(instructionSchedule.ID)
      bundle.delete(newInstructionSchedule)    }
    bundle.commit();
  }

  function checkAndValidateStartDate(instructionScheduler:InstructionScheduler_ACC) : String {
    if(Date.CurrentDate.after(instructionScheduler.ExecutionStartDateTime)) {
      return DisplayKey.get("Web.Admin.Instruction_ACC.InstructionScheduleScreen.ValueAfterCurrent", Date.CurrentDate.toString())
    }

    var conflictedSchedule = getInstructionScheduleAsOfDate(instructionScheduler.ExecutionStartDateTime, null, instructionScheduler.ID, null)
    if(conflictedSchedule != null) {
      return DisplayKey.get("Web.Admin.Instruction_ACC.InstructionScheduleScreen.DateValueConflict", conflictedSchedule.ExecutionStartDateTime, conflictedSchedule.ExecutionEndDateTime)
    }
    return null
  }

  function checkAndValidateEndDate(instructionScheduler:InstructionScheduler_ACC) : String {
    if(instructionScheduler.ExecutionStartDateTime.after(instructionScheduler.ExecutionEndDateTime)) {
      return DisplayKey.get("Web.Admin.Instruction_ACC.InstructionScheduleScreen.EndDateAfterStart", instructionScheduler.ExecutionEndDateTime)
    }

    var conflictedSchedule = getInstructionScheduleAsOfDate(instructionScheduler.ExecutionEndDateTime, null, instructionScheduler.ID, null)
    if(conflictedSchedule != null) {
      return DisplayKey.get("Web.Admin.Instruction_ACC.InstructionScheduleScreen.DateValueConflict", conflictedSchedule.ExecutionStartDateTime, conflictedSchedule.ExecutionEndDateTime)
    }
    return null
  }

  function blobToFile(blob : Blob, fileName: String) : File {
    var file = new File(fileName)
    var output = new FileOutputStream(file);
    IOUtils.copy(blob.toInputStream(), output);
    return file
  }

  /**
   * Based on file name, we work out what is the bulk instruction type
   * @param fileName The given file name
   * @return Mapped instruction type, Exception will be thrown out if no suitable instruction type is mapped.
   */
  public static function deriveInstructionType(fileName : String) : InstructionType_ACC {
    var result : InstructionType_ACC
    InstructionType_ACC.getAllTypeKeys().each(\tk -> {
      if (fileName.startsWith(tk.Code)) {
        result = tk
      }
    })
    if (result == null) {
      throw new RuntimeException("There is no suitable Instruction Type for this file[${fileName}]!")
    }
    if (! result.isMappedToTypekey_ACC(InstTypeCategory_ACC.TC_FILE)) {
      throw new RuntimeException("Instruction[${result}] can't be created by a file!")
    }
    return result
  }
}