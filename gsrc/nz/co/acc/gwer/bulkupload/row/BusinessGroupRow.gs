package nz.co.acc.gwer.bulkupload.row

/**
 * Created by HamblyAl on 18/03/2019.
 */
class BusinessGroupRow {
  public var groupID : Integer as GroupID = null
  public var dateCreated : Date as DateCreated = null
  public var accPolicyID : String as ACCPolicyID = null
  public var startDate: Date as StartDate = null
  public var endDate: Date as EndDate = null
  public var activeInERPeriod: Boolean as ActiveInERPeriod = null
  public var companyID : Integer as CompanyID = null

  @Override
  function toString() : String  {
  return "BusinessGroup{" +
      "groupID='" + groupID + '\'' +
      ", dateCreated='" + dateCreated + '\'' +
      ", accPolicyID='" + accPolicyID + '\'' +
      ", startDate='" + startDate + '\'' +
      ", endDate='" + endDate + '\'' +
      ", activeInERPeriod='" + activeInERPeriod + '\'' +
      ", companyID='" + companyID + '\'' +
      '}';
  }
}