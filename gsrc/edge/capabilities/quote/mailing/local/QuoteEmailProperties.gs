package edge.capabilities.quote.mailing.local

uses java.util.Properties
uses java.io.BufferedInputStream
uses java.io.FileNotFoundException
uses java.io.FileInputStream
uses java.lang.Exception

class QuoteEmailProperties extends Properties{
 
  public static final var DEFAULT_QUOTE_EMAIL_PROPERTIES_LOCATION : String = "config/portal/quoteemail.properties" 
  public static final var SENDER_EMAIL : String = "senderEmail"
  public static final var SENDER_NAME : String = "senderName"
  public static final var CONTACT_NUMBER : String = "contactNumber"
  public static final var QUOTE_URL : String = "quoteUrl"
  public static final var QUOTE_CHAT_URL : String = "quoteChatUrl"
         
  //Enforce the singleton pattern.
  private static var props : Properties = loadProps(QuoteEmailProperties.DEFAULT_QUOTE_EMAIL_PROPERTIES_LOCATION)
   
  private static function loadProps(file : String) : Properties {
    final var EmailQuotePropertiesFile = gw.api.util.ConfigAccess.getConfigFile(file)
    if (EmailQuotePropertiesFile == null) {       
      throw new FileNotFoundException("Properties file not found: " + file)
    }
    final var res = new Properties()
    final var inputStream = new BufferedInputStream(new FileInputStream(EmailQuotePropertiesFile))      
    try {
      res.load(inputStream)
      return res
    } finally {
       try {         
         inputStream.close() 
       } catch (e : Exception) {}
    }
  }

  public static function getSenderEmail() : String {    
    return props.getProperty(QuoteEmailProperties.SENDER_EMAIL)
  }

  public static function getSenderName() : String {    
    return props.getProperty(QuoteEmailProperties.SENDER_NAME)
  }
  
  public static function getContactNumber() : String {    
    return props.getProperty(QuoteEmailProperties.CONTACT_NUMBER)
  }
  
  public static function getQuoteChatUrl() : String {    
    return props.getProperty(QuoteEmailProperties.QUOTE_CHAT_URL)
  }
  
  public static function getQuoteUrl() : String {    
    return props.getProperty(QuoteEmailProperties.QUOTE_URL)
  }
}
