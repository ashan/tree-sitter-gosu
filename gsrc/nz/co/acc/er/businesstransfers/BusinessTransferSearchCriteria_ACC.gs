package nz.co.acc.er.businesstransfers

uses nz.co.acc.er.databeans.TransferLevyDataBean_ACC

uses java.io.Serializable

/**
 * Created by andy on 5/10/2017.
 */
class BusinessTransferSearchCriteria_ACC implements  Serializable{

  private var _levySearchResultsList: TransferLevyDataBean_ACC[] as LevySearchResultsList

  private var _accPolicyIdField : String as AccPolicyIdField
  private var _levyNameField : String as LevyNameField


}