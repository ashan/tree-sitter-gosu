package edge.capabilities.profileinfo.producer.local

uses edge.capabilities.address.IAddressPlugin
uses edge.security.EffectiveUserProvider
uses edge.capabilities.profileinfo.producer.dto.ProducerSummaryDTO
uses edge.di.annotations.ForAllGwNodes

/**
 * Default implementation of producer plugin.
 */
final class DefaultProducerPlugin implements IProducerPlugin {

  private var _addressPlugin : IAddressPlugin

  @ForAllGwNodes
  @Param("addressPlugin", "Plugin used to handle address conversion")
  construct(addressPlugin : IAddressPlugin, aUserProvider:EffectiveUserProvider) {
    this._addressPlugin = addressPlugin
  }

  override function getProducerSummary(account: Account) : ProducerSummaryDTO {
    var contactCompany = getProducerProfile(account)

    final var res = new ProducerSummaryDTO ()
    fillBaseProps(res, contactCompany)
    res.primaryAddress = _addressPlugin.toDto(contactCompany.PrimaryAddress)

    return res
  }

  /**
   * Returns a producer profile for the account.
   */
  protected function getProducerProfile(account : Account) : Company {
    final var producerCodes = account.ProducerCodes
    if(producerCodes.length == 0){
    /**/
      return null
    }

    final var firstHolderContact = producerCodes[0].ProducerCode.Organization
    return firstHolderContact.Contact as Company
  }

  /**
   * Fills a base simple properties on producer contact.
   */
  public static function fillBaseProps(res : ProducerSummaryDTO, contactCompany : Company) {
    res.displayName = contactCompany.DisplayName
    res.email = contactCompany.EmailAddress1
    res.phoneNumber = contactCompany.PrimaryPhoneValue
    res.publicID = contactCompany.PublicID
  }

}
