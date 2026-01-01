package edge.samlV2.base.xml

uses org.opensaml.saml2.core.Response
uses org.opensaml.saml2.core.Assertion

interface IXMLSignatureProcessor {
  function validateSignature(resp:Response)
  function signResponse(response: Response, signatureAlgorithm: String, samlSession:String) : Response
  function signAssertion(assertion : Assertion, signatureAlgorithm : String, samlSession:String) : Assertion
}
