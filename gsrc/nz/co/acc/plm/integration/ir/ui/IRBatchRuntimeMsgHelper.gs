package nz.co.acc.plm.integration.ir.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths
uses gw.api.web.WebUtil
uses gw.pl.util.csv.CSVBuilder
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

uses java.io.ByteArrayInputStream
uses java.io.StringWriter

/**
 * UI helper class for Runtime Message Report.
 */
class IRBatchRuntimeMsgHelper {

  var _batch : entity.IRInboundBatch_ACC

  /**
   * Constructor
   */
  construct(b : entity.IRInboundBatch_ACC) {
    _batch = b
  }

  /**
   * All the header columns
   */
  public static final var HEADER_COLUMNS : String[] = {
      "SequencerKey",
      "ExternalKey",
      "RecordType",
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
    HEADER_COLUMNS.each(\c ->
        csvBuilder.add(c)
    )
    csvBuilder.newLine()

    var records = findInboundsWithMsg()

    records.each(\inbound ->
        buildErrorMsg(inbound, csvBuilder)
    )
    var value = writer.toString().Bytes
    var input = new ByteArrayInputStream(value)
    WebUtil.copyStreamToClient("application/csv", "InboundRuntimeMessage${_batch.ExternalKey}.csv", input, value.length)
  }

  /**
   * Search the inbound records in this batch with has runtime message.
   */
  private function findInboundsWithMsg() : IQueryBeanResult<IRInboundRecord_ACC> {
    var orderBy = QuerySelectColumns.path(Paths.make(IRInboundRecord_ACC#RecordSequence))
    var q = Query.make(IRInboundRecord_ACC)
    if (_batch.ExternalKey?.NotBlank) {
      var bq = q.join(IRInboundRecord_ACC#IRInboundBatch_ACC)
      bq.compare(IRInboundBatch_ACC#ExternalKey, Equals, _batch.ExternalKey)
    } else {
      q.compare(IRInboundRecord_ACC#IRInboundBatch_ACC, Equals, _batch)
    }

    q.or(\orCriteria -> {
      orCriteria.compare(IRInboundRecord_ACC#RuntimeMessage, NotEquals, null)
    })

    return q.select().orderBy(orderBy) as IQueryBeanResult<IRInboundRecord_ACC>
  }

  /**
   * Build report for one inbound record.
   */
  private function buildErrorMsg(inbound : IRInboundRecord_ACC, builder : CSVBuilder) {

    builder.add(inbound.SequencerKey)
    builder.add(inbound.ExternalKey)
    builder.add(inbound.IRExtRecordType_ACC.Code)
    builder.add(inbound.Status.Code)
    buildRuntimeMsg(inbound, builder)
    buildLastUpdatedBy(inbound, builder)
    builder.newLine()

  }

  /**
   * Derive the last updated user and last updated time.
   */
  private function buildLastUpdatedBy(inbound : IRInboundRecord_ACC, builder : CSVBuilder) {
    var u : User
    var lastUpdatedBy : Date
    var execStatus = inbound.Status
    if (execStatus == IRInboundRecordStatus_ACC.TC_SKIPPEDBYUSER) {
      u = inbound.SkippedBy
      lastUpdatedBy = inbound.UpdateTime
    } else {
      var lastPayload = inbound.deriveLatestPayloadHistory()
      if (lastPayload != null) {
        u = lastPayload.CreateUser
        lastUpdatedBy = lastPayload.PayloadTimestamp
      } else {
        u = inbound.UpdateUser
        lastUpdatedBy = inbound.UpdateTime
      }
    }
    builder.add(u)
    builder.add(lastUpdatedBy.format(ConstantPropertyHelper.DATE_FORMAT_dMYHms))
  }

  /**
   * Derive the runtime message.
   */
  private function buildRuntimeMsg(inbound : IRInboundRecord_ACC, builder : CSVBuilder) {
    builder.addEscaped(inbound.RuntimeMessage)
  }

}
