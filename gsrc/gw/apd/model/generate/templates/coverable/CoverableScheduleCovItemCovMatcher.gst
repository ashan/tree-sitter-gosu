<%@ params(coverable : APDCoverable) %>
<%
uses gw.apd.APDConstants

var basePackage = "${APDConstants.GW_LOB}.${coverable.LinePrefixLowerCase}"
%>
package ${basePackage}

uses gw.api.logicalmatch.AbstractEffDatedPropertiesMatcher
uses gw.entity.IEntityPropertyInfo
uses gw.entity.ILinkPropertyInfo

@Export
class ${coverable.QualifiedName}SchCovItemCovMatcherBase extends AbstractEffDatedPropertiesMatcher<entity.${coverable.QualifiedName}SchCovItemCov> {

  construct(owner : entity.${coverable.QualifiedName}SchCovItemCov) {
    super(owner)
  }

  override property get IdentityColumns() : Iterable<IEntityPropertyInfo> {
    return {}
  }

  override property get ParentColumns() : Iterable<ILinkPropertyInfo> {
    return { entity.${coverable.QualifiedName}SchCovItemCov.${coverable.ScheduleCovItemFieldName.toUpperCase()}_PROP.get() }
  }

}