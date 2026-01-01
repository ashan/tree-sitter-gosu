package nz.co.acc.util

class FeatureToogleUtil {
  //overseas income feature
  //for checks that depend on both the state of the script parameter and levy year
  static function overseasIncomeEnabled(levyYear : Integer) : Boolean {
    if (ScriptParameters.OverseasIncomeEnabled_ACC and levyYear >= 2023) {
      return true
    } else {
      return false
    }
  }
  // for checks that depend only on the state of the script parameter
  static function overseasIncomeEnabled() : Boolean {
    if (ScriptParameters.OverseasIncomeEnabled_ACC) {
      return true
    } else {
      return false
    }
  }

}