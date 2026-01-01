package nz.co.acc.common.integration.files.inbound.utils

uses java.math.BigDecimal
uses java.text.ParseException
uses java.text.SimpleDateFormat
uses java.util.regex.Pattern

/**
 * Created by Nithy on 10/01/2017.
 */
class InboundUtility {

  static var _ipsPattern = Pattern.compile("^([IPSips]){3}+[0-9]{7,8}(-\\d{1,3})?+$")

  public static function isValidACCAccountNumberFormat(acNumber : String, fileType : InboundFileType) : boolean {
    if (InboundFileType.GNA == fileType || InboundFileType.NZP == fileType || InboundFileType.WPREM == fileType
        || InboundFileType.PRMSTMT == fileType || InboundFileType.INTSTMT == fileType || InboundFileType.CRCARD == fileType
        || InboundFileType.XCPLEVY == fileType || InboundFileType.WPEL == fileType)
      return acNumber.matches("^([A-Za-z]){1}+[0-9]{7}$") || acNumber.matches("^([A-Za-z]){2}+[0-9]{6}$")
    else
      return false
  }


  public static function isValidACCAccountNumberFormat(accNumber : String) : boolean {
    return accNumber.matches("^([A-Za-z]){1}+[0-9]{7}$") || accNumber.matches("^([A-Za-z]){2}+[0-9]{6}$")
  }

  public static function isValidPolicyNumberFormat(acNumber : String) : boolean {
    return acNumber.matches("^([A-Za-z]){1}+([0-9]){7}+([SEDsed]{1})$")
        || acNumber.matches("^([A-Za-z]){2}+([0-9]){6}+([SEDsed]{1})$")
        || acNumber.matches("^([Aa])+([0])+[0-9]{8}$")
  }

  public static function isValidPolicyNumberFormat1(acNumber : String) : boolean {
    return acNumber.matches("^[0-9]{10}$")
  }

  public static function isValidACCIPSInvoiceNumberFormat(invoiceNumber : String) : boolean {
    return _ipsPattern.matcher(invoiceNumber).matches()
  }

  public static function isValidACCPANumberFormat(paNumber : String) : boolean {
    return paNumber.matches("^([PApa]){2}+[0-9]{5}$")
  }

  public static function isValidACCTPNumberFormat(invoiceNumber : String) : boolean {
    return invoiceNumber.matches("(?i)^(TP\\d{8})")
  }

  public static function isValidACCGWInvoiceNumberFormat(invoiceNumber : String) : boolean {
    return invoiceNumber.matches("^([Aa])+([1-9])+[0-9]{8}$")
  }

  public static function formatIPSInvoiceNumber(invoiceNumber : String) : String {
    invoiceNumber = "IPS" + invoiceNumber
    return invoiceNumber
  }

  public static function getValidPolicyNumberFormat(policyNumber : String, fileType : InboundFileType) : String {
    var policyNo : String
    if (InboundFileType.DB == fileType || InboundFileType.BC == fileType || InboundFileType.EC == fileType) {
      if (policyNumber.startsWith("PRM-")) {
        policyNumber = policyNumber.substring(4)
      }
    }

    if (policyNumber.length() > 10) {
      policyNo = policyNumber.substring(policyNumber.length() - 10);
    } else {
      policyNo = policyNumber
    }

    if (policyNo.startsWith("00")) {
      return null
    } else {
      var policyStripZero = policyNo.replaceFirst("^0+(?!$)", "")
      if (isValidPolicyNumberFormat(policyStripZero)) {
        return policyStripZero
      } else if (isValidPolicyNumberFormat1(policyNo)) {
        return policyNo
      }
    }
    return null
  }

  public static function getValidACCInvoiceNumberFormat(invoiceNumber : String, fileType : InboundFileType) : String {
    if (InboundFileType.NZP == fileType || InboundFileType.WPREM == fileType || InboundFileType.PRMSTMT == fileType || InboundFileType.INTSTMT == fileType || InboundFileType.CRCARD == fileType || InboundFileType.XCPLEVY == fileType || InboundFileType.WPEL == fileType || InboundFileType.DB == fileType || InboundFileType.BC == fileType || InboundFileType.EC == fileType) {
      if (isValidACCGWInvoiceNumberFormat(invoiceNumber)) {
        return invoiceNumber
      } else if (InboundFileType.DB == fileType || InboundFileType.BC == fileType || InboundFileType.EC == fileType) {
        if (isValidACCIPSInvoiceNumberFormat(invoiceNumber)) {
          return invoiceNumber
        } else if (isValidACCPANumberFormat(invoiceNumber)) {
          return invoiceNumber
        }
      } else if (InboundFileType.PRMSTMT == fileType || InboundFileType.INTSTMT == fileType || InboundFileType.WPEL == fileType || InboundFileType.WPREM == fileType || InboundFileType.CRCARD == fileType || InboundFileType.XCPLEVY == fileType || InboundFileType.WPEL == fileType || InboundFileType.NZP == fileType) {
        if (isValidACCIPSInvoiceNumberFormat(invoiceNumber)) {
          return invoiceNumber
        } else if (isValidACCPANumberFormat(invoiceNumber)) {
          return invoiceNumber
        } else {
          if (invoiceNumber.length() == 5) {
            var paInvoiceNumber = "PA" + invoiceNumber
            if (isValidACCPANumberFormat(paInvoiceNumber)) {
              return paInvoiceNumber
            }
          } else {
            var ipsInvoiceNumber = formatIPSInvoiceNumber(invoiceNumber)
            if (isValidACCIPSInvoiceNumberFormat(ipsInvoiceNumber))
              return ipsInvoiceNumber
          }
        }
      }
    }
    return null
  }

  public static function convertTo2decimalCurrency(amount : String) : BigDecimal {
    try {
      var longAmount = new Long(amount.trim())
      return new BigDecimal(longAmount).movePointLeft(2)
    } catch (e : NumberFormatException) {
      throw new Exception("Amount cannot be converted : " + amount, e)
    }
  }

  public static function isValidDateFormat(dateString : String, strDateFormat : String) : boolean {
    try {
      var dateFormatter = new SimpleDateFormat(strDateFormat)
      // dateFormatter.setLenient(false)
      dateFormatter.parse(dateString)
    } catch (e : ParseException) {
      return false
    }
    return true
  }

  public static function isValidDateLength(dateString : String, length : int) : boolean {

    try {
      if ((dateString.replace(" ", "")).length() == length) {
        return true
      } else {
        return false
      }
    } catch (e : Exception) {
      throw new Exception("Date length invalid : " + dateString + e)
    }
  }

  public static function stringToDate(dateString : String, strDateFormat : String) : Date {
    try {
      var format = new SimpleDateFormat(strDateFormat, Locale.ENGLISH);
      return format.parse(dateString);
    } catch (e : ParseException) {
      throw new Exception("Invalid date format : " + dateString, e)
    }
  }

  public static function getValidId(particulars : String, code : String, reference : String, idType : String, fileType : InboundFileType) : String {
    if (idType.equals("INVOICE")) {
      var invoiceNumber : String
      invoiceNumber = InboundUtility.getValidACCInvoiceNumberFormat(particulars, fileType)
      if (invoiceNumber == null)
        invoiceNumber = InboundUtility.getValidACCInvoiceNumberFormat(code, fileType)
      if (invoiceNumber == null)
        invoiceNumber = InboundUtility.getValidACCInvoiceNumberFormat(reference, fileType)
      return invoiceNumber
    } else if (idType.equals("POLICY")) {
      var policyNumber : String
      policyNumber = InboundUtility.getValidPolicyNumberFormat(particulars, fileType)
      if (policyNumber == null)
        policyNumber = InboundUtility.getValidPolicyNumberFormat(code, fileType)
      if (policyNumber == null)
        policyNumber = InboundUtility.getValidPolicyNumberFormat(reference, fileType)
      return policyNumber
    } else if (idType.equals("ACCOUNT")) {
      if (InboundUtility.isValidACCAccountNumberFormat(particulars, fileType))
        return particulars
      else if (InboundUtility.isValidACCAccountNumberFormat(code, fileType))
        return code
      else if (InboundUtility.isValidACCAccountNumberFormat(reference, fileType))
        return reference
      else return null
    }
    return null
  }
}