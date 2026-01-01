package edge.capabilities.gpa.user.local

uses edge.capabilities.gpa.user.dto.ProducerCodeDTO

interface IProducerCodePlugin {

  public function toDTO(aProducerCode : ProducerCode) : ProducerCodeDTO
  public function toDTOArray(producerCodes : ProducerCode[]) : ProducerCodeDTO[]

}
