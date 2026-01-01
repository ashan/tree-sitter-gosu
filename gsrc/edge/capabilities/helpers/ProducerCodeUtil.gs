package edge.capabilities.helpers

uses java.lang.IllegalArgumentException
uses gw.api.database.Query
uses java.util.ArrayList
uses edge.di.annotations.ForAllGwNodes

class ProducerCodeUtil {

  @ForAllGwNodes
  construct() {}

  /**
   * Find a ProducerCode entity from the database based on the code
   */
  public function getProducerCodeByCode(code : String) : ProducerCode{
    if(code == null){
      throw new IllegalArgumentException("ProducerCode must not be null")
    }

    return Query.make(ProducerCode).compare("Code", Equals, code).select().AtMostOneRow
  }

  /**
   * Find ProducerCode entities from the database based on their codes
   */
  public function getProducersCodeByCodes(codes : String[]) : ProducerCode[]{
    if(codes == null || !codes.HasElements){
      throw new IllegalArgumentException("ProducerCodes must not be empty")
    }

    var producerCodes = new ArrayList<ProducerCode>();
    for(code in codes){
      producerCodes.add(getProducerCodeByCode(code))
    }

    return producerCodes.toTypedArray()
  }
}
