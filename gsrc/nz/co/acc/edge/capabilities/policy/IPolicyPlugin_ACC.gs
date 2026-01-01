package nz.co.acc.edge.capabilities.policy

uses edge.capabilities.policy.dto.PolicyPeriodDTO
uses nz.co.acc.edge.capabilities.gpa.account.dto.HistoryDTO_ACC
uses nz.co.acc.edge.capabilities.accountcontact.dto.AccountContactDTO_ACC
uses nz.co.acc.edge.capabilities.policy.dto.PolicyPeriodDTO_ACC

/**
 * Created by lee.teoh on 3/30/2017.
 */
interface IPolicyPlugin_ACC {
  public function getPolicyContacts(policyPeriod: PolicyPeriod) : AccountContactDTO_ACC[]
  public function getPolicyPeriodDetails(policyPeriod: PolicyPeriod) : PolicyPeriodDTO_ACC
  public function getPolicyHistory(policyNumber: PolicyPeriod) : HistoryDTO_ACC[]
}