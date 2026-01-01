package nz.co.acc.validation

uses entity.Contact
uses gw.account.AccountSearchCriteria
uses gw.api.locale.DisplayKey
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.util.GosuStringUtil
uses nz.co.acc.account.AccountUtil
uses nz.co.acc.contact.ContactUtil

/**
 * Created by andy on 13/12/2016.
 * <p>
 * This class will take in a number and validate it as an I.R.D. Number
 * <p>
 * The IRD number format used by Inland Revenue is an eight or nine digit number consisting of the following parts
 * -  A seven or eight digit base number
 * -  A trailing check digit
 **/

/*  Test data from IRD spec
 *
 *  Passes
 *  print(validator.validateParsedIRDNumber_ACC("49091850"))
 *  print(validator.validateParsedIRDNumber_ACC("49-091-850"))
 *  print(validator.validateParsedIRDNumber_ACC("35901981"))
 *  print(validator.validateParsedIRDNumber_ACC("49098576"))
 *  print(validator.validateParsedIRDNumber_ACC("136410132"))
 *  print(validator.validateParsedIRDNumber_ACC("136-410-132"))
 *
 *  fail's
 *  print(validator.validateParsedIRDNumber_ACC("136410133"))
 *  print(validator.validateParsedIRDNumber_ACC("9125568"))
 *  print(validator.validateParsedIRDNumber_ACC("aasdfasdfsd"))
 */

class IRDNumberValidator_ACC {

  private static final var _logger = StructuredLogger.INTEGRATION.withClass(IRDNumberValidator_ACC)

  private static final var ALL_ZEROS : String = "000000000"

  //Set up weight constants
  private static final var primaryWeights : int[] = {3, 2, 7, 6, 5, 4, 3, 2}
  private static final var secondaryWeights : int[] = {7, 4, 3, 2, 5, 2, 7, 6}

  // A public constructor
  construct() {
  }

  /**
   * Start IR number validation - modulus 11 digit check
   * <p>
   * Take in a number as a string and run the number through the validation processes
   *
   * @param parsedIRDNumber
   * @return
   */
  public function validateParsedIRDNumber_ACC(parsedIRDNumber : String) : Boolean {
    var intIRDNumber : int
    var isValidParsedIRDNumber = false

    _logger.debug("Validating IRD Number - " + parsedIRDNumber)

    // Is the param empty
    if (GosuStringUtil.isBlank(parsedIRDNumber)) {
      _logger.debug("IRD Number is Blank or empty")
      return isValidParsedIRDNumber
    }


    // Remove any seperating charactors that may be in the number
    parsedIRDNumber = parsedIRDNumber.replaceAll("[^0-9]", '')


    // Is the IRD number really a number.  Or does it have chars in it.
    if (!parsedIRDNumber.Numeric) {
      _logger.error_ACC("IRD Number is NOT a Number, There are invalid charactors contained in this number")
      return isValidParsedIRDNumber
    }

    // Is the IRD number really a number.  Or does it have chars in it.
    try {
      intIRDNumber = parsedIRDNumber.toInt()
    } catch (e : Exception) {
      _logger.error_ACC("IRD Number is NOT a Number - Exception: " + e)
      return isValidParsedIRDNumber
    }
    
    
    /*
     IR number validation - modulus 11 digit check

     The IRD number format used by Inland Revenue is an eight or nine digit number consisting of the following parts -
     -  A seven or eight digit base number
     -  A trailing check digit
    */


    /* 1. Check the valid range  */

    //If the IRD number is < 10-000-000 or > 150-000-000 then the number is invalid.
    // This step ensures that the IRD number is in the already issued range,
    // or is in the range expected to be issued in the next 10 years.
    if (intIRDNumber < 10000000 or intIRDNumber > 150000000) {
      _logger.error_ACC("IRD Number " + intIRDNumber + " is not valid - must be in range [10,000,000, 150,000,000]")
      return isValidParsedIRDNumber
    }



    /* 2. Form the eight digit base number: */

    // - If the resulting number is seven digits long, pad to eight digits by adding a leading zero.
    if (parsedIRDNumber.size == 8) {
      _logger.info("Padding small IRD number with leading '0'")
      parsedIRDNumber = "0" + parsedIRDNumber
    }


    // Get the last char as the "Check Digit" of the supplied IRD number
    var _checkDigit = Integer.parseInt(parsedIRDNumber.charAt(8))

    var calculatedCheckDigit = 0
    /*  3. Calculate the check digit  */
    // - To each of the base number’s eight digits a weight factor is assigned.
    //      From left to right these are: 3, 2, 7, 6, 5, 4, 3, 2.  See {primaryWeights} Created at start of this class
    // - Sum together the products of the weight factors and their associated digits.
    // - Divide the sum by 11. If the remainder is 0 then the calculated check digit is 0.
    // - If the remainder is not 0 then subtract the remainder from 11, giving the calculated check digit.
    // - If the calculated check digit is in the range 0 to 9, go to step 5.
    calculatedCheckDigit = calculateCheckDigit(parsedIRDNumber, primaryWeights);

    // If the calculated check digit is 10, continue with step 4
    if (calculatedCheckDigit == 10) {
      /* 4. Re-calculate the check digit - using the other weights!  */
      // - To each of the base number’s eight digits a secondary weight factor is assigned. From left to right these are: 7, 4, 3, 2, 5, 2, 7, 6.
      // - Sum together the products of the weight factors and their associated digits.
      // - Divide the sum by 11. If the remainder is 0 then the calculated check digit is 0.
      // - If the remainder is not 0 then subtract the remainder from 11, giving the 00 calculated check digit.
      calculatedCheckDigit = calculateCheckDigit(parsedIRDNumber, secondaryWeights);

      // If the calculated check digit is 10, the IRD number is invalid.
      // Otherwise compare the check didit
      if (calculatedCheckDigit == 10 or calculatedCheckDigit != _checkDigit) {
        _logger.error_ACC("IRD Number is NOT a valid Number - the secondry checksum calculation failed")
        return isValidParsedIRDNumber
      }
    } else {
      /* 5. Compare the check digit  */
      // - Compare the calculated check digit to the last digit of the original IRD number.
      //      If they match, the IRD number is valid.
      if (calculatedCheckDigit != _checkDigit) {
        _logger.error_ACC("IRD Number is NOT a valid Number - the primary checksum calculation failed")
        return isValidParsedIRDNumber
      }
    }


    /*   SUCCESS    */
    // If the code has reached here then the number is a valid IRD number
    isValidParsedIRDNumber = true

    // Return Happy...
    return isValidParsedIRDNumber

  }


  /**
   * Perform a Check Digit Calculation
   *
   * @param sIRDNumber
   * @param weights
   * @return
   */
  private function calculateCheckDigit(sIRDNumber : String, weights : int[]) : int {
    var sum = 0;
    for (i in 0..7) {
      sum += Integer.parseInt(sIRDNumber.charAt(i)) * weights[i]
    }
    var remainder = sum % 11
    if (remainder == 0) {
      return 0;
    }
    return 11 - remainder
  }


  /**
   * Create a display String for the user from an IRD Number
   *
   * @param value
   * @return
   */
  public static function formatIRDNumberForView(value : String) : String {
    var result : String = ""

    if (value == null or !value.NotBlank) {
      return result
    }

    // There may be Odd seperator chars in the number
    value = value.replaceAll("[^0-9]", '')

    // Padd number out to 9 chars - This is for the cheeky bugga that puts chars instead of numbers
    value = (ALL_ZEROS + value)
    // Take only 9 digits
    value = value.substring(value.length() - 9)
    // Add the dashes to make the number "very pretty"
    result = value.substring(0, 3) + "-" + value.substring(3, 6) + "-" + value.substring(6, 9)

    return result
  }

  public function getInputMask() : String {
    return "###-###-###"
  }

  /**
   * Create a display String for the user from an IRD Number
   *
   * @param value
   * @return
   */
  public function formatIRDNumberForModel(value : String) : String {
    if (value.NotBlank) {

      // There may be Odd seperator chars in the number
      value = value.replaceAll("[^0-9]", '')

      // Pad the number to 9 digits or greater - This is for the cheeky bugga that puts chars instead of numbers
      value = (ALL_ZEROS + value)
      // Take only 9 digits
      return value.substring(value.length() - 9)
    }
    return null
  }


  /**
   * This method is to clear out old invalid values as Guidewire does NOT do this
   *
   * @param searchCriteria
   * @param value
   * @return
   */
  public function requestValidationExpression(searchCriteria : AccountSearchCriteria, value : String) : String {

    if (!validateParsedIRDNumber_ACC(formatIRDNumberForModel(value))) {
      searchCriteria.IRDNumber_ACC = null
      return DisplayKey.get("Validator.Account.IRD.Number")
    }
    // Otherwise all is great in the world
    return null
  }

  public function requestValidationExpression(account : Account, value : String) : String {

    if (!validateParsedIRDNumber_ACC(formatIRDNumberForModel(value))) {
      account.IRDNumber_ACC = null
      return DisplayKey.get("Validator.Account.IRD.Number")
    }
    // Otherwise all is great in the world
    return null
  }

  public function requestValidationExpression(checkIRDNumberExists : boolean, account : Account, irdNumber : String) : String {
    var result : String
    //check that the IRD number is valid
    result = requestValidationExpression(account, irdNumber)
    if (result == null and checkIRDNumberExists) {
      //Check that it doesn't already exist as an account
      if (account.AccountHolderContact.Subtype != null
          and !account.AccountHolderContact.DummyContact_ACC
          and AccountUtil.accountExistsWithIRDNumber(irdNumber, account.AccountHolderContact.Subtype)) {
        account.IRDNumber_ACC = null
        result = DisplayKey.get("Validator.Account.IRD.Number.Exists")
      } else {
        // If this account is created from a contact and the ACC number is supplied
        // make sure the converted IRD number matches the ACC number supplied from the contact entiry
        var accNumber = AccountUtil.IRDNumberToACCNumber(irdNumber)
        if (!GosuStringUtil.isEmpty(account.ACCID_ACC)) {
          if (accNumber != account.ACCID_ACC) {
            account.IRDNumber_ACC = null
            result = DisplayKey.get("Validator.Account.ACC.Number.NotMatched")
          }
        } else {
          account.ACCID_ACC = accNumber
        }
      }
    }
    return result
  }

  /**
   * <ol>
   * <li>Validates the IRD number</li>
   * <li>Checks to see if the IRD number already exists in {@link entity.Account} IRDNumber_ACC</li>
   * <li>Converts the IRD number to its corresponding ACC number and checks {@link entity.Contact} ACCID_ACC</li>
   * </ol>
   *
   * @param value The IRD number to validate
   * @return A string containing the error message, null (ok) otherwise
   */
  public function validate(contact : Contact, irdNumber : String) : String {
    var accNumber = AccountUtil.IRDNumberToACCNumber(irdNumber)
    if (!validateParsedIRDNumber_ACC(formatIRDNumberForModel(irdNumber))) {
      return DisplayKey.get("Validator.Account.IRD.Number")
    } else if (!contact.DummyContact_ACC and AccountUtil.accountExistsWithIRDNumber(irdNumber, contact.Subtype)) {
      return DisplayKey.get("Validator.Account.IRD.Number.Exists")
    } else if (ContactUtil.contactExists(accNumber)) {
      return DisplayKey.get("Validator.ACCID_ACC.ContactUniqueACCID", accNumber, contact.Subtype)
    }

    return null
  }

  /**
   * Checks if either {@link entity.Account} or {@link entity.Contact} contains the ACC number
   *
   * @param newValue      The user entered value
   * @param existingValue The existing value in the entity
   * @return true if entity exists
   */
  public function checkACCNumberExists(newACCID : String, existingACCID : String, contactType : typekey.Contact) : String {
    // DE2283 - Allow new contacts with dummy contact ACCID to be created.
    var unknownShareholderACCID = ScriptParameters.getParameterValue("DummyContactACCID_ACC") as String
    if (newACCID == unknownShareholderACCID) {
      return null
    }
    if (newACCID != existingACCID) {
      if (ContactUtil.contactExists(newACCID)) {
        return DisplayKey.get("Validator.ACCID_ACC.ContactUniqueACCID", newACCID, contactType)
      }
    }

    return null
  }

  public function showCreateButton(searchCriteria : AccountSearchCriteria) : boolean {

    if (!searchCriteria.HasMinimumSearchCriteria) {
      return false
    }

    if (searchCriteria.AEPContractAccount_ACC) {
      return true
    }

    if (searchCriteria.IRDNumber_ACC.NotBlank and !validateParsedIRDNumber_ACC(searchCriteria.IRDNumber_ACC)) {
      return false
    }

    return true
  }
}