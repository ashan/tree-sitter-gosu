package nz.co.acc.er.databeans


uses gw.api.locale.DisplayKey

uses java.io.Serializable
uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Created by andy on 25/09/2017.
 */
class BuyersOrSellersRowData_ACC implements Serializable {


  var _partyId : String as PartyId
  var _levyPayerName : String as LevyPayerName
  var _partyRole : TransferLevyDataBean_ACC.BuyerSellerType as PartyRole
  var _liableEarningsAmountsForYear : LiableEarningsAmountsData_ACC[]
  var _liableEarningsAmountsForYearArray : ArrayList<LiableEarningsAmountsData_ACC> as LiableEarningsAmountsForYearArray = new ArrayList<LiableEarningsAmountsData_ACC>()

  var _columnHeaderLabels : HeaderLabels[] as ColumnHeaderLabels

  construct() {
  }

  @Override
  function getliableEarningsAmountsForYear() : LiableEarningsAmountsData_ACC[] {
    return _liableEarningsAmountsForYearArray.toArray(new LiableEarningsAmountsData_ACC[_liableEarningsAmountsForYearArray.size()]);
  }

  @Override
  function setliableEarningsAmountsForYear(le : LiableEarningsAmountsData_ACC[])  {
    _liableEarningsAmountsForYear = le
  }

  function resetHeaderLabels() {
    var headers : ArrayList<HeaderLabels> = new ArrayList<HeaderLabels>()
    for (year in _liableEarningsAmountsForYearArray) {
      headers.add(new HeaderLabels(year.Year))
    }
    ColumnHeaderLabels = headers.toArray(new HeaderLabels[headers.size()])
  }

  function dataChanged(earnings : BuyersOrSellersRowData_ACC, year : int, buyersForCu : BuyersAndSellerForCUData_ACC) {
    var buyersLiableEarningsTotal : BigDecimal = 0
    var buyersLevyDueTotal : BigDecimal = 0

    var liableEarningsTotalForYear : BigDecimal = 0
    var levyDueTotalForYear : BigDecimal = 0


    // Get the Totals Row and store the amounts.  This is needed to work out percentages below
    for (totals in buyersForCu.BuyersOrSellerRowDataArray.last().LiableEarningsAmountsForYearArray) {
      if (totals.Year == year) {
        // Store the totals
        liableEarningsTotalForYear = totals.LiableEarningsAmount
        levyDueTotalForYear = totals.LevyDueAmount
        break
      }
    }

    // Cycle through all the rows and find all the buyers
    for (buyer in buyersForCu.BuyersOrSellerRowDataArray) {
      if (buyer.PartyRole == TransferLevyDataBean_ACC.BuyerSellerType.BUYER) {
        // Now cycle throught the buyers levy years to find the right one
        for (years in buyer.LiableEarningsAmountsForYearArray) {
          if (years.Year == year) {
            // Woo hoo.  Found one.
            if (years.LiableEarningsAmount == null) {
              years.LiableEarningsAmount = new BigDecimal(0)
            }
            // If the totals is zero then make the levy Due 0
            if (liableEarningsTotalForYear == 0 or years.LiableEarningsAmount == 0) {
              years.LevyDueAmount = new BigDecimal(0)
            } else {
              var percentage : BigDecimal = (years.LiableEarningsAmount / liableEarningsTotalForYear)
              years.LevyDueAmount = (levyDueTotalForYear * percentage).setScale(2, RoundingMode.HALF_UP)
            }

            buyersLiableEarningsTotal = buyersLiableEarningsTotal + years.LiableEarningsAmount
            buyersLevyDueTotal = buyersLevyDueTotal + years.LevyDueAmount

            break
          }
        }
      }
    }

    // Get the Sellers Row and find the right year and update the totals
    for (seller in buyersForCu.BuyersOrSellerRowDataArray.first().LiableEarningsAmountsForYearArray) {
      if (seller.Year == year) {
        // Store the totals
        seller.LiableEarningsAmount = liableEarningsTotalForYear - buyersLiableEarningsTotal
        seller.LevyDueAmount = levyDueTotalForYear - buyersLevyDueTotal
        break
      }
    }

  }


  class HeaderLabels implements Serializable {
    var _leLabel : String as LeLabel
    var _dueLabel : String as DueLabel

    construct(year : int) {
      _leLabel = year + DisplayKey.get("Web.ExperienceRating.LiableEarnings.Header.LE_ACC")
      _dueLabel = year + DisplayKey.get("Web.ExperienceRating.LiableEarnings.Header.LD_ACC")
    }
  }

}