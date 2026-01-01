package nz.co.acc.common.integration.files.outbound

uses gw.api.database.Query
uses gw.api.gx.GXOptions
uses gw.pl.persistence.core.Bundle
uses gw.pl.persistence.core.Key
uses gw.xml.XmlElement
uses gw.xml.XmlSerializationOptions

/**
 * Encapsulates extensions for the OutBoundRecord_ACC.gs.
 * Created by Nick on 10/01/2017.
 */
enhancement OutBoundRecordExt_ACC: OutBoundRecord_ACC {

  function upgradeToNewFullData(gxModelData: String) {
    this.Data = gxModelData
    this.Status = OutBoundRecordStatus_ACC.TC_NEW
  }

  function retry() {
    this.Status = OutBoundRecordStatus_ACC.TC_RETRY
    this.ErrorMessage = null
  }

  function setAsFail(error: String) {
    this.Status = OutBoundRecordStatus_ACC.TC_ERROR
    this.ErrorMessage = error?.truncate(512)
  }

  function setAsConvertingError(e: Exception) {
    this.Status = OutBoundRecordStatus_ACC.TC_ERROR
    this.ErrorMessage = e.Message
  }

  function setAsConverted(dataOutput: String) {
    this.Status = OutBoundRecordStatus_ACC.TC_CONVERTED
    this.DataOutput = dataOutput
    this.ErrorMessage = null
  }

  function setAsProcessingError(e: Exception) {
    this.Status = OutBoundRecordStatus_ACC.TC_ERROR
    this.ErrorMessage = e.StackTraceAsString?.truncate(512)
  }

  function setAsProcessed(outboundHeader: OutBoundHeader_ACC) {
    this.Header = outboundHeader
    this.Status = OutBoundRecordStatus_ACC.TC_PROCESSED
    this.ErrorMessage = null
  }

  /**
   * Find the entity by the OriginEntityID.
   *
   * @param bundle
   * @param type
   * @param id
   * @param <T>
   * @return The entity.
   */
  reified function findOriginEntity<T extends KeyableBean>(bundle: Bundle, type: Type<T>): T {
    var q = Query.make(type)
    var theKey = new Key(q.getEntityType(), this.getOriginEntityID())
    return bundle.loadBean(theKey) as T
  }

}
