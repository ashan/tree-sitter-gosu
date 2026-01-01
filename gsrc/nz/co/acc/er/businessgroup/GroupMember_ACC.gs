package nz.co.acc.er.businessgroup


uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.api.util.LocationUtil
uses nz.co.acc.er.dbconnectionhandler.StoreProcController_ACC
uses org.joda.time.LocalDate
uses pcf.EditGroupMember_ACCForward

uses java.io.Serializable


class GroupMember_ACC implements Serializable {

  private var _businessGroupMembershipPeriodID : Integer as BusinessGroupMembershipPeriodID

  private var _businessGroupMemberID : Integer as BusinessGroupMemberID

  private var _businessGroupId : Integer as BusinessGroupID

  private var _groupMemberId : Integer as GroupMemberID

  private var _companyId : Integer as CompanyID

  private var _accPolicyId : String as ACCPolicyID

  private var _name : String as Name

  private var _noPayroll : boolean as NonPayroll

  private var _ceasedTradingDate : Date as CeasedTradingDate

  private var _groupStartDate : Date as GroupStartDate

  private var _groupEndDate : Date as GroupEndDate

  private var _companyIdGenerated : boolean as CompanyIdGenerated

  private var _canSubmit : boolean as CanSubmit = true

  private var _storeProcController : StoreProcController_ACC as StoreProcController = new StoreProcController_ACC()

  /**
   * US12243 ER UI - GW - Business Groups - add TransferID to the fields returned after a search
   * 24.10.2018 NowchoO
   */
  private var _sellerTransferIds : String as SellerTransferIds

  private var _buyerTransferIds : String as BuyerTransferIds

  construct(businessGroupId : Integer) {
    this.BusinessGroupID = businessGroupId
  }


  function findLevyPayerByID(groupMemberId : Integer) : GroupMember_ACC {
    return _storeProcController.findLevyPayerByID(groupMemberId, _businessGroupId)
  }

  function updateNonPayrollEntityGroupMember() {
    _storeProcController.updateNonPayrollEntityGroupMember(this.BusinessGroupMembershipPeriodID, this.GroupMemberID, this.CompanyID, this.Name, this.GroupStartDate, this.GroupEndDate)
  }

  function updateLevyPayerGroupMember() {
    _storeProcController.updateLevyPayerGroupMember(this.BusinessGroupMembershipPeriodID, this.GroupMemberID, this.CompanyID, this.GroupStartDate, this.GroupEndDate)
  }

  function validateLevyPayerCompanyIdExists() {
    if(_storeProcController.validateLevyPayerCompanyIdExists(_groupMemberId, _companyId)) {
      LocationUtil.addRequestScopedWarningMessage(DisplayKey.get("Web.ExperienceRating.LevyPayerCompanyIDExistsWarning_ACC"))
    }
  }

  function addLevyPayerToBusinessGroup() {
    this.BusinessGroupID = _storeProcController.addLevyPayerToBusinessGroup(this.BusinessGroupID, this.GroupMemberID, this.CompanyID, this.GroupStartDate, this.GroupEndDate)

  }

  function addNonpayrollEntityToBusinessGroup() {
    this.BusinessGroupID = _storeProcController.addNonpayrollEntityToBusinessGroup(this.BusinessGroupID, this.GroupMemberID, this.CompanyID, this.Name, this.GroupStartDate, this.GroupEndDate)
  }

  function removeMemberFromGroup() {
    _storeProcController.removeMemberFromGroup(this.BusinessGroupMembershipPeriodID, this.BusinessGroupID)
    pcf.ViewBusinessGroup_ACC.go(this.BusinessGroupID)
  }

  function validateNameOfNonPayrollBusinessGroup(value : String) : String {
    this.Name = value
    if (!this.Name.HasContent or this.Name?.trim().length() == 0) {
      return DisplayKey.get("Web.ExperienceRating.NonPayrollEntityNameValidation_ACC")
    }
    return null
  }

  function createNonPayrollBusinessGroup() {
    this.BusinessGroupID = _storeProcController.createNonPayrollBusinessGroup(this.BusinessGroupID, this.CompanyID, this.Name, this.GroupStartDate, this.GroupEndDate)
  }

  function generateDummyCompanyId() {
    this.CompanyID = _storeProcController.generateDummyCompanyId()
    this.CompanyIdGenerated = true
  }

  function validateNonPayrollCompanyId(companyId : Integer, editMode : Boolean) : String {
    this.CompanyID = companyId
    if (editMode) {
      return null
    }
    var isValid = _storeProcController.validateNonPayrollCompanyId(this.CompanyID, null)
    if(!isValid) {
      return DisplayKey.get("Web.ExperienceRating.NonPayrollEntityCompanyIDValidation_ACC")
    }
    return null
  }

  function validateLevyPayerCompanyId(companyId : Integer) : String {
    var isValid = _storeProcController.validateLevyPayerCompanyId(companyId)
    if(!isValid) {
      return DisplayKey.get("Web.ExperienceRating.CompanyIDAlreadyExistsForNonPayrollEntity_ACC")
    }
    return null
  }

  function validateGroupStartDate(startDate : Date) : String {
    var yearOfDate = startDate.YearOfDate
    var valideDateString = yearOfDate + "-04-01"
    var valideDate = LocalDate.parse(valideDateString).toDate()
    if(valideDate.compareIgnoreTime(startDate) != 0) {
      return DisplayKey.get("Web.ExperienceRating.GroupStartDateValidation_ACC")
    }
    return null
  }

  function validateGroupEndDate(endDate : Date) : String {
    var yearOfDate = endDate.YearOfDate
    var valideDateString = yearOfDate + "-03-31"
    var valideDate = LocalDate.parse(valideDateString).toDate()
    if(valideDate.compareIgnoreTime(endDate) != 0) {
      return DisplayKey.get("Web.ExperienceRating.GroupEndDateValidation_ACC")
    }
    return null
  }

  function validateGroupStartEndDate() {
    if(this.GroupStartDate != null and this.GroupEndDate != null and this.GroupEndDate.compareIgnoreTime(this.GroupStartDate) <= 0) {
      this.CanSubmit = false
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.GroupStartDateMustBeforeEndDate_ACC"))
    }
    this.CanSubmit = true
  }

  function validateStartEndDateMismatch() {
    var hasMismatch = _storeProcController.validateStartEndDateMismatch(this.GroupMemberID, this.CompanyID, this.GroupStartDate, this.GroupEndDate)
    if(hasMismatch) {
      LocationUtil.addRequestScopedWarningMessage(DisplayKey.get("Web.ExperienceRating.BusinessGroupStartEndDateMisMatchWarning_ACC"))
    }
  }

  function validateStartEndDateOverlapOtherGroup() {
    var hasOverlap = _storeProcController.validateStartEndDateOverlapOtherGroup(this.BusinessGroupMembershipPeriodID,
        this.BusinessGroupID,
        this.GroupMemberID,
        this.GroupStartDate,
        this.GroupEndDate)

    if(hasOverlap) {
      this.CanSubmit = false
      if(this.NonPayroll) {
        throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.BusinessGroupStartEndDateOverlapNonPayrollEntityOtherGroups_ACC"))
      } else {
        throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.BusinessGroupStartEndDateOverlapLevyPayerOtherGroups_ACC"))
      }
    }
    this.CanSubmit = true
  }

  function validateMemberAlreadyExistsInGroup() {
    var hasOverlap = _storeProcController.validateMemberAlreadyExistsInGroup(this.BusinessGroupMembershipPeriodID,
        this.BusinessGroupID,
        this.GroupMemberID,
        this.GroupStartDate,
        this.GroupEndDate)

    if(hasOverlap) {
      this.CanSubmit = false
      if(this.NonPayroll) {
        throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.NonPayrollEntityAlreadyExistsInGroup_ACC"))
      } else {
        throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.LevyPayerAlreadyExistsInGroup_ACC"))
      }
    }
    this.CanSubmit = true
  }

  function composeRemoveLevyPayerConfirmMessage() : String {
    var groupMembers = new nz.co.acc.er.businessgroup.BusinessGroup_ACC(this.BusinessGroupID).AllGroupMembers
    var hasCOIDExists = groupMembers.hasMatch(\gm -> gm.GroupMemberID != this.GroupMemberID and gm.CompanyID == this.CompanyID)
    if(hasCOIDExists) {
      return DisplayKey.get(DisplayKey.get("Web.ExperienceRating.RemoveFromGroupConfirmMessageNonUniqueCOID_ACC"))
    }
    return DisplayKey.get(DisplayKey.get("Web.ExperienceRating.RemoveFromGroupConfirmMessageUniqueCOID_ACC"))
  }


  function selectEditMember(businessGroupACC : nz.co.acc.er.businessgroup.BusinessGroup_ACC, groupMember : GroupMember_ACC) {

    if (groupMember.BusinessGroupMembershipPeriodID == null or groupMember.BusinessGroupMembershipPeriodID == 0) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.DataError.BussGrpMemberShipPeriodID", groupMember.BusinessGroupMembershipPeriodID))
    }
    var localGroupMember :  GroupMember_ACC

    try {
      localGroupMember = _storeProcController.loadGroupMemberDetails(groupMember.BusinessGroupMembershipPeriodID, _businessGroupId)
    }
    catch(e : Exception) {
      // If we are here then there was no record
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.DataError.BussGrpMemberShipPeriodID", groupMember.BusinessGroupMembershipPeriodID))
    }

    EditGroupMember_ACCForward.go(businessGroupACC, groupMember.BusinessGroupMembershipPeriodID, groupMember)


  }
}