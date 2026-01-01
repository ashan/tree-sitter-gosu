<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.coverage.AbstractCoverageMatcher
uses gw.entity.ILinkPropertyInfo

@Export
class ${coverable.QualifiedName}CovMatcherBase extends AbstractCoverageMatcher<entity.${coverable.QualifiedName}Cov> {

  var _owner : entity.${coverable.QualifiedName}Cov as readonly Owner

  construct(owner : entity.${coverable.QualifiedName}Cov) {
    super(owner)
    _owner = owner
  }

  override property get CoverableColumns() : List<ILinkPropertyInfo> {
    return {${coverable.QualifiedName}Cov.Type.TypeInfo.getProperty("${coverable.TypeName}") as ILinkPropertyInfo}
  }
}