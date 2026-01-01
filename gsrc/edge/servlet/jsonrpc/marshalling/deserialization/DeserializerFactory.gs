package edge.servlet.jsonrpc.marshalling.deserialization

uses edge.metadata.service.IMetadataService
uses edge.metadata.service.DefaultMetadataService
uses java.util.concurrent.locks.ReentrantLock
uses java.util.concurrent.ConcurrentHashMap
uses gw.lang.reflect.IType
uses java.lang.Throwable
uses gw.entity.TypeKey
uses gw.entity.ITypeList
uses edge.util.MapUtil
uses java.lang.Enum
uses java.util.Arrays
uses java.lang.IllegalArgumentException
uses edge.metadata.typeinfo.type.TypeAnalyzer
uses edge.PlatformSupport.Reflection
uses java.util.ArrayList
uses gw.lang.reflect.IConstructorHandler
uses java.util.HashSet
uses java.util.HashMap
uses edge.jsonmapper.JsonReadOnlyProperty

/**
 * Factory for the deserializers.
 */
final class DeserializerFactory {

  public static final var INSTANCE : DeserializerFactory = new DeserializerFactory(DefaultMetadataService.SERVICE)

  /** Metadata provider for this factory. */
  private var metadataService : IMetadataService

  /** Thread-safety lock. */
  private var lock = new ReentrantLock()

  /** Deserializers for different object types. */
  private var deserializers = new ConcurrentHashMap<IType, Deserializer>()


  private construct(ms : IMetadataService) {
    this.metadataService = ms
    deserializers.putAll(CoreDeserializers.CORE_DESERIALIZERS)
  }

  /** Returns a deserializer for the given type. */
  public function getDeserializer(type : IType) : Deserializer {
    final var guess = deserializers.get(type)
    /* Proxy mean that construction is in progress and we should wait for its completion using the lock. */
    if (guess != null && !(guess typeis ProxyDeserializer)) {
      return guess
    }

    using(lock) {
      return safeGet(type)
    }
  }


  /** Locked version of the retrieval. */
  private function safeGet(type : IType) : Deserializer {
    final var guess = deserializers.get(type)
    if (guess != null) {
      return guess
    }

    return createDeserializer(type)
  }


  /** Creates and registern a new deserializer. */
  private function createDeserializer(type : IType) : Deserializer {
    final var proxy = new ProxyDeserializer()
    deserializers.put(type, proxy)
    try {
      final var realSerializer = constructSerializer(type)
      proxy.peer = realSerializer
      deserializers.put(type, realSerializer)
      return realSerializer
    } catch (e : Throwable) {
      deserializers.remove(type)
      throw e
    }
  }

  /**
   * Constructs a new deserializer based on the type.
   */
  private function constructSerializer(type :  IType) : Deserializer {
    if (TypeKey.isAssignableFrom(type)) {
      return TypelistDeserializer.make(type as ITypeList)
    }
    if (Enum.isAssignableFrom(type)) {
      final var values = type.TypeInfo.getMethod('values', {}).CallHandler.handleCall(null, {})?.asArrayOf(Object)
      final var valueMap = MapUtil.groupUniqueBy(Arrays.asList(values), \v -> (v as Enum).name())
      return new UnmapValueDeserializer(valueMap, type.Name)
    }
    if (type.Array) {
      return new ArrayDeserializer(safeGet(type.ComponentType), type.ComponentType)
    }

    if (TypeAnalyzer.isCollection(type)) {
      final var ctor = getCollectionCtor(type)
      return new CollectionDeserializer(safeGet(type.TypeParameters[0]), ctor)
    }

    if (TypeAnalyzer.isMap(type)) {
      final var ctor = getMapCtor(type)
      return new MapDeserializer(safeGet(type.TypeParameters[1]), ctor)
    }

    return createDtoDeserializer(type)
  }


  /**
   * Creates a new DTO serializer.
   */
  private function createDtoDeserializer(t : IType) : Deserializer {
    final var ctor = t.TypeInfo.getConstructor({})
    if (ctor == null) {
      throw new IllegalArgumentException("DTO with type " + t  + " must have a default constructor to be deserializable")
    }

    final var props = metadataService.getExposedProperties(t)
        .where( \ elt -> !Reflection.hasAnnotation(elt, JsonReadOnlyProperty))
    final var propReaders = props.map( \ elt -> PropertyReader.make(elt, safeGet(Reflection.getPropertyType(elt))))

    return new DtoDeserializer(ctor.Constructor, propReaders)
  }


  /** Returns a constructor for the map type. */
  private function getMapCtor(type : IType) : IConstructorHandler {
    final var genericType = Reflection.getGenericType(type)
    if (genericType.Name == "java.util.Map") {
      return HashMap.Type.TypeInfo.getConstructor({}).Constructor
    }

    return genericType.TypeInfo.getConstructor({}).Constructor
  }


  /** Returns a collection constructor based on the its declared type. */
  private function getCollectionCtor(type : IType) : IConstructorHandler {
    final var genericType = Reflection.getGenericType(type)

    if (genericType.Name == "java.util.List") {
      return ArrayList.Type.TypeInfo.getConstructor({}).Constructor
    }

    if (genericType.Name == "java.util.Set") {
      return HashSet.Type.TypeInfo.getConstructor({}).Constructor
    }

    return type.TypeInfo.getConstructor({}).Constructor
  }

}
