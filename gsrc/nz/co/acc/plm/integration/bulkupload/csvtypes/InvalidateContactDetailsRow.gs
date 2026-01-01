package nz.co.acc.plm.integration.bulkupload.csvtypes

uses org.apache.commons.lang3.builder.ToStringBuilder

/**
 * Created by Mike Ourednik on 7/13/21.
 */
class InvalidateContactDetailsRow {
  public var accId : String
  public var invalidateType : InvalidContactInfoType_ACC

  override public function toString() : String {
    return new ToStringBuilder(this)
        .append("accId", accId)
        .append("invalidateType", invalidateType)
        .toString()
  }
}