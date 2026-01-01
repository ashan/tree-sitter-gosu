package edge.capabilities.quote.draft.util

uses edge.capabilities.address.dto.AddressDTO
uses java.util.Date
uses edge.util.helper.JurisdictionUtil
uses edge.capabilities.address.IAddressPlugin

class SubmissionUtil {

  /**
   * Creates a new submission.
   */
  public static function newSubmission(account : Account, productCode:String, periodStartDate: Date, policyAddress : AddressDTO, termType : typekey.TermType, _addressPlugin : IAddressPlugin) : Submission {
    var producerSelection = getProducerSelection(account, periodStartDate)
    var productSelection = getProductSelection(productCode)

    // create submission
    var sub = productSelection.createSubmission(account, producerSelection)
    var branch = sub.LatestPeriod

    /* We work on custom period and create offerings only during quoting. */
    branch.Offering = null

    selectUWCompany(branch)

    // Set the branch name so that we can identify the quote in the portal.  Maps to quote type enum values
    branch.BranchName = "CUSTOM"

    branch.SubmissionProcess.beginEditing()
    branch.TermType = termType == null ? typekey.TermType.TC_ANNUAL : termType

    /*
     * Account holder address could differ from policy address, unlink and update it if necessary.
     * It is absolutely valid to have separate account and policy addresses.
     */
    updateAddress(branch, policyAddress, _addressPlugin)

    return sub
  }

  protected static function selectUWCompany(branch:PolicyPeriod) {
    var uwCompanies = branch.getUWCompaniesForStates(false)
    branch.UWCompany = uwCompanies.first()
  }

  protected static function selectProducerCode(account:Account):ProducerCode {
    return account.ProducerCodes.first().ProducerCode
  }

  protected static function getProducerSelection(account : Account, periodStartDate: Date) : ProducerSelection{
    var producer = selectProducerCode(account)
    var producerSelection = new ProducerSelection()
    producerSelection.Producer = producer.Organization
    producerSelection.ProducerCode = producer
    // DE102 - Set the Producer Selection state to NZ as the producer is ACC.
    producerSelection.State = Jurisdiction.TC_NZ

    producerSelection.DefaultPPEffDate = periodStartDate

    return producerSelection
  }

  protected static function getProductSelection(productCode : String) : ProductSelection{
    var productSelection = new ProductSelection()
    productSelection.ProductCode = productCode
    productSelection.ProductSelectionStatus = ProductSelectionStatus.TC_AVAILABLE

    return productSelection
  }

  protected static function updateAddress(branch : PolicyPeriod, policyAddress : AddressDTO, _addressPlugin : IAddressPlugin) {
    final var defaultAddress = _addressPlugin.toDto(branch.PolicyAddress.Address)
    if (_addressPlugin.doAddressesDiffer(defaultAddress, policyAddress)) {
      if (branch.PolicyAddress.Address === branch.Policy.Account.AccountHolderContact.PrimaryAddress) {
        final var clonedAddress = branch.PolicyAddress.Address.copy() as Address
        branch.Policy.Account.AccountHolderContact.addAddress(clonedAddress)
        branch.changePolicyAddressTo(clonedAddress)
      }

      _addressPlugin.updateFromDTO(branch.PolicyAddress.Address, policyAddress)
    }
  }
}
