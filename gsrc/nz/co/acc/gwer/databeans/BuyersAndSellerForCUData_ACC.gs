package nz.co.acc.gwer.databeans


uses java.io.Serializable

/**
 * Created by andy on 25/09/2017.
 */
class BuyersAndSellerForCUData_ACC implements Serializable {

  private var _cuInfo : CUData_ACC as CuInfo
  var _buyersOrSellerRowData: BuyersOrSellersRowData_ACC[]
  var _buyersOrSellerRowDataArray: ArrayList<BuyersOrSellersRowData_ACC> as BuyersOrSellerRowDataArray

  construct(cuInfo : CUData_ACC) {
    _cuInfo = cuInfo
    _buyersOrSellerRowDataArray = new ArrayList<BuyersOrSellersRowData_ACC>()
  }


  property get EarningsForCu() : BuyersOrSellersRowData_ACC[] {
    return _buyersOrSellerRowDataArray.toArray(new BuyersOrSellersRowData_ACC[_buyersOrSellerRowDataArray.size()]);
  }

  property set EarningsForCu(le : BuyersOrSellersRowData_ACC[]) {
    _buyersOrSellerRowData = le
  }
}