package nz.co.acc.lob.util

uses entity.*
uses nz.co.acc.lob.common.DateUtil_ACC

/**
 * Created by ManubaF on 9/05/2017.
 */
class ModifiersUtil_ACC {

  public static function updateModifiersBasedOnKeyword(searchString:String, exactMatch:boolean, policyPeriod:PolicyPeriod) {
    var modifiers = getModifiers(policyPeriod)
    var discountAppliedModifiers = modifiers.where(\elt -> elt.Pattern.CodeIdentifier.contains(searchString) == exactMatch)
    for (modifier in discountAppliedModifiers) {
      if (modifier.Pattern.ModifierDataType == ModifierDataType.TC_BOOLEAN) {
        modifier.BooleanModifier = false
      }
    }
  }

  public static function syncModifiers(policyPeriod:PolicyPeriod) {
    if(policyPeriod.EMPWPCLineExists) {
      policyPeriod.EMPWPCLine.syncModifiers()
    } else if(policyPeriod.CWPSLineExists) {
      policyPeriod.CWPSLine.syncModifiers()
    } else {
      policyPeriod.EffectiveDatedFields.syncModifiers()
    }
  }

  public static function getModifiers(policyPeriod:PolicyPeriod) : Modifier[] {
    var modifiers : Modifier[]

    if(policyPeriod.EMPWPCLineExists) {
      modifiers = policyPeriod.EMPWPCLine.EMPLineModifiers
    } else if(policyPeriod.CWPSLineExists) {
      modifiers = policyPeriod.CWPSLine.SHCLineModifiers
    } else {
      modifiers = policyPeriod.EffectiveDatedFields.Modifiers
    }

    return modifiers
  }

  public static function getSelectedDiscountAppliedModifier(policyPeriod:PolicyPeriod) : DiscountsAppliedSelection_ACC {
    if(hasSelectedModifier("WSD", policyPeriod)) {
      return DiscountsAppliedSelection_ACC.TC_WSD
    } else if(hasSelectedModifier("WSMP", policyPeriod)) {
      return DiscountsAppliedSelection_ACC.TC_WSMP
    }
    return null
  }

  public static function getAllDiscountsAppliedModifiers(policyPeriod : PolicyPeriod) : Modifier[] {
    var modifiers : List<Modifier> = new ArrayList<Modifier>()
    modifiers.addAll(getModifiers(policyPeriod).where(\elt -> elt.Pattern.CodeIdentifier.contains("WSMP")).toList())
    modifiers.add(getModifiers(policyPeriod).where(\elt -> elt.Pattern.CodeIdentifier.contains("WSD")).first())
    return modifiers.toTypedArray()
  }

  public static function getSelectedExperienceRating(policyPeriod : PolicyPeriod) : ExpRatingProgramme_ACC {
    var modifier = getModifiers(policyPeriod).where(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgramme")).first()
    return ExpRatingProgramme_ACC.get(modifier.TypeKeyModifier)
  }

  public static function setSelectedExperienceRating(policyPeriod:PolicyPeriod, selectedRating : ExpRatingProgramme_ACC ) {
    var modifiers = getModifiers(policyPeriod)
    if(modifiers != null) {
      var modifier = modifiers?.where(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgramme"))?.first()
      if(modifier != null) {
        modifier?.TypeKeyModifier = selectedRating.Code
        if(modifier.TypeKeyModifier == null) {
          policyPeriod.PolicyTerm.ERStatus_ACC = ERStatus_ACC.TC_ER_MODIFIER_PENDING
        } else {
          policyPeriod.PolicyTerm.ERStatus_ACC = ERStatus_ACC.TC_LE_PENDING
        }
      }
    }
  }

  public static function setSelectedExperienceRating(modifiers : Modifier[], policyTerm : PolicyTerm, selectedRating : ExpRatingProgramme_ACC ) {
    if(modifiers != null) {
      var modifier = modifiers?.where(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgramme"))?.first()
      if(modifier != null) {
        modifier?.TypeKeyModifier = selectedRating.Code
        if(modifier.TypeKeyModifier == null) {
          policyTerm.ERStatus_ACC = ERStatus_ACC.TC_ER_MODIFIER_PENDING
        } else {
          policyTerm.ERStatus_ACC = ERStatus_ACC.TC_LE_PENDING
        }
      }
    }
  }

  public static function getExperienceRatingModRateModifier(modifiers : Modifier[]) : Modifier {
    return modifiers.where(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeModRate")).first()
  }

  public static function getExperienceRatingModRateModifier(policyPeriod : PolicyPeriod) : Modifier {
    return getModifiers(policyPeriod).where(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeModRate")).first()
  }

  public static function getExperienceRatingRunNumberModifier(modifiers : Modifier[]) : Modifier {
    return modifiers.where(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeRunNumber")).first()
  }

  public static function getExperienceRatingRunNumberModifier(policyPeriod : PolicyPeriod) : Modifier {
    return getModifiers(policyPeriod).where(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeRunNumber")).first()
  }

  public static function getExperienceRatingManualRequestModifier(policyPeriod : PolicyPeriod) : Modifier {
    return getModifiers(policyPeriod).where(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeManualRequest")).first()
  }

  public static function getExperienceRatingManualRequestModifier(modifiers : Modifier[]) : Modifier {
    return modifiers.where(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeManualRequest")).first()
  }

  public static function getAllExperienceRatingModifiers(policyPeriod : PolicyPeriod) : Modifier[] {
    return getModifiers(policyPeriod).where(\elt -> elt.Pattern.CodeIdentifier.contains("ExpRatingProgramme"))
  }

  public static function getExperienceRatingModifiers(policyPeriod : PolicyPeriod) : Modifier[] {
    return getModifiers(policyPeriod).where(\elt -> elt.Pattern.CodeIdentifier.contains("ExpRatingProgramme") and
                                                    !elt.Pattern.CodeIdentifier.contains("ExpRatingProgrammeCalcTypeCode") and
                                                    !elt.Pattern.CodeIdentifier.contains("ExpRatingProgrammeRunNumber") and
                                                    !elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgramme"))
  }

  public static function getExperienceRatingCalcTypeModifiers(modifiers : Modifier[]) : Modifier {
    return modifiers.where(\elt -> elt.Pattern.CodeIdentifier.contains("ExpRatingProgrammeCalcTypeCode")).first()
  }

  public static function getExperienceRatingCalcTypeModifiers(policyPeriod : PolicyPeriod) : Modifier {
    return getModifiers(policyPeriod).where(\elt -> elt.Pattern.CodeIdentifier.contains("ExpRatingProgrammeCalcTypeCode")).first()
  }

  public static function getExperienceRatingModifiers(modifiers : Modifier[]) : Modifier[] {
    return modifiers.where(\elt -> elt.Pattern.CodeIdentifier.contains("ExpRatingProgramme"))
  }

  public static function clearExpRatingRunNumberValue(policyPeriod : PolicyPeriod) {
    getModifiers(policyPeriod).where(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeRunNumber"))?.first()?.RateModifier = null
  }

  public static function clearExpRatingRunManualRequest(policyPeriod : PolicyPeriod) {
    getModifiers(policyPeriod).where(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeManualRequest")).first()?.BooleanModifier = false
  }

  public static function hasSelectedModifier(searchString:String, policyPeriod:PolicyPeriod) : boolean {
    var discountModifiers = getModifiers(policyPeriod).where(\elt -> elt.Pattern.CodeIdentifier.contains(searchString))
    for(modifier in discountModifiers) {
      if(modifier.BooleanModifier) {
        return true
      }
    }
    return false
  }

  public static function clearNonApplicableModifierPeriods(policyPeriod:PolicyPeriod) {
    var policyModifiers = getModifiers(policyPeriod)
    for(modifier in policyModifiers) {
      if(modifier.StartEndDate.EffectiveExpirationDate.length > 0) {
        var effectiveDates = modifier.StartEndDate.EffectiveExpirationDate
        if(effectiveDates != null and effectiveDates.length > 0) {
          for (modifierDate in effectiveDates) {
            if(DateUtil_ACC.isBeforeDay(modifierDate.expirationDate_ACC, policyPeriod.PeriodStart)) {
              modifier.StartEndDate.removeFromEffectiveExpirationDate(modifierDate)
            }
          }
        }
      }

      if(modifier.StartEndDate.EffectiveExpirationDate.IsEmpty and modifier.DataType == ModifierDataType.TC_BOOLEAN) {
        modifier.BooleanModifier = false
      }
    }
  }

  public static function clearERModifiers(policyPeriod:PolicyPeriod) {
    nz.co.acc.lob.util.ModifiersUtil_ACC.setSelectedExperienceRating(policyPeriod, null)
    nz.co.acc.lob.util.ModifiersUtil_ACC.clearExpRatingRunNumberValue(policyPeriod)
    nz.co.acc.lob.util.ModifiersUtil_ACC.getExperienceRatingModRateModifier(policyPeriod).RateModifier = null
    nz.co.acc.lob.util.ModifiersUtil_ACC.clearExpRatingRunManualRequest(policyPeriod)
  }

  public static function removeERModifiers(policyPeriod : PolicyPeriod){

    for (eachLinePattern in policyPeriod.LinePatterns) {
      var theLine = policyPeriod.getLine(eachLinePattern)
      switch (typeof theLine) {
        case productmodel.INDCPXLine:
        case productmodel.INDCoPLine:
          policyPeriod.EffectiveDatedFields.ProductModifiers = policyPeriod.EffectiveDatedFields.ProductModifiers.where(\elt ->
              !elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgramme") and
                  !elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeRunNumber") and
                  !elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeModRate") and
                  !elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeManualRequest"))
          break
        case productmodel.EMPWPCLine:
          policyPeriod.EMPWPCLine.EMPLineModifiers = policyPeriod.EMPWPCLine.EMPLineModifiers.where(\elt ->
              !elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgramme") and
                  !elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeRunNumber") and
                  !elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeModRate") and
                  !elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeManualRequest"))
          break
        case productmodel.CWPSLine:
          policyPeriod.CWPSLine.SHCLineModifiers = policyPeriod.CWPSLine.SHCLineModifiers.where(\elt ->
              !elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgramme") and
                  !elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeRunNumber") and
                  !elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeModRate") and
                  !elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeManualRequest"))
      }
    }
  }
}
