package nz.co.acc.er.businesstransfers

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.plugin.util.CurrentUserUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.er.databeans.LevyTransferStatus_ACC
uses pcf.MenuNavigation_ACCForward

uses java.io.Serializable

/**
 * Created by andy on 9/10/2017.
 */
class NavigationPageController_ACC implements Serializable {
  private static var _logger = StructuredLogger.INTEGRATION.withClass(NavigationPageController_ACC)

  /**
   * Details All the pages in this wizard
   */
  enum PagesForTransferNavigation {
    TransferList(-1),
    InformationPage(1),
    LiableEarnings(2),
    Claims(3),
    Summary(4)

    var _pageOrder : int

    private construct(pageOrder : int) {
      this._pageOrder = pageOrder
    }

    public function getPageOrder() : int {
      return _pageOrder
    }

    public function isFirstPage() : boolean {
      if (_pageOrder == 1) {
        return true
      }
      return false
    }

    public function isLastPage() : boolean {
      if (_pageOrder == count()) {
        return true
      }
      return false
    }

    public static function count() : int {
      // Dont to the negative numbers (Transfers List)
      return PagesForTransferNavigation.AllValues.size() - 1
    }

    public function getPageFromOrderNumber(order: int) : PagesForTransferNavigation {
      for (page in PagesForTransferNavigation.AllValues) {
        if (order == page.getPageOrder()) {
          return page
        }
      }
      // Opps   use default
      return Summary
    }

    /**
     * Get the next page in the navigation
     * @return  PagesForTransferNavigation
     */
    public function getNextPageInNavigation() : PagesForTransferNavigation {
      var nextPg : PagesForTransferNavigation
      try {
        nextPg = getPageFromOrderNumber(_pageOrder + 1)
      }
      catch (e : Exception) {
        // Oppps.  Just get the last one
        nextPg = getPageFromOrderNumber(PagesForTransferNavigation.count())
      }

      return nextPg
    }

    /**
     * Get the prev page in the navigation
     * @return  PagesForTransferNavigation
     */
    public function getPrevPageInNavigation() : PagesForTransferNavigation {
      var prevPg : PagesForTransferNavigation
      try {
        prevPg = getPageFromOrderNumber(_pageOrder - 1)
      }
      catch (e : Exception) {
        // Oppps.  Just get the first one
        prevPg = getPageFromOrderNumber(1)
      }

      return prevPg
    }
  }


  var _backButton: NavigationButtonController_ACC as BackButton = new NavigationButtonController_ACC(NavigationButtonController_ACC.WizardButton.BackButton)
  var _nextButton: NavigationButtonController_ACC as NextButton = new NavigationButtonController_ACC(NavigationButtonController_ACC.WizardButton.NextButton)
  var _cancelButton: NavigationButtonController_ACC as CancelButton = new NavigationButtonController_ACC(NavigationButtonController_ACC.WizardButton.CancelButton)
  var _saveButton: NavigationButtonController_ACC as SaveButton = new NavigationButtonController_ACC(NavigationButtonController_ACC.WizardButton.SaveButton)
  var _submitButton: NavigationButtonController_ACC as SubmitButton = new NavigationButtonController_ACC(NavigationButtonController_ACC.WizardButton.SubmitButton)
  var _withdrawButton: NavigationButtonController_ACC as WithdrawButton = new NavigationButtonController_ACC(NavigationButtonController_ACC.WizardButton.WithdrawButton)
  var _editButton: NavigationButtonController_ACC as EditButton = new NavigationButtonController_ACC(NavigationButtonController_ACC.WizardButton.EditButton)
  var _approveButton: NavigationButtonController_ACC as ApproveButton = new NavigationButtonController_ACC(NavigationButtonController_ACC.WizardButton.ApproveButton)
  var _declineButton: NavigationButtonController_ACC as DeclineButton = new NavigationButtonController_ACC(NavigationButtonController_ACC.WizardButton.DeclineButton)
  var _currentPage : PagesForTransferNavigation as CurrentPage

  private var _businessTransferController : BusinessTransferController_ACC

  construct() {
  }

  function initalisePage(page : PagesForTransferNavigation, businessTransferController : BusinessTransferController_ACC) {
    _currentPage = page
    _businessTransferController = businessTransferController

    switch (_currentPage) {
      case PagesForTransferNavigation.InformationPage:
        initInformationScreen()
        return
      case PagesForTransferNavigation.LiableEarnings:
        initLiableEarningsScreen()
        return
      case PagesForTransferNavigation.Claims:
        initClaimsScreen()
        return
      case PagesForTransferNavigation.Summary:
        initSummaryScreen()
        return
      default:
        _logger.error_ACC("Error determining which page user is on for Wizzard Navigation")
        throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error.InvalidPage_ACC"))
    }
  }

  /**
   * This will initialise the navigation buttons for the Information screen
   */
  private function initInformationScreen() {
    setVisibleOnButtons()
  }

  /**
   * This will initialise the navigation buttons for the Liable Earnings screen
   */
  private function initLiableEarningsScreen() {
    setVisibleOnButtons()
  }

  /**
   * This will initialise the navigation buttons for the Claims screen
   */
  private function initClaimsScreen() {
    setVisibleOnButtons()
  }

  /**
   * This will initialise the navigation buttons for the Claims Summary screen
   */
  private function initSummaryScreen() {
    setVisibleOnButtons()
  }

  /**
   * Redirect the user to the correcxt page
   * @param page
   * @param businessTransferController
   */
  function pageGo(page : PagesForTransferNavigation, businessTransferController : BusinessTransferController_ACC) {
    MenuNavigation_ACCForward.go(page, businessTransferController)
  }

  /**
   * Function to action when the Back Button is pressed
   */
  function backButtonPressed(businessTransferController : BusinessTransferController_ACC) {
    if (isPageEditable()) {
      doSaveAction()
    }
    pageGo(this._currentPage.getPrevPageInNavigation(), businessTransferController)
  }

  /**
   * Function to action when the next Button is pressed
   */
  function nextButtonPressed(businessTransferController : BusinessTransferController_ACC) {
    if (isPageEditable()) {
      doSaveAction()
    }
    pageGo(this._currentPage.getNextPageInNavigation(), businessTransferController)
  }

  /**
   * Function to action when the Cancel Button is pressed
   */
  function cancelButtonPressed() {
    pageGo(PagesForTransferNavigation.TransferList, this._businessTransferController)
  }

  /**
   * Function to action when the Save Button is pressed
   */
  function saveButtonPressed() {
    setVisibleOnButtons()

    doSaveAction()

    if (this._currentPage == PagesForTransferNavigation.InformationPage) {
        pageGo(this._currentPage, this._businessTransferController)
    }
  }

  /**
   * Function to action when the Submit Button is pressed
   */
  function submitButtonPressed() {
    if (isPageStatusDraft()) {
      //Save any data change first
      doSaveAction()
    }
    updateModifiedByDetails()
    _businessTransferController.submitForApprovalTransferInfo()
    pageGo(PagesForTransferNavigation.TransferList, this._businessTransferController)
  }

  /**
   * Function to action when the Withdraw Button is pressed
   */
  function withdrawButtonPressed() {
    if (isPageStatusDraft()) {
      //Save any data change first
      doSaveAction()
    }
    updateModifiedByDetails()
    _businessTransferController.withdrawTransferInfo()
    pageGo(PagesForTransferNavigation.TransferList, this._businessTransferController)
  }

  /**
   * Function to action when the Edit Button is pressed
   */
  function editButtonPressed() {
    updateModifiedByDetails()
    _businessTransferController.editTransferInfo()
    pageGo(this._currentPage, this._businessTransferController)
  }

  /**
   * Function to action when the Approve Button is pressed
   */
  function approveButtonPressed() {
    updateModifiedByDetails()
    _businessTransferController.approveTransferInfo()
    pageGo(PagesForTransferNavigation.TransferList, this._businessTransferController)
  }

  /**
   * Function to action when the Decline Button is pressed
   */
  function declineButtonPressed() {
    updateModifiedByDetails()
    _businessTransferController.declineTransferInfo()
    pageGo(PagesForTransferNavigation.TransferList, this._businessTransferController)
  }


  function doSaveAction() {
    // Perform validation before saving
    performValidation()

    // Reset the status to draft
    this._businessTransferController.WorkingTransferDataObject.TransferStatusDescription = _businessTransferController.TransferStatusList.getDescriptionFromCode(
        LevyTransferStatus_ACC.TransferStatusDraftCode)

    // Do the same that is appropiate for this page
    switch (this._currentPage) {
      case PagesForTransferNavigation.InformationPage:
        if (!this._businessTransferController.WorkingTransferDataObject.isExistingRecord()) {
          // Update createdBy details first
          this._businessTransferController.WorkingTransferDataObject.CreatedDate = Date.Now
          this._businessTransferController.WorkingTransferDataObject.CreatedBy = CurrentUserUtil.CurrentUser.User.DisplayName
          this._businessTransferController.WorkingTransferDataObject.CreatedByEmail = CurrentUserUtil.CurrentUser.User.Contact.EmailAddress1
          _businessTransferController.createTransferInfo()
        } else {
          // Update modifiedBy details first
          updateModifiedByDetails()
          _businessTransferController.updateTransferInfo()
        }
        break;

      case PagesForTransferNavigation.LiableEarnings:
        updateModifiedByDetails()
        _businessTransferController.saveLiableEarningsData()
        break;

      case PagesForTransferNavigation.Claims:
        updateModifiedByDetails()
        _businessTransferController.saveClaimsData()
        break;

      case PagesForTransferNavigation.Summary:
        updateModifiedByDetails()
        break;

    }

    setEnabledOnButtons()
    this._businessTransferController.WorkingTransferDataObject.DataJustSavedOk = true
  }

  /**
   * Call this to update all the Modified details
   */
  function updateModifiedByDetails() {
    this._businessTransferController.WorkingTransferDataObject.LastModifiedDate = gw.api.util.DateUtil.currentDate()
    this._businessTransferController.WorkingTransferDataObject.LastModifiedBy = CurrentUserUtil.getCurrentUser().User.getDisplayName()
    this._businessTransferController.WorkingTransferDataObject.LastModifieByEmail = CurrentUserUtil.getCurrentUser().User.getContact().getEmailAddress1()
  }

  function canShowPrev() : boolean{
    return !this._currentPage.isFirstPage()
  }

  function canShowNext() : boolean{
    if ( this._businessTransferController.isTransferTypeFull()) {
      return false
    }
    if (this._currentPage.isLastPage()) {
      return false
    }
    return true
  }

  function canShowEdit() : boolean {
    if (!perm.System.editbusinesstransfersacc) {
      return false
    }
    if (isPageStatusDraft()) {
      return false
    }
    return true
  }

  function canShowSubmitButton() : boolean {
    if (!perm.System.editbusinesstransfersacc) {
      return false
    }
    if (isPageStatusDraft()) {
      return true
    }
    return false
  }

  function canShowDeclineButton() : boolean {
    if (!perm.System.approvebusinesstransfersacc) {
      return false
    }
    if (_businessTransferController.WorkingTransferDataObject.TransferStatusDescription.equals(
            _businessTransferController.TransferStatusList.getDescriptionFromCode(
                LevyTransferStatus_ACC.TransferStatusReadyForApprovalCode))) {
      return true
    }
    return false
  }

  function canShowApproveButton() : boolean {
    if (!perm.System.approvebusinesstransfersacc) {
      return false
    }
    if (_businessTransferController.WorkingTransferDataObject.TransferStatusDescription.equals(
            _businessTransferController.TransferStatusList.getDescriptionFromCode(
                LevyTransferStatus_ACC.TransferStatusReadyForApprovalCode))) {
      return true
    }
    return false
  }

  function canShowSaveButton() : boolean {
    if (!perm.System.editbusinesstransfersacc) {
      return false
    }
    if (!isPageStatusDraft()) {
      return false
    }

    if (this._currentPage == PagesForTransferNavigation.InformationPage and
        this._businessTransferController.WorkingTransferDataObject.isExistingRecord()) {
      return false
    }

    return true
  }

  function canShowCancelButton() : boolean {
    return true
  }

  function canShowWithdrawButton() : boolean {
    if (!perm.System.editbusinesstransfersacc) {
      return false
    }
    if (!isPageStatusDraft()) {
      return false
    }
    if (_businessTransferController.WorkingTransferDataObject.TransferId==0) {
      return false
    }
    return true
  }

  function isPageEditable(businessTransferController : BusinessTransferController_ACC, page : PagesForTransferNavigation) : boolean {
    _businessTransferController = businessTransferController
    this._currentPage = page
    return isPageEditable()
  }

  function isPageEditable() : boolean {
    if (!perm.System.editbusinesstransfersacc) {
      return false
    }
    if (!isPageStatusDraft()) {
      return false
    }
    // can edit
    if (this._currentPage == PagesForTransferNavigation.InformationPage and
        this._businessTransferController.WorkingTransferDataObject.isExistingRecord()) {
      return false
    }
    // can create
    if (this._currentPage == PagesForTransferNavigation.InformationPage and
        !this._businessTransferController.WorkingTransferDataObject.isExistingRecord() and
        !perm.System.createbusinesstransfersacc) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error.CreateTransfer_ACC"))
    }
    return true
  }

  function isPageStatusDraft() : boolean {
    if (_businessTransferController.WorkingTransferDataObject.TransferStatusDescription.equals(
        _businessTransferController.TransferStatusList.getDescriptionFromCode(
            LevyTransferStatus_ACC.TransferStatusDraftCode))) {
      return true
    }
    return false
  }
  /**
   * Set all the buttons to be visible or not
   * @param back
   * @param next
   * @param cancel
   * @param save
   * @param submit
   * @param withdraw
   * @param edit
   * @param approve
   * @param decline
   */
  private function setVisibleOnButtons() {
    BackButton.setVisible(canShowPrev())
    NextButton.setVisible(canShowNext())
    CancelButton.setVisible(canShowCancelButton())
    SaveButton.setVisible(canShowSaveButton())
    SubmitButton.setVisible(canShowSubmitButton())
    WithdrawButton.setVisible(canShowWithdrawButton())
    EditButton.setVisible(canShowEdit())
    ApproveButton.setVisible(canShowApproveButton())
    DeclineButton.setVisible(canShowDeclineButton())
    setEnabledOnButtons()
  }


  /**
   * If the button is visible, Set the buttons to be enabled or not
   * Choosing this method will set Enabled to be the same as Visible
   */
  private function setEnabledOnButtons() {
    BackButton.setEnabled(_backButton.isVisible())
    NextButton.setEnabled(_nextButton.isVisible())
    CancelButton.setEnabled(_cancelButton.isVisible())
    SaveButton.setEnabled(_saveButton.isVisible())
    SubmitButton.setEnabled(_submitButton.isVisible())
    WithdrawButton.setEnabled(_withdrawButton.isVisible())
    EditButton.setEnabled(_editButton.isVisible())
    ApproveButton.setEnabled(_approveButton.isVisible())
    DeclineButton.setEnabled(_declineButton.isVisible())
  }

  /**
   * If the button is visible, Set the buttons to be enabled or not
   * @param back
   * @param next
   * @param cancel
   * @param save
   * @param submit
   * @param withdraw
   * @param edit
   * @param approve
   * @param decline
   */
  private function setEnabledOnButtons(back : boolean,
                                       next : boolean,
                                       cancel : boolean,
                                       save : boolean,
                                       submit : boolean,
                                       withdraw : boolean,
                                       edit : boolean,
                                       approve : boolean,
                                       decline : boolean ) {
    BackButton.setEnabled(back)
    NextButton.setEnabled(next)
    CancelButton.setEnabled(cancel)
    SaveButton.setEnabled(save)
    SubmitButton.setEnabled(submit)
    WithdrawButton.setEnabled(withdraw)
    EditButton.setEnabled(edit)
    ApproveButton.setEnabled(approve)
    DeclineButton.setEnabled(decline)
  }

  function performValidation() {

    switch (this._currentPage) {
      case PagesForTransferNavigation.InformationPage:
        validateInformationPage()
        return
      case PagesForTransferNavigation.LiableEarnings:
        validateLiableEarningsPage()
        return
      case PagesForTransferNavigation.Claims:
        validateClaimsPage()
        return
      case PagesForTransferNavigation.Summary:
        validateSummaryPage()
        return
    }
  }


  function validateInformationPage() {

    if (_businessTransferController.WorkingTransferDataObject.TransferDate == null) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ValidationError.Mandatory_ACC", "Transfer Date"))
    }
    if (_businessTransferController.WorkingTransferDataObject.TransferTypeDescription == null or
        _businessTransferController.WorkingTransferDataObject.TransferTypeDescription.Empty) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ValidationError.Mandatory_ACC", "Transfer Type"))
    }
    if (_businessTransferController.WorkingTransferDataObject.SellerTransferDataBean.AccPolicyId == null or
        _businessTransferController.WorkingTransferDataObject.SellerTransferDataBean.AccPolicyId.Empty) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ValidationError.Mandatory_ACC", "Seller"))
    }
    if (_businessTransferController.WorkingTransferDataObject.BuyerTransferDataBeans.length == 0 or
        _businessTransferController.WorkingTransferDataObject.BuyerTransferDataBeans.first() == null or
        _businessTransferController.WorkingTransferDataObject.BuyerTransferDataBeans.first().AccPolicyId == null or
        _businessTransferController.WorkingTransferDataObject.BuyerTransferDataBeans.first().AccPolicyId.Empty) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ValidationError.Mandatory_ACC", "Buyer"))
    }
    for (buyer in _businessTransferController.WorkingTransferDataObject.BuyerTransferDataBeans) {
      if (buyer.AccPolicyId.equals(_businessTransferController.WorkingTransferDataObject.SellerTransferDataBean.AccPolicyId)) {
        throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ValidationError.Buyer.IsSeller_ACC"))
      }
    }

    // Check the buyer has not been added twice
    var buyersList : ArrayList<String> = new ArrayList<String>()
    for (buyer in _businessTransferController.WorkingTransferDataObject.BuyerTransferDataBeans) {
      buyersList.add(buyer.AccPolicyId)
    }
    
    if(buyersList.Count != buyersList.toSet().Count) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ValidationError.MulitBuyers_ACC"))
    }

  }
  function validateLiableEarningsPage() {

  }
  function validateClaimsPage() {

  }
  function validateSummaryPage() {

  }
}