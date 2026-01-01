package edge.capabilities.quote.mailing
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.quote.dto.QuoteDataDTO
uses gw.plugin.Plugins
uses edge.jsonrpc.exception.JsonRpcInternalErrorException
uses gw.api.email.EmailUtil
uses edge.capabilities.quote.mailing.util.QuoteEmailProperties
uses gw.api.email.EmailContact

/**
 * Default e-mail plugin.
 */
class DefaultQuoteMailingPlugin implements IQuoteMailingPlugin {
  @ForAllGwNodes('quote')
  construct() {
  }

  override function sendMail(sub : Submission, dto : QuoteDataDTO) {
    if (!Plugins.isEnabled("emailMessageTransport")){
      throw new JsonRpcInternalErrorException(){:Message = "Email plugin is not enabled. Please contact the administrator to enable the email plugin."}
    }

    var template = getTemplate()
    var email = new gw.api.email.Email()

    var acctHolder = sub.Policy.Account.AccountHolder.AccountContact.Contact
    email.addToRecipient(new EmailContact(acctHolder))
    email.Sender = getSender(sub)
    email.Html = true

    var symbolTable = getSymbolTable(sub, dto)

    email.useEmailTemplate(template, symbolTable)

    EmailUtil.sendEmailWithBody(null, email)
  }

  protected function getSender(sub : Submission) : EmailContact {

    return new EmailContact(QuoteEmailProperties.getSenderEmail(), QuoteEmailProperties.getSenderName())
  }

  protected function getTemplate() : gw.plugin.email.IEmailTemplateDescriptor{

  //All this is based on CreateEmailsScreenUIHelper
  var templatePlugin = gw.plugin.Plugins.get(gw.plugin.email.IEmailTemplateSource)

  return templatePlugin.getEmailTemplate("QuoteEmailPortal.gosu")
  }

  protected function getSymbolTable(sub : Submission, dto : QuoteDataDTO) : java.util.HashMap<String, Object>{

      var symbolTable = new java.util.HashMap<String, Object>()

      symbolTable.put("sub", sub)
      symbolTable.put("qdd", dto)
      symbolTable.put("sender", QuoteEmailProperties.getSenderEmail())
      symbolTable.put("quoteUrl", QuoteEmailProperties.getQuoteUrl())
      symbolTable.put("contactNumber", QuoteEmailProperties.getContactNumber())
      symbolTable.put("chatURL", QuoteEmailProperties.getQuoteChatUrl())

      return symbolTable
  }
}
