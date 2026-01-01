package gw.job

uses gw.api.database.Query
uses gw.api.database.Relop

uses java.util.Date

@Export
class AvailableUWCompanies {
  var _allCoveredStates : java.util.Set<Jurisdiction> = {}
  var _periodStart : Date
  var _period : PolicyPeriod
  var _uwCompanies : UWCompany[]
  
  construct(period : PolicyPeriod) {
    _period = period
  }
  
  property get Value() : UWCompany[] {
    if (hasPeriodStartChanged() or hasAllCoveredStatesChanged()) {
      _periodStart = _period.PeriodStart
      _allCoveredStates = _period.AllCoveredStates
      _uwCompanies = _period.getUWCompaniesForStates(true).toTypedArray()
    }

    //APD specific change that defaults UWCompany for manual products
    if (_period.Policy.ProductCode != "Manual") {
      return _uwCompanies
    } else {
      return _uwCompanies.Count != 0 ? _uwCompanies : {defaultAPDUWCompany()}
    }
  }

  function hasPeriodStartChanged() : boolean {
    return not (_periodStart == _period.PeriodStart)
  }

  function hasAllCoveredStatesChanged() : boolean {
    var allCoveredStates = _period.AllCoveredStates
    return not (_allCoveredStates.containsAll(allCoveredStates) and allCoveredStates.containsAll(_allCoveredStates))
  }

  public static function defaultAPDUWCompany() : UWCompany {
    var q = Query.make(UWCompany)
    q.compare(UWCompany#Code, Relop.Equals, UWCompanyCode.TC_DEFAULT)
    return q.select().single()
  }
}
