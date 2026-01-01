package edge.capabilities.gpa.user.local

uses edge.capabilities.gpa.user.dto.ProducerCodeDTO
uses edge.di.annotations.ForAllGwNodes

class DefaultProducerCodePlugin implements IProducerCodePlugin {

  @ForAllGwNodes
  construct(){}

  override function toDTO(aProducerCode: ProducerCode): ProducerCodeDTO {
    final var dto = new ProducerCodeDTO()
    dto.PublicID = aProducerCode.PublicID
    dto.Code = aProducerCode.Code
    dto.Description = aProducerCode.Description
    dto.DisplayValue = aProducerCode.Description != null ? aProducerCode.Code + " " + aProducerCode.Description : aProducerCode.Code

    return dto
  }

  override function toDTOArray(producerCodes: ProducerCode[]): ProducerCodeDTO[] {
    if(producerCodes != null && producerCodes.HasElements){
      return producerCodes.map( \ code -> toDTO(code))
    }

    return new ProducerCodeDTO[]{}
  }
}
