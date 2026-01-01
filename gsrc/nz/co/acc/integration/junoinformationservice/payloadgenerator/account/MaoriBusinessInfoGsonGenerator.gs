package nz.co.acc.integration.junoinformationservice.payloadgenerator.account

uses nz.co.acc.integration.junoinformationservice.model.account.GSONMaoriBusinessInfo

class MaoriBusinessInfoGsonGenerator {

  function generate(entity : MaoriBusinessInfo_ACC) : GSONMaoriBusinessInfo {
    if (entity == null) {
      return null
    }
    var gsonDoc = new GSONMaoriBusinessInfo()

    gsonDoc.ownership = entity.Ownership
    gsonDoc.employees = entity.Employees
    gsonDoc.directors = entity.Directors
    gsonDoc.philosophy = entity.Philosophy
    gsonDoc.management = entity.Management
    gsonDoc.assetsTangible = entity.AssetsTangible
    gsonDoc.assetsIntangible = entity.AssetsIntangible
    gsonDoc.other = entity.Other
    gsonDoc.otherReason = entity.OtherReason

    return gsonDoc
  }

}