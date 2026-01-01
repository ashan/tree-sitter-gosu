package nz.co.acc.plm.integration.webservices.inbound.account

uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper
uses nz.co.acc.plm.integration.webservices.inbound.account.datatypes.ACCIDAndSuffix

/**
 * Database queries used by AccountAPI
 * <p>
 * Created by OurednM on 4/04/2018.
 */
class AccountAPIDAO {

  static private var _productCodeMap : HashMap<String, String> = {
      InstructionConstantHelper.PRODUCTKEY_WPC->ConstantPropertyHelper.PRODUCTCODE_WPC,
      InstructionConstantHelper.PRODUCTKEY_WPS->ConstantPropertyHelper.PRODUCTCODE_WPS,
      InstructionConstantHelper.PRODUCTKEY_CP->ConstantPropertyHelper.PRODUCTCODE_CP
  }

  public function findAccountByACCID(accId : String) : Optional<Account> {
    var queryResult = Query.make(entity.Account)
        .compare(Account#ACCID_ACC, Relop.Equals, accId)
        .select()
        .first()
    return Optional.ofNullable(queryResult)
  }

  private function findPolicyTermsForLevyYear(accIdAndSuffix : ACCIDAndSuffix, levyYear : Integer) : List<PolicyTerm> {
    var productCode = _productCodeMap.get(accIdAndSuffix.Suffix)

    return Query.make(PolicyTerm)
        .compare(PolicyTerm#AEPACCNumber_ACC, Equals, accIdAndSuffix.ACCID)
        .compare(PolicyTerm#AEPProductCode_ACC, Equals, productCode)
        .compare(PolicyTerm#AEPFinancialYear_ACC, Equals, levyYear)
        .select()
        .toList()
  }

  private function findBoundOrAuditedPeriodForDate(policyTerm: PolicyTerm, date : Date) : PolicyPeriod {
    return Query.make(PolicyPeriod)
        .compare(PolicyPeriod#PolicyTerm, Relop.Equals, policyTerm)
        .compareIn(PolicyPeriod#Status, {PolicyPeriodStatus.TC_BOUND, PolicyPeriodStatus.TC_AUDITCOMPLETE})
        .compare(PolicyPeriod#PeriodStart, Relop.LessThanOrEquals, date)
        .compare(PolicyPeriod#PeriodEnd, Relop.GreaterThan, date)
        .select()
        .toTypedArray()
        .orderByDescending(\pp -> pp.ModelDate != null ? pp.ModelDate : pp.UpdateTime)
        .first()
  }

  function findPolicyPeriodAtDateOfAccident(accIdAndSuffix: ACCIDAndSuffix, dateOfAccident: Date): Optional<PolicyPeriod> {
    var levyYear = dateOfAccident.LevyYear_ACC
    var policyTerms = findPolicyTermsForLevyYear(accIdAndSuffix, levyYear)
    var policyTermsOrderedDescending = policyTerms.orderByDescending(\policyTerm -> policyTerm.CreateTime)

    for (policyTerm in policyTermsOrderedDescending) {
      var period = findBoundOrAuditedPeriodForDate(policyTerm, dateOfAccident)
      if (period != null) {
        return Optional.of(period)
      }
    }

    return Optional.empty()
  }

}