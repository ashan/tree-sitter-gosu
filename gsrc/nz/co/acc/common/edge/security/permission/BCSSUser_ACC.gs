package nz.co.acc.common.edge.security.permission

uses edge.jsonmapper.JsonProperty
uses edge.servlet.jsonrpc.marshalling.deserialization.DeserializerFactory
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.DomReader

uses java.io.StringReader

/**
 * Information about the BCSS user
 */
class BCSSUser_ACC {
  /**
   * Name of the user.
   */
  @JsonProperty
  private var _bcssId: String as BcssId

  @JsonProperty
  private var _fullName: String as FullName

  private static final var BCSS_USER_DESERIALIZER = DeserializerFactory.INSTANCE.getDeserializer(BCSSUser_ACC)

  public static function getInstance(userDetails: String): BCSSUser_ACC {
    var BCSSUserJson = DomReader.read(new StringReader(userDetails))
    return BCSS_USER_DESERIALIZER.deserialize(BCSSUserJson) as BCSSUser_ACC
  }

  @Override
  public function toString(): String {
    return "bcssId: ${_bcssId} fullName: ${_fullName}"
  }
}