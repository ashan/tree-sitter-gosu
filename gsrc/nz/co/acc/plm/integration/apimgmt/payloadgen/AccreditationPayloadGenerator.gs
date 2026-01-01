package nz.co.acc.plm.integration.apimgmt.payloadgen

uses nz.co.acc.common.GenericConstants
uses nz.co.acc.common.integration.apimgmt.json.JSONAccreditation
uses nz.co.acc.common.integration.apimgmt.payloadgen.AbstractPayloadGenerator
uses nz.co.acc.common.integration.apimgmt.payloadgen.GenFlags

uses java.text.SimpleDateFormat

/**
 * Payload generator for the Accreditation_ACC entity.
 */
class AccreditationPayloadGenerator extends AbstractPayloadGenerator<JSONAccreditation, Accreditation_ACC> {

  construct() {
    super()
  }

  construct(accreditation: Accreditation_ACC) {
    super(accreditation)
  }

  override function generate(flags: GenFlags[]): JSONAccreditation {
    if (entity == null) {
      return null
    }

    var pAccreditation = new JSONAccreditation()

    pAccreditation.LinkID = entity.getLinkID()
    pAccreditation.CompanyName = entity.CompanyName_ACC
    pAccreditation.Type = entity.AccreditationType_ACC
    pAccreditation.Number = entity.AccreditationNumber_ACC
    pAccreditation.UpdateTime = new SimpleDateFormat(GenericConstants.ISO8601_TIMESTAMP_PATTERN).format(entity.UpdateTime)
    
    return pAccreditation
  }
}