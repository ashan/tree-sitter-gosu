package edge.servlet.jsonrpc.marshalling.serialization

uses edge.metadata.service.IMetadataService
uses edge.metadata.service.DefaultMetadataService
uses gw.lang.reflect.IType
uses java.util.concurrent.locks.ReentrantLock
uses edge.metadata.typeinfo.type.TypeAnalyzer
uses edge.PlatformSupport.Reflection
uses gw.entity.TypeKey
uses java.lang.Enum

/** Factory which could resolve serializers for the specific types. It uses set of predefined rules and reflection to
 * build a serializer instance.
 */
final class SerializerFactory {

  /** Default instance of the serializer factory. */
  public static var DEFAULT_FACTORY : SerializerFactory = new SerializerFactory(DefaultMetadataService.SERVICE)

  /** Metadata provider. Used to access list of properties on the DTOs. */
  private var metaService : IMetadataService

  /** Lock for the thread-safe initialization of factories. */
  private final var lock = new ReentrantLock()

  /** Serializers based on the declared type of the field. These serializers would delegate its job to the
   * runtime serializers of the proper type if necessary.
   */
  private final var declaredTypeSerializers = new SerializerProvider(lock,
      CoreSerializers.CORE_SERIALIZERS.mapValues( \ value -> new NullSafeSerializer(value)),
      \type -> createDeclaredTypeSerializer(type))


  /** Serializers based on the run-time type of the object. They assume that every key is an exact type of the
   * object.
   */
  private final var runtimeTypeSerializers = new SerializerProvider(lock, CoreSerializers.CORE_SERIALIZERS,
      \type -> createRuntimeTypeSerializer(type))


  /** Creates a new serializer factory which uses specific metadata service. */
  private construct(ms : IMetadataService) {
    this.metaService = ms
  }



  /**
   * Returns a serializer for the specific declared type. Serializer is automatically created for the DTO types and could
   * automatically serialize child instances of the declaring type (preserving properties defined on the child object
   * as well as parent's properties). Note that nulls should not be passed to the returned serializer   */
  public function getSerializerForDeclaredType(type: IType) : Serializer {
    return declaredTypeSerializers.get(type)
  }


  /** Creates a serializer for the declared type. */
  private function createDeclaredTypeSerializer(type : IType) : Serializer {
    if (declaredTypeDefinesRuntimeSerializer(type)) {
      return new NullSafeSerializer(runtimeTypeSerializers.safeGet(type))
    }

    return new NullSafeSerializer(new DispatchDtoSerializer(runtimeTypeSerializers, type))
  }


  /** Checks if a declared type could define a deserializer to be used for any runtime type. */
  private function declaredTypeDefinesRuntimeSerializer(type : IType) : boolean {
    if (java.util.Date.isAssignableFrom(type)) {
      return true
    }

    if (TypeKey.isAssignableFrom(type)) {
      return true
    }

    if (Enum.isAssignableFrom(type)) {
      return true
    }

    if (type.Array) {
      return true
    }

    if (TypeAnalyzer.isCollection(type)) {
      return true
    }

    if (TypeAnalyzer.isMap(type)) {
      return true
    }

    if (type.Final) {
      return true
    }

    return false
  }


  /** Creates a serializer for the specific runtime type. */
  private function createRuntimeTypeSerializer(type: IType) : Serializer {
    /* Support for all exotic dates. */
    if (java.util.Date.isAssignableFrom(type)) {
      return CoreSerializers.DATE_SERIALIZER
    }

    if (TypeKey.isAssignableFrom(type)) {
      return CoreSerializers.TYPEKEY_SERIALIZER
    }

    if (Enum.isAssignableFrom(type)) {
      return CoreSerializers.ENUM_SERIALIZER
    }

    if (type.Array) {
      return new ArraySerializer(declaredTypeSerializers.safeGet(type.ComponentType))
    }

    if (TypeAnalyzer.isCollection(type)) {
      return new CollectionSerializer(declaredTypeSerializers.safeGet(type.TypeParameters[0]))
    }

    if (TypeAnalyzer.isMap(type)) {
      return new MapSerializer(declaredTypeSerializers.safeGet(type.TypeParameters[1]))
    }

    return createRuntimeDtoSerializer(type)
  }


  /**
   * Creates a serializer for the runtime DTO type..
   */
  private function createRuntimeDtoSerializer(type: IType) : Serializer {
    final var props = metaService.getExposedProperties(type)
    final var propSpecs = props.map(
        \ elt -> PropertyWriter.make(elt, declaredTypeSerializers.safeGet(Reflection.getPropertyType(elt))))
    return new StrictDtoSerializer(propSpecs)
  }
}
