package edge.Plugin
uses java.util.Map
uses gw.plugin.InitializablePlugin
uses edge.webservice.pc.pc900.community.EdgeProducerAPI
uses gw.webservice.pc.pc1000.community.datamodel.ProducerCodeDTO

class ProducerCodeRetrieverPlugin implements InitializablePlugin {

  function retrieveProducerCodesByUserName(userName : String) : List<ProducerCodeDTO>{

    return ProducerCodeService.getProducerCodesByUserName(userName)

  }

  private property get ProducerCodeService() : EdgeProducerAPI  {

    var pcService = new EdgeProducerAPI()

    return pcService
  }

  override property set Parameters(map : Map) {

  }
}
