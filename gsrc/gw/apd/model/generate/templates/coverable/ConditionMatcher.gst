<%@ params(coverable:APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.lob.common.AbstractConditionMatcher
uses gw.entity.ILinkPropertyInfo

class ${coverable.QualifiedName}CondMatcherBase extends AbstractConditionMatcher<entity.${coverable.QualifiedName}Cond> {

  construct(owner : entity.${coverable.QualifiedName}Cond) {
    super(owner)
  }

  override property get Parent(): ILinkPropertyInfo {
    return ${coverable.QualifiedName}Cond.Type.TypeInfo.getProperty("${coverable.TypeName}") as ILinkPropertyInfo
  }

}