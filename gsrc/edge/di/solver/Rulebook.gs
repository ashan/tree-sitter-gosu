package edge.di.solver
uses java.util.Map
uses edge.di.Path
uses java.util.Collections
uses gw.lang.reflect.IType
uses java.util.LinkedList
uses java.lang.Math
uses java.lang.Iterable
uses edge.util.MapUtil
uses gw.util.Pair
uses edge.di.CapabilityAndPath

/**
 * Rules helper. Keeps track of rules applicable to different categories of objects.
 */
final class Rulebook {  
  /** Information provider for type. */
  private var _implementationFinder(x : IType) : List<TypeMetadata>
  
  /** Configuration file metadata. */
  private var _confrules : Map<CapabilityAndPath, List<RuleDefn>>
  
  /** Private configuration metadata. */
  private var _privateConfRules : Map<CapabilityAndPath, List<RuleDefn>>
  
  /** Maximal rulebook path. */
  private var _maxRulePath : int
  
  
  
  internal construct(
        implFinder(x : IType) : List<TypeMetadata>, 
        clientPathRules : List<Pair<CapabilityAndPath, RuleDefn>>, 
        privatePathRules : List<Pair<CapabilityAndPath, RuleDefn>>) {
    this._implementationFinder = implFinder
    this._confrules = MapUtil.groupCollection(clientPathRules , \ i -> i.First, \ i -> i.Second)
    this._privateConfRules = MapUtil.groupCollection(privatePathRules, \ i -> i.First, \ i -> i.Second)
    this._maxRulePath = Math.max(maxPath(_confrules.keySet()), maxPath(_privateConfRules.keySet()))
  }
  
  
  
  private static function maxPath(items : Iterable<CapabilityAndPath>) : int {
    var res = 0
    for (var cpath in items) {
      if (cpath.Path.Length > res) {
        res = cpath.Path.Length
      }
    }
    return res
  }  
  
  
  /** Returns all rules applicable to a specific path. */
  function conffileRules(path : CapabilityAndPath) : List<RuleDefn> {
    return MapUtil.getOrDefault(_confrules, path, Collections.emptyList<RuleDefn>())
  }



  /** Returns all private rules applicable to a specific path. */
  function privateConffileRules(path : CapabilityAndPath) : List<RuleDefn> {
    return MapUtil.getOrDefault(_privateConfRules, path, Collections.emptyList<RuleDefn>())
  }
  

  /** Returns annotation rules applicable to a specific path with 
   * specific result type.
   */
  function pathAnnots(p : CapabilityAndPath, goal : IType) : List<RuleDefn> {    
    var res = _implementationFinder(goal).flatMap(
      \candidate ->  candidate.PathRules
        .where(\rule -> rule.First.equals(p))
        .map(\rule -> rule.Second))
    return res
  }


  
  /** Returns rules forced by wildcard annotations for some target type. */
  function wildcardAnnots(goal : IType, capability : String) : List<RuleDefn> {
    final var eligibleTypes = _implementationFinder(goal)
      .where(\ t -> t.WildcardRules.hasMatch(\ p -> supportCapability(capability, p)))
    return mostSpecificTypes(eligibleTypes).flatMap(\t -> capabilityRules(capability, t.WildcardRules))
  }
  



  /** Returns rules forced by private annotations for some target type. */
  function privateWildcardAnnots(goal : IType, capability : String) : List<RuleDefn> {
    final var eligibleTypes = _implementationFinder(goal)
      .where(\ t -> t.PrivateWildcardRules.hasMatch(\ p -> supportCapability(capability, p)))
    return mostSpecificTypes(eligibleTypes).flatMap(\t -> capabilityRules(capability, t.PrivateWildcardRules))
  }
  
  /**
   * Limits rules to capability-only rules.
   */
  private static function capabilityRules(cap : String, rules : List<Pair<String, RuleDefn>>) : List<RuleDefn> {
    return rules.where(\ rule -> supportCapability(cap, rule)).map(\ r -> r.Second)
  }

  private static function supportCapability(cap : String, rule : Pair<String, RuleDefn>) : Boolean {
    return rule.First == null || rule.First.equals(cap)
  }

  
  /** Return maximal path which is mentioned in all path rules (both configs and annotations) 
   * which can define a non-wildcard application of type.
   */
  function maxExplicitRulePath(goal : IType) : int {
    var res = _maxRulePath
    for (var candidate in _implementationFinder(goal)) {
      for (var rule in candidate.PathRules) {
        if (rule.First.Path.Length >  res) {
          res = rule.First.Path.Length
        }
      }
    }
    return res    
  }

  
  
  /** Finds list of "most-specific" type among provided. */
  private static function mostSpecificTypes(types : List<TypeMetadata>) : List<TypeMetadata> {
    final var res = new LinkedList<TypeMetadata>()
    
    for (var candidate in types) {
      if (res.hasMatch(\ t -> candidate.ConcreteType.isAssignableFrom(t.ConcreteType))) {
        /* Candidate is less specific than existing type. */
        continue
      }
      
      final var resIterator = res.iterator()
      while (resIterator.hasNext()) {
        /* Candidate is more specific than previous one. */
        if (resIterator.next().ConcreteType.isAssignableFrom(candidate.ConcreteType)) {
          resIterator.remove()
        }
      }
      
      res.add(candidate)
    }
    
    return res
  }
}
