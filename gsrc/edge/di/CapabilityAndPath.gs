package edge.di

/**
 * Rule defining both capability and path.
 */
final class CapabilityAndPath {
  
  /** Capability name for the item. */
  private var _capability : String as readonly Capability
  
  /** Path to the node in question. */
  private var _path : Path as readonly Path
  
  construct(cap : String, p : Path) {
    this._capability = cap
    this._path = p
  }
  
  function sub(part : String) : CapabilityAndPath {
    return new CapabilityAndPath(_capability, _path.sub(part))
  }
  

  override function hashCode() : int {
    return _capability.hashCode() * 31 + _path.hashCode()
  }
  
  override function equals(other : Object) : boolean {
    if (!(other typeis CapabilityAndPath)) {
      return false
    }
    
    final var o = other as CapabilityAndPath

    if (_capability == null && o._capability != null || _capability != null && !_capability.equals(o._capability)) {
      return false
    }
    
    if (_path == null && o._path != null || _path != null && !_path.equals(o._path)) {
      return false
    }
    
    return true
  }
  
  override function toString() : String {
    return _capability + "::" + _path
  }
}
