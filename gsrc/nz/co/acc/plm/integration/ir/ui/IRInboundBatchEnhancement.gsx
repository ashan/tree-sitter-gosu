package nz.co.acc.plm.integration.ir.ui

/**
 * Enhancement on IRInboundBatch to simplify UI logic
 */
enhancement IRInboundBatchEnhancement: IRInboundBatch_ACC {

  /**
   * The long name for batch...
   */
  public property get LongName() : String {
    return "${this.BatchId} (${this.ExternalKey})"
  }

}
