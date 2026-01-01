package nz.co.acc.gwer.businesstransfers

uses gw.api.database.IQueryBeanResult
uses nz.co.acc.gwer.util.ERUIUtils_ACC

uses java.io.Serializable

/**
 * Created by andy on 5/10/2017.
 */
class BusinessTransferSearchCriteria_ACC implements Serializable {

  private var _transferStatus : ERTransferStatus_ACC as TransferStatus
  private var _searchID : Long as SearchID

  function searchTransfers() : IQueryBeanResult<ERTransfer_ACC> {
    var erUIUtils = new ERUIUtils_ACC()
    var results = erUIUtils.retrieveTransferList(_transferStatus, _searchID)
    return results
  }
}