package nz.co.acc.integration.mbiefeed

uses gw.api.database.Query
uses gw.lang.reflect.json.Json
uses nz.co.acc.plm.integration.validation.nzbnvalidation.MBIEAPIClientResponse

class MBIEHelper {

  public function getMaoriBusinessEntity(nzbn : String) : MaoriBusinessInfo_ACC {
    var existingEntity = Query.make(MaoriBusinessInfo_ACC)
        .compare(MaoriBusinessInfo_ACC#NZBN, Equals, nzbn)
        .select()
        .first()
    return existingEntity
  }

  public function extractNZBNFromEvent(eventPayload : String) : String {
    var parseResult : Dynamic
    var nzbn : String
    try {
      parseResult = Json.fromJson(eventPayload)
      nzbn = parseResult.nzbn
    } catch (e : Exception) {
      throw new MBIEException("Problem parsing eventPayload Exception: ${e}")
    }
    if (nzbn == null) {
      throw new MBIEException("nzbn '${nzbn}' is not provided")
    }

    if (not nzbn.Numeric) {
      throw new MBIEException("nzbn '${nzbn}' is not numeric")
    }

    if (nzbn.length != 13) {
      throw new MBIEException("nzbn '${nzbn}' is not 13 digits")
    }
    return nzbn
  }


  public function updateMaoriBusinessInfo(payload : String, nzbn: String) : void {
    var maoriBusinessResult : MaoriBusinessInfo_ACC = null
    try {
      var parseResult : Dynamic = Json.fromJson(payload)
      parseResult = parseResult.Documents[0]

      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        maoriBusinessResult = getMaoriBusinessEntity(nzbn)

        if (parseResult.businessEthnicityIdentifiers != null and (parseResult.businessEthnicityIdentifiers as List).HasElements) {

          if (maoriBusinessResult == null) {
            maoriBusinessResult = new MaoriBusinessInfo_ACC()
            maoriBusinessResult.setNZBN(nzbn)
          }

          bundle.add(maoriBusinessResult)
          var businessEthnicityIdentifiers = parseResult.businessEthnicityIdentifiers as ArrayList<Dynamic>;
          var maoriBusinessIdentifier = businessEthnicityIdentifiers.firstWhere(\elt -> elt.ethnicity == "MAORI");
          var identifyingFactors = maoriBusinessIdentifier.identifyingFactors as ArrayList<Dynamic>;
          for (identifyingFactor in identifyingFactors) {
            switch (identifyingFactor.identifyingFactor) {
              case "OWNERSHIP":
                maoriBusinessResult.setOwnership(true);
                break;
              case "DIRECTORS":
                maoriBusinessResult.setDirectors(true);
                break;
              case "EMPLOYEES":
                maoriBusinessResult.setEmployees(true);
                break;
              case "PHILOSOPHY_PRINCIPLES_GOALS_TIKANGA":
                maoriBusinessResult.setPhilosophy(true);
                break;
              case "MANAGEMENT_PRACTICES":
                maoriBusinessResult.setManagement(true);
                break;
              case "BRANDING_MARKETING":
                maoriBusinessResult.setBranding(true);
                break;
              case "TANGIBLE_ASSETS_TOANGA":
                maoriBusinessResult.setAssetsTangible(true);
                break;
              case "INTANGIBLE_ASSETS_KAUPAPA_MAORI":
                maoriBusinessResult.setAssetsIntangible(true);
                break;
              case "OTHER_PLEASE_SPECIFY":
                maoriBusinessResult.setOther(true);
                maoriBusinessResult.setOtherReason(identifyingFactor.identifyingFactorOtherDescription != null ? identifyingFactor.identifyingFactorOtherDescription : "No 'Other reason' specified")
                break;
            }
          }
        } else if ((parseResult.businessEthnicityIdentifiers == null
            or !(parseResult.businessEthnicityIdentifiers as List).HasElements)
            and maoriBusinessResult != null) {
          bundle.add(maoriBusinessResult)
          maoriBusinessResult.remove()
        }

      }, "sys")
    } catch (e : Exception) {
      throw new MBIEException("Problem parsing eventPayload", e)
    }
  }
}