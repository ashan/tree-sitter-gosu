package edge.capabilities.gpa.document

uses edge.capabilities.gpa.document.dto.DocumentDTO

interface IDocumentPlugin {
  public function toDTO(document : Document) : DocumentDTO
  public function toDTOArray(documents : Document[]) : DocumentDTO[]
  public function getDocumentsForAccount(anAccount : Account) : Document[]
  public function getDocumentsForPolicy(aPolicy : Policy) : Document[]
  public function getDocumentsForJob(aJob : Job) : Document[]
  public function createDocument(dto : DocumentDTO) : Document
  public function removeDocument(aDocument : Document) : boolean
}
