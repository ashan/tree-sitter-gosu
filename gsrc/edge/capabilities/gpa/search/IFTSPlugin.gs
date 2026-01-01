package edge.capabilities.gpa.search

interface IFTSPlugin {

  public function performPolicySearch(searchParam: String): List<String>
  public function performAccountSearch(searchParam: String): List<String>
}
