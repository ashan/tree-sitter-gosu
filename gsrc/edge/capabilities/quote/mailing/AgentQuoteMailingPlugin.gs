package edge.capabilities.quote.mailing

uses edge.capabilities.quote.mailing.util.QuoteEmailProperties
uses edge.capabilities.quote.dto.QuoteDataDTO
uses edge.di.annotations.ForAllGwNodes
uses gw.api.email.EmailContact

class AgentQuoteMailingPlugin extends DefaultQuoteMailingPlugin{

  @ForAllGwNodes('agentquote')
  construct() {
  }

  override function getSender(sub : Submission) : EmailContact {

    return new EmailContact(sub.Policy.ProducerCodeOfService.Organization.Contact.EmailAddress1, sub.Policy.ProducerCodeOfService.Organization.DisplayName)
  }

  override function getTemplate() : gw.plugin.email.IEmailTemplateDescriptor{

    //All this is based on CreateEmailsScreenUIHelper
    var templatePlugin = gw.plugin.Plugins.get(gw.plugin.email.IEmailTemplateSource)

    return templatePlugin.getEmailTemplate("AgentQuoteEmailPortal.gosu")
  }

  override function getSymbolTable(sub : Submission, dto : QuoteDataDTO) : java.util.HashMap<String, Object>{

    var symbolTable = new java.util.HashMap<String, Object>()

    symbolTable.put("sub", sub)
    symbolTable.put("qdd", dto)
    symbolTable.put("sender", sub.Policy.ProducerCodeOfService.Organization.DisplayName)
    symbolTable.put("email", sub.Policy.ProducerCodeOfService.Organization.Contact.EmailAddress1)
    symbolTable.put("contactNumber", sub.Policy.ProducerCodeOfService.Organization.Contact.PrimaryPhoneValue)

    return symbolTable
  }

}
