package gw.apd.policy

uses entity.APDRiskCoverable
uses gw.api.locale.DisplayKey

/**
 * Agile product developer
 */
@Export
enhancement APDRiskCoverableContentEnhancement : APDRiskCoverable {

  function riskPopupTitle() : String {
    if (this.VersionList.AllVersions.Count > 1) {
      return DisplayKey.get("Web.APDRiskPopup.Title.Split", this.DisplayName, this.EffectiveDate.ShortFormat, this.ExpirationDate.ShortFormat)
    }
    return this.DisplayName
  }
}