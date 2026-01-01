package nz.co.acc.plm.integration.ir.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths
uses gw.entity.TypeKey
uses nz.co.acc.integration.ir.record.parser.PropertiesParser
uses nz.co.acc.integration.ir.record.parser.RecordParser
uses nz.co.acc.plm.integration.ir.stats.IRBatchStats
uses org.apache.commons.lang.StringUtils

/**
 * UI helper class for Screen IRInboundBatch.
 */
class IRInboundBatchUIHelper extends IRUIHelperBase {

  private var _batch : IRInboundBatch_ACC as SelectedBatch
  private var _batchStatus : IRBatchStats as BatchStats
  private var _inbound : IRInboundRecord_ACC as SelectedInboundRecord
  private var _inboundCount : Integer as InboundCount
  private var _currentInboundCount : Integer as CurrentInboundCount
  private var _payloadWrapperList : List<InboundPayloadWrapper>as PayloadWrapperList
  private var _selectedPayload : InboundPayloadWrapper as SelectedPayload

  //Search result
  private var _inboundRecords : IQueryBeanResult<IRInboundRecord_ACC>as InboundRecords

  //Search criteria
  private var _searchTK : TypeKey as SearchTK
  private var _searchKeyword : String as SearchKeyword
  private var _searchKeywordName : String as SearchKeywordName

  private var _sequencerKey : String as readonly SequencerKey = "SequencerKey"
  private var _externalKey : String as readonly ExternalKey = "ExternalKey"

  //Control fields
  private var _uiPayloadOverrideMode : boolean as UiPayloadOverrideMode = false

  /**
   * Constructor
   */
  public construct(batch : IRInboundBatch_ACC) {
    _batch = batch
    init()
  }

  /**
   * Constructor, the given inbound record will be highlighted.
   */
  public construct(inbound : IRInboundRecord_ACC) {
    select(inbound)
    _batch = inbound.IRInboundBatch_ACC
    _batchStatus = new IRBatchStats(_batch)
  }

  /**
   * Initialization
   */
  private function init() {
    doSearchRecords()
    if (_inbound == null && _inboundRecords.HasElements) {
      select(_inboundRecords.first())
    }
    _batchStatus = new IRBatchStats(_batch)
    findRecordCount()
  }

  /**
   * Find record counts for the batch, using Query to improve performance.
   */
  private function findRecordCount() {
    var q = Query.make(IRInboundRecord_ACC)
    q.compare(IRInboundRecord_ACC#IRInboundBatch_ACC, Equals, _batch)
    _inboundCount = q.select().Count
  }

  /**
   * Search records by filter...
   */
  public function doSearchRecords() {
    var orderBy = QuerySelectColumns.path(Paths.make(IRInboundRecord_ACC#RecordSequence))
    var q = Query.make(IRInboundRecord_ACC)
    q.compare(IRInboundRecord_ACC#IRInboundBatch_ACC, Equals, _batch)
    if (_searchTK != null) {
      if (_searchTK typeis IRExtRecordType_ACC) {
        q.compare(IRInboundRecord_ACC#IRExtRecordType_ACC, Equals, _searchTK)
      } else if (_searchTK typeis IRInboundRecordStatus_ACC) {
        q.compare(IRInboundRecord_ACC#Status, Equals, _searchTK)
      }
    }
    if (_searchKeyword != null) {
      if (_searchKeywordName == SequencerKey) {
        q.compare(IRInboundRecord_ACC#SequencerKey, Equals, _searchKeyword)
      } else if (_searchKeywordName == ExternalKey) {
        q.compare(IRInboundRecord_ACC#ExternalKey, Equals, _searchKeyword)
      }
    }
    _inboundRecords = q.select().orderBy(orderBy) as IQueryBeanResult<IRInboundRecord_ACC>
    _currentInboundCount = _inboundRecords.Count
  }

  /**
   * Select the given inbound record in the Screen
   */
  public function select(inbound : IRInboundRecord_ACC) {
    _inbound = inbound
    buildPayloadListForDisplay()
  }

  /**
   * Filter the records by given TypeKey.
   * The TypeKey can be ActionType or ExecStatus.
   */
  public function searchByTK(tk : TypeKey) {
    clearSearchCriteria()
    _searchTK = tk
    doSearchRecords()
    if (_inboundRecords.HasElements) {
      select(_inboundRecords.first())
    }
  }

  /**
   * Filter the records by given keyword.
   * The keyword can be external key or sequence key.
   */
  public function searchByKeyword(kw : String, kwName : String) {
    clearSearchCriteria()
    _searchKeyword = kw
    _searchKeywordName = kwName
    doSearchRecords()
    if (_inboundRecords.HasElements) {
      select(_inboundRecords.first())
    }
  }

  /**
   * Clear all the search criteria
   */
  public function clearSearchCriteria() {
    _searchTK = null
    _searchKeyword = null
    _searchKeywordName = null
  }

  /**
   * Return the current FilterName
   */
  public property get FilterName() : String {
    if (_searchTK != null) {
      return _searchTK.Code
    } else if (_searchKeywordName != null) {
      return _searchKeywordName
    } else {
      return null
    }
  }

  /**
   * Select the given payload
   */
  public function select(payload : InboundPayloadWrapper) {
    _selectedPayload = payload
  }

  /**
   * Recalculate the status for the current batch
   */
  public function reloadStats() {
    gw.transaction.Transaction.runWithNewBundle(\b -> {
      var edit = b.add(_batch)
      _batchStatus.IRBatch = edit
      _batchStatus.rebuildStats()
    })
    _batch = _batch.refresh() as IRInboundBatch_ACC
    clearSearchCriteria()
    doSearchRecords()
  }

  /**
   * This is for runtime card. This list is used for runtime card.
   */
  public function buildPayloadElementValidationResults() : List<PropertiesParser.PropertiesParserResult> {
    if (StringUtils.isEmpty(_selectedPayload?.Payload)) {
      return {}
    }
    if (_inbound.IRExtRecordType_ACC == IRExtRecordType_ACC.TC_CREG1) {
      return new RecordParser().parseCREGPayload(_inbound.PublicID, _selectedPayload.Payload).ParseResults
    } else if (_inbound.IRExtRecordType_ACC == IRExtRecordType_ACC.TC_CARA4) {
      return new RecordParser().parseCARA4Payload(_inbound.PublicID, _selectedPayload.Payload).ParseResults
    } else if (_inbound.IRExtRecordType_ACC == IRExtRecordType_ACC.TC_CARA5) {
      return new RecordParser().parseCARA5Payload(_inbound.PublicID, _selectedPayload.Payload).ParseResults
    } else {
      return new RecordParser().parseCARA6Payload(_inbound.PublicID, _selectedPayload.Payload).ParseResults
    }
  }

  /**
   * Build payload list for UI display.
   */
  private function buildPayloadListForDisplay() {
    _payloadWrapperList = new ArrayList<InboundPayloadWrapper>()

    var w = new InboundPayloadWrapper()
    w.IsOriginal = true
    w.Payload = this.SelectedInboundRecord.getPayloadAsUnicode()
    w.CreateUser = this.SelectedInboundRecord.CreateUser
    w.Timestamp = this.SelectedInboundRecord.CreateTime
    _payloadWrapperList.add(w)

    this.SelectedInboundRecord.IROverridePayload_ACCs?.orderBy(\r -> r.PayloadTimestamp)?.each(\r -> {
      w = new InboundPayloadWrapper()
      w.IsOriginal = false
      w.Payload = r.getPayloadAsUnicode()
      w.CreateUser = r.CreateUser
      w.Timestamp = r.PayloadTimestamp
      _payloadWrapperList.add(w)
    })
    //after refresh the payload list, set first one as the current.
    select(_payloadWrapperList.first())
  }

  /**
   * Refresh the current location by re-navigation
   */
  public function refreshCurrentLocation() {
    //Make sure we refresh the Bean with latest DB version
    _batch = _batch.refresh() as IRInboundBatch_ACC

    pcf.IRInboundAdmin_ACC.go()

    var uiHelper = new IRInboundBatchUIHelper(_batch)
    uiHelper.select(this.SelectedInboundRecord)
    pcf.IRInboundBatch_ACCPopup.push(uiHelper)
  }

  /**
   * Override payload from UI
   */
  public function doOverridePayload(location : pcf.api.Location, value : String) {
    if ((not _uiPayloadOverrideMode) or (location != null and (not location.InEditMode))) {
      return
    }

    if (location != null) {
      location.commit()
    }

    _inbound.overridePayloadInNewBundle(value)

    _inbound.setStatusToRetry()

    //Chris A 26/02/2020 JUNO-1856 Simplified UI for IR import
    // this isn't required when coming from IRInboundRecordsSearch_ACC
    // because it returns the user to the IRInboundBatch_ACCPopup
    if (location.CurrentLocation.toString() != "IRInboundRecordsSearch_ACC") {
      refreshCurrentLocation()
    }
    _uiPayloadOverrideMode = false
  }

  /**
   * Enable payload override function from UI
   */
  public function enableOverridePayload(location : pcf.api.Location) {
    _uiPayloadOverrideMode = true
    if (location != null && !location.InEditMode) {
      location.startEditing()
    }
  }

}
