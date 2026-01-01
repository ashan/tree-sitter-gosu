package edge.capabilities.quote.lob

uses edge.di.annotations.ForAllGwNodes
uses edge.di.boot.Bootstrap
uses edge.di.CapabilityAndPath
uses edge.di.Path
uses java.util.Map

class AgentCompositeLobDraftPlugin extends CompositeLobDraftPlugin{

  //private var _lobMap : Map<String, ILobDraftPlugin >
  /**
   * Creates a new composite draft plugin
   */
  @ForAllGwNodes("agentquote")
  @ForAllGwNodes("agentpolicychange")
  construct() {
    //Using Bootstrap as a service locator until DI framework evolves to support injecting a map of dependencies
    super("agentquote")
  }

}
