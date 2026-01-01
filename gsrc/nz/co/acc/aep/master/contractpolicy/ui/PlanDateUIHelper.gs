package nz.co.acc.aep.master.contractpolicy.ui

uses gw.api.util.DateUtil

/**
 * Created by madhav.mandayam on 30-May-17.
 */
class PlanDateUIHelper {
  private var _period : PolicyPeriod
  private var _term : PolicyTerm
  private var _planDateEditable : boolean as readonly PlanDateEditable
  private var _endDateRangeStart: Date

  construct(period : PolicyPeriod) {
    _period = period
    _term = period.PolicyTerm
    _planDateEditable = false
    calculatePlanDates()
  }

  property get PlanStartDate() : Date {
    return _term.AEPPlanStartDate_ACC
  }

  property get PlanEndDate() : Date {
    return _term.AEPPlanEndDate_ACC
  }

  property set PlanEndDate(d : Date) {
    _term.AEPPlanEndDate_ACC = d
  }

  private function calculatePlanDates() {
    if (!_period.OpenForEdit)
      return

    var job = _period.Job

    if (!(job typeis Submission or job typeis Renewal)) {
      return
    }

    var periodStartDate : Date
    if (_period.PolicyTerm.AEPMidTermStartDate_ACC != null)
      periodStartDate = _period.PolicyTerm.AEPMidTermStartDate_ACC
    else
      periodStartDate = _period.PeriodStart

    if (job typeis Renewal) {
      var previousTermPlanStartDate = _period.BasedOn.PolicyTerm.AEPPlanStartDate_ACC
      var previousTermPlanEndDate = _period.BasedOn.PolicyTerm.AEPPlanEndDate_ACC

      if  (previousTermPlanStartDate != null and previousTermPlanEndDate != null) {
        if (DateUtil.differenceInDays(periodStartDate, previousTermPlanEndDate) < 365) {
          setPlanDatesAndEditability(periodStartDate, _period.PeriodEnd, true)
        }
        else {
          setPlanDatesAndEditability(previousTermPlanStartDate, previousTermPlanEndDate, false)
        }
        return
      }
    }

    if (DateUtil.differenceInDays(periodStartDate, _period.PeriodEnd) < 365) {
      setPlanDatesAndEditability(periodStartDate, _period.PeriodEnd.addYears(1), true)
      return
    }

    setPlanDatesAndEditability(periodStartDate, _period.PeriodEnd, true)
  }

  private function setPlanDatesAndEditability(startDate : Date, endDate : Date, editable : boolean) {
    _endDateRangeStart = endDate

    if (!(_period.Job typeis Renewal))
      _planDateEditable = false
    else
      _planDateEditable = editable

    if (_term.AEPPlanEndDate_ACC != null)
      return

    _term.AEPPlanStartDate_ACC = startDate
    _term.AEPPlanEndDate_ACC = endDate
  }

  property get PossiblePlanEndDates() : List<Date> {
    var planEndDatesList = new ArrayList<Date>()
    if (!_planDateEditable) {
      planEndDatesList.add(_term.AEPPlanEndDate_ACC)
      return planEndDatesList
    }

    var planRangeEndDate = _endDateRangeStart.addYears(2)
    var endDate = _endDateRangeStart
    while(endDate <= planRangeEndDate) {
      planEndDatesList.add(endDate)
      endDate = endDate.addYears(1)
    }

    return planEndDatesList
  }

  public static function initializePlanDates(period : PolicyPeriod) {
    var uiHelper = new PlanDateUIHelper(period)
  }
}