package edge.capabilities.gpa.billing.local

uses gw.plugin.billing.BillingContactInfo
uses edge.capabilities.gpa.billing.dto.PrimaryPayerDTO
uses edge.di.annotations.ForAllGwNodes

class DefaultPrimaryPayerPlugin implements IPrimaryPayerPlugin {

  @ForAllGwNodes
  construct() {

  }

  override function toDTO(primaryPayer: BillingContactInfo): PrimaryPayerDTO {
    var dto = new PrimaryPayerDTO()

    dto.Name = primaryPayer.Name
    dto.Address = primaryPayer.Address
    dto.PhoneNumber = primaryPayer.Phone

    return dto
  }
}
