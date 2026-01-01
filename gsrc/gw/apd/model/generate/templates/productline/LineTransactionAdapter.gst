<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}.${APDConstants.FINANCIALS}"
%>
package ${basePackage}

uses gw.api.domain.financials.TransactionAdapter

@Export
class ${productLine.LinePrefix}TransactionAdapterBase implements TransactionAdapter {

  var _owner : entity.${productLine.LinePrefix}Transaction as readonly Owner

  construct(owner : entity.${productLine.LinePrefix}Transaction) {
    _owner = owner
  }

  override property get Cost() : Cost {
    return Owner.Cost
  }

}
