package nz.co.acc.er.dbconnectionhandler

/**
 * Details of all the Store procs that are available for ER
 */
enum StoreProcNames_ACC {

  // Levy Payers
  FindlevyPayerById("ERData", "FindLevyPayerByID", "(?)"),
  UpdateLevyPayer("ERData", "UpdateLevyPayer", "(?, ?, ?, ?, ?, ?)"),
  HasLevyPayerCompanyIdExists("ERData", "HasLevyPayerCompanyIdExists", "(?, ?, ?)"),
  AddLevyPayerToBusinessGroup("ERData", "AddLevyPayerToBusinessGroup", "(?, ?, ?, ?, ?, ?, ?)"),

  UpdateNonPayrollEntity("ERData", "UpdateNonPayrollEntity", "(?, ?, ?, ?, ?, ?, ?)"),
  AddNonPayrollEntityToBusinessGroup("ERData", "AddNonPayrollEntityToBusinessGroup", "(?, ?, ?, ?, ?, ?, ?, ?)"),
  CreateDummyCoid("ERData", "CreateDummyCoid", "(?)"),
  ValidateNonPayrollCompanyId("ERData", "ValidateNonPayrollCompanyId", "(?, ?, ?)"),
  ValidateLevyPayerCompanyID("ERData", "ValidateLevyPayerCompanyID", "(?, ?)"),
  HasGroupStartEndDateMisMatch("ERData", "HasGroupStartEndDateMisMatch", "(?, ?, ?, ?, ?)"),
  MembershipDateOverlapWithAnotherGroup("ERData", "MembershipDateOverlapWithAnotherGroup", "(?, ?, ?, ?, ?, ?)"),
  MembershipDateOverlapWithSameGroup("ERData", "MembershipDateOverlapWithSameGroup", "(?, ?, ?, ?, ?, ?)"),

  // Calc Request
  FindERRequestByID("Rundta", "FindERRequestByID", "(?)"),
  ListRequestTargetsForRequestID("ERData", "ListRequestTargetsForRequestID", "(?)"),
  FindERRequestsByStatus("Rundta", "FindERRequestsByStatus", "(?)"),
  WithdrawRunRequest("Rundta", "WithdrawRunRequest", "(?, ?)"),
  UpdateRunRequest("Rundta", "UpdateRunRequest", "(?, ?, ?, ?, ?, ?)"),
  CreateRunRequest("Rundta", "CreateRunRequest", "(?, ?, ?, ?, ?, ?, ?, ?)"),

  // Calculation requests
  CreateRequestTarget("Rundta", "CreateRequestTarget", "(?,?,?,?,?,?)"),
  SearchClosedERRequests("Rundta", "SearchClosedERRequests", "(?, ?, ?, ?)"),
  RetrieveAllERRequestDecisionOptions("Refdta", "RetrieveAllERRequestDecisionOptions", "()"),
  RetrieveAllERRequestGroupTypeOptions("Refdta", "RetrieveAllERRequestGroupTypeOptions", "()"),
  RetrieveAllERRequestReasonOptions("Refdta", "RetrieveAllERRequestReasonOptions", "()"),
  RetrieveAllERRequestStatusOptions("Refdta", "RetrieveAllERRequestStatusOptions", "()"),
  RetrieveAllERRequestTypeOptions("Refdta", "RetrieveAllERRequestTypeOptions", "()"),
  RetrieveAllERCalculationTypes("Refdta", "RetrieveAllERCalculationTypes", "()"),

  AddFileImportLog("Refdta", "AddFileImportLog", "(?,?,?,?,?,?,?,?,?,?,?)"),
  RetrieveFileName("Refdta", "RetrieveFileName", "(?,?)"),
  RetrieveParameterFileTabs("Refdta", "RetrieveParameterFileTabs", "(?)"),
  RetrieveFileType("Refdta", "RetrieveFileType", "()"),
  RetrieveAllExtensionTypes("Refdta", "RetrieveAllExtensionTypes", "()"),
  RetrieveTargetfolder("Refdta", "RetrieveTargetfolder", "()"),
  RetrieveExpectedRehabRiskMgmtRates("Rundta", "RetrieveExpectedRehabRiskMgmtRates", "(?)"),
  UpdateRequestERLRGParams("Rundta", "UpdateRequestERLRGParams", "(?,?,?)"),
  RemoveFileImportLog("Refdta", "RemoveFileImportLog", "(?,?)"),

  ListFileUploads("ERData", "ListFileUploads", "()"),

  // Business Groups
  SearchBusinessGroupsRecalc("ERData", "SearchBusinessGroupsRecalc", "(?, ?, ?, ?, ?, ?)"),
  FindBusinessGroupMembers("ERData", "FindBusinessGroupMembers", "(?)"),
  SearchBusinessGroups("ERData", "SearchBusinessGroups", "(?, ?, ?, ?, ?, ?, ?)"),
  SearchBusinessGroupMembership("ERData", "SearchBusinessGroupMembership", "(?, ?)"),
  InsertBusinessGroupMembershipPeriod("ERData", "InsertBusinessGroupMembershipPeriod", "(?,?,?,?,?)"),
  RetrieveGroupMemberDetails("ERData", "RetrieveGroupMemberDetails", "(?)"),
  RemoveBusinessGroupMember("ERData", "RemoveBusinessGroupMember", "(?)"),
  CreateNonPayrollBusinessGroup("ERData", "CreateNonPayrollBusinessGroup", "(?, ?, ?, ?, ?, ?)"),

  // Suppression List
  ViewBusinessGroupSuppressionList("ERData", "ViewBusinessGroupSuppressionList", "()"),
  RemoveBusinessGroupSuppression("ERData", "RemoveBusinessGroupSuppression", "(?)"),
  AddBusinessGroupSuppression("ERData", "AddBusinessGroupSuppression", "(?)"),
  SearchBusinessGroupSuppression("ERData", "SearchBusinessGroupSuppression", "(?,?,?,?)"),
  //US12208 NowchoO Download Business Group Suppression List Extract
  DownloadSearchBusinessGroupSuppressionList("ERData", "BusinessGroupSuppressionListFileInfo", "()"),

  ViewlevyPayerSuppressionList("ERData", "ViewLevyPayerSuppression", "(?,?,?,?)"),
  RemovelevyPayerSuppression("ERData", "RemoveLevyPayerSuppression", "(?)"),
  AddlevyPayerSuppression("ERData", "AddLevyPayerSuppression", "(?,?,?)"),
  SearchLevyPayerSuppression("ERData", "SearchLevyPayerSuppression", "(?,?,?,?)"),
  //US12122 NowchoO Download Levy Payer Suppression List Extract
  DownloadLevyPayerSuppressionList("ERData", "LevyPayerSuppressionListFileInfo", "()"),

  // Business transfers
  BusinessTransfersStatusList("ERData", "BusinessTransfers_StatusList", "()"),
  BusinessTransfersTransferTypeList("ERData", "BusinessTransfers_TransferTypeList", "()"),
  BusinessTransfersViewList("ERData", "BusinessTransfers_ViewList", "(?)"),
  BusinessTransfersSearchLevyPayers("ERData", "BusinessTransfers_SearchLevyPayers", "(?,?,?)"),
  BusinessTransfersCreateTransfer("ERData", "BusinessTransfers_CreateTransfer", "(?,?,?,?,?,?,?)"),
  BusinessTransfersUpdateTransfer("ERData", "BusinessTransfers_UpdateTransfer", "(?,?,?,?,?,?)"),
  BusinessTransfersAddBuyerLevys("ERData", "BusinessTransfers_CreateTransferBuyer", "(?,?,?,?,?)"),
  BusinessTransfersSubmitForApproval("ERData", "BusinessTransfers_SubmitForApproval", "(?,?,?,?)"),
  BusinessTransfersWithdrawTransfer("ERData", "BusinessTransfers_Withdraw", "(?,?,?,?)"),
  BusinessTransfersDeclineTransfer("ERData", "BusinessTransfers_DeclineTransfer", "(?,?,?,?)"),
  BusinessTransfersApproveTransfer("ERData", "BusinessTransfers_ApproveTransfer", "(?,?,?,?)"),
  BusinessTransfersSelectTransfer("ERData", "BusinessTransfers_SelectTransfer", "(?)"),
  BusinessTransfersSelectBuyers("ERData", "BusinessTransfers_SelectBuyers", "(?)"),
  BusinessTransfersEditTransfer("ERData", "BusinessTransfers_EditTransfer", "(?,?,?,?)"),
  BusinessTransfersRetrieveSplitLiableEarnings("ERData", "BusinessTransfers_RetrieveSplitLiableEarnings", "(?)"),
  BusinessTransfersCreateTransferPolicy("ERData", "BusinessTransfers_CreateTransferPolicy", "(?,?,?,?,?,?,?)"),
  BusinessTransfersUpdateTransferPolicy("ERData", "BusinessTransfers_UpdateTransferPolicy", "(?,?,?)"),
  BusinessTransfersRetrieveSplitClaims("ERData", "BusinessTransfers_RetrieveSplitClaims", "(?)"),
  BusinessTransfersCreateTransferClaim("ERData", "BusinessTransfers_CreateTransferClaim", "(?,?,?,?,?)"),
  BusinessTransfersUpdateTransferClaim("ERData", "BusinessTransfers_UpdateTransferClaim", "(?,?,?,?)"),
  BusinessTransfersRetrieveClaimsSummary("ERData", "BusinessTransfers_RetrieveClaimsSummary", "(?)"),

  // Documentation
  ListDocumentTypes("Refdta", "ListDocumentTypes", "(?)"),
  AddERDocuments("ERData", "AddERDocuments", "(?,?,?,?,?,?,?,?)"),
  RetrieveERConfiguration("Refdta", "RetrieveERConfiguration", "(?)"),
  ViewRunInformation("Rundta", "ViewRunInformation", "()"),
  ERRunAddERExtract("Rundta", "AddERExtract", "(?,?,?,?,?)"),
  ViewExtractDetails("Rundta", "ViewExtractDetails", "(?)"),

  // Claim Cost Transfers
  ClaimCostTransferCreateCostTransfer("ERData", "ClaimCostTransfer_CreateCostTransfer", "(?,?,?,?,?,?)"),
  ClaimCostTransferDeleteCostTransfer("ERData", "ClaimCostTransfer_DeleteCostTransfer", "(?)"),
  ClaimCostTransferRetrieveClaimDetails("ERData", "ClaimCostTransfer_RetrieveClaimDetails", "(?,?)"),
  ClaimCostTransferUpdateCostTransfer("ERData", "ClaimCostTransfer_UpdateCostTransfer", "(?,?,?,?,?,?)"),
  ClaimCostTransferViewCostTransfer("ERData", "ClaimCostTransfer_ViewCostTransfer", "(?,?,?)")

  private var _prefix: String as readonly Prefix
  private var _procName: String as readonly ProcName
  private var _params: String as readonly Params


  private construct(prefix : String, name: String, params : String) {
    this._prefix = prefix
    this._procName = name
    this._params = params
  }


  public function getProcConnectionString() : String {
    return  "{call " + _prefix + "." + _procName + _params + "}"
  }

  public function getProcNameOnly() : String {
    return  _procName
  }
}
