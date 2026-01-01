<%@ params(coverable:APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.entity.ILinkPropertyInfo
uses gw.lob.common.AbstractExclusionMatcher

class ${coverable.QualifiedName}ExclMatcherBase extends AbstractExclusionMatcher<entity.${coverable.QualifiedName}Excl> {

  construct(owner : entity.${coverable.QualifiedName}Excl) {
    super(owner)
  }

  override property get Parent() : ILinkPropertyInfo {
    return ${coverable.QualifiedName}Excl.Type.TypeInfo.getProperty("${coverable.TypeName}") as ILinkPropertyInfo
  }

}