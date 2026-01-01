package gw.apd.schedule

uses gw.api.productmodel.IValueRangeGetter

@Export
class APDInvolvedPartyValueRangeGetter implements IValueRangeGetter {

  var _owningClause : Clause

  construct(owningClause : Clause) {
    _owningClause = owningClause
  }

  override property get ValueRange() : KeyableBean[] {
    return (_owningClause.BranchUntyped as PolicyPeriod).PolicyContactRoles.whereTypeIs(APDPolicyInvolvedParty)
  }
}