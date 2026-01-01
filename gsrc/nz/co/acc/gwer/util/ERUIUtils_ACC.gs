package nz.co.acc.gwer.util

uses gw.api.database.IQueryBeanResult
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.api.path.Paths
uses gw.pl.persistence.core.Key
uses nz.co.acc.gwer.businessgroup.BusinessGroupSearchResult_ACC
//uses nz.co.acc.erV2.gw.reports.ERReportNewToER
uses nz.co.acc.lob.common.DateUtil_ACC

uses java.math.BigDecimal
uses java.time.LocalDate

class ERUIUtils_ACC {
  function getLevyPayers(accPolicyID: String, levyYear: int) : Set<Contact> {
    var erProcessUtils = new ERProcessUtils_ACC()
    if(accPolicyID.HasContent) {
      return erProcessUtils.getContactByACCPolicyIDAndLevyYear(accPolicyID, levyYear)
    }
    throw new gw.api.util.DisplayableException("Empty ACC Policy Found")
  }

  function retrieveTransferList(transferStatus : ERTransferStatus_ACC, transferID : Long) : IQueryBeanResult<ERTransfer_ACC> {
    var transferQuery = gw.api.database.Query.make(ERTransfer_ACC)
    if(transferStatus != null) {
      transferQuery.compare(ERTransfer_ACC#ERTransferStatus, Relop.Equals, transferStatus)
    }

    if(transferID != null and transferID != 0) {
      transferQuery.compare(ERTransfer_ACC#ID, Relop.Equals, new Key(ERTransfer_ACC, transferID))
    }
    return transferQuery.select()
  }

  function validateBuyers(erTransfer : ERTransfer_ACC) {
    if(!erTransfer.Buyers.HasElements) {
      throw new gw.api.util.DisplayableException("Buyers should be added")
    }

    if(erTransfer.Buyers.hasMatch(\elt1 -> elt1.ACCPolicyID_ACC == null)) {
      throw new gw.api.util.DisplayableException("Buyer will empty ACCID exists")
    }
  }

  function validateStartDate(date : Date) : String {
    return validateDate(date, "-04-01", "Web.ExperienceRating.GroupStartDateValidation_ACC")
  }

  function validateEndDate(date : Date) : String {
    return validateDate(date, "-03-31", "Web.ExperienceRating.GroupEndDateValidation_ACC")
  }

  function validateDate(date : Date, dateToCheck : String, validationProperty : String) : String {
    var yearOfDate = date.YearOfDate
    var valideDateString = yearOfDate + dateToCheck
    var valideDate = LocalDate.parse(valideDateString).toDate()
    if(valideDate.compareIgnoreTime(date) != 0) {
      return DisplayKey.get(validationProperty)
    }
    return null
  }

  function searchBusinessGroups(accPolicyID : String, companyID : Integer, name : String) : List<BusinessGroupSearchResult_ACC> {
    var resultList = new ArrayList<BusinessGroupSearchResult_ACC>()
    if(accPolicyID == null and companyID == null) {
      throw new DisplayableException("Please specify any of the search fields")
    }

    if(companyID != null) {
      var memberQuery = Query.make(ERBusinessGroupMember_ACC)

      if(accPolicyID.HasContent) {
        memberQuery.compare(ERBusinessGroupMember_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
      }

      if(companyID != null) {
        memberQuery.compare(ERBusinessGroupMember_ACC#CompanyID, Relop.Equals, companyID)
      }

      var results = memberQuery.select()

      if(results.HasElements) {
        results.each(\elt -> resultList.add(new BusinessGroupSearchResult_ACC(elt)))
      }
    }

    if(!resultList.HasElements) {
      if(accPolicyID.HasContent) {
        if(name == null) {
          var tmpResult = new BusinessGroupSearchResult_ACC()
          tmpResult.ACCPolicyID = accPolicyID
          resultList.add(tmpResult)
        } else {
          var accid = accPolicyID.substring(0, accPolicyID.length() - 1)
          var policyTermQuery = Query.make(PolicyTerm)
          policyTermQuery.compare(PolicyTerm#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
        }
      }
    }

    return resultList
  }

  function getBusinessGroupByID(id : Long) : ERBusinessGroup_ACC {
    var businessGroup = Query.make(ERBusinessGroup_ACC)
        businessGroup.compare(ERBusinessGroup_ACC#ID, Relop.Equals, new Key(ERBusinessGroup_ACC, id))
    return businessGroup.select().AtMostOneRow
  }

  function getBusinessGroupMemberByID(id : Long) : ERBusinessGroupMember_ACC {
    if(id < 1) {
      return null
    }
    var member = Query.make(ERBusinessGroupMember_ACC)
    member.compare(ERBusinessGroupMember_ACC#ID, Relop.Equals, new Key(ERBusinessGroupMember_ACC, id))
    return member.select().AtMostOneRow
  }

  function getAccountByACCID(accid : String) : Long {
    if(accid.HasContent) {
      return Query.make(Account).compare(Account#ACCID_ACC, Relop.Equals, accid).select().FirstResult.ID.Value
    }
    return null
  }

  function getBusinessGroupByMemberCompanyID(companyID : Integer) : ERBusinessGroup_ACC {
    var memberQuery = Query.make(ERBusinessGroupMember_ACC)
        memberQuery.compare(ERBusinessGroupMember_ACC#CompanyID, Relop.Equals, companyID)
    return  memberQuery.select().FirstResult.ERBusinessGroup
  }

  property get AllSuppressedBusinessGroups() : IQueryBeanResult<ERBusinessGroup_ACC> {
    return Query.make(ERBusinessGroup_ACC)
        .compare(ERBusinessGroup_ACC#SuppressGroupLetters, Relop.Equals, Boolean.TRUE)
        .select()
  }

  function generateCompanyID() : Integer {
    var random = new Random()
    var isValid = false
    while(!isValid) {
      var companyID = random.nextInt()
      var memberQuery = Query.make(ERBusinessGroupMember_ACC)
                             .compare(ERBusinessGroupMember_ACC#CompanyID, Relop.Equals, companyID).select()
      if(memberQuery.Count == 0) {
        return companyID
      }
    }
    return -1
  }

  property get CBLevyYear() : Integer[] {
    var queryRequest = Query.make(ERRequest_ACC)
        .compareIn(ERRequest_ACC#ERRequestType, {ERRequestType_ACC.TC_ANN, ERRequestType_ACC.TC_REC})
    var queryRun = queryRequest.join(ERRun_ACC#ERRequest)
        .compare(ERRun_ACC#ERRunStatus, Relop.Equals, ERRunStatus_ACC.TC_COMPLETED)
    var queryCalcType = queryRequest.join("LevyYear", ERCalcTypeLevyYear_ACC, "LevyYear")
        .compare(ERCalcTypeLevyYear_ACC#ERProgramme, Relop.Equals, ERProgramme_ACC.TC_ER)
        .compareIn(ERCalcTypeLevyYear_ACC#ERCalculationType, {ERCalculationType_ACC.TC_SER1, ERCalculationType_ACC.TC_SER2})
    return queryRequest.select()*.LevyYear.toSet().toTypedArray()
  }

//  function getNewToERRecords(currentLevyYear : Integer) : ERReportNewToER[] {
//    var recordList = new ArrayList<ERReportNewToER>()
//    var startDate = DateUtil_ACC.createDate(1, 4, currentLevyYear - 1)
//    var endDate = DateUtil_ACC.createDate(31, 3, currentLevyYear)
//
//    /* Get all levy payers with ER in previous calculation */
//    var previousERLevyPayers = getPreviousERLevyPayers(currentLevyYear)
//
//    /* Get current ER results that is NOT ER in previous calculation */
//    var erRunCalcCurrent = getERRunCalcResult(currentLevyYear, ERProgramme_ACC.TC_ER)
//    for (r in erRunCalcCurrent) {
//      if (r.ERBusinessGroup != null) {
//        var groupMembers = getGroupMembersACCPolicyID(r.ERBusinessGroup, currentLevyYear)
//        for (memberACCPolicyID in groupMembers) {
//          // get results that is NOT ER in previous calculation
//          if (!previousERLevyPayers.contains(memberACCPolicyID))
//            recordList.add(createRecord(memberACCPolicyID, r))
//        }
//      } else {
//        // get results that is NOT ER in previous calculation
//        if (!previousERLevyPayers.contains(r.ACCPolicyID_ACC))
//          recordList.add(createRecord(r.ACCPolicyID_ACC, r))
//      }
//    }
//
//    return null
//  }

//  function createRecord(accPolicyID : String, runCalc : ERRunCalcResult_ACC) : ERReportNewToER {
//    var latestTransfer = getLatestTransfer(accPolicyID, runCalc.ERRun.ERRequest.LevyYear)
//    var levyPayerDetails = getLevyPayerDetails(accPolicyID)
//    var policyCULRG = getPolicyCULRG(accPolicyID, runCalc.ERRun)
//
//    var record = new ERReportNewToER()
//    record.ACCPolicyID = accPolicyID
//    record.LevyPayerName = levyPayerDetails.Name
//    record.Programme = runCalc.ERProgramme.Name
//    record.Location = levyPayerDetails.Location
//    record.BusinessGroupID = runCalc.ERBusinessGroup.BusinessGroupID
//    record.CUCode = policyCULRG.CUCode
//    record.LRGCode = policyCULRG.LRGCode
//    record.TransferID = latestTransfer.ID.Value
//    record.TransferDate = latestTransfer.TransferDate
//    record.EMod = runCalc.EMod
//    record.ERMod = runCalc.ERMod
//    record.ERResultType = getERResultType(runCalc.ERMod)
//    record.RelationshipManager = levyPayerDetails.RelationshipManager
//    return record
//  }


  function getERRunCalcResult(levyYear : Integer, erProgramme : ERProgramme_ACC) : ERRunCalcResult_ACC[] {
    // get the latest Run ID from approved request with given levy year
    var runID = QuerySelectColumns.path(Paths.make(ERRun_ACC#ID))
    var queryRun = Query.make(ERRun_ACC)
        .compare(ERRun_ACC#ERRunStatus, Relop.Equals, ERRunStatus_ACC.TC_COMPLETED)
    var queryRequest = queryRun.join(ERRun_ACC#ERRequest)
        .compareIn(ERRequest_ACC#ERRequestType, {ERRequestType_ACC.TC_ANN, ERRequestType_ACC.TC_REC})
        .compare(ERRequest_ACC#LevyYear, Relop.Equals, levyYear)
    var erRun = queryRun.select().orderByDescending(runID).FirstResult

    // get ER Run Calculation Results
    var queryRunCalc = Query.make(ERRunCalcResult_ACC)
        .compare(ERRunCalcResult_ACC#ERProgramme, Relop.Equals, erProgramme)
        .compare(ERRunCalcResult_ACC#ERRun, Relop.Equals, erRun)
    return queryRunCalc.select().toTypedArray()
  }

  function getPreviousERLevyPayers(currentLevyYear : Integer) : List<String> {
    var previousLevyYear = currentLevyYear - 1
    var erRunCalcPrevious = getERRunCalcResult(previousLevyYear, ERProgramme_ACC.TC_ER)

    // get list of ACCPolicyID without Business Group
    var levyPayersPrevious = erRunCalcPrevious*.ACCPolicyID_ACC.toList()

    //get list if Business Groups
    var businessGroupPrevious = erRunCalcPrevious*.ERBusinessGroup
    for (group in businessGroupPrevious) {
      var groupMembersPrevious = getGroupMembersACCPolicyID(group, previousLevyYear)
      levyPayersPrevious.addAll(groupMembersPrevious.where(\elt ->
          levyPayersPrevious.contains(elt) == false
      ))
    }
    return levyPayersPrevious
  }

  function getGroupMembersACCPolicyID(erBusinessGroup : ERBusinessGroup_ACC, levyYear : Integer) : List<String> {
    var startDate = DateUtil_ACC.createDate(1, 4, levyYear - 1)
    var endDate = DateUtil_ACC.createDate(31, 3, levyYear)

    var queryMember = Query.make(ERBusinessGroupMember_ACC)
        .compare(ERBusinessGroupMember_ACC#MembershipStart, Relop.GreaterThanOrEquals, startDate)
        .or(\orDate -> {
          orDate.compare(ERBusinessGroupMember_ACC#MembershipEnd, Relop.Equals, null)
          orDate.compare(ERBusinessGroupMember_ACC#MembershipEnd, Relop.LessThanOrEquals, endDate)
        })
    var queryGroup = queryMember.join(ERBusinessGroupMember_ACC#ERBusinessGroup)
        .compare(ERBusinessGroup_ACC#ID, Relop.Equals, erBusinessGroup.ID)

    return queryMember.select()*.ACCPolicyID_ACC.toList()
  }

  function getLatestTransfer(accPolicyID : String, levyYear : Integer) : ERTransfer_ACC {
    var startDate = DateUtil_ACC.createDate(1, 4, levyYear - 1)
    var endDate = DateUtil_ACC.createDate(31, 3, levyYear)

    var queryTransfer = Query.make(ERTransfer_ACC)
    queryTransfer.compare(ERTransfer_ACC#ERTransferStatus, Relop.Equals, ERTransferStatus_ACC.TC_APP)
    queryTransfer.or(\orQryExp -> {
      orQryExp.and(\orStart -> {
        orStart.compare(ERTransfer_ACC#TransferStartDate, Relop.LessThanOrEquals, startDate)
        orStart.compare(ERTransfer_ACC#TransferDate, Relop.GreaterThanOrEquals, startDate)
      })
      orQryExp.and(\orEnd -> {
        orEnd.compare(ERTransfer_ACC#TransferStartDate, Relop.LessThanOrEquals, endDate)
        orEnd.compare(ERTransfer_ACC#TransferDate, Relop.GreaterThanOrEquals, endDate)
      })
      orQryExp.and(\orOver -> {
        orOver.compare(ERTransfer_ACC#TransferStartDate, Relop.GreaterThan, startDate)
        orOver.compare(ERTransfer_ACC#TransferDate, Relop.LessThan, endDate)
      })
    })
    var queryBuyer = queryTransfer.join(ERTransferBuyer_ACC#ERTransfer)
    queryBuyer.or(\orTr -> {
      orTr.compare(ERTransferBuyer_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
      orTr.compare(queryTransfer.getColumnRef("SellerACCPolicyID"), Relop.Equals, accPolicyID)
    })

    var transferID = QuerySelectColumns.path(Paths.make(ERTransfer_ACC#ID))
    return queryTransfer.select().orderByDescending(transferID).FirstResult
  }

  function getLevyPayerDetails(accPolicyID : String) : ERLevyPayer {
    var accID = accPolicyID.substring(0, accPolicyID.length - 1)
    var suffix = accPolicyID.substring(accPolicyID.length, 1)
    var account = Query.make(Account)
        .compare(Account#ACCID_ACC, Relop.Equals, accID)
        .select().FirstResult

    var levyPayer = new ERLevyPayer()
    /* Get name */
    levyPayer.Name = account.AccountHolderContact.DisplayName
    /* Get WPC location */
    if (suffix == "E") {
      levyPayer.Location = account.PrimaryContact_ACC.WPCAddress_ACC.City == 'Unknown'
          ? account.PrimaryContact_ACC.WPCAddress_ACC.AddressLine3
          : account.PrimaryContact_ACC.WPCAddress_ACC.City
    }
    /* Get relationship manager */
    levyPayer.RelationshipManager = account.RelationshipManager_ACC.DisplayName
    return levyPayer
  }

  function getERResultType(erMod : BigDecimal) : String {
    if (erMod < 0)
      return 'Discount'
    if (erMod > 0)
      return 'Loading'
    return 'Neutral'
  }

  function getPolicyCULRG(accPolicyID : String, erRun : ERRun_ACC) : ERPolicyCULRG {
    var queryPolicy = Query.make(ERRunPolicyDetail_ACC)
        .compare(ERRunPolicyDetail_ACC#ERRun, Relop.Equals, erRun)
    var queryLevyPayer = queryPolicy.join(ERRunPolicyDetail_ACC#ERRunLevyPayer)
        .compare(ERRunLevyPayer_ACC#ERRun, Relop.Equals, erRun)
        .compare(ERRunLevyPayer_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)

    var resultsCU = queryPolicy.select()*.ERParamCU
    var resultsLRG = queryPolicy.select()*.ERParamLRG

    var erPolicyCULRG = new ERPolicyCULRG()
    erPolicyCULRG.cuCode = (resultsCU.Count > 1) ? "Multiple" : resultsCU.first().CUCode
    erPolicyCULRG.lrgCode = (resultsLRG.Count > 1) ? "Multiple" : resultsLRG.first().LRGCode.toString()
    return erPolicyCULRG
  }

  class ERLevyPayer {
    var name : String as Name
    var location : String as Location
    var relationshipManager : String as RelationshipManager
  }

  class ERPolicyCULRG {
    var cuCode : String as CUCode
    var lrgCode : String as LRGCode
  }


}