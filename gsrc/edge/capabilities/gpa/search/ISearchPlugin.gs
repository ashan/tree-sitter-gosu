package edge.capabilities.gpa.search

uses edge.capabilities.gpa.search.dto.SearchResultsDTO

interface ISearchPlugin {

  public function searchResultsToDTO(accounts : Account[], policies : Policy[]) : SearchResultsDTO
  public function search(searchParam : String) : SearchResultsDTO

}
