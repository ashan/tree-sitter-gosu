package edge.jsonrpc.endpoint

uses gw.lang.reflect.IMethodInfo
uses java.lang.IllegalArgumentException
uses gw.lang.reflect.IType
uses java.util.ArrayList
uses edge.jsonrpc.exception.JsonRpcInvalidParamsException
uses java.util.Map
uses edge.jsonrpc.endpoint.validation.ArgumentValidator
uses edge.exception.DtoValidationException
uses gw.api.util.Logger
uses edge.servlet.jsonrpc.marshalling.deserialization.Deserializer
uses edge.servlet.jsonrpc.marshalling.deserialization.DeserializerFactory
uses edge.servlet.jsonrpc.marshalling.deserialization.dom.JsonValue
uses org.apache.commons.fileupload.FileItem
uses java.util.Arrays
uses edge.aspects.validation.context.ContextAspect
uses edge.PlatformSupport.Reflection
uses edge.aspects.validation.annotations.Context
uses edge.aspects.validation.context.ContextFactory
uses edge.aspects.validation.context.ContextPrecompiler
uses edge.metadata.service.ElementMetadataUtil
uses gw.surepath.suite.integration.logging.StructuredLogger


/**
 * Definition of a RPC method that can be called.
 */
internal final class RpcMethod extends InvokableMethod {

  private static final var LOG = StructuredLogger.EDGE_SP.withClass(RpcMethod)

  /** Instance to invoke methods on. */
  private var _instance : Object

  /** Method to invoke. */
  private var _method : IMethodInfo

  /** Validators for the arguments. */
  private var _validators : List<ArgumentValidator>

  /** Factory for the context. */
  private var _contextFactory : ContextFactory


  construct(i : Object, m : IMethodInfo, validators : List<ArgumentValidator>) {
    if (i == null) {
      throw new IllegalArgumentException("RPC object instance could not be null")
    }
    if (m == null) {
      throw new IllegalArgumentException("RPC method could not be null")
    }

    if (!m.OwnersType.isAssignableFrom(typeof(i))) {
      throw new IllegalArgumentException(
          "RPC method " + m.OwnersType.QName + "." + m.Name + " could not be applied to an instance of " + (typeof i).QName)
    }

    this._instance = i
    this._method = m
    final var argTypes = m.Parameters.toList().map(\ param -> param.Type)
    final var contextMetadata = m.Annotations
        .where( \ elt -> elt.Instance typeis Context)
        .map( \ elt -> (elt.Instance as Context).getState())
    this._contextFactory = ContextPrecompiler.fromMetadata(ElementMetadataUtil.fromObjects(contextMetadata.toArray()), argTypes.toTypedArray())

    this._validators = validators
  }

  override internal function invoke(typedArgs : List<Object>) : Object {
    final var ctx = _contextFactory.createContext(null, typedArgs.toArray())
    final var messages = typedArgs.mapWithIndex( \ item, idx -> _validators.get(idx).validate(ctx, item)).flatten().toList()
    if (!messages.Empty) {
      LOG.error_ACC(messages.map(\x -> x.ArgumentName + ":" + x.Path + " -> " + x.Message).join("\n"))

      throw new DtoValidationException() {
        :Message = "Dto validation error",
        :Data =  messages
      }
    }

    return _method.CallHandler.handleCall(_instance, typedArgs.toArray())
  }


  override function getArgumentTypes(): List<IType> {
    return Arrays.asList(_method.Parameters.map( \ elt -> elt.FeatureType))
  }
}
