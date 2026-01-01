package nz.co.acc.plm.integration.webservice.document

uses gw.api.database.Query
uses gw.api.database.Relop

/**
 * Util methods for document API
 */
class DocumentAPIUtil {

  function getDCAInvoiceCopyProductCodes(scriptParamValue : String) : String[] {
    var productSuffixes = scriptParamValue?.split("\\|")
    if (productSuffixes == null) {
      return {}
    } else {
      return productSuffixes.map(\suffix -> {
        switch (suffix) {
          case "E":
            return "EmployerACC"
          case "D":
            return "ShareholdingCompany"
          case "S":
            return "IndividualACC"
          default:
            return ""
        }
      }).where(\suffix -> suffix.HasContent)
    }
  }

  function getLevyInvoiceDocumentData(
      accountNumber : String,
      policyNumber : String,
      invoiceNumber : String) : List<DocumentData> {
    var productCodes = getDCAInvoiceCopyProductCodes(ScriptParameters.DCAInvoiceCopyPolicyLines_ACC)
    if (productCodes == null or productCodes.Count == 0) {
      return {}
    }
    return getLevyInvoiceDocuments(accountNumber, policyNumber, invoiceNumber, productCodes)
        .map(\doc -> new DocumentData(doc))
  }

  function getLevyInvoiceDocuments(
      accountNumber : String,
      policyNumber : String,
      invoiceNumber : String,
      productCodes : String[]) : List<Document> {

    return Query.make(Document)
        .withDistinct(true)
        .compare(Document#Status, Relop.Equals, DocumentStatusType.TC_FINAL)
        .compare(Document#Type, Relop.Equals, DocumentType.TC_LEVY_INVOICE)
        .compare(Document#TaxInvoiceNumber_ACC, Relop.Equals, invoiceNumber)
        .join(Document#Policy)
        .compareIn(Policy#ProductCode, productCodes)
        .join(Policy#Account)
        .compare(Account#ACCID_ACC, Relop.Equals, accountNumber)
        .select()
        .where(\doc -> matchesPolicyNumber(doc.Policy, policyNumber))
  }

  private function matchesPolicyNumber(policy : Policy, policyNumber : String) : Boolean {
    var count = Query.make(PolicyPeriod)
        .compare(PolicyPeriod#Policy, Relop.Equals, policy)
        .compare(PolicyPeriod#PolicyNumber, Relop.Equals, policyNumber)
        .select()
        .getCountLimitedBy(1) > 0
    return count
  }
}