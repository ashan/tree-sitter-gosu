package nz.co.acc.integration.junoinformationservice.payloadgenerator.account

uses nz.co.acc.integration.junoinformationservice.model.account.GSONAccreditation

/**
 * Payload generator for the Accreditation_ACC entity.
 */
class AccreditationGsonGenerator {

  function generate(entity: Accreditation_ACC) : GSONAccreditation {
    if (entity == null) {
      return null
    }

    var gsonDoc = new GSONAccreditation()

    gsonDoc.companyName = entity.CompanyName_ACC
    gsonDoc.type = entity.AccreditationType_ACC
    gsonDoc.number = entity.AccreditationNumber_ACC

    return gsonDoc
  }
}