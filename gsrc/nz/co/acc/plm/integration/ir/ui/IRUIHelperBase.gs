package nz.co.acc.plm.integration.ir.ui

uses gw.api.database.Query
uses gw.api.database.Relop
uses nz.co.acc.integration.ir.record.parser.PropertiesParser
uses nz.co.acc.plm.integration.ir.util.BundleHelper
uses pcf.AccountFileForward
uses pcf.IRSequencerAdmin_ACC

/**
 * UI helper base class. Functions in this class can be shared by all the UI helper
 */
class IRUIHelperBase {

  // Colours for the visual elements
  public static final var COLOUR_ALERT : String = "red"
  public static final var COLOUR_EMPHASISE : String = "blue"
  public static final var COLOUR_NORMAL : String = "black"

  /**
   * Go to the IR inbound admin page with a given batch record highlighted.
   */
  public static function gotoIRInboundAdmin(batchExternalKey : String) {
    var uiHelper = new IRInboundAdminUIHelper()
    uiHelper.clearSearchCriteria()
    uiHelper.SelectedBatchId = batchExternalKey
    uiHelper.doSearch()
    pcf.IRInboundAdmin_ACC.push(uiHelper)
  }

  /**
   * Go to the batch detail page
   */
  public static function gotoBatchDetails(details : IRInboundBatch_ACC) {
    var uiHelper = new IRInboundBatchUIHelper(details)
    pcf.IRInboundBatch_ACCPopup.push(uiHelper)
  }

  /**
   * Go to the batch detail page, select the given inbound record
   */
  public static function gotoBatchDetails(inbound : IRInboundRecord_ACC) {
    var uiHelper = new IRInboundBatchUIHelper(inbound)
    pcf.IRInboundBatch_ACCPopup.push(uiHelper)
  }

  /**
   * Go to the batch detail page given an ID (used for linking via activity)
   */
  public static function gotoBatchDetails(inboundID : String) {
    var query = Query.make(IRInboundRecord_ACC)
    query.compare(IRInboundRecord_ACC#PublicID, Relop.Equals, inboundID)
    var inbound = query.select().AtMostOneRow
    gotoBatchDetails(inbound)
  }

  /**
   * Go to the sequencer page with a sequence key highlighted
   */
  public static function gotoSequencerDetails(seqKey : String) {
    var uiHelper = new IRSequencerAdminUIHelper()
    uiHelper.SelectedSequencerKey = seqKey
    uiHelper.doSearch()
    IRSequencerAdmin_ACC.push(uiHelper)
  }

  /**
   * Go to the account screen
   */
  public static function gotoAccountDetailsForACCID(accID : String) {
    var query = Query.make(Account)
    query.compare(Account#ACCID_ACC, Relop.Equals, accID)
    var account = query.select().AtMostOneRow
    AccountFileForward.go(account)
  }

  /**
   * Go to the account screen
   */
  public static function gotoAccountDetails(accNo : String) {
    var query = Query.make(Account)
    query.compare(Account#AccountNumber, Relop.Equals, accNo)
    var account = query.select().AtMostOneRow
    AccountFileForward.go(account)
  }

  /**
   * Get the display color for payload element validation
   */
  public static function getDisplayColor(result : PropertiesParser.PropertiesParserResult) : String {
    if (result.ParseError != null) {
      return COLOUR_ALERT
    } else {
      return COLOUR_NORMAL
    }
  }

  /**
   * Get the display color for schedule
   */
  public static function getDisplayColor(schedule : IRSchedule_ACC) : String {
    if (schedule.IsBlocked) {
      return COLOUR_ALERT
    } else {
      return COLOUR_NORMAL
    }
  }

  /**
   * Get the display color for inbound record
   */
  public static function getDisplayColor(inbound : IRInboundRecord_ACC) : String {
    if (inbound.hasErrorState()) {
      return COLOUR_ALERT
    } else {
      return COLOUR_NORMAL
    }
  }

  /**
   * Get the icon to show if the inbound is completed
   */
  public static function getIcon(rec : IRInboundRecord_ACC) : String {
    if (rec.hasCompletedState()) {
      return "profiler_green.png"
    } else {
      return "trans_pixel.png"
    }
  }

  /**
   * Get the icon to show if the inbound is completed
   */
  public static function getIcon(rec : SequencedDelegate_ACC) : String {
    if (rec.Completed) {
      return "profiler_green.png"
    } else {
      return "trans_pixel.png"
    }
  }

  /**
   * Get the icon to show if the payload is original
   */
  public static function getIcon(payloadWrapper : InboundPayloadWrapper) : String {
    if (payloadWrapper.IsOriginal) {
      return "tier2-small.png"
    } else {
      return "editchange_12.png"
    }
  }

  /**
   * Return {@code true} if the payload element needs to be highlighted
   */
  public static function getHighlight(result : PropertiesParser.PropertiesParserResult) : boolean {
    return result.ParseError != null
  }

  /**
   * Resume the sequencer
   */
  public static function resume(sequencer : IRSequencer_ACC) {
    gw.transaction.Transaction.runWithNewBundle(\b -> {
      var edit = BundleHelper.explicitlyAddBeanToBundle(b, sequencer, true)
      if (!edit.IsActive) {
        edit.IsActive = true
        edit.resetSequencerPointerToExecNextRecord()
      }
    })
  }

  /**
   * Suspend the sequencer
   */
  public static function suspend(sequencer : IRSequencer_ACC) {
    gw.transaction.Transaction.runWithNewBundle(\b -> {
      var edit = BundleHelper.explicitlyAddBeanToBundle(b, sequencer, true)
      if (edit.IsActive) {
        edit.IsActive = false
      }
    })
  }

  /**
   * Reset Sequencer Pointer
   */
  public static function resetSequencerPointer(sequencer : IRSequencer_ACC) {
    gw.transaction.Transaction.runWithNewBundle(\b -> {
      var edit = BundleHelper.explicitlyAddBeanToBundle(b, sequencer, true)
      edit.resetSequencerPointerToExecNextRecord()
    })
  }

  /**
   * Export the runtime message report
   */
  public static function exportRuntimeMessages(batch : IRInboundBatch_ACC) {
    var helper = new IRBatchRuntimeMsgHelper(batch)
    helper.exportErrorMsgs()
  }

  /**
   * Is this schedule editable?
   *
   * @return {@code true} if editable
   */
  public static function isEditable(schedule : IRSchedule_ACC) : boolean {
    return schedule.ExternalKey == null
  }

}
