package edge.util.helper

class JurisdictionUtil {

  static function getJurisdiction(aState:State):Jurisdiction {
    return aState == null ? null :
           aState.Categories.firstWhere(\ t -> t typeis Jurisdiction) as Jurisdiction
  }
}
