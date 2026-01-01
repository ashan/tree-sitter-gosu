package edge.capabilities.gpa.search

uses edge.di.annotations.ForAllGwNodes

class DefaultFTSplugin implements IFTSPlugin{

  @ForAllGwNodes
  construct(){}

  override function performPolicySearch(searchParam: String): List<String> {
    return null
  }

  override function performAccountSearch(searchParam: String): List<String> {
    return null
  }
}
