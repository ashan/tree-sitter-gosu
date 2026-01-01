package nz.co.acc.plm.integration.ir.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths

/**
 * All the methods on "IRInboundWF_ACC" related to UI.
 */
enhancement IRSequencerEnhancement : IRSequencer_ACC {

  /**
   * Get all the records for this sequencer order by the record sequence
   * This is good for performance
   */
  public property get OrderedRecords() : IQueryBeanResult<IRInboundRecord_ACC> {
    var result = Query.make(IRInboundRecord_ACC)
        .compare(IRInboundRecord_ACC#SequencerKey, Relop.Equals, this.SequencerKey)
        .select()
    result.orderBy(QuerySelectColumns.path(Paths.make(IRInboundRecord_ACC#SequencerKey)))
    return result
  }

}
