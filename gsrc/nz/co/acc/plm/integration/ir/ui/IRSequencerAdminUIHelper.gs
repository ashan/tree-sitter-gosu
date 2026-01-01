package nz.co.acc.plm.integration.ir.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

/**
 * UI helper class for Screen IRSequencerAdmin.
 */
class IRSequencerAdminUIHelper extends IRUIHelperBase {

  private var _propHelper = new ConstantPropertyHelper()

  private var _selectedSequencerKey : String as SelectedSequencerKey = null
  private var _selectedActiveFlag : String as SelectedActiveFlag = _propHelper.FLAG_ALL

  private var _activeFlagOptions : String[] as ActiveFlagOptions = {_propHelper.FLAG_NO,
                                                                    _propHelper.FLAG_YES,
                                                                    _propHelper.FLAG_ALL}

  private var _searchResult : IQueryBeanResult<IRSequencer_ACC> as SearchResult

  /**
   * Constructor
   */
  public construct() {
    doSearch()
  }

  /**
   * Search sequencer by cirteria
   */
  public function doSearch() {
    _searchResult = null
    var aQuary = Query.make(IRSequencer_ACC)
    var orderBy = QuerySelectColumns.path(Paths.make(IRSequencer_ACC#SequencerKey))

    if (_selectedSequencerKey != null) {
      aQuary.compare(IRSequencer_ACC#SequencerKey, Equals, _selectedSequencerKey)
    } else {
      if (_selectedActiveFlag == _propHelper.FLAG_YES) {
        //only want completed batches
        aQuary.compare(IRSequencer_ACC#IsActive, Equals, true)
      } else if (_selectedActiveFlag == _propHelper.FLAG_NO) {
        aQuary.compare(IRSequencer_ACC#IsActive, Equals, false)
      }
    }
    _searchResult = aQuary.select().orderByDescending(orderBy) as IQueryBeanResult<IRSequencer_ACC>
  }

  /**
   * Get the display color for payload element validation
   */
  public function getDisplayColor(result: IRSequencer_ACC): String {
    if (result.IsActive) {
      return COLOUR_NORMAL
    } else {
      return COLOUR_ALERT
    }
  }

}