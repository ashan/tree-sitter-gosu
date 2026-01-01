package nz.co.acc.er.dbconnectionhandler

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.er.ERPersistenceUtil_ACC
uses nz.co.acc.er.ERSearchResultsCounter_ACC
uses nz.co.acc.er.businessgroup.BusinessGroupSearchResult_ACC
uses nz.co.acc.er.businessgroup.GroupMember_ACC
uses nz.co.acc.er.businesstransfers.BusinessTransferSearchCriteria_ACC
uses nz.co.acc.er.claimcosttransfer.ClaimCostTransferClaimDetail_ACC
uses nz.co.acc.er.claimcosttransfer.ClaimCostTransferSearchResult_ACC
uses nz.co.acc.er.databeans.LevyTransferStatus_ACC
uses nz.co.acc.er.databeans.LevyTransferType_ACC
uses nz.co.acc.er.databeans.LiableEarningsTempAmountData_ACC
uses nz.co.acc.er.databeans.LiableEarningsTempData_ACC
uses nz.co.acc.er.databeans.TransferClaimData_ACC
uses nz.co.acc.er.databeans.TransferClaimSummaryData_ACC
uses nz.co.acc.er.databeans.TransferLevyDataBean_ACC

uses java.math.BigDecimal
uses java.sql.Types

/**
 * Created by andy on 25/09/2017.
 */
class StoreProcController_ACC extends ERDatabaseController_ACC {
  private static var _logger = StructuredLogger.INTEGRATION.withClass(StoreProcController_ACC)


  construct() {
  }


  /**
   * Add details to the file upload table in ER
   *
   * @param filename
   * @param fileTypeId
   * @param uniqueFilename
   * @param uniqueFileNameExtension
   * @param comment
   * @param matchflag
   * @param providedTabs
   * @param recordCreatedby
   * @param recordCreatedByEmail
   * @return
   */
  function addFileToErImportLog(filename : String,
                                fileTypeId : int,
                                uniqueFilename : String,
                                uniqueFileNameExtension : String,
                                comment : String,
                                matchflag : boolean,
                                providedTabs : String,
                                recordCreatedby : String,
                                recordCreatedByEmail : String) : String {

    var _retrievedValue : String = ""

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.AddFileImportLog)
      stmt.setString(1, filename)
      stmt.setInt(2, fileTypeId)
      stmt.setString(3, uniqueFilename)
      stmt.setString(4, uniqueFileNameExtension)
      stmt.setString(5, comment)
      stmt.setBoolean(6, matchflag)
      stmt.setString(7, providedTabs)
      stmt.setString(8, recordCreatedby)
      stmt.setString(9, recordCreatedByEmail)
      stmt.registerOutParameter(10, Types.INTEGER)
      stmt.registerOutParameter(11, Types.VARCHAR)
      executeStatement()

      _retrievedValue = stmt.getString("FailureReason_Out")

      return _retrievedValue
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  /**
   * Select a transfer and all its information and repopulate the databean
   */
  function loadTransferFromId(workingTransferDataObject : TransferLevyDataBean_ACC) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersSelectTransfer)
      stmt.setInt(1, workingTransferDataObject.TransferId)
      executeQuery()

      while (rs.next()) {
        workingTransferDataObject.TransferDate = rs.getDate("TransferDate")
        workingTransferDataObject.TransferTypeDescription = rs.getString("TransferTypeDescription")
        workingTransferDataObject.TransferStatusDescription = rs.getString("TransferStatusDescription")
        workingTransferDataObject.SellerTransferDataBean = new TransferLevyDataBean_ACC(rs.getString("ACCPolicyID"))
        workingTransferDataObject.SellerTransferDataBean.LevyName = rs.getString("Name")
        workingTransferDataObject.CreatedDate = rs.getDate("RecordCreated")
        workingTransferDataObject.CreatedBy = rs.getString("RecordCreatedBy")
        workingTransferDataObject.CreatedByEmail = rs.getString("RecordCreatedByEMail")
        workingTransferDataObject.LastModifiedDate = rs.getDate("RecordModified")
        workingTransferDataObject.LastModifiedBy = rs.getString("RecordModifiedBy")
        workingTransferDataObject.LastModifieByEmail = rs.getString("RecordModifiedByEmail")
      }
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  /**
   * Add Buyers to the Transfer
   * Note this will submit ONE at a time
   */
  function loadBuyersFromTransferId(workingTransferDataObject : TransferLevyDataBean_ACC) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersSelectBuyers)
      stmt.setInt(1, workingTransferDataObject.TransferId)
      executeQuery()

      var list = new ArrayList<TransferLevyDataBean_ACC>()
      while (rs.next()) {
        var transferData = new TransferLevyDataBean_ACC()
        transferData.AccPolicyId = rs.getString("ACCPolicyID")
        transferData.LevyName = rs.getString("Name")
        list.add(transferData)
      }
      workingTransferDataObject.BuyerTransferDataBeans = list.toArray(new TransferLevyDataBean_ACC[list.size()]);
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  /**
   * Submit the new Transfer to the Database
   */
  function createTransferInfo(workingTransferDataObject : TransferLevyDataBean_ACC, transferTypeList : LevyTransferType_ACC) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersCreateTransfer)
      stmt.setDate(1, new java.sql.Date(workingTransferDataObject.TransferDate.Time))
      stmt.setString(2, transferTypeList.getCodeFromDescription(workingTransferDataObject.TransferTypeDescription))
      stmt.setString(3, workingTransferDataObject.SellerTransferDataBean.AccPolicyId)
      stmt.setDate(4, null)
      stmt.setString(5, workingTransferDataObject.CreatedBy)
      stmt.setString(6, workingTransferDataObject.CreatedByEmail)
      stmt.registerOutParameter(7, Types.BIGINT)

      executeStatement()

      workingTransferDataObject.TransferId = stmt.getInt("TransferID")

    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  /**
   * Submit updates to the Database
   */
  function updateTransferInfo(workingTransferDataObject : TransferLevyDataBean_ACC, transferStatusList : LevyTransferStatus_ACC) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersUpdateTransfer)
      stmt.setInt(1, workingTransferDataObject.TransferId)
      stmt.setDate(2, new java.sql.Date(workingTransferDataObject.TransferDate.Time))
      stmt.setString(3, transferStatusList.getCodeFromDescription(workingTransferDataObject.TransferStatusDescription))
      stmt.setNull(4, Types.DATE)
      stmt.setString(5, workingTransferDataObject.LastModifiedBy)
      stmt.setString(6, workingTransferDataObject.LastModifieByEmail)

      executeStatement()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  /**
   * Add Buyers to the Transfer
   * Note this will submit ONE at a time
   */
  function addBuyerLevysInfo(workingTransferDataObject : TransferLevyDataBean_ACC) {

    for (buyer in workingTransferDataObject.BuyerTransferDataBeans) {
      try {
        makeDbConnection()
        createDbStatement(StoreProcNames_ACC.BusinessTransfersAddBuyerLevys)
        stmt.setInt(1, workingTransferDataObject.TransferId)
        stmt.setString(2, buyer.AccPolicyId)
        stmt.setDate(3, new java.sql.Date(workingTransferDataObject.CreatedDate.Time))
        stmt.setString(4, workingTransferDataObject.CreatedBy)
        stmt.setString(5, workingTransferDataObject.CreatedByEmail)
        executeStatement()
      } catch (e : Exception) {
        _logger.error_ACC(storeProcData.ProcName, e)

        if (e typeis DisplayableException) {
          throw e
        }
        throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
      } finally {
        closeDbConnection()
      }
    }
  }

  function submitForApprovalTransferInfo(workingTransferDataObject : TransferLevyDataBean_ACC) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersSubmitForApproval)
      stmt.setInt(1, workingTransferDataObject.TransferId)
      stmt.setNull(2, Types.DATE)
      stmt.setString(3, workingTransferDataObject.LastModifiedBy)
      stmt.setString(4, workingTransferDataObject.LastModifieByEmail)
      executeStatement()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function editTransferInfo(workingTransferDataObject : TransferLevyDataBean_ACC) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersEditTransfer)
      stmt.setInt(1, workingTransferDataObject.TransferId)
      stmt.setNull(2, Types.DATE)
      stmt.setString(3, workingTransferDataObject.LastModifiedBy)
      stmt.setString(4, workingTransferDataObject.LastModifieByEmail)
      executeStatement()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function withdrawTransferInfo(workingTransferDataObject : TransferLevyDataBean_ACC) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersWithdrawTransfer)
      stmt.setInt(1, workingTransferDataObject.TransferId)
      stmt.setNull(2, Types.DATE)
      stmt.setString(3, workingTransferDataObject.LastModifiedBy)
      stmt.setString(4, workingTransferDataObject.LastModifieByEmail)
      executeStatement()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }


  function approveTransferInfo(workingTransferDataObject : TransferLevyDataBean_ACC) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersApproveTransfer)
      stmt.setInt(1, workingTransferDataObject.TransferId)
      stmt.setNull(2, Types.DATE)
      stmt.setString(3, workingTransferDataObject.LastModifiedBy)
      stmt.setString(4, workingTransferDataObject.LastModifieByEmail)
      executeStatement()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function declineTransferInfo(workingTransferDataObject : TransferLevyDataBean_ACC) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersDeclineTransfer)
      stmt.setInt(1, workingTransferDataObject.TransferId)
      stmt.setNull(2, Types.DATE)
      stmt.setString(3, workingTransferDataObject.LastModifiedBy)
      stmt.setString(4, workingTransferDataObject.LastModifieByEmail)
      executeStatement()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function searchLevyPayers(searchCriteria : BusinessTransferSearchCriteria_ACC,
                            searchResultLimit : int,
                            toManyRecordsMessage : String) {

    toManyRecordsMessage = ""
    if (searchCriteria == null) {
      searchCriteria = new BusinessTransferSearchCriteria_ACC()
    }

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersSearchLevyPayers)
      stmt.setString(1, searchCriteria.AccPolicyIdField)
      stmt.setString(2, searchCriteria.LevyNameField)
      stmt.setInt(3, searchResultLimit)
      executeQuery()
      var list = new ArrayList<TransferLevyDataBean_ACC>()
      while (rs.next()) {
        var transferData = new TransferLevyDataBean_ACC()
        transferData.LevyPayerId = rs.getString("LevyPayerID")
        transferData.AccPolicyId = rs.getString("ACCPolicyID")
        transferData.LevyName = rs.getString("Name")
        transferData.ExistsInTransfer = rs.getInt("ExistsInTransfer")
        list.add(transferData)

        if (list.size() >= searchResultLimit) {
          toManyRecordsMessage = DisplayKey.get("Web.ExperienceRating.BusinessTransfers.Search.MaxCount_ACC", searchResultLimit)
          break
        }
      }
      searchCriteria.LevySearchResultsList = list.toArray(new TransferLevyDataBean_ACC[list.size()]);
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }


  function loadListOfLevyTransfers(selectedStatusFilter : String) : TransferLevyDataBean_ACC[] {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersViewList)
      if (selectedStatusFilter == null) {
        stmt.setNull(1, 0)
      } else {
        stmt.setString(1, selectedStatusFilter)
      }
      executeQuery()
      var list = new ArrayList<TransferLevyDataBean_ACC>()
      while (rs.next()) {
        var transferData = new TransferLevyDataBean_ACC()
        transferData.TransferId = rs.getInt("TransferID")
        transferData.TransferDate = rs.getDate("TransferDate")
        transferData.TransferTypeDescription = rs.getString("TransferTypeDescription")
        transferData.AccPolicyId = rs.getString("ACCPolicyID")
        transferData.LevyName = rs.getString("Name")
        transferData.CreatedDate = rs.getDate("RecordCreated")
        transferData.CreatedBy = rs.getString("RecordCreatedBy")
        transferData.LastModifiedDate = rs.getDate("RecordModified")
        transferData.LastModifiedBy = rs.getString("RecordModifiedBy")
        transferData.TransferStatusDescription = rs.getString("TransferStatusDescription")
        list.add(transferData)
      }

      return list.toArray(new TransferLevyDataBean_ACC[list.size()]);
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }


  function loadListOfStatuses() : LevyTransferStatus_ACC {
    var transferStatusList = new LevyTransferStatus_ACC()

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersStatusList)
      executeQuery()
      while (rs.next()) {
        transferStatusList.Code.add(rs.getString("TransferStatusCode"))
        transferStatusList.Description.add(rs.getString("TransferStatusDescription"))
      }
      return transferStatusList
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }


  function loadListOfTransferTypes() : LevyTransferType_ACC {
    var transferTypeList = new LevyTransferType_ACC()

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersTransferTypeList)
      executeQuery()
      while (rs.next()) {
        transferTypeList.Code.add(rs.getString("TransferTypeCode"))
        transferTypeList.Description.add(rs.getString("TransferTypeDescription"))
      }

      return transferTypeList
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }


  /**
   * Load all the Liable Earnings data for a transfer
   */
  function loadLiableEarningsData(workingTransferDataObject : TransferLevyDataBean_ACC) : ArrayList<Object> {

    try {
      makeDbConnection()

      createDbStatement(StoreProcNames_ACC.BusinessTransfersRetrieveSplitLiableEarnings)
      stmt.setInt(1, workingTransferDataObject.TransferId)
      var isResultSet = stmt.execute()

      var rtn = new ArrayList<Object>()

      if (!isResultSet) {
        throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Sql.Error_ACC", storeProcData.ProcName))
      }

      var buyers : ArrayList<LiableEarningsTempData_ACC> = new ArrayList<LiableEarningsTempData_ACC>()

      // Get First Results Set
      rs = stmt.getResultSet();
      while (rs.next()) {
        var temp : LiableEarningsTempData_ACC = new LiableEarningsTempData_ACC()
        temp.CuCode = rs.getString("CUCode")
        temp.CuDesc = rs.getString("CUDesc")
        temp.Year = rs.getInt("LevyYear")
        temp.TotalLiableEarnings = rs.getBigDecimal("LiableEarnings")
        temp.TotalLiableEarnings.setScale(2)
        temp.TotalLevyDue = rs.getBigDecimal("LevyDue")
        temp.TotalLevyDue.setScale(2)
        buyers.add(temp)
      }
      rtn.add(buyers)
      rs.close()

      isResultSet = stmt.getMoreResults()
      if (!isResultSet) {
        throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Sql.Error_ACC", storeProcData.ProcName))
      }

      // Get Second Results Set
      var amounts : ArrayList<LiableEarningsTempAmountData_ACC> = new ArrayList<LiableEarningsTempAmountData_ACC>()
      rs = stmt.getResultSet();
      while (rs.next()) {
        var temp : LiableEarningsTempAmountData_ACC = new LiableEarningsTempAmountData_ACC()
        temp.Amounts.TransferPolicyID = rs.getInt("TransferPolicyID")
        temp.CUCode = rs.getString("CUCode")
        temp.ACCPolicyID = rs.getString("ACCPolicyID")
        temp.Amounts.Year = rs.getInt("LevyYear")
        temp.Amounts.LiableEarningsAmount = rs.getBigDecimal("LiableEarningsAmount")
        amounts.add(temp)
      }
      rtn.add(amounts)

      return rtn

    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }


  /**
   * Create all the Liable Earnings data for a transfer
   */
  function createLiableEarningsData(transactionId : int,
                                    buyerAccId : String,
                                    levyYear : int,
                                    cuCode : String,
                                    leAmount : BigDecimal,
                                    createdBy : String) : int {

    try {
      makeDbConnection()

      createDbStatement(StoreProcNames_ACC.BusinessTransfersCreateTransferPolicy)
      stmt.setInt(1, transactionId)
      stmt.setString(2, buyerAccId)
      stmt.setInt(3, levyYear)
      stmt.setString(4, cuCode)
      stmt.setBigDecimal(5, leAmount)
      stmt.setString(6, createdBy)
      stmt.registerOutParameter(7, Types.BIGINT)
      executeStatement()

      return stmt.getInt("TransferPolicyID")

    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  /**
   * Update all the Liable Earnings data for a transfer
   */
  function updateLiableEarningsData(transferPolicyID : int,
                                    leAmount : BigDecimal,
                                    modifiedBy : String) {

    try {
      makeDbConnection()

      createDbStatement(StoreProcNames_ACC.BusinessTransfersUpdateTransferPolicy)
      stmt.setInt(1, transferPolicyID)
      stmt.setBigDecimal(2, leAmount)
      stmt.setString(3, modifiedBy)
      executeStatement()


    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  /**
   * Load all the claim data for a transfer
   */
  function loadTransferClaimsData(workingTransferDataObject : TransferLevyDataBean_ACC) : TransferClaimData_ACC[] {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersRetrieveSplitClaims)
      stmt.setInt(1, workingTransferDataObject.TransferId)
      executeQuery()

      var results = new ArrayList<TransferClaimData_ACC>()

      while (rs.next()) {
        results.add(new TransferClaimData_ACC() {
          :ClaimNumber = rs.getString("ClaimNumber"),
          :AccidentDate = rs.getDate("AccidentDate"),
          :ClaimantName = rs.getString("ClaimantName"),
          :TransferClaimID = ERPersistenceUtil_ACC.getResultSetLongValue(rs, "TransferClaimID"),
          :TransferBuyerID = ERPersistenceUtil_ACC.getResultSetLongValue(rs, "TransferBuyerID"),
          :BuyerLevyPayerID = ERPersistenceUtil_ACC.getResultSetLongValue(rs, "BuyerLevyPayerID"),
          :BuyerACCPolicyID = rs.getString("BuyerACCPolicyID"),
          :CUCode = rs.getString("CUCode"),
          :InitialBuyerACCPolicyID = rs.getString("BuyerACCPolicyID")
        })
      }

      return results.toTypedArray()

    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  /**
   * Create a transfer claim record
   */
  function createTransferClaim(transferID : Long, transferClaimData : TransferClaimData_ACC) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersCreateTransferClaim)
      stmt.setLong(1, transferID)
      stmt.setString(2, transferClaimData.BuyerACCPolicyID)
      stmt.setString(3, transferClaimData.ClaimNumber)
      stmt.setString(4, User.util.CurrentUser.Credential.UserName)
      stmt.registerOutParameter(5, Types.BIGINT)

      executeStatement()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  /**
   * Update the buyer on a transfer claim record
   */
  function updateTransferClaim(transferID : Long, transferClaimData : TransferClaimData_ACC) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.BusinessTransfersUpdateTransferClaim)
      stmt.setLong(1, transferClaimData.TransferClaimID)
      stmt.setLong(2, transferID)
      stmt.setString(3, transferClaimData.BuyerACCPolicyID)
      stmt.setString(4, User.util.CurrentUser.Credential.UserName)

      executeStatement()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  /**
   * Load the claims summary data for a transfer
   */
  function loadTransferClaimsSummaryData(workingTransferDataObject : TransferLevyDataBean_ACC) : TransferClaimSummaryData_ACC[] {

    try {
      makeDbConnection()

      createDbStatement(StoreProcNames_ACC.BusinessTransfersRetrieveClaimsSummary)
      stmt.setInt(1, workingTransferDataObject.TransferId)
      executeQuery()

      var results = new ArrayList<TransferClaimSummaryData_ACC>()

      while (rs.next()) {
        results.add(new TransferClaimSummaryData_ACC() {
          :ACCPolicyID = rs.getString("ACCPolicyID"),
          :Role = rs.getString("SellerOrBuyer"),
          :ClaimsCount = rs.getInt("ClaimsCount")
        })
      }

      return results.toTypedArray()

    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }


  function getAllGroupMembers(businessGroupID : Integer) : GroupMember_ACC[] {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.FindBusinessGroupMembers)
      stmt.setInt(1, businessGroupID)
      executeQuery()
      var groupMembers = new ArrayList<GroupMember_ACC>()
      while (rs.next()) {
        var groupMember = new GroupMember_ACC(businessGroupID)
        groupMember.BusinessGroupMemberID = rs.getInt("BusinessGroupID")
        groupMember.GroupMemberID = rs.getInt("LevyPayerID")
        groupMember.CompanyID = rs.getInt("CompanyID")
        groupMember.ACCPolicyID = rs.getString("ACCPolicyID")
        groupMember.Name = rs.getString("Name")
        groupMember.NonPayroll = ("Y" == rs.getString("NonPayroll"))
        groupMember.CeasedTradingDate = rs.getDate("CeasedTradingDate")
        groupMember.BusinessGroupMembershipPeriodID = rs.getInt("BusinessGroupMembershipPeriodID")
        groupMember.GroupStartDate = rs.getDate("MembershipStart")
        groupMember.GroupEndDate = rs.getDate("MembershipEnd")
        /**
         * US12243 ER UI - GW - Business Groups - add TransferID to the fields returned after a search
         * 24.10.2018 NowchoO
         */
        groupMember.SellerTransferIds = rs.getString("SellerTransferIDs")
        groupMember.BuyerTransferIds = rs.getString("BuyerTransferIDs")
        groupMembers.add(groupMember)
      }
      return groupMembers.toTypedArray()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function loadGroupMemberDetails(businessGroupmembershipPeriodID : Integer, businessGroupID : Integer) : GroupMember_ACC {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.RetrieveGroupMemberDetails)
      stmt.setInt(1, businessGroupmembershipPeriodID)
      executeQuery()
      if (rs.next()) {
        var groupMember = new GroupMember_ACC(businessGroupID)
        groupMember.BusinessGroupMemberID = rs.getInt("BusinessGroupMemberID")
        var businessGroup = rs.getInt("BusinessGroupID")
        if (rs.wasNull()) {
          groupMember.BusinessGroupID = null
        } else {
          groupMember.BusinessGroupID = businessGroup
        }
        groupMember.GroupMemberID = rs.getInt("LevyPayerID")
        var companyId = rs.getInt("CompanyID")
        if (rs.wasNull()) {
          groupMember.CompanyID = null
        } else {
          groupMember.CompanyID = companyId
        }
        groupMember.ACCPolicyID = rs.getString("ACCPolicyID")
        groupMember.Name = rs.getString("Name")
        groupMember.NonPayroll = "Y" == (rs.getString("NonPayroll"))
        var ceasedTradingDate = rs.getDate("CeasedTradingDate")
        if (rs.wasNull()) {
          groupMember.CeasedTradingDate = null
        } else {
          groupMember.CeasedTradingDate = ceasedTradingDate
        }
        groupMember.BusinessGroupMembershipPeriodID = rs.getInt("BusinessGroupmembershipPeriodID")
        var membershipStart = rs.getDate("MembershipStart")
        if (rs.wasNull()) {
          groupMember.GroupStartDate = null
        } else {
          groupMember.GroupStartDate = membershipStart
        }
        var membershipEnd = rs.getDate("MembershipEnd")
        if (rs.wasNull()) {
          groupMember.GroupEndDate = null
        } else {
          groupMember.GroupEndDate = membershipEnd
        }
        return groupMember
      }
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }

    // If we are here then there was no record
    throw new DisplayableException("Could not find group member for business group member ID ${businessGroupmembershipPeriodID}")
  }

  function findLevyPayerByID(groupMemberId : Integer, businessGroupID : Integer) : GroupMember_ACC {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.FindlevyPayerById)
      stmt.setInt(1, groupMemberId)
      executeQuery()
      if (rs.next()) {
        var groupMember = new GroupMember_ACC(businessGroupID)
        groupMember.GroupMemberID = rs.getInt("LevyPayerID")
        var companyId = rs.getInt("CompanyID")
        if (rs.wasNull()) {
          groupMember.CompanyID = null
        } else {
          groupMember.CompanyID = companyId
        }
        groupMember.ACCPolicyID = rs.getString("ACCPolicyID")
        groupMember.Name = rs.getString("Name")
        groupMember.NonPayroll = "Y" == (rs.getString("NonPayroll"))
        var ceasedTradingDate = rs.getDate("CeasedTradingDate")
        if (rs.wasNull()) {
          groupMember.CeasedTradingDate = null
        } else {
          groupMember.CeasedTradingDate = ceasedTradingDate
        }
        return groupMember
      } else {
        throw new Exception("Could not find group member with ID ${groupMemberId}")
      }
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function updateNonPayrollEntityGroupMember(businessGroupMembershipPeriodID : Integer,
                                             groupMemberID : Integer,
                                             companyID : Integer,
                                             name : String,
                                             groupStartDate : Date,
                                             groupEndDate : Date) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.UpdateNonPayrollEntity)
      stmt.setInt(1, businessGroupMembershipPeriodID)
      stmt.setInt(2, groupMemberID)
      stmt.setInt(3, companyID)
      stmt.setString(4, name)
      stmt.setDate(5, new java.sql.Date(groupStartDate.Time))
      if (groupEndDate == null) {
        stmt.setNull(6, Types.DATE)
      } else {
        stmt.setDate(6, new java.sql.Date(groupEndDate.Time))
      }
      stmt.setString(7, User.util.CurrentUser.Credential.UserName)
      executeStatement()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function updateLevyPayerGroupMember(businessGroupMembershipPeriodID : Integer,
                                      groupMemberID : Integer,
                                      companyID : Integer,
                                      groupStartDate : Date,
                                      groupEndDate : Date) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.UpdateLevyPayer)
      stmt.setInt(1, businessGroupMembershipPeriodID)
      stmt.setInt(2, groupMemberID)
      stmt.setInt(3, companyID)
      stmt.setDate(4, new java.sql.Date(groupStartDate.Time))
      if (groupEndDate == null) {
        stmt.setNull(5, Types.DATE)
      } else {
        stmt.setDate(5, new java.sql.Date(groupEndDate.Time))
      }
      stmt.setString(6, User.util.CurrentUser.Credential.UserName)
      executeStatement()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function validateLevyPayerCompanyIdExists(groupMemberID : Integer,
                                            companyID : Integer) : boolean {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.HasLevyPayerCompanyIdExists)
      stmt.setInt(1, groupMemberID)
      stmt.setInt(2, companyID)
      stmt.registerOutParameter(3, Types.BIT)
      executeStatement()
      return stmt.getBoolean("HasAlreadyExists")
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function addLevyPayerToBusinessGroup(businessGroupID : Integer,
                                       groupMemberID : Integer,
                                       companyID : Integer,
                                       groupStartDate : Date,
                                       groupEndDate : Date) : Integer {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.AddLevyPayerToBusinessGroup)
      if (businessGroupID == null) {
        stmt.setNull(1, Types.INTEGER)
      } else {
        stmt.setInt(1, businessGroupID)
      }
      stmt.setInt(2, groupMemberID)
      stmt.setInt(3, companyID)
      stmt.setDate(4, new java.sql.Date(groupStartDate.Time))
      if (groupEndDate == null) {
        stmt.setNull(5, Types.DATE)
      } else {
        stmt.setDate(5, new java.sql.Date(groupEndDate.Time))
      }
      stmt.setString(6, User.util.CurrentUser.Credential.UserName)
      stmt.registerOutParameter(7, Types.BIGINT)
      executeStatement()
      return stmt.getInt("BusinessGroupID_Out")
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function addNonpayrollEntityToBusinessGroup(businessGroupID : Integer,
                                              groupMemberID : Integer,
                                              companyID : Integer,
                                              name : String,
                                              groupStartDate : Date,
                                              groupEndDate : Date) : Integer {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.AddNonPayrollEntityToBusinessGroup)
      if (businessGroupID == null) {
        stmt.setNull(1, Types.INTEGER)
      } else {
        stmt.setInt(1, businessGroupID)
      }
      stmt.setInt(2, groupMemberID)
      stmt.setInt(3, companyID)
      stmt.setString(4, name)
      stmt.setDate(5, new java.sql.Date(groupStartDate.Time))
      if (groupEndDate == null) {
        stmt.setNull(6, Types.DATE)
      } else {
        stmt.setDate(6, new java.sql.Date(groupEndDate.Time))
      }
      stmt.setString(7, User.util.CurrentUser.Credential.UserName)
      stmt.registerOutParameter(8, Types.BIGINT)
      executeStatement()
      return stmt.getInt("BusinessGroupID_Out")
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function removeMemberFromGroup(businessGroupMembershipPeriodID : Integer,
                                 businessGroupID : Integer) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.RemoveBusinessGroupMember)
      stmt.setInt(1, businessGroupMembershipPeriodID)
      executeStatement()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function createNonPayrollBusinessGroup(businessGroupID : Integer,
                                         companyID : Integer,
                                         name : String,
                                         groupStartDate : Date,
                                         groupEndDate : Date) : Integer {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.CreateNonPayrollBusinessGroup)
      if (businessGroupID == null) {
        stmt.setNull(1, Types.INTEGER)
      } else {
        stmt.setInt(1, businessGroupID)
      }
      stmt.setInt(2, companyID)
      stmt.setString(3, name)
      stmt.setDate(4, new java.sql.Date(groupStartDate.Time))
      if (groupEndDate == null) {
        stmt.setNull(5, Types.DATE)
      } else {
        stmt.setDate(5, new java.sql.Date(groupEndDate.Time))
      }
      stmt.setString(6, User.util.CurrentUser.Credential.UserName)
      executeQuery()

      var businessGroupId = 0
      while (rs.next()) {
        businessGroupId = rs.getInt("BusinessGroupID")
      }
      return businessGroupId
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function generateDummyCompanyId() : Integer {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.CreateDummyCoid)
      stmt.registerOutParameter(1, Types.BIGINT)
      executeStatement()
      var dummyId = stmt.getInt("CompanyId_out")
      return dummyId
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function validateNonPayrollCompanyId(companyId : Integer, groupMemberID : Integer) : Boolean {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.ValidateNonPayrollCompanyId)
      if (groupMemberID == null) {
        stmt.setNull(1, Types.INTEGER)
      } else {
        stmt.setInt(1, groupMemberID)
      }
      stmt.setInt(2, companyId)
      stmt.registerOutParameter(3, Types.BIT)
      executeStatement()
      var isValid = stmt.getBoolean("IsValid")
      return isValid
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function validateLevyPayerCompanyId(companyId : Integer) : Boolean {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.ValidateLevyPayerCompanyID)
      stmt.setInt(1, companyId)
      stmt.registerOutParameter(2, Types.BIT)
      executeStatement()
      var isValid = stmt.getBoolean("IsValid")
      return isValid
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }

  }

  function validateStartEndDateMismatch(groupMemberID : Integer,
                                        companyID : Integer,
                                        groupStartDate : Date,
                                        groupEndDate : Date) : Boolean {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.HasGroupStartEndDateMisMatch)
      if (groupMemberID == null) {
        stmt.setNull(1, Types.INTEGER)
      } else {
        stmt.setInt(1, groupMemberID)
      }
      stmt.setInt(2, companyID)
      stmt.setDate(3, new java.sql.Date(groupStartDate.Time))
      if (groupEndDate == null) {
        stmt.setNull(4, Types.DATE)
      } else {
        stmt.setDate(4, new java.sql.Date(groupEndDate.Time))
      }
      stmt.registerOutParameter(5, Types.BIT)
      executeStatement()
      var hasMismatch = stmt.getBoolean("HasMismatch")
      return hasMismatch
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function validateStartEndDateOverlapOtherGroup(businessGroupMembershipPeriodID : Integer,
                                                 businessGroupID : Integer,
                                                 groupMemberID : Integer,
                                                 groupStartDate : Date,
                                                 groupEndDate : Date) : Boolean {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.MembershipDateOverlapWithAnotherGroup)
      if (businessGroupMembershipPeriodID == null) {
        stmt.setNull(1, Types.INTEGER)
      } else {
        stmt.setInt(1, businessGroupMembershipPeriodID)
      }
      if (groupMemberID == null) {
        stmt.setNull(2, Types.INTEGER)
      } else {
        stmt.setInt(2, groupMemberID)
      }
      if (businessGroupID == null) {
        stmt.setNull(3, Types.INTEGER)
      } else {
        stmt.setInt(3, businessGroupID)
      }
      stmt.setDate(4, new java.sql.Date(groupStartDate.Time))
      if (groupEndDate == null) {
        stmt.setNull(5, Types.DATE)
      } else {
        stmt.setDate(5, new java.sql.Date(groupEndDate.Time))
      }
      stmt.registerOutParameter(6, Types.BIT)
      executeStatement()
      var hasOverlap = stmt.getBoolean("HasOverlap")
      return hasOverlap
    } catch (e : DisplayableException) {
      throw e
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function validateMemberAlreadyExistsInGroup(businessGroupMembershipPeriodID : Integer,
                                              businessGroupID : Integer,
                                              groupMemberID : Integer,
                                              groupStartDate : Date,
                                              groupEndDate : Date) : Boolean {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.MembershipDateOverlapWithSameGroup)
      if (businessGroupMembershipPeriodID == null) {
        stmt.setNull(1, Types.INTEGER)
      } else {
        stmt.setInt(1, businessGroupMembershipPeriodID)
      }
      if (groupMemberID == null) {
        stmt.setNull(2, Types.INTEGER)
      } else {
        stmt.setInt(2, groupMemberID)
      }
      if (businessGroupID == null) {
        stmt.setNull(3, Types.INTEGER)
      } else {
        stmt.setInt(3, businessGroupID)
      }
      stmt.setDate(4, new java.sql.Date(groupStartDate.Time))
      if (groupEndDate == null) {
        stmt.setNull(5, Types.DATE)
      } else {
        stmt.setDate(5, new java.sql.Date(groupEndDate.Time))
      }
      stmt.registerOutParameter(6, Types.BIT)
      executeStatement()
      var hasOverlap = stmt.getBoolean("HasOverlap")
      return hasOverlap
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }


  function performSearch(rowCounter : ERSearchResultsCounter_ACC,
                         businessGroupId : Integer,
                         companyID : Integer,
                         accPolicyID : String,
                         name : String) : BusinessGroupSearchResult_ACC[] {
    rowCounter.TotalRows = 0
    _logger.info("performSearch:: rowCounter ${rowCounter}, businessGroupId ${businessGroupId}, \
                                  companyID ${companyID}, accPolicyID ${accPolicyID}, name ${name} ")
    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.SearchBusinessGroups)
      stmt.setNull(1, Types.INTEGER)
      stmt.setInt(2, businessGroupId)
      if (companyID != null) {
        stmt.setInt(3, companyID)
      } else {
        stmt.setNull(3, Types.VARCHAR)
      }
      if (accPolicyID != null) {
        stmt.setString(4, accPolicyID)
      } else {
        stmt.setNull(4, Types.VARCHAR)
      }
      if (name != null) {
        stmt.setString(5, name)
      } else {
        stmt.setNull(5, Types.VARCHAR)
      }
      stmt.setNull(6, Types.INTEGER)
      stmt.setInt(7, (ScriptParameters.getParameterValue("ERSearchResultLimit_ACC") as Integer))
      super.executeQuery()
      var results = new ArrayList<BusinessGroupSearchResult_ACC>()
      while (rs.next()) {
        var result = new BusinessGroupSearchResult_ACC()
        var businessGroupID = rs.getInt("BusinessGroupID")
        if (rs.wasNull()) {
          result.BusinessGroupID = null
        } else {
          result.BusinessGroupID = businessGroupID
        }
        result.GroupMemberID = rs.getInt("LevyPayerID")
        var companyId = rs.getInt("CompanyID")
        if (rs.wasNull()) {
          result.CompanyID = null
        } else {
          result.CompanyID = companyId
        }
        result.ACCPolicyID = rs.getString("ACCPolicyID")
        result.Name = rs.getString("Name")
        result.NonPayroll = "Y" == (rs.getString("NonPayroll"))
        var ceasedTradingDate = rs.getDate("CeasedTradingDate")
        if (rs.wasNull()) {
          result.CeasedTradingDate = null
        } else {
          result.CeasedTradingDate = ceasedTradingDate
        }
        var membershipStart = rs.getDate("MembershipStart")
        if (rs.wasNull()) {
          result.GroupStartDate = null
        } else {
          result.GroupStartDate = membershipStart
        }
        var membershipEnd = rs.getDate("MembershipEnd")
        if (rs.wasNull()) {
          result.GroupEndDate = null
        } else {
          result.GroupEndDate = membershipEnd
        }
        /**
         * US12243 ER UI - GW - Business Groups - add TransferID to the fields returned after a search
         * 26.10.2018 NowchoO
         */
        result.SellerTransferIds = rs.getString("SellerTransferIDs")
        result.BuyerTransferIds = rs.getString("BuyerTransferIDs")
        result.HasBeenDeletedPreviously = rs.getBoolean("HasBeenDeletedPreviously")

        rowCounter.TotalRows = rs.getInt("totalrows")
        results.add(result)
      }
      return results.toTypedArray()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function retrieveClaimCostTransfers(fromClaim : String, toClaim : String, accNumber : String) : ClaimCostTransferSearchResult_ACC[] {
    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.ClaimCostTransferViewCostTransfer)
      if (fromClaim != null) {
        stmt.setString(1, fromClaim)
      } else {
        stmt.setNull(1, Types.VARCHAR)
      }
      if (toClaim != null) {
        stmt.setString(2, toClaim)
      } else {
        stmt.setNull(2, Types.VARCHAR)
      }
      if (accNumber != null) {
        stmt.setString(3, accNumber)
      } else {
        stmt.setNull(3, Types.VARCHAR)
      }
      executeQuery()

      var results = new ArrayList<ClaimCostTransferSearchResult_ACC>()
      while (rs.next()) {
        var result = new ClaimCostTransferSearchResult_ACC()
        result.ClaimCostTransferID = rs.getInt("ClaimCostTransferID")
        result.ACCNumber = rs.getString("ACC_Number")
        result.PolicyNumber = rs.getString("Policy_Number")
        result.FromClaim = rs.getString("From_Claim")
        result.ToClaim = rs.getString("To_Claim")
        result.StartDate = rs.getDate("Start_Daate")
        result.EndDate = rs.getDate("End_Date")
        var description = rs.getString("Description")
        if (rs.wasNull()) {
          result.Description = null
        } else {
          result.Description = description
        }
        result.CreateDate = rs.getDate("Create_Date")
        result.CreatedBy = rs.getString("Created_By")
        var modifiedDate = rs.getDate("Modified_Date")
        if (rs.wasNull()) {
          result.ModifiedDate = null
        } else {
          result.ModifiedDate = modifiedDate
        }
        var modifiedBy = rs.getString("Modified_By")
        if (rs.wasNull()) {
          result.ModifiedBy = null
        } else {
          result.ModifiedBy = modifiedBy
        }
        results.add(result)
      }
      return results.toTypedArray()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function deleteClaimCostTransfer(claimCostTransferToDelete : ClaimCostTransferSearchResult_ACC) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.ClaimCostTransferDeleteCostTransfer)
      stmt.setInt(1, claimCostTransferToDelete.ClaimCostTransferID)
      executeStatement()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function updateClaimCostTransfer(claimCostTransferToUpdate : ClaimCostTransferSearchResult_ACC) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.ClaimCostTransferUpdateCostTransfer)
      stmt.setInt(1, claimCostTransferToUpdate.ClaimCostTransferID)
      stmt.setString(2, claimCostTransferToUpdate.ToClaim)
      stmt.setDate(3, new java.sql.Date(claimCostTransferToUpdate.StartDate.Time))
      stmt.setDate(4, new java.sql.Date(claimCostTransferToUpdate.EndDate.Time))
      var description = claimCostTransferToUpdate.Description
      if (description == null) {
        stmt.setNull(5, Types.VARCHAR)
      } else {
        stmt.setString(5, description)
      }
      stmt.setString(6, User.util.CurrentUser.Credential.UserName)
      executeStatement()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function createClaimCostTransfer(claimCostTransferToCreate : ClaimCostTransferSearchResult_ACC) {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.ClaimCostTransferCreateCostTransfer)
      stmt.setString(1, claimCostTransferToCreate.FromClaim)
      stmt.setString(2, claimCostTransferToCreate.ToClaim)
      stmt.setDate(3, new java.sql.Date(claimCostTransferToCreate.StartDate.Time))
      stmt.setDate(4, new java.sql.Date(claimCostTransferToCreate.EndDate.Time))
      var description = claimCostTransferToCreate.Description
      if (description == null) {
        stmt.setNull(5, Types.VARCHAR)
      } else {
        stmt.setString(5, description)
      }
      stmt.setString(6, User.util.CurrentUser.Credential.UserName)
      executeStatement()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)

      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  function retrieveClaimCostTransferClaimDetails(claimNumberFrom : String, claimNumberTo : String) : ClaimCostTransferClaimDetail_ACC {
    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.ClaimCostTransferRetrieveClaimDetails)
      if (claimNumberFrom != null) {
        stmt.setString(1, claimNumberFrom)
      } else {
        stmt.setNull(1, Types.VARCHAR)
      }
      if (claimNumberTo != null) {
        stmt.setString(2, claimNumberTo)
      } else {
        stmt.setNull(2, Types.VARCHAR)
      }
      executeQuery()
      var result = new ClaimCostTransferClaimDetail_ACC()
      while (rs.next()) {
        result.ClaimType = rs.getString("ClaimType")
        result.ClaimNumber = rs.getString("Claim_Number")
        result.ACCNumber = rs.getString("ACC_Number")
        result.AccountName = rs.getString("Account_Name")
        result.ACCPolicyID = rs.getString("ACC_Policy_ID")
      }
      return result
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }
}