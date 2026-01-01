package nz.co.acc.gwer.databeans


uses java.io.Serializable

/**
 * Created by andy on 25/09/2017.
 */
class TransferLevyDataBean_ACC implements Serializable {

  private var _transferId : int as TransferId
  private var _transferDate : Date as TransferDate
  private var _levyName : String as LevyName = ""
  private var _accPolicyId : String as AccPolicyId = ""
  private var _createdDate : Date as CreatedDate
  private var _createdBy : String as CreatedBy
  private var _createdByEmail : String as CreatedByEmail
  private var _lastModifiedDate : Date as LastModifiedDate
  private var _lastModifiedBy : String as LastModifiedBy
  private var _lastModifieByEmail : String as LastModifieByEmail = ""
  private var _levyPayerId : String as LevyPayerId = ""
  private var _existsInTransfer : int as ExistsInTransfer
  private var _sellerTransferDataBean : TransferLevyDataBean_ACC as SellerTransferDataBean
  private var _buyerTransferDataBeans : TransferLevyDataBean_ACC[] as BuyerTransferDataBeans
  var _transferTypeDesc : String as TransferTypeDescription = ""
  var _transferStatusDesc : String as TransferStatusDescription = ""

  private var _allBuyersAndSellersForCUData: BuyersAndSellerForCUData_ACC[] as AllBuyersAndSellersForCUData
  private var _dataJustSavedOk : boolean as DataJustSavedOk = false

  private var _transferClaimsData : TransferClaimData_ACC[] as TransferClaimsData
  private var _transferClaimsSummaryData : TransferClaimSummaryData_ACC[] as TransferClaimsSummaryData

  enum BuyerSellerType {
    SELLER("Seller"),
    BUYER("Buyer"),
    TOTAL("Total")

    var _displayTypeName : String as DisplayTypeName

    private construct(name : String) {
      this._displayTypeName = name
    }

  }

  construct() {
  }

  construct(accPolicyId : String) {
    _accPolicyId = accPolicyId
  }

  construct(transferId : int,
            transferDate : Date,
            transferTypes: String,
            levyName : String,
            accPolicyId : String,
            createdDate : Date,
            createdBy : String,
            lastModifiedDate : Date,
            lastModifiedBy : String,
            status : String ) {
    _transferId = transferId
    _transferDate = transferDate
    _transferTypeDesc = transferTypes
    _levyName = levyName
    _accPolicyId = accPolicyId
    _createdDate = createdDate
    _createdBy = createdBy
    _lastModifiedDate = lastModifiedDate
    _lastModifiedBy = lastModifiedBy
    _transferStatusDesc = status
  }

  property get ExistingRecord() : boolean {
    return TransferId != 0
  }

  property get AllLiableEmployers() : String[] {
    var employers = new ArrayList<String>()
    if (SellerTransferDataBean != null) {
      employers.add(SellerTransferDataBean.AccPolicyId)
    }
    if (BuyerTransferDataBeans != null) {
      BuyerTransferDataBeans.each(\buyer -> employers.add(buyer.AccPolicyId))
    }
    return employers.toTypedArray()
  }
}