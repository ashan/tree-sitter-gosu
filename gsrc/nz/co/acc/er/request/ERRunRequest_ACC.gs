package nz.co.acc.er.request

uses java.io.Serializable
uses java.lang.invoke.MethodHandles
uses java.math.BigDecimal
uses java.sql.Types

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses nz.co.acc.er.businessgroup.BusinessGroupSearchResult_ACC
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper

uses gw.surepath.suite.integration.logging.StructuredLogger


class ERRunRequest_ACC extends ERDatabaseController_ACC implements Serializable {

  private var _requestId : Integer as RequestID
  private var _levyYear : Integer as LevyYear
  private var _requestType : RequestType_ACC as RequestType
  private var _requestGroupTypeACC: RequestGroupType_ACC as RequestGroupType
  private var _requestStatus : RequestStatus_ACC as RequestStatus
  private var _creator : String as Creator = User.util.CurrentUser.Credential.UserName
  private var _creatorEmail : String as Email = User.util.CurrentUser.Contact.EmailAddress1
  private var _createdDate : Date as CreatedDate
  private var _updatedBy : String as UpdatedBy = User.util.CurrentUser.Credential.UserName
  private var _updatedDate : Date as UpdatedDate
  private var _decisionComments : String as DecisionComments
  private var _requestDecisionACC: RequestDecision_ACC as RequestDecision
  private var _runId : Integer as RunID
  private var _runDate : Date as RunDate
  private var _totalRows : Integer as TotalRows
  private var _requestTarget : List<ERRequestTarget_ACC> as RequestTargets = new ArrayList<ERRequestTarget_ACC>()
  private var _calculationTypeCode : String as calculationTypeCode
  private var _ratesApprovedBy : String as RatesApprovedBy
  private var _ratesApprovedDate : Date as RatesApprovedDate
  private var _reviewRates : String as ReviewRates
  private var _ratesSource  : String as RatesSource

  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())

  function onEnter() : ERRunRequest_ACC[] {
    return new nz.co.acc.er.request.ERRunRequest_ACC().retrieveOpenOnly()
  }

  function validateLevyYear(value : Integer) : String {
    //NTK-1366 NowchoO removing end year validation.
    var minLevyYear = (ScriptParameters.getParameterValue("ERRunRequestLevyYearMin_ACC") as BigDecimal).intValue()
    if (value < minLevyYear) {
      return DisplayKey.get("Web.Validation.ExperienceRating.LevyYear_ACC", minLevyYear)
    }
    return null
  }

  function withdraw() {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.WithdrawRunRequest)
      stmt.setInt(1, this.RequestID)
      stmt.registerOutParameter(2, Types.VARCHAR)
      executeStatement()
      var errorMessage = stmt.getString("errorMsg")
      if(errorMessage != null) {
        throw new Exception(errorMessage)
      }
    }
    catch(e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if(e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    }
    finally{
      closeDbConnection()
    }
    pcf.OpenERRunRequests_ACC.go()
  }

  function update() {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.UpdateRunRequest)
      stmt.setInt(1, this.RequestID)
      if(this.RequestDecision.RequestDecisionID == RequestDecision.APPROVED) {
        stmt.setInt(2, RequestStatus.APPROVED)
      } else if(this.RequestDecision.RequestDecisionID == RequestDecision.DECLINED) {
        stmt.setInt(2, RequestStatus.DECLINED)
      }
      stmt.setInt(3, this.RequestDecision.RequestDecisionID)
      if(this.DecisionComments != null) {
        stmt.setString(4, this.DecisionComments)
      } else {
        stmt.setNull(4, Types.VARCHAR)
      }
      stmt.setString(5, this.UpdatedBy)
      stmt.registerOutParameter(6, Types.VARCHAR)
      executeStatement()

      var errorMessage = stmt.getString("errorMsg")
      if(errorMessage != null) {
        throw new Exception(errorMessage)
      }
    }
    catch(e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if(e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    }
    finally{
      closeDbConnection()
    }
  }

  function create() {
    if(this.RequestGroupType.RequestGroupTypeCode == "SEL") {
      if (not this.RequestTargets.HasElements) {
        throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.MustAddLevyPayers_ACC"))
      }
      for(target in this.RequestTargets) {
        if(target.BusinessGroupID == null and target.ACCPolicyID == null) {
          throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.BusinessGroupOrACCPolicyIDRequired_ACC"))
        }
      }
    }

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.CreateRunRequest)
      stmt.setInt(1, this.LevyYear)
      stmt.setInt(2, this.RequestType.RequestTypeID)
      stmt.setInt(3, this.RequestGroupType.RequestGroupTypeID)
      stmt.setString(4, this.Creator)
      stmt.setString(5, this.Email)
      stmt.setNull(6, Types.INTEGER)
      stmt.registerOutParameter(7, Types.INTEGER)
      stmt.registerOutParameter(8, Types.VARCHAR)
      executeStatement()

      var errorMessage = stmt.getString("errorMsg")
      if(errorMessage != null) {
        throw new Exception(errorMessage)
      } else {
        this.RequestID = stmt.getInt("RequestID")
      }
      //commit the target
      if(this.RequestGroupType.RequestGroupTypeCode == "SEL") {
        this.RequestTargets.each(\target -> {
          target.RequestID = this.RequestID
          target.create(conn)
        })
      }
    }
    catch(e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if(e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    }
    finally{
      closeDbConnection()
    }
  }


  function findById(requestId : Integer) : ERRunRequest_ACC {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.FindERRequestByID)
      stmt.setInt(1, requestId)
      executeQuery()

      if(rs.next()) {
        var runRequest = new ERRunRequest_ACC()
        runRequest.RequestID = rs.getInt("RequestID")
        runRequest.LevyYear = rs.getInt("LevyYear")
        var requestGroupType = new RequestGroupType_ACC()
        requestGroupType.RequestGroupTypeID = rs.getInt("RequestGroupTypeID")
        requestGroupType.Description = rs.getString("RequestGroupTypeDescription")
        runRequest.RequestGroupType = requestGroupType
        var requestType = new RequestType_ACC()
        requestType.RequestTypeID = rs.getInt("RequestTypeID")
        requestType.Description = rs.getString("RequestTypeDescription")
        runRequest.RequestType = requestType
        var decisiionId = rs.getInt("RequestDecisionID")
        if(!rs.wasNull()) {
          var requestDecision = new RequestDecision_ACC()
          requestDecision.RequestDecisionID = decisiionId
          requestDecision.Description = rs.getString("RequestDecisionDescription")
          runRequest.RequestDecision = requestDecision
        }
        var statusId = rs.getInt("RequestStatusID")
        if(!rs.wasNull()) {
          var requestStatus = new RequestStatus_ACC()
          requestStatus.RequestStatusID = statusId
          requestStatus.Description = rs.getString("RequestStatusDescription")
          runRequest.RequestStatus = requestStatus
        }
        runRequest.DecisionComments = rs.getString("RequestDecisionDetail")
        runRequest.CreatedDate = rs.getDate("RecordCreated") != null ? new Date(rs.getDate("RecordCreated").getTime()) : null
        runRequest.Creator = rs.getString("RecordCreatedBy")
        runRequest.Email = rs.getString("RecordCreatedByEmail")
        var updator = rs.getString("RecordModifiedBy")
        if(!rs.wasNull()) {
          runRequest.UpdatedBy = updator
          runRequest.UpdatedDate = rs.getDate("RecordModified") != null ? new Date(rs.getDate("RecordModified").getTime()) : null
        }

        runRequest.RatesApprovedBy = rs.getString("RatesApprovedBy")
        runRequest.RatesApprovedDate = rs.getDate("RatesApprovedDate")
        runRequest.ReviewRates = rs.getString("ReviewRates")
        runRequest.RatesSource = rs.getString("RatesSource")

        runRequest.calculationTypeCode = rs.getString("CalculationTypeCode")
        if(runRequest.RequestGroupType.RequestGroupTypeID == 4) { //Selected Levy Payer
          retrieveRequestTargetDetails(runRequest)
        }

        //no more rs read beyond this point.. code needs to be refactored
        return runRequest
      }
      return null
    }
    catch(e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if(e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    }
    finally {
      closeDbConnection()
    }
  }

  private function retrieveRequestTargetDetails(runRequest : ERRunRequest_ACC) {

    try {
      // DO NOT perform a makeDbConnection() here as this is already created in this class.
      createDbStatement(StoreProcNames_ACC.ListRequestTargetsForRequestID)
      stmt.setInt(1, runRequest.RequestID)
      executeQuery()

      while(rs.next()) {
        var target = new ERRequestTarget_ACC()
        target.RequestTargetID = rs.getInt("RequestTargetID")
        target.RequestID = runRequest.RequestID
        var businessGroupId = rs.getInt("BusinessGroupID")
        if(!rs.wasNull()) {
          target.BusinessGroupID = businessGroupId
        }
        target.ACCPolicyID = rs.getString("ACCPolicyID")
        target.Name = rs.getString("Name")
        var requestReason = new RequestReason_ACC()
        requestReason.RequestReasonID = rs.getInt("RequestReasonID")
        requestReason.RequestReasonCode = rs.getString("RequestReasonCode")
        requestReason.Description = rs.getString("RequestReasonDescription")
        target.RequestReason = requestReason
        target.RequestReasonDetails = rs.getString("RequestReasonDetail")
        runRequest.RequestTargets.add(target)
      }
    }
    catch(e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if(e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    }
    finally {
      closeDbConnection()
    }
  }

  function retrieveOpenOnly() : ERRunRequest_ACC[] {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.FindERRequestsByStatus)
      conn = new ERDatabaseConnectionHelper().Connection
      stmt.setInt(1, RequestStatus.OPEN)
      executeQuery()

      var allRequests = new ArrayList<ERRunRequest_ACC>()
      while (rs.next()) {
        var runRequest = new ERRunRequest_ACC()
        runRequest.RequestID = rs.getInt("RequestID")
        runRequest.LevyYear = rs.getInt("LevyYear")
        var requestStatus = new RequestStatus_ACC()
        requestStatus.RequestStatusID = rs.getInt("RequestStatusID")
        requestStatus.Description = rs.getString("RequestStatusDescription")
        runRequest.RequestStatus = requestStatus
        var requestGroupType = new RequestGroupType_ACC()
        requestGroupType.RequestGroupTypeID = rs.getInt("RequestGroupTypeID")
        requestGroupType.Description = rs.getString("RequestGroupTypeDescription")
        runRequest.RequestGroupType = requestGroupType
        var requestType = new RequestType_ACC()
        requestType.RequestTypeID = rs.getInt("RequestTypeID")
        requestType.Description = rs.getString("RequestTypeDescription")
        runRequest.RequestType = requestType
        runRequest.CreatedDate = new Date(rs.getDate("RecordCreated").getTime())
        runRequest.Creator = rs.getString("RecordCreatedBy")
        runRequest.calculationTypeCode = rs.getString("CalculationTypeCode")
        allRequests.add(runRequest)
      }
      return allRequests.toTypedArray()
    }
    catch(e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if(e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    }
    finally {
      closeDbConnection()
    }
  }

  function createtRequestTarget(): ERRequestTarget_ACC {
    var target = new ERRequestTarget_ACC()
    this.RequestTargets.add(target)
    return target
  }

  function removeRequestTarget(target : ERRequestTarget_ACC) {
    this.RequestTargets.remove(target)
  }

  function setRequestTarget(target : ERRequestTarget_ACC, selected : BusinessGroupSearchResult_ACC) : Integer {
    //clear the old
    target.BusinessGroupID = null
    target.ACCPolicyID = null
    target.Name = null
    //validate duplicate
    if(hasTargetAlreadyExists(selected)) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.LevyPayerHasAlreadyBeenSelected_ACC"))
    }
    //set the selected
    target.BusinessGroupID = selected.BusinessGroupID
    if(target.BusinessGroupID == null) {
      target.ACCPolicyID = selected.ACCPolicyID
      target.Name = selected.Name
    }
    return selected.BusinessGroupID
  }

  private function hasTargetAlreadyExists(selected : BusinessGroupSearchResult_ACC) : boolean {
    var targetExists = false
    for(rt in this.RequestTargets) {
      if((rt.BusinessGroupID != null and rt.BusinessGroupID == selected.BusinessGroupID) or (rt.ACCPolicyID != null and rt.ACCPolicyID == selected.ACCPolicyID)) {
        targetExists = true
        break
      }
    }
    return targetExists
  }
}