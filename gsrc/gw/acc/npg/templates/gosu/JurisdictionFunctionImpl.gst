<% uses gw.acc.npg.model.Coverable %>
<%@ params(coverable:Coverable,functionName:String,pathToJurisdiction:String) %>

  override property get ${functionName}(): Jurisdiction {
<%if(coverable.JurisBasedOnLocation){%>
    return JurisdictionMappingUtil.getJurisdiction(_owner.${pathToJurisdiction})
<%} else {%>
    return _owner.${pathToJurisdiction}
<%}%>
  }