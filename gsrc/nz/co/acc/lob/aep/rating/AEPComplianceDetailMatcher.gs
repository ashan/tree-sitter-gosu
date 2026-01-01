package nz.co.acc.lob.aep.rating

uses gw.api.logicalmatch.AbstractEffDatedPropertiesMatcher
uses gw.entity.IEntityPropertyInfo
uses gw.entity.ILinkPropertyInfo

/**
 * Matches {@link AEPComplianceDetailMatcher}s based on the FK to the {@link AEPLine_ACC}.
 */
@Export
class AEPComplianceDetailMatcher extends AbstractEffDatedPropertiesMatcher<AEPComplianceDetail_ACC> {

  construct(owner : AEPComplianceDetail_ACC) {
    super(owner)
  }

  override property get IdentityColumns() : Iterable<IEntityPropertyInfo> {
    return {}
  }

  override property get ParentColumns() : Iterable<ILinkPropertyInfo> {
    return {AEPComplianceDetail_ACC.Type.TypeInfo.getProperty("AEPLine_ACC") as ILinkPropertyInfo}
  }

}
