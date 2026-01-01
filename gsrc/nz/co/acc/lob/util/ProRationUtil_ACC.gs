package nz.co.acc.lob.util

uses gw.util.Pair
uses nz.co.acc.lob.common.DateUtil_ACC

uses gw.surepath.suite.integration.logging.StructuredLogger
uses typekey.*
uses typekey.Job

uses java.lang.invoke.MethodHandles
uses java.math.BigDecimal
uses java.math.RoundingMode
uses java.text.SimpleDateFormat
uses java.util.concurrent.TimeUnit

/**
 * Created by ManubaF on 29/05/2017.
 */
class ProRationUtil_ACC {
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())

  static function calculateProRateFactor(effectiveDate:Date, expirationDate:Date, referenceEffectiveDate : Date, referenceEndDate : Date, policyExpirationDate:Date) : BigDecimal {
    var proRataFactor : BigDecimal = 0
    var modifierFullDate : double = 0
    var policyFullYearDate : double = 0
    expirationDate = expirationDate.trimToMidnight()
    referenceEndDate = referenceEndDate.trimToMidnight()
    policyExpirationDate = policyExpirationDate.trimToMidnight()
    // Below are the scenarios for pro-ration
    // Scenario 1 - Modifier effective date is before or the same as the policy effective and the modifier expiration date is
    //              after or same as the policy expiration date. The rate factor is 1.
    if((DateUtil_ACC.isBeforeDay(effectiveDate, referenceEffectiveDate) or DateUtil_ACC.isSameDay(referenceEffectiveDate, effectiveDate)) and
        (DateUtil_ACC.isAfterDay(expirationDate, referenceEndDate) or DateUtil_ACC.isSameDay(referenceEndDate, expirationDate)) or
        (effectiveDate == null and expirationDate == null)) {
      proRataFactor = 1
    }
    // Scenario 2 - Policy effective date is before or the same day as the policy effective and the modifier expiration date is
    //              after or same as the policy expiration date. The rate factor is calculation is show below.
    else if ((DateUtil_ACC.isBeforeDay(referenceEffectiveDate, effectiveDate) or DateUtil_ACC.isSameDay(referenceEffectiveDate, effectiveDate)) and
        (DateUtil_ACC.isBeforeDay(expirationDate, referenceEndDate) or DateUtil_ACC.isSameDay(expirationDate, referenceEndDate))) {

      modifierFullDate = TimeUnit.MILLISECONDS.toDays(expirationDate.getTime()) - TimeUnit.MILLISECONDS.toDays(effectiveDate.getTime())
      modifierFullDate = modifierFullDate + adjustToIncludeEndDate(expirationDate, policyExpirationDate)

      policyFullYearDate = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(referenceEffectiveDate.getTime())
      policyFullYearDate = policyFullYearDate + adjustToIncludeEndDate(referenceEndDate, policyExpirationDate)

      proRataFactor = modifierFullDate / policyFullYearDate
    }
    // Scenario 3 - If the policy effective date is before or the same day as the modifier effective date and the modifier expiration date is
    //              before or same as the policy expiration date. The rate factor is calculation is show below.
    //              modifierNumberOfDays = policy expiration date - modifier effective date
    //              policyNumberOfDays = policy expiration date - policy effective date
    else if ( DateUtil_ACC.isBeforeDay(referenceEffectiveDate, effectiveDate) and
        (DateUtil_ACC.isBeforeDay(expirationDate, referenceEffectiveDate) and
            DateUtil_ACC.isAfterDay(expirationDate, referenceEndDate)) ) {
      modifierFullDate = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(effectiveDate.getTime())
      policyFullYearDate = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(referenceEffectiveDate.getTime())
      proRataFactor = modifierFullDate / policyFullYearDate
    }
    // Scenario 4 - Modifier effective date is before the or the same day as the policy effective date and the modifier expiration date is
    //              before or same as the policy expiration date. The rate factor is calculation is show below.
    //              modifierNumberOfDays = modifier effective date - policy effective date
    //              policyNumberOfDays = expiration effective date - policy effective date
    else if( DateUtil_ACC.isBeforeDay(effectiveDate, referenceEffectiveDate) and
             ((DateUtil_ACC.isBeforeDay(expirationDate, referenceEndDate) or DateUtil_ACC.isSameDay(expirationDate, referenceEndDate)) and
             (DateUtil_ACC.isAfterDay(expirationDate, referenceEffectiveDate) or DateUtil_ACC.isSameDay(expirationDate, referenceEffectiveDate))) ) {
      modifierFullDate = TimeUnit.MILLISECONDS.toDays(expirationDate.getTime()) - TimeUnit.MILLISECONDS.toDays(referenceEffectiveDate.getTime()) + 1
      policyFullYearDate = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(referenceEffectiveDate.getTime())
      proRataFactor = (modifierFullDate / policyFullYearDate)
    }
    // Scenario 5 - Modifier effective date is AFTER the policy effective date and the modifier expiration date is
    //              before or same as the policy expiration date. The rate factor is calculation is show below.
    //              modifierNumberOfDays = modifier effective date - policy effective date
    //              policyNumberOfDays = expiration effective date - policy effective date
    else if(DateUtil_ACC.isAfterDay(effectiveDate, referenceEffectiveDate) and
        (DateUtil_ACC.isBeforeDay(effectiveDate, referenceEndDate) and DateUtil_ACC.isAfterDay(expirationDate, referenceEffectiveDate)) ) {
      modifierFullDate = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(effectiveDate.getTime())
      policyFullYearDate = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(referenceEffectiveDate.getTime())
      proRataFactor = (modifierFullDate / policyFullYearDate)
    }

    _logger.info("calculateProRataFactor "+ modifierFullDate + ", " + policyFullYearDate)
    return proRataFactor.setScale(4, RoundingMode.HALF_UP)
  }

  static function calculateAppliedDays(effectiveDate:Date, expirationDate:Date, referenceEffectiveDate : Date, referenceEndDate : Date, policyExpirationDate:Date) : Pair<BigDecimal, BigDecimal> {
    var policyActiveDays = BigDecimal.ZERO
    var modifierFullDate = BigDecimal.ZERO
    expirationDate = expirationDate.trimToMidnight()
    referenceEndDate = referenceEndDate.trimToMidnight()
    policyExpirationDate = policyExpirationDate.trimToMidnight()
    // Below are the scenarios for pro-ration
    // Scenario 1 - Modifier effective date is before or the same as the policy effective and the modifier expiration date is
    //              after or same as the policy expiration date. The rate factor is 1.
    if((DateUtil_ACC.isBeforeDay(effectiveDate, referenceEffectiveDate) or DateUtil_ACC.isSameDay(referenceEffectiveDate, effectiveDate)) and
        (DateUtil_ACC.isAfterDay(expirationDate, referenceEndDate) or DateUtil_ACC.isSameDay(referenceEndDate, expirationDate)) or
        (effectiveDate == null and expirationDate == null)) {
      if(DateUtil_ACC.isAfterDay(expirationDate, referenceEndDate) and DateUtil_ACC.isBeforeDay(effectiveDate, referenceEffectiveDate)) {
        modifierFullDate = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(referenceEffectiveDate.getTime())
        if(DateUtil_ACC.isAfterDay(expirationDate, referenceEndDate)) {
          modifierFullDate = modifierFullDate.add(1)
        }
      } else if(DateUtil_ACC.isAfterDay(expirationDate, referenceEndDate) and (DateUtil_ACC.isBeforeDay(effectiveDate, referenceEffectiveDate) or
                                                                               DateUtil_ACC.isSameDay(effectiveDate, referenceEffectiveDate))) {
        modifierFullDate = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(referenceEffectiveDate.getTime())
        if(DateUtil_ACC.isAfterDay(expirationDate, referenceEndDate)) {
          modifierFullDate = modifierFullDate.add(1)
        }
      } else {
        modifierFullDate = TimeUnit.MILLISECONDS.toDays(expirationDate.getTime()) - TimeUnit.MILLISECONDS.toDays(effectiveDate.getTime())
      }

      policyActiveDays = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(referenceEffectiveDate.getTime())
      if(DateUtil_ACC.isBeforeDay(referenceEndDate, policyExpirationDate)){
        policyActiveDays = policyActiveDays + 1
      }
    }
    // Scenario 2 - Policy effective date is before or the same day as the policy effective and the modifier expiration date is
    //              after or same as the policy expiration date. The rate factor is calculation is show below.
    else if ((DateUtil_ACC.isBeforeDay(referenceEffectiveDate, effectiveDate) or DateUtil_ACC.isSameDay(referenceEffectiveDate, effectiveDate)) and
        (DateUtil_ACC.isBeforeDay(expirationDate, referenceEndDate) or DateUtil_ACC.isSameDay(expirationDate, referenceEndDate))) {
      modifierFullDate = TimeUnit.MILLISECONDS.toDays(expirationDate.getTime()) - TimeUnit.MILLISECONDS.toDays(effectiveDate.getTime())
      modifierFullDate = modifierFullDate + adjustToIncludeEndDate(expirationDate, policyExpirationDate)

      policyActiveDays = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(referenceEffectiveDate.getTime())
      policyActiveDays = policyActiveDays + adjustToIncludeEndDate(referenceEndDate, policyExpirationDate)
    }
    // Scenario 3 - If the policy effective date is before or the same day as the modifier effective date and the modifier expiration date is
    //              before or same as the policy expiration date. The rate factor is calculation is show below.
    //              modifierNumberOfDays = policy expiration date - modifier effective date
    //              policyNumberOfDays = policy expiration date - policy effective date
    else if ( DateUtil_ACC.isBeforeDay(referenceEffectiveDate, effectiveDate) and
        (DateUtil_ACC.isBeforeDay(expirationDate, referenceEffectiveDate) and
            DateUtil_ACC.isAfterDay(expirationDate, referenceEndDate)) ) {
      modifierFullDate = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(effectiveDate.getTime())
      policyActiveDays = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(referenceEffectiveDate.getTime())
    }
    // Scenario 4 - Modifier effective date is before the or the same day as the policy effective date and the modifier expiration date is
    //              before or same as the policy expiration date. The rate factor is calculation is show below.
    //              modifierNumberOfDays = modifier effective date - policy effective date
    //              policyNumberOfDays = expiration effective date - policy effective date
    else if( DateUtil_ACC.isBeforeDay(effectiveDate, referenceEffectiveDate) and
        ((DateUtil_ACC.isBeforeDay(expirationDate, referenceEndDate) or DateUtil_ACC.isSameDay(expirationDate, referenceEndDate)) and
            (DateUtil_ACC.isAfterDay(expirationDate, referenceEffectiveDate) or DateUtil_ACC.isSameDay(expirationDate, referenceEffectiveDate))) ) {
      modifierFullDate = TimeUnit.MILLISECONDS.toDays(expirationDate.getTime()) - TimeUnit.MILLISECONDS.toDays(referenceEffectiveDate.getTime()) + 1
      policyActiveDays = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(referenceEffectiveDate.getTime())
      if(DateUtil_ACC.isBeforeDay(referenceEndDate, policyExpirationDate)){
        policyActiveDays = policyActiveDays + 1
      }
    }
    // Scenario 5 - Modifier effective date is AFTER the policy effective date and the modifier expiration date is
    //              before or same as the policy expiration date. The rate factor is calculation is show below.
    //              modifierNumberOfDays = modifier effective date - policy effective date
    //              policyNumberOfDays = expiration effective date - policy effective date
    else if(DateUtil_ACC.isAfterDay(effectiveDate, referenceEffectiveDate) and
        (DateUtil_ACC.isBeforeDay(effectiveDate, referenceEndDate) and DateUtil_ACC.isAfterDay(expirationDate, referenceEffectiveDate)) ) {
      modifierFullDate = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(effectiveDate.getTime())
      if(DateUtil_ACC.isAfterDay(expirationDate, referenceEndDate)) {
        modifierFullDate = modifierFullDate.add(1)
      }
      policyActiveDays = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(referenceEffectiveDate.getTime())
      if(DateUtil_ACC.isBeforeDay(referenceEndDate, policyExpirationDate)){
        policyActiveDays = policyActiveDays + 1
      }
    } else {
      policyActiveDays = TimeUnit.MILLISECONDS.toDays(referenceEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(referenceEffectiveDate.getTime())
      if(DateUtil_ACC.isBeforeDay(referenceEndDate, policyExpirationDate)){
        policyActiveDays = policyActiveDays + 1
      }
    }

    return new Pair<BigDecimal, BigDecimal>(modifierFullDate, policyActiveDays)
  }

  static protected function adjustToIncludeEndDate(expirationDate:Date, policyExpirationDate:Date) : int {
    if(policyExpirationDate != null and DateUtil_ACC.isBeforeDay(expirationDate, policyExpirationDate)) {
      return 1
    }
    return 0
  }

  static function getProRataFactor(policyPeriod:PolicyPeriod) : BigDecimal {
    var proRataFactor : BigDecimal = 0
    var sdf = new SimpleDateFormat("dd/MM/yyyy")

    var derivedDateValue = policyPeriod.PeriodEnd.MonthOfYear * 100 + policyPeriod.PeriodEnd.DayOfMonth

    var endDate = sdf.parse("1/4/" + (policyPeriod.PeriodEnd.YearOfDate + 1))
    var startDate = sdf.parse("1/4/" + policyPeriod.PeriodEnd.YearOfDate)
    if(derivedDateValue >= 101 and derivedDateValue <= 401) {
      endDate = sdf.parse("1/4/" + policyPeriod.PeriodEnd.YearOfDate)
      startDate = sdf.parse("1/4/"+ (policyPeriod.PeriodEnd.YearOfDate - 1))
    }

    var policyEndDate = policyPeriod.PeriodEnd
    var policyStartDate = policyPeriod.PeriodStart
    if (policyPeriod.Job.Subtype == Job.TC_CANCELLATION or policyPeriod.CancellationDate != null) {
      policyEndDate = policyPeriod.CancellationDate
    } else if (policyPeriod.Job.Subtype == Job.TC_AUDIT) {
      policyEndDate = policyPeriod.Audit.AuditInformation.AuditPeriodEndDate
      policyStartDate = policyPeriod.Audit.AuditInformation.AuditPeriodStartDate
    }

    var policyPeriodDays : double = TimeUnit.MILLISECONDS.toDays(policyEndDate.getTime()) - TimeUnit.MILLISECONDS.toDays(policyStartDate.getTime())
    var fullYearDays :double = TimeUnit.MILLISECONDS.toDays(endDate.getTime()) - TimeUnit.MILLISECONDS.toDays(startDate.getTime())
    proRataFactor = policyPeriodDays / fullYearDays
    return proRataFactor.setScale(4, RoundingMode.HALF_UP)
  }
}