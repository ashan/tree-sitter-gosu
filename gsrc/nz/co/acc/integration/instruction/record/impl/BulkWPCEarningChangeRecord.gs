package nz.co.acc.integration.instruction.record.impl

uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.integration.instruction.record.InstructionRecord

uses java.math.BigDecimal

class BulkWPCEarningChangeRecord implements InstructionRecord {
  private var _accID : String as readonly ACCID
  private var _levyYear : Integer as readonly LevyYear
  private var _totalGrossEarnings : BigDecimal as readonly TotalGrossEarnings
  private var _totalNotLiableEarnings : BigDecimal as readonly TotalNotLiableEarnings
  private var _totalScheduledPmnt : BigDecimal as readonly TotalScheduledPmnt
  private var _totalExcess : BigDecimal as readonly TotalExcess
  private var _firstWeek : BigDecimal as readonly FirstWeek
  private var _postWeek : BigDecimal as readonly PostWeek

  construct(accID : String,
            levyYear : Integer,
            totalGrossEarnings : BigDecimal,
            totalNotLiableEarnings : BigDecimal,
            totalScheduledPmnt : BigDecimal,
            totalExcess : BigDecimal,
            firstWeek : BigDecimal,
            postWeek : BigDecimal) {
    _accID = accID
    _levyYear = levyYear
    _totalGrossEarnings = totalGrossEarnings
    _totalNotLiableEarnings = totalNotLiableEarnings
    _totalScheduledPmnt = totalScheduledPmnt
    _totalExcess = totalExcess
    _firstWeek = firstWeek
    _postWeek = postWeek
  }

  override property get InstructionType() : InstructionType_ACC {
    return InstructionType_ACC.TC_BULKWPCEARNINGCHANGE
  }

  override property get InstructionSource() : InstructionSource_ACC {
    return InstructionSource_ACC.TC_FILE
  }
}