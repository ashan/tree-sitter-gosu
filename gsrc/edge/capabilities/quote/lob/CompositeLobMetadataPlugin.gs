package edge.capabilities.quote.lob

uses edge.di.annotations.ForAllGwNodes
uses edge.di.boot.Bootstrap
uses edge.di.Path
uses edge.di.CapabilityAndPath
uses java.util.HashSet
uses java.util.Arrays

/**
 * Composite implementation of metadata provider.
 */
final class CompositeLobMetadataPlugin implements ILobMetadataPlugin {

  private var _peers : ILobMetadataPlugin []
  @ForAllGwNodes
  construct() {
    //Using Bootstrap as a service locator until DI framework evolves to support injecting a map of dependencies
    _peers =
        Bootstrap.forceCreateMap< ILobMetadataPlugin >(new CapabilityAndPath("quote", Path.parse("quote.metadata.lob")))
            .values().toTypedArray()
  }

  override function getQuestionSetCodes(): String[] {
    final var res = new HashSet<String>()
    for (peer in _peers) {
      res.addAll(Arrays.asList(peer.getQuestionSetCodes()))
    }
    return res.toTypedArray()
  }
}
