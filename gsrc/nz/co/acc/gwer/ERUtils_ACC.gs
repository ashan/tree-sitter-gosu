package nz.co.acc.gwer

uses gw.api.util.DateUtil
//uses nz.co.acc.erV2.businesstransfers.BusinessTransferController_ACC
uses org.joda.time.LocalDate

uses java.text.SimpleDateFormat


class ERUtils_ACC {

  private static var dateFormat = new SimpleDateFormat("yyyy-MM-dd")

  static property get CurrentLevyYear() : Integer {
    var systemTime = DateUtil.currentDate()
    var currentYear = systemTime.YearOfDate
    var cutOffDateString = currentYear + "-04-01"
    var cutOffDate = LocalDate.parse(cutOffDateString).toDate()
    var currentLevyYear = systemTime.YearOfDate
    if(systemTime.compareIgnoreTime(cutOffDate) >= 0) {
      currentLevyYear = currentLevyYear + 1
    }
    return currentLevyYear
  }

  static function getMemberLevyYearRange(startYear : int) : Integer[] {
    var levyYears = new ArrayList<Integer>()
    var currentLevyYear = ERUtils_ACC.CurrentLevyYear
    for(year in startYear .. currentLevyYear) {
      levyYears.add(year)
    }
    return levyYears.toTypedArray()
  }

  static property get AllLevyYears() : Integer[] {
    var levyYears = new ArrayList<Integer>()
    var currentLevyYear = ERUtils_ACC.CurrentLevyYear
    for(year in 2012 .. currentLevyYear) {
      levyYears.add(year)
    }
    return levyYears.toTypedArray()
  }

  static function getStartOfDate(date : Date) : Date {
    var year = date.YearOfDate
    var month = date.MonthOfYear
    var day = date.DayOfMonth
    return dateFormat.parse(year + "-" + month + "-" + day)
  }

  static function getEndOfDate(date : Date) : Date {
    var nextDate = date.addDays(1)
    return ERUtils_ACC.getStartOfDate(nextDate).addSeconds(-1)
  }

  static function getStartDateOfLevyYear(levyYear : Integer) : Date {
    assert levyYear != null
    var startDateString = (levyYear - 1) + "-04-01"
    return LocalDate.parse(startDateString).toDate()
  }

  static function getEndDateOfLevyYear(levyYear : Integer) : Date {
    assert levyYear != null
    var endDateString = levyYear + "-03-31"
    return LocalDate.parse(endDateString).toDate()
  }

  static function displayErMenuItem() : boolean {

    if (ScriptParameters.getParameterValue("ERAvailable_ACC") != true ) {
      return false
    }

    if( perm.System.viewerrunrequestacc or
      perm.System.createerrunrequestacc or
      perm.System.createrrecalculationrequestacc or
      perm.System.editerrunrequestacc or
      perm.System.viewerbusinessgroupacc or
      perm.System.createerbusinessgroupacc or
      perm.System.viewerbusinessgroupacc or
      perm.System.filtererbusinessgroupacc or
      perm.System.adderbusinessgroupmemberacc or
      perm.System.editerbusinessgroupmemberacc or
      perm.System.removeerbusinessgroupmemberacc or
      perm.System.createernewnonpayrollentityacc or
      perm.System.generategroupstructurelettersacc or
      perm.System.viewbusinessgroupsuppressionlistacc or
      perm.System.addbusinessgrouptosuppressionlistacc or
      perm.System.removebusinessgroupfromsuppressionlistacc or
      perm.System.viewerfileuploadscc or
      perm.System.viewuploaderfileacc or
      perm.System.viewruninformationacc or
      perm.System.requestrunextractacc or
      perm.System.downloadrunextractacc or
      perm.System.viewbusinesstransfersacc or
      perm.System.createbusinesstransfersacc or
      perm.System.editbusinesstransfersacc or
      perm.System.approvebusinesstransfersacc  ) {
      return true
    }

    return false
  }

//  static function canViewCreateTransfer(businessTransferController : BusinessTransferController_ACC) : boolean {
//
//    if (perm.System.createbusinesstransfersacc) {
//      return true
//    }
//
//    if (perm.System.viewbusinesstransfersacc and businessTransferController.WorkingTransferDataObject==null) {
//      return false
//    }
//
//    if (perm.System.viewbusinesstransfersacc and businessTransferController.WorkingTransferDataObject.TransferId!=0) {
//      return true
//    }
//
//    return false
//  }

}






