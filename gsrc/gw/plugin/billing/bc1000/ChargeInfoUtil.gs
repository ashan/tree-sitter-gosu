package gw.plugin.billing.bc1000

uses gw.api.locale.DisplayKey
uses gw.api.system.PCConfigParameters
uses gw.billing.Charge
uses gw.billing.ChargeBreakdownCategory
uses gw.billing.ChargeBreakdownCategoryLookup
uses gw.billing.ChargeBreakdownTranslation
uses gw.billing.ChargeCollector
uses gw.pl.util.BigDecimalUtil
uses wsi.remote.gw.webservice.bc.bc1000.entity.anonymous.elements.BreakdownCategoryInfo_TranslatedCriteriaNames
uses wsi.remote.gw.webservice.bc.bc1000.entity.types.complex.ChargeInfo
uses wsi.remote.gw.webservice.bc.bc1000.entity.anonymous.elements.BreakdownItemInfo_Categories
uses wsi.remote.gw.webservice.bc.bc1000.entity.anonymous.elements.ChargeInfo_BreakdownItemInfos
uses wsi.remote.gw.webservice.bc.bc1000.entity.anonymous.elements.BreakdownCategoryInfo_TranslatedCategoryNames

uses java.math.BigDecimal

/**
 * External helper class for returning Charges and Installments
 *
 * @see gw.webservice.pc.bc1000.BillingInstructionInfoEnhancement
 */

@Export
class ChargeInfoUtil {
  /**
   * Create ChargeInfos array from all the CHARGED transactions of the period.
   * <p>
   * Example of UNCHARGED transactions are premiums created by a submission with reporting plan.
   * In that case, only taxes transactions are charged.
   *
   * @param period Policy Period that contains the ChargeInfos
   * @return Array of ChargeInfo items that are charged
   */
  static function getChargeInfos(period : PolicyPeriod) : ChargeInfo[] {
    return getChargeInfos(period.AllTransactions.where(\t -> t.Charged), null)
  }

  /**
   * Create ChargeInfos array from all the INSTALLMENT transactions of the period.
   *
   * @param period Policy Period that contains the ChargeInfos
   * @return Array of ChargeInfo items that are not charged
   */
  static function getInstallmentInfos(period : PolicyPeriod) : ChargeInfo[] {
    return getChargeInfos(period.AllTransactions.where(\t : Transaction -> t.Written), null)
  }

  internal static function getChargeInfos(transactions : List<Transaction>, testingLookup : ChargeBreakdownCategoryLookup) : ChargeInfo[] {
    return getCharges(transactions, testingLookup).map(\detail -> makeChargeInfo(detail)).toTypedArray()
  }

  static function getCharges(transactions : List<Transaction>, testingLookup : ChargeBreakdownCategoryLookup) : Collection<Charge> {
    return ChargeCollector.getCharges(transactions, testingLookup);
  }

  internal static function makeChargeInfo(charge : Charge) : ChargeInfo {
    var apiCharge = new ChargeInfo() {
      :ChargePatternCode = charge.ChargePattern.Code,
      :ChargeGroup = charge.ChargeGroup,
      :WrittenDate = charge.WrittenDate.XmlDateTime,
      :Amount = charge.TotalAmount.toString()
    }
    var breakDownAmountTotal = new BigDecimal("0")
    var breakdownAmounts = {}
    foreach (criteriaKey in charge.getCategories()) {
      var breakdownAmount = charge.getBreakdownAmount(criteriaKey)
      breakdownAmounts.add(breakdownAmount)
      breakDownAmountTotal = breakDownAmountTotal.add(breakdownAmount)
      var apiCriterion : ChargeInfo_BreakdownItemInfos
      if (PCConfigParameters.EnableChargeBreakdownCommissionable.Value) {
        apiCriterion = new ChargeInfo_BreakdownItemInfos() {
          :Amount = breakdownAmount.toString(),
//          :Commissionable = charge.getBreakdownCommissionableValue(criteriaKey),
          :Description = criteriaKey.Keys.length < 2 ? DisplayKey.get("ChargeInfo.Breakdown.Description.Other") : "" // either we have just RateAmountType, or nothing (in the case where we have a "remainder" breakdown when we have a package policy with both an itemizing line and a non-itemizing line
        }
      } else {
        apiCriterion = new ChargeInfo_BreakdownItemInfos() {
          :Amount = breakdownAmount.toString(),
          :Description = criteriaKey.Keys.length < 2 ? DisplayKey.get("ChargeInfo.Breakdown.Description.Other") : "" // either we have just RateAmountType, or nothing (in the case where we have a "remainder" breakdown when we have a package policy with both an itemizing line and a non-itemizing line
        }
      }
      for (key in criteriaKey.Keys) {
        var category = key as ChargeBreakdownCategory
        var apiCategory = new BreakdownItemInfo_Categories() {
          :CriteriaCode = category.Criterion.Code,
          :CriteriaName = category.Criterion.Name,
          :CategoryIdentifier = category.Identifier,
          :CategoryName = category.Name
        }
        addTranslatedCriteriaNames(category.Criterion.Translations, apiCategory);
        addTranslatedCategoryNames(category.Translations, apiCategory);
        apiCriterion.Categories.add(apiCategory)
      }
      apiCharge.BreakdownItemInfos.add(apiCriterion)
    }
    if (not (BigDecimalUtil.isEqual(breakDownAmountTotal, BigDecimal.ZERO) or BigDecimalUtil.isEqual(breakDownAmountTotal, charge.TotalAmount))) {  // either we have no breakdowns or else it should all add up
      throw new IllegalStateException("A charge's total amount (" + charge.TotalAmount
          + ") should equal the sum of all of its breakdowns (" + breakDownAmountTotal
          + ").\nBreakdowns: " + breakdownAmounts.join(", "))
    }
    return apiCharge
  }

  private static function addTranslatedCriteriaNames(criterionTranslations : List<ChargeBreakdownTranslation>, apiCategory : BreakdownItemInfo_Categories) {
    for (criterionTranslation in criterionTranslations) {
      var apiTranslation = new BreakdownCategoryInfo_TranslatedCriteriaNames() {
        :LanguageCode = criterionTranslation.LanguageType.Code,
        :Translation = criterionTranslation.Value
      }
      apiCategory.TranslatedCriteriaNames.add(apiTranslation)
    }
  }

  private static function addTranslatedCategoryNames(categoryTranslations : List<ChargeBreakdownTranslation>, apiCategory : BreakdownItemInfo_Categories) {
    for (categoryTranslation in categoryTranslations) {
      var apiTranslation = new BreakdownCategoryInfo_TranslatedCategoryNames() {
        :LanguageCode = categoryTranslation.LanguageType.Code,
        :Translation = categoryTranslation.Value
      }
      apiCategory.TranslatedCategoryNames.add(apiTranslation)
    }
  }
}
