package nz.co.acc.plm.integration.instruction.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths

/**
 * All the methods on "IRInboundWF_ACC" related to UI.
 *
 */
enhancement IRSequencerEnhancement: IRSequencer_ACC {

  /**
   * Get all the workers for this sequencer order by the sequence number
   * This is good for performance
   */
  public property get OrderedWorkers() : IQueryBeanResult<InstructionWorker_ACC>  {
    var orderBy = QuerySelectColumns.path(Paths.make(InstructionWorker_ACC#RecordSequence))

    var q = Query.make(InstructionWorker_ACC)
    q.compare(InstructionWorker_ACC#IRSequencer_ACC, Equals, this)
    return q.select().orderBy(orderBy) as IQueryBeanResult<InstructionWorker_ACC>
  }

}
