package edge.capabilities.quote.binding

uses edge.di.annotations.ForAllGwNodes
uses java.lang.IllegalArgumentException
uses java.lang.IllegalStateException
uses edge.capabilities.quote.binding.dto.BindingDataDTO
uses edge.capabilities.address.dto.AddressDTO
uses edge.capabilities.address.IAddressPlugin

/**
 * Default binding implementation.
 */
class DefaultBindingPlugin implements IBindingPlugin {

  private var _paymentPlugin : IPolicyPaymentPlugin

  private var _paymentPlanPlugin : IPaymentPlanPlugin

  private var _addressPlugin : IAddressPlugin

  @ForAllGwNodes
  @Param("paymentPlugin", "Policy payment processing plugin. It is invoked during bind phase inside binding bundle.")
  @Param("paymentPlanPlugin", "Plugin used to deal with payment plan selection and conversion.")
  construct(paymentPlugin : IPolicyPaymentPlugin, paymentPlanPlugin : IPaymentPlanPlugin, addressPlugin:IAddressPlugin) {
    _paymentPlugin = paymentPlugin
    _paymentPlanPlugin = paymentPlanPlugin
    _addressPlugin = addressPlugin
  }


  override function getBindingData(submission : Submission) : BindingDataDTO {
    if (submission.ResultingBoundPeriod != null) {
      return getBindingForBoundPeriod(submission, submission.ResultingBoundPeriod)
    }
    if (submission.SelectedVersion.Status == PolicyPeriodStatus.TC_QUOTING ||
        submission.SelectedVersion.Status == PolicyPeriodStatus.TC_QUOTED) {
      return getBindingForQuote(submission, submission.SelectedVersion)
    }
    return null
  }


  override function updateBindingData(submission : Submission, data : BindingDataDTO) {
    if (data.ChosenQuote != null) {
      final var pp = submission.ActivePeriods.firstWhere(\ p -> p.PublicID == data.ChosenQuote)
      if (pp == null) {
        throw new IllegalArgumentException("Bad quote id " + data.ChosenQuote)
      }
      submission.SelectedVersion = pp
    }

    final var contact = submission.Policy.Account.AccountHolder.AccountContact.Contact
    if (data.ContactPhone.NotBlank) {
      switch (contact.PrimaryPhone) {
        case PrimaryPhoneType.TC_HOME:
          contact.HomePhone = data.ContactPhone
          break

        case PrimaryPhoneType.TC_WORK:
          contact.WorkPhone = data.ContactPhone
          break

        case PrimaryPhoneType.TC_MOBILE:
          if(contact.Subtype != typekey.Contact.TC_PERSON) {
            throw new IllegalStateException("Can not set a mobile phone on a contact that is not a person")
          }

          (contact as Person).CellPhone = data.ContactPhone
          break

        default:
          if (contact.Subtype == typekey.Contact.TC_PERSON) {
            contact.HomePhone = data.ContactPhone
            contact.PrimaryPhone = PrimaryPhoneType.TC_HOME
          } else {
            contact.WorkPhone = data.ContactPhone
            contact.PrimaryPhone = PrimaryPhoneType.TC_WORK
          }
      }
    }

    if (data.ContactEmail != null) {
      contact.EmailAddress1 = data.ContactEmail
    }
    if (data.BillingAddress != null) {
      updateAddresses(submission, data.BillingAddress);
    }

  }

  private function updateAddresses(submission : Submission, billingAddress : AddressDTO){

      for(period in submission.ActivePeriods){
        var accountHolderContact = period.Policy.Account.AccountHolder.AccountContact.Contact
        var currentBillingAddress = accountHolderContact.AllAddresses
            .firstWhere( \ addr -> addr.AddressType == AddressType.TC_BILLING)
        if ( currentBillingAddress == null ) {
          currentBillingAddress = new Address()
          accountHolderContact.addAddress(currentBillingAddress)
        }

        _addressPlugin.updateFromDTO(currentBillingAddress, billingAddress)
        currentBillingAddress.AddressType = AddressType.TC_BILLING
      }
  }

  override function preBind(submission : Submission, data : BindingDataDTO) {
    if (data.ChosenQuote == null) {
      throw new IllegalArgumentException("Missing quote id")
    }

    /* Save last data. */
    updateBindingData(submission, data)

    _paymentPlanPlugin.selectPaymentPlan(submission.SelectedVersion, data.SelectedPaymentPlan)
    submission.SelectedVersion.BillingMethod = BillingMethod.TC_DIRECTBILL

  }



  override function bind(submission : Submission, data : BindingDataDTO) {
    _paymentPlugin.pay(
      submission,
      submission.SelectedVersion,
      data.PaymentDetails)
    submission.SelectedVersion.SubmissionProcess.issue()
  }



  protected function getBindingForQuote(sub : Submission, period : PolicyPeriod) : BindingDataDTO {
    final var res = new BindingDataDTO()
    res.PaymentPlans = _paymentPlanPlugin.getAvailablePaymentPlans(period)
    fillContact(res, sub)
    return res
  }



  protected function getBindingForBoundPeriod(sub : Submission, period : PolicyPeriod) :  BindingDataDTO {
    final var selectedPaymentPlan = _paymentPlanPlugin.getSelectedPaymentPlan(period)
    final var res = new BindingDataDTO()
    res.ChosenQuote = period.PublicID
    res.PolicyNumber = period.PolicyNumber
    res.SelectedPaymentPlan = selectedPaymentPlan.BillingId
    res.PaymentPlans = { selectedPaymentPlan }
    fillContact(res, sub)
    return res
  }



  /**
   * Fills contact information on the submission.
   */
  protected function fillContact(res : BindingDataDTO, sub : Submission) {
    final var contact = sub.Policy.Account.AccountHolder.AccountContact.Contact
    res.AccountNumber = sub.Policy.Account.AccountNumber
    res.ContactPhone = contact.PrimaryPhoneValue;
    res.ContactEmail = contact.EmailAddress1
  }


}

