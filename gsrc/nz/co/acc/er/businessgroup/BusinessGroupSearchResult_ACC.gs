package nz.co.acc.er.businessgroup

uses java.io.Serializable

class BusinessGroupSearchResult_ACC implements Serializable {

  private var _businessGroupId : Integer as BusinessGroupID

  private var _groupMemberId : Integer as GroupMemberID

  private var _companyId : Integer as CompanyID

  private var _accPolicyId : String as ACCPolicyID

  private var _name : String as Name

  private var _noPayroll : boolean as NonPayroll

  private var _ceasedTradingDate : Date as CeasedTradingDate

  private var _groupStartDate : Date as GroupStartDate

  private var _groupEndDate : Date as GroupEndDate

  /**
   * US12243 ER UI - GW - Business Groups - add TransferID to the fields returned after a search
   * 24.10.2018 NowchoO
   */
  private var _sellerTransferIds : String as SellerTransferIds

  private var _buyerTransferIds : String as BuyerTransferIds

  private var _hasBeenDeletedPreviously : Boolean as HasBeenDeletedPreviously
}