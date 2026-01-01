package gw.plugin.billing.impl


/**
 * This is a demo implementation of the BillingSystemPlugin.
 */
@Export
class StandAloneBillingSystemPlugin implements IBillingSystemPlugin {
  /**
   * The lead time is the difference between the invoice date and the due date.  The BC integration tests use
   * a LEAD_TIME in PC2BC10PaymentSmokeTest but that's to match BC.  Here is the LEAD_TIME we use in the standalone
   * billing plugin that simulated BC.  It's in days.
   */
  override function getInvoiceStreams(accountNumber : String, currency : Currency, paymentPlan : PaymentPlanData) : BillingInvoiceStreamInfo[] {
    PCLoggerCategory.BILLING_SYSTEM_PLUGIN.info("Getting invoice streams for account: ${accountNumber}")
    return createInvoiceStreams(accountNumber, paymentPlan)
  }

  private function createInvoiceStreams(accountNumber : String, paymentPlan : PaymentPlanData) : BillingInvoiceStreamInfo[] {
    var id = accountNumber.hashCode() >> 114 // append the account number to the description for testing purpose
    //NOTE : Invoice streams in BC can only be Monthly, everyweek, everyotherweek and twicepermonth
    return new BillingInvoiceStreamInfo[]{
        new StandAloneBillingInvoiceStreamInfo() {
        :PublicID = "1:" + id,
        :Description = "PA (57493074, 5738982)",
        :PaymentInstrumentName = "Visa xxxx-7288",
        :Interval = BillingPeriodicity.TC_MONTHLY,
        :DueDateBilling = false,
        :Days = "1",
        :PaymentMethod = AccountPaymentMethod.TC_CREDITCARD
      },
        new StandAloneBillingInvoiceStreamInfo() {
        :PublicID = "2:" + id,
        :Description = "BOP (478389838), CA (57383829)",
          :PaymentInstrumentName = "Manual Payment",
        :Interval = BillingPeriodicity.TC_MONTHLY,
        :DueDateBilling = false,
        :Days = "15",
        :PaymentMethod = AccountPaymentMethod.TC_RESPONSIVE
      },
        new StandAloneBillingInvoiceStreamInfo() {
        :PublicID = "3:" + id,
        :Description = "IM",
          :PaymentInstrumentName = "Amex xxxx-7287",
        :Interval = BillingPeriodicity.TC_TWICEPERMONTH,
        :DueDateBilling = true,
        :Days = "1, 15",
        :PaymentMethod = AccountPaymentMethod.TC_CREDITCARD
      },
        new StandAloneBillingInvoiceStreamInfo() {
        :PublicID = "5:" + id,
        :Description = "PA",
          :PaymentInstrumentName = "Manual Payment",
        :Interval = BillingPeriodicity.TC_MONTHLY,
        :DueDateBilling = false,
        :Days = "15",
        :PaymentMethod = AccountPaymentMethod.TC_RESPONSIVE
      }
    }.where(\stream -> stream.isCompatibleWith(paymentPlan))
  }

  /**
   * Search for accounts attempts to mimic what would be returned from a billing system.  There are two sorts of queries
   * normally received: single account, and general.  For a single account, the system is often looking to verify the
   * account is of a particular type or has certain attributes.  Since most of these sorts will be looking for a
   * single, non-list bill account, if there's a query for one, we mock it and return it.  For a single list bill account,
   * the tester will need to use the TestBillingSystemPlugin and return a mock result for themselves.
   * The more general case is that the UI is looking to display a collection of accounts.  If the query does not have
   * a specific account number, we return three mock accounts.
   *
   * @param searchCriteria the search for accounts
   * @param p1             the max number to return
   * @return
   */
  override function searchForAccounts(searchCriteria : BillingAccountSearchCriteriaJava, p1 : Integer) : BillingAccountSearchResult[] {
    if (searchCriteria typeis BillingAccountSearchCriteria and searchCriteria.AccountNumber != null) {
      if (!searchCriteria.ListBill) {
        var localAccountQuery = Query.make(Account)
        localAccountQuery.compare(Account.ACCID_ACC_PROP.get(), Relop.Equals, searchCriteria.AccountNumber)
        var results = createSearchResultFromActualAccounts(localAccountQuery.select().toTypedArray() as Account[])
        if (results.HasElements) {
          return results
        }
      }
    }

    var result1 = createSearchResult("1", searchCriteria)
    var result2 = createSearchResult("2", searchCriteria)
    var result3 = createSearchResult("3", searchCriteria)
    return {result1, result2, result3}
  }

  private function createSearchResultFromActualAccounts(accounts : Account[]) : BillingAccountSearchResult[] {

    var results = new ArrayList<BillingAccountSearchResult>()

    accounts.each(\a -> {
      results.add(new StandAloneBillingAccountSearchResult() {
        :AccountNumber = a.AccountNumber,
        :AccountName = a.AccountHolderContact.DisplayName,
        :PrimaryPayer = "Payer",
        :Currency = a.PreferredSettlementCurrency
     })
    })

    return results.toTypedArray()
  }

  private function createSearchResult(id : String, criteria : BillingAccountSearchCriteriaJava) : BillingAccountSearchResult {
    var result = new StandAloneBillingAccountSearchResult() {
      :AccountNumber = id,
      :AccountName = UniqueKeyGenerator.get().nextID(),
      :PrimaryPayer = "Payer " + id}
    if (criteria typeis BillingAccountSearchCriteria) {
      if (criteria.AccountName.NotBlank) {
        result.AccountName = criteria.AccountName
      }
      result.AccountNameKanji = criteria.AccountNameKanji
    }
    return result
  }

  override function getExistingPaymentInstruments(accountNumber : String, currency : Currency) : BillingPaymentInstrument[] {
    return {new BillingPaymentInstrumentImpl() {
        :PublicID = "bctest:1",
        :DisplayName = "Visa xxxx-3452",
        :PaymentMethod = TC_CREDITCARD,
        :OneTime = false
      },
        new BillingPaymentInstrumentImpl() {
        :PublicID = "bctest:2",
        :DisplayName = "ACH/EFT xxxx-3857",
        :PaymentMethod = TC_ACH,
        :OneTime = false
      }
    }
  }

  @SuppressWarnings({"all"})
  override function addPaymentInstrumentTo(accountNumber : String, currency : Currency, paymentInstrument : BillingPaymentInstrument) : BillingPaymentInstrument {
    if (paymentInstrument.PaymentMethod == AccountPaymentMethod.TC_UNSUPPORTED) {
      throw new IllegalStateException(DisplayKey.get("BillingSystemPlugin.Error.UnsupportedPaymentMethod"))
    }
    return new BillingPaymentInstrumentImpl() {
        :PublicID = "bctest:1",
        :DisplayName = "Visa xxxx-3452",
        :PaymentMethod = paymentInstrument.PaymentMethod,
        :OneTime = paymentInstrument.OneTime,
        :Token = paymentInstrument.Token
      }
  }

  override function updatePolicyPeriodTermConfirmed(policyNumber : String, termNumber : int,
                                           isConfirmed : boolean) : void {
  }

  /**
   * Create or return existing sub accounts
   */
  private function getSampleSubAccounts(currency : Currency = null) : Account[] {
    //TODO-dp cannot use test code in production module
    var query = Query.make(Account).compareIn("PublicId", {"pctest:bc:1", "pctest:bc:2", "pctest:bc:3"})
    if (currency != null) {
      query.compare(Account#PreferredSettlementCurrency, Relop.Equals, currency)
    }
    var results = query.select()
    if (results.HasElements) {
      return results.toTypedArray()
    }

    var helper = TypeSystem.getByFullNameIfValid("gw.plugin.billing.impl.StandAloneBillingSystemPluginHelper")
    if (helper != null) {
      return ReflectUtil.invokeStaticMethod("gw.plugin.billing.impl.StandAloneBillingSystemPluginHelper", "init", {}) as Account[]
    } else {
      return new Account[0]
    }
  }

  override function retrieveAccountUnappliedFunds(accountNumber : String, currency : Currency) : BillingUnappliedFundInfo[] {
    return {}
  }

  override function supportsSpecialHandlingForChangeInCost() : boolean {
    return true
  }

  override function getBillingLevel(accountNumber : String) : BillingLevel {
    return BillingLevel.TC_POLICYDESIGNATEDUNAPPLIED
  }

  private function getCommissionPlanSummaryFor(currency : Currency) : CommissionPlanSummary {
    var planSummary =
        COMMISSION_PLAN_SUMMARIES.firstWhere(\planSummary -> planSummary.Currencies.contains(currency))
    if (planSummary == null) {
      planSummary = newCommissionPlanSummary({currency}, "1")
      COMMISSION_PLAN_SUMMARIES.add(planSummary)
    }
    return planSummary
  }

  private static function newAgencyBillingPlanSummary(currencies: Currency[], id : String): AgencyBillPlanSummary {
    var summary = new AgencyBillPlanSummary()
    var suffix = "${id}(${currencies*.Ordinal.join("")})"
    summary.Id = "pctest:" + suffix
    summary.Name = DisplayKey.get("Web.Demo.Billing.StandardAgencyBillPlan") + " ${id} (${currencies*.DisplayName.join(", ")})"
    summary.Currencies = currencies
    return summary
  }

  private function newCommissionPlanSummary(currencies : Currency[], id : String) : CommissionPlanSummary {
    final var planSummary = new CommissionPlanSummary()
    var suffix = "${id}(${currencies*.Ordinal.join("")})"
    planSummary.Name = DisplayKey.get("Web.Demo.Billing.StandardCommissionPlan") + " ${id} (${currencies*.DisplayName.join(", ")})"
    planSummary.Id = "pctest:" + suffix
    planSummary.Currencies = currencies
    planSummary.AllowedTiers = new Tier[] {TC_BRONZE}
    return planSummary
  }

  private static property get DepositKey() : String {
    return "deposit"
  }

  private static property get InstallmentKey() : String {
    return "installment"
  }

  private static property get OneTimeKey() : String {
    return "onetime"
  }

  private static property get PremiumKey() : String {
    return "premium"
  }

  private static property get FeeKey() : String {
    return "fee"
  }

  private static property get TaxKey() : String {
    return "tax"
  }

  private function generatePreviewFor(policyPeriod : PolicyPeriod, plan : PaymentPlanData) : PaymentPreviewItem[] {
    if (jobSupportsSpecialHandling(policyPeriod)) {
      var numberOfPayments = policyPeriod.BasedOn.SelectedPaymentPlan.NumberOfPayments
      var paymentPreviewItems = generatePaymentPreviewItems(policyPeriod.BasedOn, plan)
      var paymentPreviewItemsForChangeInCost = generatePaymentPreviewChangeItems(policyPeriod, paymentPreviewItems, numberOfPayments)
      return paymentPreviewItems.concat(paymentPreviewItemsForChangeInCost)
    } else {
      return generatePaymentPreviewItems(policyPeriod, plan)
    }
  }

  /**
   * Generates and returns payment preview items for the period based on the payment plan.
   */
  private function generatePaymentPreviewItems(policyPeriod : PolicyPeriod, plan : PaymentPlanData) : PaymentPreviewItem[] {
    final var planDescriptor = makePlanDescriptorForPlan(plan, policyPeriod)
    final var installmentAmount = planDescriptor.Installment
    final var installmentFee = planDescriptor.InstallmentFee
    var generatedDates : Date[] = null
    if (planDescriptor.Dates != null) {
      generatedDates = planDescriptor.Dates
    } else {
      generatedDates = generatePaymentDates(policyPeriod, planDescriptor)
    }
    final var dates = generatedDates
    return dates.flatMap<PaymentPreviewItem>(\date -> {
      if (date.before(policyPeriod.EditEffectiveDate)) {
        return {
            generatePreviewFor(date.addDays(-LEAD_TIME), date, planDescriptor.Deposit, DepositKey, PremiumKey),
            generatePreviewFor(date.addDays(-LEAD_TIME), date, policyPeriod.TaxAndSurchargesRPT, OneTimeKey, TaxKey)
          }
      } else {
        // installmentAmount...
        final var installmentPreview = generatePreviewFor(date.addDays(-LEAD_TIME), date, installmentAmount,
            InstallmentKey, PremiumKey)
        return installmentFee.IsZero
            ? {installmentPreview}
            : {installmentPreview,
            generatePreviewFor(date.addDays(-LEAD_TIME), date, installmentFee, OneTimeKey, FeeKey)
            }
      }
    })
  }

  /**
   * Returns an array of {@link PaymentPreviewItem}'s, either by newly generating them or updated existing ones with the change in cost from the basedOn Period.
   *
   * @param policyPeriod        the PolicyPeriod used for {@link PaymentPreviewItem}
   * @param paymentPreviewItems the {@link PaymentPreviewItem}'s of a policyPeriod
   * @param numberOfPayments    the number of payments of period's selected payment plan
   */
  private static function generatePaymentPreviewChangeItems(policyPeriod : PolicyPeriod, paymentPreviewItems : PaymentPreviewItem[], numberOfPayments : int) : PaymentPreviewItem[] {
    var pcPaymentPreviewItemsChanged = new ArrayList<PaymentPreviewItem>()
    if (policyPeriod.ChangeInTotalCostRPT.IsNotZero) {
      var changeInCostTax = policyPeriod.TaxAndSurchargesRPT.subtract(policyPeriod.BasedOn.TaxAndSurchargesRPT)
      var changeInCostPremium = policyPeriod.TotalPremiumRPT.subtract(policyPeriod.BasedOn.TotalPremiumRPT)
      //For specialHandling as BillOnNext/HoldForAudit, update the existing previewItems with changeInCost amount (premium and tax).
      if (policyPeriod.SpecialHandling == SpecialHandling.TC_BILLONNEXT or policyPeriod.SpecialHandling == SpecialHandling.TC_HOLDFORAUDIT) {
        updatePreviewItemsForChangeInCost(paymentPreviewItems, changeInCostPremium, changeInCostTax)
      }
      // For BillImmediately, generate new preview items if there isn't any existing invoice with dueDate as currentDate + 25, else update the existing previewItems with changeInCost
      if (policyPeriod.SpecialHandling == SpecialHandling.TC_BILLIMMEDIATELY) {
        var calculatedDueDate = Date.CurrentDate.addDays(25).trimToMidnight().addMinutes(1)

        if (paymentPreviewItems*.DueDate.contains(calculatedDueDate)) {
          updatePreviewItemsForChangeInCost(paymentPreviewItems, changeInCostPremium, changeInCostTax)
        } else {
          pcPaymentPreviewItemsChanged.addAll(generatePreviewItemsForBillImmediately(changeInCostPremium, changeInCostTax, calculatedDueDate))
        }
      }

      // update previewItems based on number of installments by slicing the ChangeInCostPremium --> changeInCostPremium/numberOfInstallments for each dueDate
      if (policyPeriod.SpecialHandling == null) {
        var changeInCostPremiumSliced = MonetaryAmounts.roundToCurrencyScale(changeInCostPremium / numberOfPayments)
        updatePreviewItemsForChangeInCostWithNoSpecialHandling(paymentPreviewItems, changeInCostPremiumSliced, changeInCostTax)
      }
    }
    return pcPaymentPreviewItemsChanged.toTypedArray()
  }

  /**
   * Updates the {@link PaymentPreviewItem}'s with change in cost premium and tax for {@link SpecialHandling} types - BillImmediately, BillOnNext and HoldForAudit.
   * In case of BillImmediately, update preview items if there is an existing invoice with same due date.
   *
   * @param paymentPreviewItems PaymentPreviewItems to be updated with change in cost
   * @param changeInCostPremium the changeInCost Premium to be added to matching existing {@link PaymentPreviewItem}
   * @param changeInCostTax     the changeInCost Tax to be added to matching existing {@link PaymentPreviewItem}
   */
  private static function updatePreviewItemsForChangeInCost(paymentPreviewItems : PaymentPreviewItem[], changeInCostPremium : MonetaryAmount, changeInCostTax : MonetaryAmount) {
    paymentPreviewItems.where(\item -> item.ChargeCategory == PremiumKey and item.Type == DepositKey).each(\item -> {
      item.Amount += changeInCostPremium
    })
    paymentPreviewItems.where(\item -> item.ChargeCategory == TaxKey and item.Type == OneTimeKey).each(\item -> {
      item.Amount += changeInCostTax
    })
  }

  /**
   * Returns a list of {@link PaymentPreviewItem}'s for {@link SpecialHandling} type BillImmediately with change in cost Premium and Tax.
   *
   * @param changeInCostPremium the changeInCost premium for the {@link PaymentPreviewItem}
   * @param changeInCostTax     the changeInCost tax for the {@link PaymentPreviewItem}
   */
  private static function generatePreviewItemsForBillImmediately(changeInCostPremium : MonetaryAmount, changeInCostTax : MonetaryAmount, calculatedDueDate : Date) : ArrayList<PaymentPreviewItem> {
    return {
        generatePreviewFor(calculatedDueDate.addDays(-LEAD_TIME), calculatedDueDate, changeInCostPremium, DepositKey, PremiumKey),
        generatePreviewFor(calculatedDueDate.addDays(-LEAD_TIME), calculatedDueDate, changeInCostTax, OneTimeKey, TaxKey)
    }
  }

  /**
   * Updates the {@link PaymentPreviewItem}'s with change in cost premium sliced across installments and tax no {@link SpecialHandling}
   *
   * @param paymentPreviewItems PaymentPreviewItems to be updated with change in cost
   * @param changeInCostPremium the changeInCost premium amount sliced across the installments for the {@link PaymentPreviewItem}
   * @param changeInCostTax     the changeInCost tax for the {@link PaymentPreviewItem}
   */
  private static function updatePreviewItemsForChangeInCostWithNoSpecialHandling(paymentPreviewItems : PaymentPreviewItem[], changeInCostPremium : MonetaryAmount, changeInCostTax : MonetaryAmount) {
    paymentPreviewItems.where(\item -> item.ChargeCategory == PremiumKey and (item.Type == DepositKey or item.Type == InstallmentKey)).each(\item -> {
      item.Amount += changeInCostPremium
    })

    var taxPreviewItem = paymentPreviewItems.firstWhere(\item -> item.ChargeCategory == TaxKey and item.Type == OneTimeKey)
    taxPreviewItem.Amount += changeInCostTax
  }

  private static function generatePreviewFor(statementDate : Date, dueDate : Date, amount : MonetaryAmount,
      typeKey : String, chargeCategoryKey : String) : PaymentPreviewItem {
    return PaymentPreviewItemLocalizationHelper
        .localizeForDisplay(new PaymentPreviewItem(statementDate, dueDate, amount, typeKey, chargeCategoryKey))
  }

  protected function generatePaymentDates(
      policyPeriod : PolicyPeriod, planDescriptor : PlanDescriptor) : Date[] {
    final var dates = new Date[planDescriptor.NumberOfPayments]
    if (planDescriptor.DepositPercent > 0) {
      dates[0] = policyPeriod.EditEffectiveDate.addDays(DEPOSIT_DUE_DIFFERENCE)
    }
    if (dates.Count > 1) {
      var startDate = policyPeriod.EditEffectiveDate
      final var daySpan = startDate.differenceInDays(policyPeriod.EndOfCoverageDate)
          / planDescriptor.NumberOfInstallments
      for (i in 1..|dates.length) {
        dates[i] = startDate
        startDate = startDate.addDays(daySpan)
      }
    }
    return dates
  }

  private function makePlanDescriptorForPlan(paymentPlan : PaymentPlanData, policyPeriod : PolicyPeriod) : PlanDescriptor {
    var totalCost = policyPeriod.TotalPremiumRPT
    switch (paymentPlan.BillingId) {
      case "pctest:2":   // 6 Pay --> Down payment + 5 installments
          return new PlanDescriptor(
            :depositPercent = 0.18,
            :numberOfInstallments = 5,
            :installmentPercent = 0.03,
            :totalCost = totalCost)
      case "pctest:3":   // 3 Pay --> Down payment + 2 installments
          return new PlanDescriptor(
            :depositPercent = 0.40,
            :numberOfInstallments = 2,
            :installmentPercent = 0.02,
            :totalCost = totalCost)
      case "pctest:4":   // Full Pay --> Down payment only
          return new PlanDescriptor(
            :depositPercent = 1.00,
            :numberOfInstallments = 0,
            :installmentPercent = 0,
            :totalCost = totalCost)
      case "pctest:5":   // Twice Per Month --> Down payment + 2 payments/month which is calculated below
        //numberOfInstallments is updated below
        var twicePerMonth = new PlanDescriptor(
            :depositPercent = 0.20,
            :numberOfInstallments = 8,
            :installmentPercent = 0.10,
            :totalCost = totalCost)
        twicePerMonth.BillingPeriodicity = BillingPeriodicity.TC_TWICEPERMONTH
        /*
         * Calculate the number of payments
         */
        var dates = generatePaymentDates(policyPeriod, twicePerMonth)
        twicePerMonth.Dates = dates
        twicePerMonth.NumberOfPayments = dates.length
        twicePerMonth.NumberOfInstallments = dates.length - 1
        return twicePerMonth
      case "pctest:6":   // Quarterly --> 30% down and 3 installments
          return new PlanDescriptor(
            :depositPercent = 0.30,
            :numberOfInstallments = 3,
            :installmentPercent = 0.02,
            :totalCost = totalCost)
      case "pctest:7":   // Monthly --> 20% down and 11 installments
        return new PlanDescriptor(
            :depositPercent = 0.20,
            :numberOfInstallments = 12,
            :installmentPercent = 0.03,
            :totalCost = totalCost)
      case "pctest:8":   // Every other week demo --> 10% down and 26 installments
        var everyOtherWeek = new PlanDescriptor(
            :depositPercent = 0.10,
            :numberOfInstallments = 26,
            :installmentPercent = 0.03,
            :totalCost = totalCost)
        everyOtherWeek.BillingPeriodicity = BillingPeriodicity.TC_EVERYOTHERWEEK
        return everyOtherWeek
      default:           // A default which generates a partial down payment and installments with no add-on fees
          return new PlanDescriptor(
            :depositPercent = 0.40,
            :numberOfInstallments = 2,
            :installmentPercent = 0,
            :totalCost = totalCost)
    }
  }

  override function sendChargeBreakdownCriteria(chargeBreakdownCriterionDefinitions : List<ChargeBreakdownCriterion>) : String[] {
    return {}
  }

  protected static class PlanDescriptor {
    private var _depositPercent : Double as readonly DepositPercent
    private var _installmentCount : int as NumberOfInstallments
    private var _installmentPercent : Double as readonly InstallmentPercent
    private var _numberOfPayments : int as NumberOfPayments
    private var _deposit : MonetaryAmount as readonly Deposit
    private var _installment : MonetaryAmount as readonly Installment
    private var _installmentFee : MonetaryAmount as readonly InstallmentFee
    private var _total : MonetaryAmount as readonly Total

    private var _billingPeriodicity : BillingPeriodicity as BillingPeriodicity
    private var _dates : Date[]as Dates

    construct(depositPercent : Double, numberOfInstallments : int, installmentPercent : Double, totalCost : MonetaryAmount) {
      _depositPercent = depositPercent
      _installmentCount = numberOfInstallments
      _installmentPercent = installmentPercent
      calculate(totalCost)
    }

    private function calculate(totalCost : MonetaryAmount) {
      _numberOfPayments = DepositPercent == 0 ? NumberOfInstallments : 1 + NumberOfInstallments

      _deposit = MonetaryAmounts.roundToCurrencyScale(totalCost.Amount * DepositPercent, totalCost.Currency, HALF_EVEN)

      _installment = NumberOfInstallments > 0
          ? MonetaryAmounts.roundToCurrencyScale((totalCost - Deposit) / NumberOfInstallments, totalCost.Currency, CEILING)
          : 0bd.ofCurrency(totalCost.Currency)

      // Correct any excess created by the rounding in previous step
      _deposit = totalCost.subtract(Installment * NumberOfInstallments)

      _installmentFee = MonetaryAmounts.roundToCurrencyScale(Installment * InstallmentPercent, HALF_EVEN)

      _total = (InstallmentPercent == 0)
          ? MonetaryAmounts.roundToCurrencyScale(totalCost)  // Avoid any rounding issues when no fees are applied
          : // Calc as sum of the down payment + installments
          MonetaryAmounts.roundToCurrencyScale(
              (Deposit + (NumberOfInstallments * Installment)).Amount,
                  totalCost.Currency, HALF_EVEN)
    }
  }

  private class ReportingPlanSpec implements PaymentPlanInfoSpec {

    override property get PublicID() : String {
      return "ReportingPlanId"
    }

    override property get BillDateOrDueDateBilling() : String {
      return typekey.BillDateOrDueDateBilling.TC_BILLDATEBILLING.Code
    }

    override property get AllowedPaymentMethods() : List<String> {
      return AccountPaymentMethod.getTypeKeys(false).map(\paymentMethod -> paymentMethod.Code)
    }
  }
}
