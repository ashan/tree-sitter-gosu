package edge.servlet.jsonrpc.marshalling.serialization

uses java.util.concurrent.locks.Lock
uses gw.lang.reflect.IType
uses java.util.concurrent.ConcurrentHashMap
uses java.util.Map
uses java.lang.Throwable

/**
 * Provider for the serializers. It looks up serializers based on the request type. All instances of this class are
 * self-reenterant. This mean that <code>factory</code> could call methods on this provider and it would not cause
 * an infinite recursion (proxy instance would be returned instead).
 */
internal final class SerializerProvider {
  /**
   * Lock used for the thread-safe access. Many providers could share the same lock to prevent dead-lock when complex
   * graph is built in many threads.
   */
  private var lck : Lock

  /**
   * Factory for the serializer. This one is used when cached item copy was not found. It is guaranteed that it is
   * called only when lck is held by the current thread.
   */
  private var factory(type : IType) : Serializer

  /**
   * Items cached in this provider.
   */
  private var items = new ConcurrentHashMap<IType, Serializer>()

  internal construct(l : Lock, iv : Map<IType, Serializer>, f(type : IType) : Serializer) {
    this.lck = l
    this.factory = f
    this.items.putAll(iv)
  }


  /** Returns a serializer for the given type. Serializer is created if it is absent in the map. */
  internal function get(key : IType) : Serializer {
    final var guess = items.get(key)

    /** Proxy mean that object is still under the construction and we have to wait until it is fully constructed. */
    if (guess != null && !(guess typeis ProxySerializer)) {
      return guess
    }

    /* Double-checked locking. Safe while items are thread-safe as well. */
    using(lck) {
      return safeGet(key)
    }
  }


  /** Version of the get which should be called when the lock is acquired. It makes get's code more readable and could
   * improve performance slightly (performance improvement is not a main intent anyway).
   */
  internal function safeGet(key : IType) : Serializer {
    /* It could be either a double-checked locking or access from outside in the safe context. */
    final var guess = items.get(key)
    if (guess != null) {
      return guess
    }

    /* Provide reenterant stub. */
    final var proxy = new ProxySerializer()
    items.put(key, proxy)

    try {
      final var realObject = factory(key)
      /* Replace proxy with a true object. Resolve proxy to the created object so anyone received proxy would delegate
       * to this peer anyway.
       */
      items.put(key, realObject)
      proxy.peer = realObject
      return realObject
    } catch (t : Throwable) {
      /* Do not leave obsolete proxy in the map. */
      items.remove(key)
      throw t
    }
  }

}
