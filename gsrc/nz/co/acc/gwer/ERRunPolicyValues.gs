package nz.co.acc.gwer

uses java.math.BigDecimal

class ERRunPolicyValues {
  public var originalERRunLevyPayer : ERRunLevyPayer_ACC
  public var erRunLevyPayer : ERRunLevyPayer_ACC
  public var branchID : Long
  public var accPolicyID : String
  public var policyNumber : String
  public var levyYear : Integer
  public var periodStart : Date
  public var periodEnd : Date
  public var cuCode : String
  public var liableEarnings : BigDecimal
  public var levyDue : BigDecimal
  public var isCpx : Boolean
  public var isShareholderLE : Boolean
  public var erTransfer : ERTransfer_ACC
  public var isAudit : Boolean
  public var isAEPMember : Boolean
  public var isWPSOrWPCPolicy : Boolean
}