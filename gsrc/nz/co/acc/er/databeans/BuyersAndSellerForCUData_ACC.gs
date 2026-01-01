package nz.co.acc.er.databeans


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


  @Override
  function getEarningsForCu() : BuyersOrSellersRowData_ACC[] {
    return _buyersOrSellerRowDataArray.toArray(new BuyersOrSellersRowData_ACC[_buyersOrSellerRowDataArray.size()]);
  }

  @Override
  function setEarningsForCu(le : BuyersOrSellersRowData_ACC[])  {
    _buyersOrSellerRowData = le
  }
}