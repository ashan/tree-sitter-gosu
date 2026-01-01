package edge.samlV2.util

uses edge.samlV2.idp.SAMLRequestParameters
uses edge.samlV2.idp.SAMLResponseParameters
uses org.opensaml.common.SAMLVersion
uses org.opensaml.saml2.core.Assertion
uses org.opensaml.saml2.core.Issuer
uses org.opensaml.saml2.core.NameID
uses org.opensaml.saml2.core.Response
uses org.opensaml.saml2.core.Status
uses org.opensaml.saml2.core.Subject
uses org.opensaml.saml2.core.Attribute
uses org.opensaml.saml2.core.SubjectConfirmation
uses org.opensaml.saml2.core.SubjectConfirmationData
uses org.opensaml.saml2.core.impl.IssuerBuilder
uses org.opensaml.saml2.core.impl.NameIDBuilder
uses org.opensaml.saml2.core.impl.ResponseBuilder
uses org.opensaml.saml2.core.impl.StatusBuilder
uses org.opensaml.saml2.core.impl.StatusCodeBuilder
uses org.opensaml.saml2.core.impl.StatusMessageBuilder
uses org.opensaml.saml2.core.impl.SubjectBuilder
uses org.opensaml.saml2.core.impl.SubjectConfirmationBuilder
uses org.opensaml.saml2.core.impl.SubjectConfirmationDataBuilder
uses org.opensaml.saml2.core.impl.AssertionBuilder
uses org.opensaml.saml2.core.AuthnStatement
uses org.opensaml.saml2.core.impl.AuthnStatementBuilder
uses org.opensaml.saml2.core.impl.AuthnContextBuilder
uses org.opensaml.saml2.core.AuthnContext
uses org.opensaml.saml2.core.AuthnContextClassRef
uses org.opensaml.saml2.core.impl.AuthnContextClassRefBuilder
uses org.opensaml.saml2.core.AttributeStatement
uses org.opensaml.saml2.core.impl.AttributeStatementBuilder
uses org.opensaml.saml2.core.Conditions
uses org.opensaml.saml2.core.impl.ConditionsBuilder
uses org.opensaml.saml2.core.AudienceRestriction
uses org.opensaml.saml2.core.impl.AudienceRestrictionBuilder
uses org.opensaml.saml2.core.Audience
uses org.opensaml.saml2.core.impl.AudienceBuilder
uses org.opensaml.saml2.core.impl.ResponseMarshaller
uses org.opensaml.xml.util.XMLHelper
uses org.apache.commons.codec.binary.Base64
uses edge.samlV2.idp.SAMLV2IdP
uses edge.samlV2.base.xml.XMLSignatureProcessor
uses org.opensaml.saml2.core.impl.AttributeBuilder
uses org.opensaml.xml.schema.XSString
uses org.opensaml.xml.schema.impl.XSStringBuilder
uses org.opensaml.saml2.core.AttributeValue
uses edge.samlV2.idp.SAMLImpl

class SAMLBuilder {
  private var _sigProcessor = new XMLSignatureProcessor()

  public construct() {

  }

  public function getIssuer(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters) : Issuer {
    var issuer = new IssuerBuilder().buildObject()
    issuer.setValue(SAMLImpl.IDP_ENTITYID) //Configured in properties file
    return issuer
  }

  public function getNameID(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters): NameID {
    var nameID = new NameIDBuilder().buildObject()
    nameID.setValue(samlReqParams.Username)
    nameID.setNameQualifier(samlRespParams.Domain)
    nameID.setFormat(org.opensaml.saml2.core.NameID.UNSPECIFIED)
    return nameID
  }

  public function getConfirmationMethod(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters):SubjectConfirmationData {
    var confirmationMethod = new SubjectConfirmationDataBuilder().buildObject()
    confirmationMethod.setNotBefore(samlRespParams.NotBefore)
    confirmationMethod.setNotOnOrAfter(samlRespParams.NotOnOrAfter)
    confirmationMethod.setInResponseTo(samlReqParams.RequestID)
    return confirmationMethod
  }

  public function getSubjectConfirmation(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters):SubjectConfirmation {
    var subjectConfirmation = new SubjectConfirmationBuilder().buildObject()
    subjectConfirmation.setSubjectConfirmationData(getConfirmationMethod(samlReqParams, samlRespParams))
    subjectConfirmation.setMethod(org.opensaml.saml2.core.SubjectConfirmation.METHOD_BEARER)
    return subjectConfirmation
  }

  public function getSubject(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters): Subject {
    var subject = new SubjectBuilder().buildObject()
    subject.NameID = getNameID(samlReqParams, samlRespParams)
    subject.SubjectConfirmations.add(getSubjectConfirmation(samlReqParams, samlRespParams))
    return subject
  }

  public function getAuthnContextClassRef(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters): AuthnContextClassRef {
    var authnContextClassRef = new AuthnContextClassRefBuilder().buildObject()
    authnContextClassRef.setAuthnContextClassRef(SAML2Constants.AUTH_CONTEXT_CLASS_REF_PASSWORD_PROTECTED_TRANSPORT)
    return authnContextClassRef
  }

  public function getAuthnContext(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters): AuthnContext {
    var authnContext = new AuthnContextBuilder().buildObject()
    authnContext.setAuthnContextClassRef(getAuthnContextClassRef(samlReqParams, samlRespParams))
    return authnContext
  }


  public function getAuthnStatement(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters): AuthnStatement {
    var authnStatement = new AuthnStatementBuilder().buildObject()
    authnStatement.setAuthnInstant(samlRespParams.IssueInstant)
    authnStatement.setSessionNotOnOrAfter(samlRespParams.NotOnOrAfter)
    authnStatement.setSessionIndex(samlRespParams.AssertionId)
    authnStatement.setAuthnContext(getAuthnContext(samlReqParams, samlRespParams))
    return authnStatement
  }

  public function getAttrStatement(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters): AttributeStatement {
    var attrStatement = new AttributeStatementBuilder().buildObject()
    attrStatement.getAttributes().add(buildStringAttribute("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",samlReqParams.Username)) // Add any custom attributes you want here
    attrStatement.getAttributes().add(buildStringAttribute("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",samlReqParams.Username)) // Add any custom attributes you want here
    return attrStatement
  }

  public function buildStringAttribute(name : String, value : String) : Attribute {
    var attrFirstName = new AttributeBuilder().buildObject()
    attrFirstName.setName(name)
    var attrValueFirstName = new  XSStringBuilder().buildObject(AttributeValue.DEFAULT_ELEMENT_NAME, XSString.TYPE_NAME)
    attrValueFirstName.setValue(value)
    attrFirstName.getAttributeValues().add(attrValueFirstName)
    return attrFirstName
  }

  public function getISAudience(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters): Audience {
    var audience = new AudienceBuilder().buildObject()
    audience.AudienceURI = SAMLImpl.AUDIENCEURI //Configured in properties file - This needs to match the insurance suite idp entity name used other places
    return audience
  }

  public function getSPAudience(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters): Audience {
      var audience = new AudienceBuilder().buildObject()
      audience.AudienceURI = samlReqParams.Issuer
      return audience
  }

  public function getCondition(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters): AudienceRestriction {
    var condition = new AudienceRestrictionBuilder().buildObject()
    condition.Audiences.add(getISAudience(samlReqParams, samlRespParams))
    condition.Audiences.add(getSPAudience(samlReqParams, samlRespParams))
    return condition
  }

  public function getConditions(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters): Conditions {
    var conditions = new ConditionsBuilder().buildObject()
    conditions.Conditions.add(getCondition(samlReqParams, samlRespParams))
    return conditions
  }

  public function getAssertion(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters):Assertion {
    var assertion = new AssertionBuilder().buildObject()
    //Required items
    assertion.setVersion(SAMLVersion.VERSION_20)
    assertion.setID(samlRespParams.AssertionId)
    assertion.setSubject(getSubject(samlReqParams, samlRespParams))
    assertion.setIssuer(getIssuer(samlReqParams, samlRespParams))
    assertion.setIssueInstant(samlRespParams.IssueInstant)
    assertion.AuthnStatements.add(getAuthnStatement(samlReqParams, samlRespParams))
    assertion.setConditions(getConditions(samlReqParams, samlRespParams))

    //Optional
    assertion.getAttributeStatements().add(getAttrStatement(samlReqParams, samlRespParams)) //GW: Add any required attributes above in getAttrStatement(...) function


    return assertion
  }

  public function getUnsignedResponse(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters):Response {
    var response = new ResponseBuilder().buildObject()

    //Required items
    response.setVersion(SAMLVersion.VERSION_20)
    response.setIssuer(getIssuer(samlReqParams, samlRespParams))
    response.setInResponseTo(samlReqParams.RequestID)
    response.setStatus(buildStatus(samlRespParams.Authenticated, null))
    response.setIssueInstant(samlRespParams.IssueInstant)
    response.setDestination(samlReqParams.ACSUrl)

    //Optional
    // Might be required for some SAML implementations - Set "pc.idp.setresponseid" to true in properties file to include response id
    if(SAMLImpl.SET_SAML_RESPONSEID){
      response.setID(samlRespParams.SAMLSession)
    }
    

    var assertion = getAssertion(samlReqParams, samlRespParams)
    var signedAssertion = _sigProcessor.signAssertion(assertion, org.apache.xml.security.signature.XMLSignature.ALGO_ID_SIGNATURE_RSA, samlRespParams.AssertionId)

    response.getAssertions().add(signedAssertion)

    return response
  }

  public function getResponse(samlReqParams:SAMLRequestParameters, samlRespParams:SAMLResponseParameters):String {
    var response = getUnsignedResponse(samlReqParams, samlRespParams)

    var marshaller = new ResponseMarshaller()
    var plaintextElement = marshaller.marshall(response)
    var responseXmlString = XMLHelper.nodeToString(plaintextElement)
    if(gw.api.system.server.ServerModeUtil.isDev()) {SAMLV2IdP.logger.info("Unsigned Response: " + responseXmlString)}

    var signedResponse = _sigProcessor.signResponse(response, org.apache.xml.security.signature.XMLSignature.ALGO_ID_SIGNATURE_RSA, samlRespParams.SAMLSession)

    var signedPlaintextElement = marshaller.marshall(signedResponse)
    var signedResponseXmlString = XMLHelper.nodeToString(signedPlaintextElement)
    if(gw.api.system.server.ServerModeUtil.isDev()) {SAMLV2IdP.logger.info("SignedResponse: " + signedResponseXmlString)}
    var base64 = new Base64()

    return base64.encodeToString(signedResponseXmlString.getBytes("utf-8"))
  }


  private function buildStatus(pass:Boolean, statMsg:String):Status {
    var stat = new StatusBuilder().buildObject();

    // Set the status code
    var statCode = new StatusCodeBuilder().buildObject();
    statCode.setValue(pass ? org.opensaml.saml2.core.StatusCode.SUCCESS_URI : org.opensaml.saml2.core.StatusCode.AUTHN_FAILED_URI );
    stat.setStatusCode(statCode);

    // Set the status Message
    if (statMsg != null) {
      var statMesssage = new StatusMessageBuilder().buildObject();
      statMesssage.setMessage(statMsg);
      stat.setStatusMessage(statMesssage);
    }

    return stat;
  }

}
