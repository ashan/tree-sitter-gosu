package nz.co.acc.plm.integration.bulkupload.csvtypes

uses org.apache.commons.lang3.builder.ToStringBuilder

/**
 * Created by Mike Ourednik on 7/13/21.
 */
class CorrespondenceDetailsRow {
  public var accId : String
  public var contactType : ContactType_ACC
  public var correspondencePreference : CorrespondencePreference_ACC
  public var primaryEmail : String
  public var emailVerified : Boolean
  public var secondaryEmail : String

  override public function toString() : String {
    return new ToStringBuilder(this)
        .append("accId", accId)
        .append("contactType", contactType)
        .append("correspondencePreference", correspondencePreference)
        .append("primaryEmail" , primaryEmail)
        .append("emailVerified", emailVerified)
        .append("secondaryEmail", secondaryEmail)
        .toString()
  }
}