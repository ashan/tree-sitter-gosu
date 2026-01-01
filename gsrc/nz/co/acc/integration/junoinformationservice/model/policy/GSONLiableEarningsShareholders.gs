package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

/**
 * Created by Mike Ourednik on 1/07/2020.
 */
class GSONLiableEarningsShareholders {
  public var adjustedLiableEarnings : BigDecimal
  public var adjustedLiableEarningsLessCpx : BigDecimal
  public var auditAdjustedLiableEarningsLessCpx : BigDecimal
  public var excessMax : BigDecimal
  public var firstWeek : BigDecimal
  public var liableEarnings : BigDecimal
  public var postWeek : BigDecimal
  public var remuneration : BigDecimal

  public var shareHolders : List<GSONLiableEarningsShareholder>
}