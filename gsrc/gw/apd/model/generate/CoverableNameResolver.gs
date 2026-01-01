package gw.apd.model.generate

@Export
class CoverableNameResolver {

  public static function appendToIdentifierField(identifierField : APDField) : String {

    var displayNameTypes = {APDFieldType.TC_TYPEKEY, APDFieldType.TC_LOCATION, APDFieldType.TC_PARTY}

    if (identifierField.Jurisdiction) {
      return ".DisplayName"
    } else if (displayNameTypes.contains(identifierField.Type)) {
      return ".DisplayName"
    } else if (identifierField.Type == APDFieldType.TC_DATE) {
      return ".ShortFormat"
    } else if (identifierField.Type != APDFieldType.TC_VARCHAR) {
      return "?.toString()"
    }
    return ""
  }

}