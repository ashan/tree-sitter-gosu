package edge.capabilities.gpa.billing

uses edge.PlatformSupport.CurrencyPlatformUtil
uses edge.capabilities.gpa.currency.local.ICurrencyPlugin
uses edge.capabilities.gpa.billing.dto.BillingInvoiceDTO
uses edge.di.annotations.ForAllGwNodes
uses gw.plugin.billing.BillingInvoiceInfo
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger

class DefaultBillingInvoicePlugin implements IBillingInvoicePlugin {

  private static var LOGGER = new Logger(Reflection.getRelativeName(DefaultBillingInvoicePlugin))

  private var _currencyPlugin : ICurrencyPlugin

  @ForAllGwNodes
  construct(aCurrencyPlugin : ICurrencyPlugin) {
    this._currencyPlugin = aCurrencyPlugin
  }

  override public function toDTO(aBillingInvoice: BillingInvoiceInfo): BillingInvoiceDTO {
    final var dto = new BillingInvoiceDTO()

    dto.InvoiceNumber = aBillingInvoice.InvoiceNumber
    dto.InvoiceDate = aBillingInvoice.InvoiceDate
    dto.DueDate = aBillingInvoice.InvoiceDueDate
    dto.Amount = _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(aBillingInvoice.Amount))
    dto.Paid = _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(aBillingInvoice.Paid))
    dto.Unpaid = _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(aBillingInvoice.Unpaid))
    dto.Status = aBillingInvoice.Status
    dto.PaidStatus = aBillingInvoice.PaidStatus

    return dto
  }

  override public function toDTOArray(billingInvoices: BillingInvoiceInfo[]): BillingInvoiceDTO[] {
    if(billingInvoices != null && billingInvoices.HasElements){
      return billingInvoices.map( \ aBillingInvoice -> toDTO(aBillingInvoice))
    }
    return new BillingInvoiceDTO[]{}
  }

  override public function getAccountBillingInvoices(anAccount : Account) : BillingInvoiceDTO[] {

    try {
      final var plugin = gw.plugin.Plugins.get(gw.plugin.billing.IBillingSummaryPlugin)
      final var invoices = plugin.retrieveAccountInvoices( anAccount.AccountNumber )?.asArrayOf(BillingInvoiceInfo)
      return toDTOArray(invoices)
    } catch (e : gw.api.util.DisplayableException) {
      LOGGER.logDebug(e.LocalizedMessage)
    }

    return new BillingInvoiceDTO[]{}
  }
}
