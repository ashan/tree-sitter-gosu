<%@ params(productLine : APDProductLine) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${productLine.LinePrefixLowerCase}.${APDConstants.FINANCIALS}"
%>
package ${basePackage}

@Export
class ${productLine.LinePrefix}CostMethodsImplBase<T extends ${productLine.LinePrefix}Cost> implements ${productLine.LinePrefix}CostMethods {

  protected var _owner : T as readonly Cost

  construct(owner : T) {
    _owner = owner
  }

  override property get Coverage() : Coverage {
    return null
  }

  override property get OwningCoverable() : Coverable {
    return null
  }

  override property get Jurisdiction() : Jurisdiction {
    return null
  }

}