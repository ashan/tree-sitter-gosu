package nz.co.acc.gwer.businesstransfers

uses nz.co.acc.gwer.util.ERUIUtils_ACC

uses java.io.Serializable

/**
 * Created by andy on 5/10/2017.
 */
class LevyPayerSearchCriteria_ACC implements  Serializable{

  private var _levySearchResultsList: LevyPayerDetail[] as LevySearchResultsList

  private var _accPolicyIdField : String as AccPolicyIdField
  private var _levyNameField : String as LevyNameField
  private var _levyYear : Integer as LevyYear

  function search() : List<LevyPayerDetail> {
    var list = new ArrayList<LevyPayerDetail>()
    var erUIUtils = new ERUIUtils_ACC()
    var results = erUIUtils.getLevyPayers(_accPolicyIdField, _levyYear)
    results.each(\elt -> list.add(new LevyPayerDetail(AccPolicyIdField, elt.DisplayName)))
    _levySearchResultsList = list.toTypedArray()
    return list
  }
}