package nz.co.acc.plm.integration.instruction.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths
uses gw.api.web.WebUtil
uses gw.pl.util.csv.CSVBuilder
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses java.io.ByteArrayInputStream
uses java.io.StringWriter

/**
 * UI helper class for Runtime Message Report.
 */
class WorkerRuntimeMsgHelper {

  var _instruction : Instruction_ACC

  /**
   * Constructor
   */
  construct(i : Instruction_ACC) {
    _instruction = i
  }

  /**
   * All the header columns
   */
  private var _headerColumns : String[] = {
      "WorkerID",
      "SequencerKey",
      "InstructionType",
      "ExecStatus",
      "RuntimeMessage",
      "LastUpdatedBy",
      "LastUpdatedTime"
  }

  /**
   * Export error message report from screen.
   */
  public function exportErrorMsgs() {
    var writer = new StringWriter()
    //Build header
    var csvBuilder = new CSVBuilder(writer)
    _headerColumns.each(\c ->
        csvBuilder.add(c)
    )
    csvBuilder.newLine()

    var records = findWorkersWithMsg()

    records.each(\worker ->
        buildErrorMsg(worker, csvBuilder)
    )
    var value = writer.toString().Bytes
    var input = new ByteArrayInputStream(value)
    WebUtil.copyStreamToClient("application/csv", "WorkerRuntimeMessages${_instruction.ID}.csv", input, value.length)
  }

  /**
   * Search the workers in this instruction with has runtime message.
   */
  private function findWorkersWithMsg() : IQueryBeanResult<InstructionWorker_ACC> {
    var orderBy = QuerySelectColumns.path(Paths.make(InstructionWorker_ACC#CreateTime))
    var q = Query.make(InstructionWorker_ACC)
            .compare(InstructionWorker_ACC#Instruction_ACC, Equals, _instruction)
            .compare(InstructionWorker_ACC#RuntimeMessage, NotEquals, null)
    return q.select().orderBy(orderBy) as IQueryBeanResult<InstructionWorker_ACC>
  }

  /**
   * Build report for one worker record.
   */
  private function buildErrorMsg(worker : InstructionWorker_ACC, builder : CSVBuilder) {
    builder.add(worker.ID)
    builder.add(worker.SequencerKey)
    builder.add("${_instruction.InstructionType_ACC}[${_instruction.ID}]")
    builder.add(worker.InstructionExecStatus_ACC.Code)
    builder.addEscaped(worker.RuntimeMessage)
    builder.add(worker.UpdateUser)
    builder.add(InstructionConstantHelper.DATE_FORMAT_dMYHm.format(worker.UpdateTime))
    builder.newLine()
  }

}