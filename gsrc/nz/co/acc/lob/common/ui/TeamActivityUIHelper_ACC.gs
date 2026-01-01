package nz.co.acc.lob.common.ui

uses entity.Activity
uses gw.api.filters.StandardBeanFilter
uses gw.api.web.team.PCDefaultTeamModel

/**
 * UI helper class for Screen Team Activity.
 */
class TeamActivityUIHelper_ACC {

  private var _subjectSearchKeyword: String as SubjectSearchKeyword
  private var _teamModel: gw.api.web.team.PCDefaultTeamModel

  public construct(teamModel: gw.api.web.team.PCTeamModel) {
    this._teamModel = teamModel as PCDefaultTeamModel
  }

  function getActivities(): Activity[] {
    if (_subjectSearchKeyword != null and _subjectSearchKeyword.HasContent) {
      return _teamModel.Activities.where(\activity -> activity.Subject.containsIgnoreCase(_subjectSearchKeyword.toLowerCase())).toTypedArray()
    } else {
      return _teamModel.Activities.toTypedArray()
    }
  }

  property get StatusFilter(): StandardBeanFilter[] {
    var statusFilter = new ArrayList<StandardBeanFilter>()
    var statusNames = new TreeSet<String>(getActivities().toList().map(\elt -> elt.Status.DisplayName))
    for (statusName in statusNames) {
      var filter = new StandardBeanFilter(statusName, \x -> (x as Activity).Status.DisplayName == statusName)
      statusFilter.add(filter)
    }
    return statusFilter.toTypedArray()
  }

}