package nz.co.acc.plm.integration.webservice.policy.util

uses gw.api.database.Query
uses gw.api.database.Relop
uses nz.co.acc.utils.TableGenerator

/**
 * Created by Mike Ourednik on 28/10/2019.
 */
class InvoiceDataAPIUtil {

  public function policyPeriodsToTable(policyPeriods : List<PolicyPeriod>) : String {
    final var fn = "logPolicyPeriods"
    var header = {"ACCPolicyID", "LevyYear", "ID", "BasedOn", "JobType", "RevisionType", "TransactionCost",
        "TotalCost", "TransactionID"}
    var rows = policyPeriods.map(\period -> periodToRow(period))
    return new TableGenerator().generateTable(header, rows, null)
  }

  private function periodToRow(period : PolicyPeriod) : List<String> {
    var row = new LinkedList<String>()
    row.add(period.ACCPolicyID_ACC)
    row.add(period.LevyYear_ACC.toString())
    row.add(period.ID.toString())
    row.add(period.BasedOn?.ID?.toString()?:"")
    row.add(period.Job.Subtype.toString())
    row.add(period.Audit?.AuditInformation?.RevisionType?.toString()?:"")
    row.add(period.TransactionCostRPT?.toString())
    row.add(period.TotalCostRPT?.toString())
    row.add(period.Job.JobNumber.toString())
    return row
  }

  public static function getTableForTestLogging(provisionalTransactions : List<String>, finalTransactions : List<String>) : String {
    var invoiced : LinkedList<String> = {}
    invoiced.addAll(provisionalTransactions)
    invoiced.addAll(finalTransactions)
    var period = Query.make(entity.PolicyPeriod)
        .compareIn(entity.PolicyPeriod#Status, {PolicyPeriodStatus.TC_BOUND, PolicyPeriodStatus.TC_AUDITCOMPLETE})
        .join(entity.PolicyPeriod#Job)
        .compare(entity.Job#JobNumber, Relop.Equals, invoiced.first())
        .select()
        .AtMostOneRow
    if (period == null) {
      return null
    }
    var periods = period.Policy.Periods.orderBy(\pp -> pp.LevyYear_ACC).thenBy(\pp -> pp.ID)
    var header = {"LevyYear", "ID", "BasedOn", "JobType", "RevisionType", "TransactionCost",
        "TotalCost", "TransactionID", "Invoiced"}
    var rows = periods.map(\_period -> periodToRow(_period, invoiced))
    return new TableGenerator().generateTable(header, rows, null)
  }

  private static function periodToRow(period : PolicyPeriod, invoicedTransactions : Collection<String>) : List<String> {
    var row = new LinkedList<String>()
    row.add(period.LevyYear_ACC.toString())
    row.add(period.ID.toString())
    row.add(period.BasedOn?.ID?.toString()?:"")
    row.add(period.Job.Subtype.toString()?:"")
    row.add(period.Audit?.AuditInformation?.RevisionType?.toString()?:"")
    row.add(period.TransactionCostRPT?.toString()?:"")
    row.add(period.TotalCostRPT?.toString()?:"")
    row.add(period.Job.JobNumber.toString()?:"")
    var isInvoiced = invoicedTransactions.contains(period.Job.JobNumber.toString())
    row.add(isInvoiced ? "TRUE" : "")
    return row
  }
}