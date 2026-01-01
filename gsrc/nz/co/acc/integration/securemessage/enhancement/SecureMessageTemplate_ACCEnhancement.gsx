package nz.co.acc.integration.securemessage.enhancement

enhancement SecureMessageTemplate_ACCEnhancement : SecureMessageTemplate_ACC {

  static function fromIntegrationTemplateName(templateName : String) : SecureMessageTemplate_ACC {
    if (templateName == "cease-shareholder-policy") {
      return SecureMessageTemplate_ACC.TC_CEASESHAREHOLDERPOLICY
    } else if (templateName == "backdate-cu-es") {
      return SecureMessageTemplate_ACC.TC_BACKDATECUOREMPLOYMENTSTATUS
    } else if (templateName == "bcss-reply-to-gw") {
      return SecureMessageTemplate_ACC.TC_BCSSREPLYTOGW
    } else if (templateName == "gw-reply-to-bcss") {
      return SecureMessageTemplate_ACC.TC_GWREPLYTOBCSS
    } else {
      throw new RuntimeException("Unknown template ${templateName}")
    }
  }

  function getIntegrationTemplateName() : String {
    if (this == SecureMessageTemplate_ACC.TC_CEASESHAREHOLDERPOLICY) {
      return "cease-shareholder-policy"
    } else if (this == SecureMessageTemplate_ACC.TC_BACKDATECUOREMPLOYMENTSTATUS) {
      return "backdate-cu-es"
    } else if (this == SecureMessageTemplate_ACC.TC_BCSSREPLYTOGW) {
      return "bcss-reply-to-gw"
    } else if (this == SecureMessageTemplate_ACC.TC_GWREPLYTOBCSS) {
      return "gw-reply-to-bcss"
    } else {
      throw new RuntimeException("Template ${this} is not mapped to integration template name")
    }
  }

}
