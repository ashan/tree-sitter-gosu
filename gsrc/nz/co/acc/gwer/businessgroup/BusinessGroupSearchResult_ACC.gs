package nz.co.acc.gwer.businessgroup

uses nz.co.acc.gwer.util.ERUIUtils_ACC
uses typekey.Contact

uses java.io.Serializable
uses java.sql.ResultSet

class BusinessGroupSearchResult_ACC implements Serializable {

  private var _businessGroupId : Long as BusinessGroupID

  private var _groupMemberId : Long as GroupMemberID

  private var _companyId : Integer as CompanyID

  private var _accPolicyId : String as ACCPolicyID

  private var _contactType : Contact as ContactType

  private var _name : String as Name

  private var _noPayroll : boolean as NonPayroll

  private var _ceasedTradingDate : Date as CeasedTradingDate

  private var _groupStartDate : Date as GroupStartDate

  private var _groupEndDate : Date as GroupEndDate

  private var _accountID : Long as AccountID

  /**
   * US12243 ER UI - GW - Business Groups - add TransferID to the fields returned after a search
   * 24.10.2018 NowchoO
   */
  private var _sellerTransferIds : String as SellerTransferIds

  private var _buyerTransferIds : String as BuyerTransferIds

  construct() {}

  construct(resultSet : ResultSet) {
    _accPolicyId = resultSet.getString("ACCPolicyID")
    _name = resultSet.getString("Name")
    _companyId = resultSet.getInt("CompanyID")
    _businessGroupId = resultSet.getLong("BusinessGroupID")
    _groupStartDate = resultSet.getDate("MembershipStart")
    _groupEndDate = resultSet.getDate("MembershipEnd")
    _accountID = resultSet.getLong("AccountID")
  }

  construct(member : ERBusinessGroupMember_ACC) {
    _accPolicyId = member.ACCPolicyID_ACC
    _companyId = member.CompanyID
    _businessGroupId = member.ERBusinessGroup.ID.Value
    _groupStartDate = member.MembershipStart
    _groupEndDate = member.MembershipEnd
    if(member.ACCPolicyID_ACC.HasContent and member.AccountID == null) {
      var erUIUtils = new ERUIUtils_ACC()
      var accid = member.ACCPolicyID_ACC.substring(0, member.ACCPolicyID_ACC.length() - 1)
      _accountID = erUIUtils.getAccountByACCID(accid)
    }
  }
}