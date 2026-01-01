package edge.samlV2.util

uses edge.samlV2.idp.SAMLV2IdP
uses org.apache.commons.codec.binary.Base64
uses org.opensaml.Configuration
uses org.opensaml.DefaultBootstrap
uses org.opensaml.saml2.core.AuthnRequest
uses org.opensaml.saml2.core.LogoutRequest
uses org.opensaml.saml2.core.Response
uses org.opensaml.xml.XMLObject
uses org.opensaml.xml.security.credential.BasicCredential
uses org.opensaml.xml.security.credential.BasicKeyInfoGeneratorFactory
uses org.w3c.dom.Element

uses javax.xml.parsers.DocumentBuilder
uses javax.xml.parsers.DocumentBuilderFactory
uses java.io.ByteArrayInputStream
uses java.io.ByteArrayOutputStream
uses java.lang.Exception
uses java.lang.RuntimeException
uses java.util.zip.DataFormatException
uses java.util.zip.Inflater
uses java.util.zip.InflaterInputStream
uses edge.samlV2.base.xml.IXMLSignatureProcessor
uses edge.samlV2.base.xml.XMLSignatureProcessor
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection

class SAMLProcessor implements  IXMLSignatureProcessor {

  final private static var _logger = new Logger(Reflection.getRelativeName(SAMLProcessor))

  private var generator = new BasicKeyInfoGeneratorFactory()
  private var builder:DocumentBuilder = null
  private var basic:BasicCredential = null
  delegate _signatureProcessor represents IXMLSignatureProcessor = new XMLSignatureProcessor()

  construct() {
      // OpenSAML 2.3
      DefaultBootstrap.bootstrap();
  }


  public function getBuilder():DocumentBuilder {
    if(builder == null) {
      DefaultBootstrap.bootstrap()
      var factory = DocumentBuilderFactory.newInstance()
      factory.setNamespaceAware(true)
      builder = factory.newDocumentBuilder()
    }
    return builder
  }

  public function readResponse(inbound: String):Response {
    //Header is generally only base64 encoded. Some SPs may deflate header and require an implementation to inflate as well as decode header
    return readFromString(decodeRequestXML(inbound)) as Response
  }

  public function readRequest(inbound:String):AuthnRequest {
    _logger.logDebug("******** ATTEMPTING TO DECODE STRING!")
    _logger.logDebug("******** DECODED STRING: " + inflateAndDecodeRequestXML(inbound))
    return readFromString(inflateAndDecodeRequestXML(inbound)) as AuthnRequest
  }


  public function reqdLogout(inbound:String):LogoutRequest {
    return readFromString(inflateAndDecodeRequestXML(inbound)) as LogoutRequest
  }

  protected function fromElement(element : Element) : XMLObject {
    return Configuration.getUnmarshallerFactory().getUnmarshaller(element).unmarshall(element)
  }

  protected function readFromString(inbound : String) : XMLObject {
    if(gw.api.system.server.ServerModeUtil.isDev()) {SAMLV2IdP.logger.info("inbound string: " + inbound)}
    return fromElement(getBuilder().parse(new ByteArrayInputStream(inbound.getBytes("utf-8"))).getDocumentElement())
  }

  public function inflateAndDecodeRequestXML(encodedRequestXmlString: String) : String {
    _logger.logDebug("****** DECODING STRING")
    try {
      var base64Decoder = new Base64()
      var base64DecodedByteArray = base64Decoder.decode(encodedRequestXmlString)
      try {
        var inflater = new Inflater(true)
        inflater.setInput(base64DecodedByteArray)
        var xmlMessageBytes = new byte[5000]
        var resultLength = inflater.inflate(xmlMessageBytes)
        if (!inflater.finished()) {
          throw new RuntimeException("didn\'t allocate enough space to hold decompressed data")
        }
        inflater.end()
        return new String(xmlMessageBytes, 0, resultLength, "UTF-8")
      }
          catch (e : DataFormatException) {
            _logger.logDebug("******** DATAFORMAT")
            var bais = new ByteArrayInputStream(base64DecodedByteArray)
            var baos = new ByteArrayOutputStream()
            var iis = new InflaterInputStream(bais)
            var buf = new byte[1024]
            var count = iis.read(buf)
            while (count != -1) {
              baos.write(buf, 0, count)
              count = iis.read(buf)
            }
            iis.close()
            var req = new String(baos.toByteArray())
            if(gw.api.system.server.ServerModeUtil.isDev()) {SAMLV2IdP.logger.info("SAML Request: " + req)}
            return req
          }
    } catch (e : Exception) {
      throw new Exception("Error decoding AuthnRequest: " + "Check decoding scheme - " + e)
    }
  }


  public function decodeRequestXML(encodedRequestXmlString: String) : String {
    try {
      var base64Decoder = new Base64()
      return new String(base64Decoder.decode(encodedRequestXmlString), "UTF-8")
    } catch (e : Exception) {
      throw new Exception("Error decoding AuthnRequest: " + "Check decoding scheme - " + e)
    }
  }
}
