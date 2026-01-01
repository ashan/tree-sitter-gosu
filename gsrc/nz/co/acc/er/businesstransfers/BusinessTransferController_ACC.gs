package nz.co.acc.er.businesstransfers

uses gw.plugin.util.CurrentUserUtil
uses nz.co.acc.er.databeans.LevyTransferType_ACC
uses nz.co.acc.er.databeans.CUData_ACC
uses nz.co.acc.er.databeans.LiableEarningsAmountsData_ACC
uses nz.co.acc.er.databeans.BuyersOrSellersRowData_ACC
uses nz.co.acc.er.databeans.BuyersAndSellerForCUData_ACC
uses nz.co.acc.er.databeans.LiableEarningsTempAmountData_ACC
uses nz.co.acc.er.databeans.LiableEarningsTempData_ACC
uses nz.co.acc.er.databeans.TransferLevyDataBean_ACC
uses nz.co.acc.er.databeans.LevyTransferStatus_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcController_ACC

uses java.io.Serializable

/**
 * Created by andy on 25/09/2017.
 */
class BusinessTransferController_ACC implements Serializable{

  // navigation
  private var _navigationPageController: NavigationPageController_ACC as NavigationPageController

  // Search Levy
  private var _toManyRecordsMessage : String as ToManyRecords = ""
  private var _searchCriteria : BusinessTransferSearchCriteria_ACC as SearchCriteria
  private var _searchResultLimit : int as SearchResultLimit = ScriptParameters.getParameterValue("ERSearchResultLimit_ACC") as Integer

  // Drop down lists
  private var _transferLevyList: TransferLevyDataBean_ACC[] as TransferLevyList
  private var _cuCodeList: CUData_ACC[] as CuCodeList

  private var _transferTypeList: LevyTransferType_ACC as TransferTypeList = new LevyTransferType_ACC()
  private var _transferStatusList: LevyTransferStatus_ACC as TransferStatusList = new LevyTransferStatus_ACC()

  // User Selected options
  private var _selectedStatusFilter: String as SelectedStatusFilter

  // Main data Container
  private var _workingTransferDataObject: TransferLevyDataBean_ACC as WorkingTransferDataObject

  private var _storeProcController_ACC : StoreProcController_ACC as StoreProcController_ACC = new StoreProcController_ACC()

  construct() {
  }

  function reset() {
    _searchCriteria = new BusinessTransferSearchCriteria_ACC()
    _transferLevyList = new TransferLevyDataBean_ACC[]{}
    _transferStatusList = new LevyTransferStatus_ACC()
    _transferTypeList = new LevyTransferType_ACC()
    _selectedStatusFilter = null
    transferLevyDataBeanQualityCheck()
    WorkingTransferDataObject.DataJustSavedOk = false
  }

  function resetView() {
    _transferLevyList = new TransferLevyDataBean_ACC[]{}
    _transferStatusList = new LevyTransferStatus_ACC()
    _selectedStatusFilter = null
    transferLevyDataBeanQualityCheck()
    WorkingTransferDataObject.DataJustSavedOk = false
  }

  function isTransferTypeFull() : boolean {
    transferLevyDataBeanQualityCheck()
    if (_workingTransferDataObject.TransferTypeDescription.equals(_transferTypeList.getDescriptionFromCode(LevyTransferType_ACC.TransferTypeFullCode))) {
      return true
    }
    return false
  }

  function loaderForViewTransfers(passedStatus : String) {
    loadListOfStatuses()
    loadListOfTransferTypes()
    this._navigationPageController = new NavigationPageController_ACC()
    transferLevyDataBeanQualityCheck()
    SelectedStatusFilter = passedStatus
    loadListOfLevyTransfers()
    WorkingTransferDataObject.DataJustSavedOk = false

  }

  /**
   * Loader to initialise the information Page
   * @param transferDataObject
   */
  function loaderForInfoPage() {

    loadListOfStatuses()

    // Load the Transfer types for the Info Screen
    loadListOfTransferTypes()

    if (this._navigationPageController == null) {
      this._navigationPageController = new NavigationPageController_ACC()
    }

    transferLevyDataBeanQualityCheck()

    // Reload all the data from the DB as the search does not hget all the information
    loadTransferFromId()

    if (_workingTransferDataObject.BuyerTransferDataBeans.length == 0) {
      _workingTransferDataObject.BuyerTransferDataBeans = new TransferLevyDataBean_ACC[]{new TransferLevyDataBean_ACC()}
    }

    // Set the navigation buttons for this Screen.
    _navigationPageController.initalisePage(NavigationPageController_ACC.PagesForTransferNavigation.InformationPage, this)
    WorkingTransferDataObject.DataJustSavedOk = false
  }

  /**
   * If the user has been in the page before it will resume, Not on Enter
   * @param transferDataObject
   */
  function resumeForInfoPage() {
    loaderForInfoPage()
  }


  function loaderForLiableEarningsPage() {
    loadListOfStatuses()
    loadListOfTransferTypes()
    if (this._navigationPageController==null) {
      this._navigationPageController = new NavigationPageController_ACC()
    }
    transferLevyDataBeanQualityCheck()

    WorkingTransferDataObject.DataJustSavedOk = false

    loadLiableEarningsData()

    // Set the navigation buttons for this Screen.
    _navigationPageController.initalisePage(NavigationPageController_ACC.PagesForTransferNavigation.LiableEarnings, this)
  }

  function loaderForClaimsPage() {
    loadListOfStatuses()
    loadListOfTransferTypes()
    if (this._navigationPageController==null) {
      this._navigationPageController = new NavigationPageController_ACC()
    }
    transferLevyDataBeanQualityCheck()
    WorkingTransferDataObject.DataJustSavedOk = false

    this.WorkingTransferDataObject.TransferClaimsData = StoreProcController_ACC.loadTransferClaimsData(this.WorkingTransferDataObject)

    // Set the navigation buttons for this Screen.
    _navigationPageController.initalisePage(NavigationPageController_ACC.PagesForTransferNavigation.Claims, this)
  }

  function loaderForClaimSummaryPage() {
    loadListOfStatuses()
    loadListOfTransferTypes()
    if (this._navigationPageController==null) {
      this._navigationPageController = new NavigationPageController_ACC()
    }
    WorkingTransferDataObject.DataJustSavedOk = false

    this.WorkingTransferDataObject.TransferClaimsSummaryData = StoreProcController_ACC.loadTransferClaimsSummaryData(this.WorkingTransferDataObject)

    // Set the navigation buttons for this Screen.
    _navigationPageController.initalisePage(NavigationPageController_ACC.PagesForTransferNavigation.Summary, this)
  }

  function viewInfoOnSelectedLevyPayer(xferData : nz.co.acc.er.databeans.TransferLevyDataBean_ACC) {
    this.WorkingTransferDataObject = xferData
    NavigationPageController.pageGo(NavigationPageController_ACC.PagesForTransferNavigation.InformationPage, this)
  }

  function postBuyerChange(pickedValue : TransferLevyDataBean_ACC, currentRow : TransferLevyDataBean_ACC) {
    currentRow.LevyName = pickedValue.LevyName
  }

  function convertReturnValueString(pickedValue : TransferLevyDataBean_ACC) : String {
    return pickedValue.AccPolicyId
  }

  function convertReturnValueSeller(pickedValue : TransferLevyDataBean_ACC) : String {
    _workingTransferDataObject.SellerTransferDataBean = pickedValue;
    return _workingTransferDataObject.SellerTransferDataBean.AccPolicyId
  }
  function convertReturnValueBuyer(pickedValue : TransferLevyDataBean_ACC) : String {
    _workingTransferDataObject.BuyerTransferDataBeans[0] = pickedValue;
    return _workingTransferDataObject.BuyerTransferDataBeans.first().AccPolicyId
  }


  /**
   * Initialise data object.
   * This object creates arrays of itself and if this initialisation in done in the Data bean then it
   * causes loops when the array is initialised on the original initialisation
   */
  function transferLevyDataBeanQualityCheck() {
    if (_workingTransferDataObject == null) {
      _workingTransferDataObject = new TransferLevyDataBean_ACC()
      _workingTransferDataObject.TransferTypeDescription = _transferTypeList.getDescriptionFromCode(LevyTransferType_ACC.TransferTypeFullCode)
      _workingTransferDataObject.TransferStatusDescription = _transferStatusList.getDescriptionFromCode(LevyTransferStatus_ACC.TransferStatusDraftCode)
    }
    if (_workingTransferDataObject.SellerTransferDataBean == null) {
      _workingTransferDataObject.SellerTransferDataBean = new TransferLevyDataBean_ACC()
    }

    if (_workingTransferDataObject.BuyerTransferDataBeans == null) {
      _workingTransferDataObject.BuyerTransferDataBeans = new TransferLevyDataBean_ACC[]{new TransferLevyDataBean_ACC()}
    }
  }


  function addNewBuyer() : TransferLevyDataBean_ACC {
    var buyer = new TransferLevyDataBean_ACC()
    var list : List<TransferLevyDataBean_ACC> = _workingTransferDataObject.BuyerTransferDataBeans.toList()
    list.add(buyer)
    _workingTransferDataObject.BuyerTransferDataBeans = list.toArray(new TransferLevyDataBean_ACC[list.size()]);
    return buyer
  }

  function removeBuyer(buyer : TransferLevyDataBean_ACC) {
    var list : List<TransferLevyDataBean_ACC> = _workingTransferDataObject.BuyerTransferDataBeans.toList()
    list.remove(buyer)
    _workingTransferDataObject.BuyerTransferDataBeans = list.toArray(new TransferLevyDataBean_ACC[list.size()]);
  }

  /**
   * Select a transfer and all its information and repopulate the databean
   */
  function loadTransferFromId()  {

    // Call the Store Proc
    _storeProcController_ACC.loadTransferFromId(_workingTransferDataObject)

      // Load in the Buyers
      loadBuyersFromTransferId()

  }

  /**
   * Add Buyers to the Transfer
   * Note this will submit ONE at a time
   */
  function loadBuyersFromTransferId() {

    // Call the Store Proc
    _storeProcController_ACC.loadBuyersFromTransferId(_workingTransferDataObject)

  }

  /**
   * Submit the new Transfer to the Database
   */
  function createTransferInfo() {

    // Call the Store Proc
    _storeProcController_ACC.createTransferInfo(_workingTransferDataObject, _transferTypeList)

    // Now add all ther buyers to this Transfer
    addBuyerLevysInfo()

    // Reload all the data from the DB
    loadTransferFromId()

  }

  /**
   * Submit updates to the Database
   */
  function updateTransferInfo() {

    // Call the Store Proc
    _storeProcController_ACC.updateTransferInfo(_workingTransferDataObject, _transferStatusList)

      // Reload all the data from the DB
      loadTransferFromId()
  }

  /**
   * Add Buyers to the Transfer
   * Note this will submit ONE at a time
   */
  function addBuyerLevysInfo() {

    // Call the Store Proc
    _storeProcController_ACC.addBuyerLevysInfo(_workingTransferDataObject)

  }

  function submitForApprovalTransferInfo() {

    // Call the Store Proc
    _storeProcController_ACC.submitForApprovalTransferInfo(_workingTransferDataObject)

    // Reload all the data from the DB
    loadTransferFromId()

  }

  function editTransferInfo() {

    // Call the Store Proc
    _storeProcController_ACC.editTransferInfo(_workingTransferDataObject)

    // Reload all the data from the DB
    loadTransferFromId()

  }

  function withdrawTransferInfo() {

    // Call the Store Proc
    _storeProcController_ACC.withdrawTransferInfo(_workingTransferDataObject)

    // Reload all the data from the DB
    loadTransferFromId()

  }


  function approveTransferInfo() {

    // Call the Store Proc
    _storeProcController_ACC.approveTransferInfo(_workingTransferDataObject)

    // Reload all the data from the DB
    loadTransferFromId()

  }

  function declineTransferInfo() {

    // Call the Store Proc
    _storeProcController_ACC.declineTransferInfo(_workingTransferDataObject)

    // Reload all the data from the DB
    loadTransferFromId()

  }

  function searchLevyPayers() {

    // Call the Store Proc
    _storeProcController_ACC.searchLevyPayers(_searchCriteria, _searchResultLimit, _toManyRecordsMessage)

  }


  function loadListOfLevyTransfers()  {

    // Call the Store Proc
    _transferLevyList = _storeProcController_ACC.loadListOfLevyTransfers(_selectedStatusFilter)

  }


  function loadListOfStatuses()  {

    // Call the Store Proc
    _transferStatusList = _storeProcController_ACC.loadListOfStatuses()

  }


  function loadListOfTransferTypes()  {

    // Call the Store Proc
    _transferTypeList =_storeProcController_ACC.loadListOfTransferTypes()

  }


  /**
   * Load all the Liable Earnings data for a transfer
   */
  function loadLiableEarningsData()  {

    // Call the Store Proc
    var results : ArrayList<Object> = _storeProcController_ACC.loadLiableEarningsData(_workingTransferDataObject)

    // Sort all the raw data from the DB into a format GW can use
    sortBuyersResults(results.get(0) as ArrayList<LiableEarningsTempData_ACC>)

    sortBuyersAmountsResults(results.get(1) as ArrayList<LiableEarningsTempAmountData_ACC>)

  }

  /**
   * Sort all the data from the database
   * @param results
   */
  private function sortBuyersResults(results : ArrayList<LiableEarningsTempData_ACC>) {

    var cu : HashMap<String, CUData_ACC> = new HashMap<String, CUData_ACC>()
    var leForCus : HashMap<String, BuyersAndSellerForCUData_ACC> = new HashMap<String, BuyersAndSellerForCUData_ACC>()

    for (data in results) {
      // First pull out the cu info
      cu.put(data.CuCode, new CUData_ACC(data.CuCode, data.CuDesc))

      var leForCu : BuyersAndSellerForCUData_ACC
      if (leForCus.get(data.CuCode)==null) {
        leForCu = new BuyersAndSellerForCUData_ACC(new CUData_ACC(data.CuCode, data.CuDesc))
        // Add Seller Row
        var leForSeller : BuyersOrSellersRowData_ACC = new BuyersOrSellersRowData_ACC()
        leForSeller.LevyPayerName = WorkingTransferDataObject.SellerTransferDataBean.LevyName
        leForSeller.PartyId = WorkingTransferDataObject.SellerTransferDataBean.AccPolicyId
        leForSeller.PartyRole = TransferLevyDataBean_ACC.BuyerSellerType.SELLER
        leForCu.BuyersOrSellerRowDataArray.add(leForSeller)
        //Add Buyer Row
        for (buyer in WorkingTransferDataObject.BuyerTransferDataBeans) {
          var leForBuyer : BuyersOrSellersRowData_ACC = new BuyersOrSellersRowData_ACC()
          leForBuyer.PartyId = buyer.AccPolicyId
          leForBuyer.LevyPayerName = buyer.LevyName
          leForBuyer.PartyRole =  TransferLevyDataBean_ACC.BuyerSellerType.BUYER
          leForCu.BuyersOrSellerRowDataArray.add(leForBuyer)
        }
        // Add Totals Row
        var leTotals : BuyersOrSellersRowData_ACC = new BuyersOrSellersRowData_ACC()
        leTotals.PartyId = ""
        leTotals.PartyRole = TransferLevyDataBean_ACC.BuyerSellerType.TOTAL
        leForCu.BuyersOrSellerRowDataArray.add(leTotals)

      } else {
        leForCu = leForCus.get(data.CuCode)
      }

      // add a empty row on to each row except the last as this is added below
      for (row in leForCu.BuyersOrSellerRowDataArray) {
        if (!row.PartyRole.equals(TransferLevyDataBean_ACC.BuyerSellerType.TOTAL)) {
          var empty = new LiableEarningsAmountsData_ACC()
          empty.Year = data.Year
          row.LiableEarningsAmountsForYearArray.add(empty)
        }
      }

      // Add the totals now
      var newLeTotals = new LiableEarningsAmountsData_ACC()
      newLeTotals.Year = data.Year
      newLeTotals.LevyDueAmount = data.TotalLevyDue
      newLeTotals.LiableEarningsAmount = data.TotalLiableEarnings

      leForCu.BuyersOrSellerRowDataArray.last().LiableEarningsAmountsForYearArray.add(newLeTotals)
      leForCu.BuyersOrSellerRowDataArray.last().resetHeaderLabels()


      //If first time then add the totals to the seller
      var newLeSeller = new LiableEarningsAmountsData_ACC()
      leForCu.BuyersOrSellerRowDataArray.first().LiableEarningsAmountsForYearArray.last().Year = data.Year
      leForCu.BuyersOrSellerRowDataArray.first().LiableEarningsAmountsForYearArray.last().LevyDueAmount = data.TotalLevyDue
      leForCu.BuyersOrSellerRowDataArray.first().LiableEarningsAmountsForYearArray.last().LiableEarningsAmount = data.TotalLiableEarnings

      // Add to the growing list to complete all the totals
      leForCus.put(data.CuCode, leForCu)
    }

    // Convert all the Lists to Arrays
    this._cuCodeList = cu.values().toArray(new CUData_ACC[cu.size()]);
    this._workingTransferDataObject.AllBuyersAndSellersForCUData = leForCus.values().toArray(new BuyersAndSellerForCUData_ACC[leForCus.size()]);
  }


  /**
   * Sort all the data from the database
   * @param results
   */
  private function sortBuyersAmountsResults(results : ArrayList<LiableEarningsTempAmountData_ACC>) {
    //Cycle through all the amounts
    for (amount in results) {
      // Find the right record for this CU Code
      for (buyersForCu in this.WorkingTransferDataObject.AllBuyersAndSellersForCUData) {
        if (buyersForCu.CuInfo.CuCode.equals(amount.CUCode)) {
          for (buyerRow in buyersForCu.BuyersOrSellerRowDataArray) {
            // Find the right Buyer
            if (buyerRow.PartyId.equals(amount.ACCPolicyID)) {
              //Find the right year for this buyer
              for (buyerYear in buyerRow.LiableEarningsAmountsForYearArray) {
                if (buyerYear.Year == amount.Amounts.Year) {
                  buyerYear.TransferPolicyID = amount.Amounts.TransferPolicyID
                  buyerYear.LiableEarningsAmount = amount.Amounts.LiableEarningsAmount
                  buyerYear.LevyDueAmount = amount.Amounts.LevyDueAmount
                  // Recalculate the sellers totals as this is derived from the amounts we just entered.
                  buyerRow.dataChanged(buyerRow, buyerYear.Year, buyersForCu)
                }
              }
            }
          }
        }
      }
    }

  }

  /**
   * Submit updates to the Database
   */
  function saveLiableEarningsData() {
    // Cycle through ALL the Liable Earnings Rows for all the CUs
    for (allBuyersAndSellers in WorkingTransferDataObject.AllBuyersAndSellersForCUData) {
      // Select LE data for the CU
      for (buyersRow in allBuyersAndSellers.BuyersOrSellerRowDataArray) {
        // We only want to update the buyers.  The sellers total is a derived amount
        if (buyersRow.PartyRole == TransferLevyDataBean_ACC.BuyerSellerType.BUYER) {
          // Grab each Year data for the buyer
          for (yearData in buyersRow.LiableEarningsAmountsForYearArray) {
            // Is this a create or an update
            if (yearData.TransferPolicyID == 0) {
              // If the amount is 0 and no Id then do not create
              if (yearData.LiableEarningsAmount != 0) {
                // ADD this records to the database
                yearData.TransferPolicyID = _storeProcController_ACC.createLiableEarningsData(
                    WorkingTransferDataObject.TransferId,
                    buyersRow.PartyId,
                    yearData.Year,
                    allBuyersAndSellers.CuInfo.CuCode,
                    yearData.LiableEarningsAmount,
                    CurrentUserUtil.CurrentUser.User.DisplayName)
              }
            } else {
              // We need to UPDATE this records in the database
              _storeProcController_ACC.updateLiableEarningsData(
                  yearData.TransferPolicyID,
                  yearData.LiableEarningsAmount,
                  CurrentUserUtil.CurrentUser.User.DisplayName)
              // If the user puts a 0 for a amount then we delete the entry from the database
              if (yearData.LiableEarningsAmount == 0) {
                yearData.TransferPolicyID = 0
              }
            }
          }
        }
      }
    }
  }

  /**
   * Submit claim updates to the Database
   */
  function saveClaimsData() {
    for (data in WorkingTransferDataObject.TransferClaimsData) {
      if (data.BuyerACCPolicyID != data.InitialBuyerACCPolicyID) {
        if (data.TransferClaimID != null) {
          if (data.BuyerACCPolicyID != this.WorkingTransferDataObject.SellerTransferDataBean.AccPolicyId) {
            StoreProcController_ACC.updateTransferClaim(this.WorkingTransferDataObject.TransferId, data)
          } else {
            data.BuyerACCPolicyID = null
            StoreProcController_ACC.updateTransferClaim(this.WorkingTransferDataObject.TransferId, data)
          }
        } else {
          if (data.BuyerACCPolicyID != this.WorkingTransferDataObject.SellerTransferDataBean.AccPolicyId) {
            StoreProcController_ACC.createTransferClaim(this.WorkingTransferDataObject.TransferId, data)
          }
        }
      }
    }

  }
}