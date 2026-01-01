package nz.co.acc.policy

uses gw.api.database.Query
uses gw.api.database.Relop
uses nz.co.acc.constants.ProductCode
uses nz.co.acc.util.finder.PolicyPolicyTermFinder_ACC

/**
 * Created by eliyaz on 8/06/2017.
 */
enhancement PolicyEnhancement_ACC : entity.Policy {

  function isPDW(policyPeriod : PolicyPeriod) : boolean {
    var ret = (policyPeriod.EMPWPCLineExists and this.EMPClassificationCode_ACC?.equalsIgnoreCase("I")) ? true : false
    return ret
  }

  /**
   * Returns all final audit completed periods on this policy,
   * each of which should result from the completion of a job. If this policy spans
   * multiple periods, then the periods in the result array will not all have the same PeriodID.
   */
  property get CompletedFinalAuditPeriods_ACC() : PolicyPeriod[] {
    var auditPeriods = Query.make(PolicyPeriod)
        .compare(PolicyPeriod#Policy, Relop.Equals, this)
        .compare(PolicyPeriod#Status, Relop.Equals, PolicyPeriodStatus.TC_AUDITCOMPLETE)
        .select()
        .toTypedArray()

    return auditPeriods.sortByDescending(\elt -> elt.Job.CloseDate) // sort to get latest policy period.
  }

  public function hasDraftFinalAuditForLevyYear_ACC(levyYear : Integer) : Boolean {
    var draftPeriods = Query.make(PolicyPeriod)
        .compare(PolicyPeriod#Policy, Relop.Equals, this)
        .compare(PolicyPeriod#Status, Relop.Equals, PolicyPeriodStatus.TC_DRAFT)
        .compare(PolicyPeriod#LevyYear_ACC, Relop.Equals, levyYear)
        .select()
        .toTypedArray()

    return draftPeriods.hasMatch(\p -> p.Job typeis Audit and p.CreateUser.SystemUser)
  }

  public function hasDraftPolicyChangeForLevyYear_ACC(levyYear : Integer) : Boolean {
    var draftPeriods = Query.make(PolicyPeriod)
        .compare(PolicyPeriod#Policy, Relop.Equals, this)
        .compare(PolicyPeriod#Status, Relop.Equals, PolicyPeriodStatus.TC_DRAFT)
        .compare(PolicyPeriod#LevyYear_ACC, Relop.Equals, levyYear)
        .select()
        .toTypedArray()

    return draftPeriods.hasMatch(\p -> p.Job typeis PolicyChange and p.CreateUser.SystemUser)
  }

  public function findBoundOrAuditedPeriodForDate_ACC(date : Date) : PolicyPeriod {
    var periods = Query.make(PolicyPeriod)
        .compare(PolicyPeriod#Policy, Relop.Equals, this)
        .compareIn(PolicyPeriod#Status, {PolicyPeriodStatus.TC_BOUND, PolicyPeriodStatus.TC_AUDITCOMPLETE})
        .compare(PolicyPeriod#EditEffectiveDate, Relop.LessThanOrEquals, date)
        .compare(PolicyPeriod#PeriodEnd, Relop.GreaterThan, date)
        .select()
        .toTypedArray()

    var period = periods
        .orderBy(\pp -> pp.ModelDate != null ? pp.ModelDate : pp.UpdateTime)
        .last()

    return period?.getSliceAtEffectiveDate_ACC()
  }

  property get PolicyTermFinder_ACC() : PolicyPolicyTermFinder_ACC {
    return new PolicyPolicyTermFinder_ACC(this)
  }

  property get ProductCode_ACC() : ProductCode {
    switch (this.ProductCode) {
      case "ShareholdingCompany":
        return ProductCode.ShareholdingCompany
      case "EmployerACC":
        return ProductCode.EmployerACC
      case "AccreditedEmployersProgramme":
        return ProductCode.AccreditedEmployersProgramme
      case "IndividualACC":
        return ProductCode.IndividualACC
      default:
        return null
    }
  }

  property get DisplayPolicyStatus_ACC() : String {
    if (this.Status_ACC == PolicyStatus_ACC.TC_ACTIVE) {
      return this.Status_ACC.DisplayName.concat(" - ").concat(this.ActiveReason_ACC.DisplayName)
    }
    return this.Status_ACC.DisplayName ?: PolicyStatus_ACC.TC_INACTIVE.DisplayName
  }

  property get IsActiveAndHasReason_ACC() : Boolean {
    return this.Status_ACC == PolicyStatus_ACC.TC_ACTIVE and
        this.ActiveReason_ACC != null
  }

  property get IsValidForClaims_ACC() : boolean {
    var mostRecentPolicyTerm = this.PolicyTermFinder_ACC.findMostRecentPolicyTerm()
    return mostRecentPolicyTerm?.ValidForClaimsReg_ACC ?: false
  }

  property get IsWithinNewCustomerActiveStatusGracePeriod_ACC() : boolean {
    var gracePeriodStartDate = Date.Today.addMonths(-1 * ScriptParameters.NewCustomersActivePolicyGracePeriodMonth_ACC)
    return this.IssueDate?.after(gracePeriodStartDate)
  }

  property get IsActiveNewCustomer_ACC() : boolean {
    return this.Status_ACC == PolicyStatus_ACC.TC_ACTIVE and
        this.ActiveReason_ACC == ActiveReason_ACC.TC_NEWCUSTOMER
  }


}


