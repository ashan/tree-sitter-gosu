package gw.pcf.coverage

uses gw.api.domain.covterm.DateTimeCovTerm
uses gw.api.locale.DisplayKey

@Export
class CovTermGenericDateTimeInputSetHelper {

  public static function validate(covTerm : DateTimeCovTerm) : String {
    return covTerm != null
        ? covTerm.validateValueInRange(covTerm.Value)
        : DisplayKey.get("Java.Validation.NonNullable", new Object[]{"Term"})
  }

}