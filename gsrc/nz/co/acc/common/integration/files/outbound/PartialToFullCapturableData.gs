package nz.co.acc.common.integration.files.outbound

uses gw.pl.persistence.core.Bundle
uses nz.co.acc.common.integration.files.outbound.FullCapturableData

/**
 * Any OutBound Record type which initially captured only partial data and requires the partial OutboundRecordWorkQueue
 * to complete the rest of the data collection should implement interface in their CapturableData.
 * <p>
 * This is designed for a non-user transaction to use and is for capturing large amounts of data.
 * <p>
 * Created by Nick on 16/01/2017.
 */
abstract class PartialToFullCapturableData extends FullCapturableData {

  construct(type: OutBoundRecordType_ACC,bundle:Bundle) {
    super(type,bundle)
    RecordStatus = OutBoundRecordStatus_ACC.TC_PARTIAL_DATA
  }

  construct(bundle:Bundle) {
    super(bundle)
    RecordStatus = OutBoundRecordStatus_ACC.TC_PARTIAL_DATA
  }
  /**
   * This method should be implemented by the concrete class, if OutBoundRecord_ACC.Data is only partial, as described by captureAsNewData.
   *
   * @param bundle
   * @param existingOutboundRecord
   * @return Returns the updated OutboundRecord_ACC
   */
  abstract function capturePartialToFullData(existingOutboundRecord: OutBoundRecord_ACC): OutBoundRecord_ACC

}
