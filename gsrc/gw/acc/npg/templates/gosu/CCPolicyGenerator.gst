<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine: ProductLine,pcVersion:String) %>
case "${productLine.LineCode}":
        mapper = new gw.webservice.pc.${pcVersion}.ccintegration.lob.${productLine.CCPolicyLineMapperName}(line, this);
        break;
