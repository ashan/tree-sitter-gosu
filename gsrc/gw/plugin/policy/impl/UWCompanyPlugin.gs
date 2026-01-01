package gw.plugin.policy.impl

uses gw.plugin.policy.IUWCompanyPlugin
uses nz.co.acc.lob.util.ProducerUtil_ACC

uses java.util.Set

@Export
class UWCompanyPlugin implements IUWCompanyPlugin {

  override function findUWCompaniesForStates(period : PolicyPeriod, allStates : boolean) : Set<UWCompany> {
    // DE102 - Always return the ACC UWCompany regardless of the State and the policy line.
    var accUW = ProducerUtil_ACC.queryUnderwritingCompany_ACC()
    var accUWSet : Set<UWCompany> = {accUW}
    return accUWSet
  }
}
