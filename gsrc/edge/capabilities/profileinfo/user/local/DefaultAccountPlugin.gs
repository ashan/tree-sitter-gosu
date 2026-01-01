package edge.capabilities.profileinfo.user.local

uses edge.PlatformSupport.TranslateUtil
uses edge.capabilities.profileinfo.user.dto.AccountSummaryDTO
uses edge.di.annotations.ForAllGwNodes
uses java.lang.IllegalArgumentException
uses edge.capabilities.address.IAddressPlugin
uses gw.api.builder.NoteBuilder
uses edge.PlatformSupport.Bundle
uses edge.security.EffectiveUserProvider
uses edge.util.helper.PhoneUtil
uses edge.PlatformSupport.Bundle
uses edge.time.LocalDateUtil

/**
 * Default implementation of account plugin.
 */
final class DefaultAccountPlugin implements IAccountPlugin {

  private var _addressPlugin : IAddressPlugin
  private var _userProvider : EffectiveUserProvider as readonly UserProvider

  @ForAllGwNodes
  @Param("addressPlugin", "Plugin used to handle address conversion")
  construct(addressPlugin : IAddressPlugin, aUserProvider:EffectiveUserProvider) {
    this._addressPlugin = addressPlugin
    this._userProvider = aUserProvider
  }


  override function getAccountSummary(account : Account) : AccountSummaryDTO {
    var contactPerson = getAccountHolder(account)

    final var res = new AccountSummaryDTO()
    fillBaseProps(res, contactPerson)
    res.AccountNumber = account.AccountNumber
    res.PrimaryAddress = _addressPlugin.toDto(contactPerson.PrimaryAddress)
    return res
  }


  override function updateAccountSummary(account : Account, summary : AccountSummaryDTO) {
    final var holder = getAccountHolder(account)
    final var oldAddress = _addressPlugin.toDto(holder.PrimaryAddress)

    if(_addressPlugin.doAddressesDiffer(oldAddress, summary.PrimaryAddress)){
      Bundle.transaction(\bundle ->{
        final var bundledAccount = bundle.add(account)
        final var bundledHolder = getAccountHolder(bundledAccount)
        createAccInfoUpdateRequestNote(bundle, bundledAccount, summary, UserProvider.EffectiveUser.Username)
        createAccInfoUpdateRequestActivity(bundle, bundledAccount, summary)
        updateContactInfoOnAccount(bundle, bundledHolder, summary)
      })
    } else {
      Bundle.transaction(\bundle ->{
        final var bundledHolder = bundle.add(holder)
        updateContactInfoOnAccount(bundle, bundledHolder, summary)
      })
    }
  }

  /** Updates information on the account which do not require additional notes or anything similar. */
  protected function updateContactInfoOnAccount(bundle : Bundle, holder : Person, newContact : AccountSummaryDTO) {
    updateBaseProps(holder, newContact)
  }


  /**
   * Creates an activity for the address change.
   */
  protected function createAccInfoUpdateRequestActivity(bundle : Bundle, acc : Account, summ : AccountSummaryDTO) {
    final var activity = new Activity(bundle.PlatformBundle)
    activity.Subject = "Update Account Address"
    activity.Description = "New Address: \n" + summ.PrimaryAddress.toString()
    activity.Priority = typekey.Priority.TC_NORMAL
    activity.Account = acc
    final var effectivePolicy = acc.Policies.where(\ policy -> policy.LatestBoundPeriod.Active).first()
    if (effectivePolicy == null) {
      activity.autoAssign()
    } else {
      final var assignee = effectivePolicy.getUserRoleAssignmentByRole(typekey.UserRole.TC_UNDERWRITER).AssignedUser
      activity.autoAssign(assignee.AllGroups.first() as Group, assignee)
    }

  }


  /**
   * Creates an update note for the user and address.
   */
  protected function createAccInfoUpdateRequestNote(bundle : Bundle, acc : Account, summ: AccountSummaryDTO, username : String) {
    if (summ.PrimaryAddress.AddressLine3 == null){
      summ.PrimaryAddress.AddressLine3 = ""
    }
    new NoteBuilder()
        .onAccount(acc)
        .withTopic(typekey.NoteTopicType.TC_GENERAL)
        .withSubject("Request to update Account Contact Info")
        .withBody(
            TranslateUtil.translate("Edge.Web.Api.PolicyHandler.updateContactInfoMessage", {username,summ.FirstName,summ.LastName, summ.PrimaryAddress})
    )
        .create(bundle.PlatformBundle)

  }


  /**
   * Returns account holder person for the account.
   */
  protected function getAccountHolder(account : Account) : Person {
    final var firstHolderContact = account.getAccountContactsWithRole(typekey.AccountContactRole.TC_ACCOUNTHOLDER).first()
    if(firstHolderContact == null || !(firstHolderContact.Contact typeis Person)){
      throw new IllegalArgumentException("Account Summary can only be returned for an account holder which is a Person")
    }
    return firstHolderContact.Contact as Person
  }


  /** Updates base properties (i.e. without an address) on the account. */
    public static function updateBaseProps(holder : Person, newContact : AccountSummaryDTO) {
      holder.PrimaryPhone = newContact.PrimaryPhoneType
      holder.HomePhone = PhoneUtil.format(newContact.HomeNumber)
      holder.WorkPhone = PhoneUtil.format(newContact.WorkNumber)
      holder.CellPhone = PhoneUtil.format(newContact.CellNumber)
      holder.EmailAddress1 = newContact.EmailAddress1
    }


  /**
   * Fills a base simple prorpeties on account summary.
   */
  public static function fillBaseProps(res : AccountSummaryDTO, contactPerson : Person) {
    res.FirstName = contactPerson.FirstName
    res.LastName = contactPerson.LastName
    res.DisplayName = contactPerson.DisplayName
    res.PrimaryAddressDisplay = PlatformAddressHelper.buildDetailDisplayName(contactPerson.PrimaryAddress);
    res.Prefix = contactPerson.Prefix
    res.Suffix = contactPerson.Suffix
    res.PrimaryPhoneType = contactPerson.PrimaryPhone
    res.HomeNumber = PhoneUtil.format(contactPerson.HomePhone)
    res.WorkNumber = PhoneUtil.format(contactPerson.WorkPhone)
    res.CellNumber = PhoneUtil.format(contactPerson.CellPhone)
    res.EmailAddress1 = contactPerson.EmailAddress1
    res.DateOfBirth = LocalDateUtil.toDTO(contactPerson.DateOfBirth)

    AccountPlatformHelper.fillBaseProps(res, contactPerson)
  }


}
