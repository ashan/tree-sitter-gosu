package edge.samlV2.base.xml

uses org.apache.xml.security.c14n.Canonicalizer
uses org.opensaml.DefaultBootstrap
uses org.opensaml.saml2.core.Assertion
uses org.opensaml.saml2.core.Response
uses org.opensaml.security.SAMLSignatureProfileValidator
uses org.opensaml.xml.security.credential.BasicCredential
uses org.opensaml.xml.security.credential.BasicKeyInfoGeneratorFactory
uses org.opensaml.xml.signature.Signature
uses org.opensaml.xml.signature.SignatureValidator
uses org.opensaml.xml.signature.Signer
uses org.opensaml.xml.signature.impl.SignatureBuilder

uses java.io.FileInputStream
uses java.io.FileNotFoundException
uses java.io.IOException
uses java.io.InputStream
uses java.lang.Exception
uses java.lang.Thread
uses java.net.MalformedURLException
uses java.net.URL
uses java.security.KeyFactory
uses java.security.NoSuchAlgorithmException
uses java.security.interfaces.RSAPrivateKey
uses java.security.interfaces.RSAPublicKey
uses java.security.spec.InvalidKeySpecException
uses java.security.spec.PKCS8EncodedKeySpec
uses java.security.spec.X509EncodedKeySpec
uses java.util.ArrayList
uses edge.samlV2.idp.SAMLImpl

class XMLSignatureProcessor implements IXMLSignatureProcessor {
  private var generator = new BasicKeyInfoGeneratorFactory()
  private var basic:BasicCredential = null

  construct() {
    var old = Thread.currentThread().ContextClassLoader
    Thread.currentThread().setContextClassLoader((XMLSignatureProcessor.Type as java.lang.Class).ClassLoader)

    try {
      //Locate our singing keys
      // Public and Private Key locations configured in properties file
      var publicKey = getKey(SAMLImpl.IDP_RSAPUBLICKEY_LOCATION, "RSA", \bytes, algo -> {
        var pubSpec = new X509EncodedKeySpec(bytes)
        var factory = KeyFactory.getInstance(algo)
        return factory.generatePublic(pubSpec)
      }) as RSAPublicKey
      var privateKey = getKey(SAMLImpl.IDP_RSAPRIVATEKEY_LOCATION, "RSA", \bytes, algo -> {
        var privSpec = new PKCS8EncodedKeySpec(bytes)
        var factory = KeyFactory.getInstance(algo)
        return factory.generatePrivate(privSpec)
      }) as RSAPrivateKey

      // OpenSAML 2.3
      DefaultBootstrap.bootstrap();

      //Setup our keys
      basic = new BasicCredential()
      basic.setPublicKey(publicKey)
      basic.setPrivateKey(privateKey)

      //Configure our generator
      generator.setEmitPublicKeyValue(Boolean.TRUE)
      generator.setEmitEntityIDAsKeyName(Boolean.TRUE)

    } finally {
      Thread.currentThread().setContextClassLoader(old)
    }
  }

  public static function getKey(keyPath: String, algorithm : String, generate(bytes:byte[], algo:String):java.security.Key) : java.security.Key {
    try {
      var pKey: InputStream = null
      try {
        var url = new URL(keyPath)
        pKey = url.openStream()
      } catch (e : MalformedURLException) {
        pKey = new FileInputStream(keyPath)
      }

      var bytes = new byte[pKey.available()]
      pKey.read(bytes)
      pKey.close()
      return generate(bytes, algorithm)

    } catch (e : FileNotFoundException) {
      throw new Exception("ERROR: Public key file not found - " + keyPath)
    } catch (e : IOException) {
      throw new Exception("ERROR: Invalid public key file - " + e.getMessage())
    } catch (e : NoSuchAlgorithmException) {
      throw new Exception("ERROR: Invalid public key algorithm - " + e.getMessage())
    } catch (e : InvalidKeySpecException) {
      throw new Exception("ERROR: Invalid public key spec - " + e.getMessage())
    }
  }


  public function validateSignature(resp:Response) {
    var profileValidator = new SAMLSignatureProfileValidator()
    profileValidator.validate(resp.getSignature())
    var sigValidator = new SignatureValidator(basic)
    sigValidator.validate(resp.getSignature())
  }

  public function signResponse(response: Response, signatureAlgorithm: String, samlSession:String) : Response {
    try {
      var signature = new SignatureBuilder().buildObject()
      signature.setSigningCredential(basic)
      signature.setSignatureAlgorithm(signatureAlgorithm)
      signature.setCanonicalizationAlgorithm(Canonicalizer.ALGO_ID_C14N_EXCL_OMIT_COMMENTS)

      //Create standard key info
      var keyInfo = generator.newInstance().generate(basic)

      signature.setKeyInfo(keyInfo)
      response.setSignature(signature)

      var signatureList = new ArrayList<Signature>()
      signatureList.add(signature)

      var marshallerFactory = org.opensaml.xml.Configuration.getMarshallerFactory()
      var marshaller = marshallerFactory.getMarshaller(response)
      marshaller.marshall(response)
      response.DOM.setAttribute("ResponseID", samlSession)
      response.DOM.setAttribute("ID", samlSession)
      org.apache.xml.security.Init.init()
      Signer.signObjects(signatureList)

      return response
    } catch (e : Exception) {
      throw new Exception("Error while signing the SAML Response message.", e)
    }
  }

  public function signAssertion(assertion : Assertion, signatureAlgorithm : String, samlSession:String) : Assertion {
    try {
      var signature = new SignatureBuilder().buildObject()
      signature.setSigningCredential(basic)
      signature.setSignatureAlgorithm(signatureAlgorithm)
      signature.setCanonicalizationAlgorithm(Canonicalizer.ALGO_ID_C14N_EXCL_OMIT_COMMENTS)

      //Create standard key info
      var keyInfo = generator.newInstance().generate(basic)

      signature.setKeyInfo(keyInfo)
      assertion.setSignature(signature)

      var signatureList = new ArrayList<Signature>()
      signatureList.add(signature)

      var marshallerFactory = org.opensaml.xml.Configuration.getMarshallerFactory()
      var marshaller = marshallerFactory.getMarshaller(assertion)
      marshaller.marshall(assertion)
      //assertion.DOM.setAttribute("ID", samlSession)
      org.apache.xml.security.Init.init()
      Signer.signObjects(signatureList)
      return assertion
    } catch (e : Exception) {
      throw new Exception("Error while signing the SAML Response message.", e)
    }
  }
}
