package edge.webapimodel.dto
uses gw.lang.reflect.IType
uses edge.jsonmapper.JsonProperty
uses java.util.HashSet
uses edge.metadata.typeinfo.dto.TypeMetadataDTO
uses edge.metadata.typeinfo.DefaultTypeMetadataService

class WebApiModelDTO {
  private var _allTypes = new HashSet<IType>()

  @JsonProperty
  property get newTypeMeta() :  TypeMetadataDTO[] {
    return DefaultTypeMetadataService.INSTANCE.getMetadata(_allTypes)
  }

  function registerType (typeToRegister : IType) {
    _allTypes.add(typeToRegister)
  }
}
