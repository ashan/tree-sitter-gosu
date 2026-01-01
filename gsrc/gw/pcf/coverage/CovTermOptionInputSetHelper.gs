package gw.pcf.coverage

uses gw.api.domain.covterm.OptionCovTerm

@Export
class CovTermOptionInputSetHelper {

  public static function validate(covTerm : OptionCovTerm) : String {
    return covTerm?.validateValueInRange(covTerm.Value)
  }

}