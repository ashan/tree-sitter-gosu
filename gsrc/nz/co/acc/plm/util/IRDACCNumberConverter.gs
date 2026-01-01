package nz.co.acc.plm.util



uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.validation.IRDNumberValidator_ACC
uses org.apache.commons.lang3.StringUtils

uses java.lang.invoke.MethodHandles

/**
 * Created by chrisand on 1/03/2019.
 * NTK-2561 Derive unique IR number - Policy Center
 * Taken from the IRD and ACC Number Tools v2.0 app and converted for use in GOSU
 */
class IRDACCNumberConverter {
  private static final var _logger = StructuredLogger.CONFIG.withClass(MethodHandles.lookup().lookupClass())

  private var check_table2 = new HashMap<String, Integer>()
  private var replace_table3 = new HashMap<String, Integer>()
  private var irdNumberValidator = new IRDNumberValidator_ACC()

  // these arrays used for calculating the last digit of the IRD Number
  private var weights1 = {3, 2, 7, 6, 5, 4, 3, 2};
  private var weights2 = {7, 4, 3, 2, 5, 2, 7, 6};

  public static var instance: IRDACCNumberConverter = new IRDACCNumberConverter()

  construct() {

    // set up the tables and arrays for use
    // This table is for the first alpha in the ACC number
    check_table2.put("A", 1)
    check_table2.put("B", 2)
    check_table2.put("C", 3)
    check_table2.put("D", 4)
    check_table2.put("E", 5)
    check_table2.put("F", 6)
    check_table2.put("G", 7)
    check_table2.put("H", 8)
    check_table2.put("J", 9)
    check_table2.put("K", 10)
    check_table2.put("L", 11)
    check_table2.put("M", 12)
    check_table2.put("N", 13)
    check_table2.put("P", 14)
    check_table2.put("Q", 15)
    check_table2.put("R", 16)
    check_table2.put("S", 17)
    check_table2.put("T", 18)
    check_table2.put("U", 19)
    check_table2.put("V", 20)
    check_table2.put("W", 21)
    check_table2.put("X", 22)
    check_table2.put("Y", 23)

    // this table is used for the 2nd alpha in the ACC number
    replace_table3.put("B", 0)
    replace_table3.put("C", 1)
    replace_table3.put("D", 2)
    replace_table3.put("F", 3)
    replace_table3.put("G", 4)
    replace_table3.put("H", 5)
    replace_table3.put("J", 6)
    replace_table3.put("K", 7)
    replace_table3.put("L", 8)
    replace_table3.put("M", 9)
    replace_table3.put("N", 0)
    replace_table3.put("P", 1)
    replace_table3.put("Q", 2)
    replace_table3.put("R", 3)
    replace_table3.put("S", 4)
    replace_table3.put("T", 5)
    replace_table3.put("V", 6)
    replace_table3.put("W", 7)
    replace_table3.put("X", 8)
    replace_table3.put("Z", 9)

  }

  /**
   * Discussed with Matt. Null will be returned if an invalid ACC number is passed in
   * Post release monitoring will pick up whether this is a problem or not
   * and error handling will be created then.
   * Mike also agrees this is not likely to be much of a problem overall
   **/
  function convertToIRDNumber(accNumber: String, validate: Boolean = true): String {
    final var fn = "convertToIRDNumber"

    if (accNumber == null) {
      return null
    }

    if (accNumber.length() != 8) {
      return null
    }

    var derivedIRDNumber = ""
    try {
      derivedIRDNumber = getIRDNum(accNumber);
    } catch (e: Exception) {
      logError(fn, "Error ocurred when converting ${accNumber}: ${e.Message}")
      return null
    }

    if (derivedIRDNumber.length() != 9) {
      // there's an error which can be confirmed by 9999 on the end of the string
      //      if(equivIRDNum.substring(equivIRDNum.length()-4,equivIRDNum.length()).equalsIgnoreCase("9999")){
      //        // there was an error in deriving the IRD number so send an empty string
      //        // and should have already been logged because there's a message generated in the method below
      //      }
      logError(fn, "The IRD number is the wrong length for conversion. It is ${derivedIRDNumber.length()} and should be 9")
      return null

    }
    derivedIRDNumber = StringUtils.leftPad(derivedIRDNumber, 9, "0")

    if (validate) {
      if (irdNumberValidator.validateParsedIRDNumber_ACC(derivedIRDNumber)) {
        _logger.debug( "IRD Number Validation successful for ACCID: ${accNumber} IRD Number: ${derivedIRDNumber}")
      } else {
        logError(fn, "The IRD number failed validation : ${derivedIRDNumber} for ACCID: ${accNumber}")
        return null
      }
    }

    return derivedIRDNumber

  }

  // Get equivalent IRD Number of entered ACC Number
  function getIRDNum(txtACCNum: String): String {
    final var fn = "getIRDNum"
    //Convert entered ACC Number to IRD Number
    // convertACCNumberToFirst8Digits delivers the first 8 digits of the IRD number for the ACC No passed in
    // and this method adds the last digit to complete the conversion
    var subRes = convertACCNumberToFirst8Digits(txtACCNum);
    var curRes = 0;
    var chkMod1 = 0;
    var chkMod2 = 0;
    var chkLstDig = 0;

//    logDebug(fn, "getting the last digit for IRD number : ${subRes}")
    // this step iterates through the 8 digits returned and generate the ninth digit
    // to complete the IRD number
    for (i in 0..subRes.length - 1) {
      curRes = subRes.substring(i, i + 1).toInt();

      chkMod1 += curRes * weights1[i];
      chkMod2 += curRes * weights2[i];
    }
    chkMod1 = chkMod1 % 11;
    chkMod2 = chkMod2 % 11;
    if (chkMod1 == 1 && chkMod2 > 1) {
      chkLstDig = 11 - chkMod2;
    } else {
      if (chkMod1 == 1 && chkMod2 == 0) {
        chkLstDig = 0;
      } else {
        if (chkMod1 > 1) {
          chkLstDig = 11 - chkMod1;
        } else {
          if (chkMod1 == 0) {
            chkLstDig = 0;
          } else {
            chkLstDig = 9999;
            logError(fn, "Failed chkMod1 check. Setting chkLstDig to 9999 : ${subRes}")
          }
        }
      }
    }

    if (chkMod1 == 1 && chkMod2 == 1) {
      logError(fn, "chkMod1 == 1 && chkMod2 == 1. Setting chkLstDig to 9999 : ${subRes}")
    }
//    logDebug(fn, "The last digit for IRD number : ${subRes} is : ${chkLstDig} creating IRD base number ${subRes + chkLstDig}")
    return (subRes + chkLstDig);
  }

  private function convertACCNumberToFirst8Digits(itaIRDACC: String): String {
    final var fn = "convertACCNumberToFirst8Digits"
    //Create the first set of 8 digits for the IRD number based on the ACC Number provided
    var numDig = 0;
    var curDig = "";
    var fstDig = 0;
    var othDig = "";

    // Loop through the ACC number passed in and convert alphas to numbers
    // and put the digits from the ACC number in to a string
    // i.e YQ011404 will have a fstDig of 17 othDig of 2 to make a final string of 2011404
    for (i in 0..itaIRDACC.length - 1) {
      // CJA extract each digit one by one
      curDig = itaIRDACC.substring(i, i + 1)
      // check if it is an alpha so we can get a number value for it or not
      if (curDig.Alpha) {
        // increment the numDig count for 2 leading alpha processing further below
        numDig += 1;
        if (i == 0) {
          // The first time around get a value for the first digit based on the alpha number
          // ie: A will return 1
          fstDig = check_table2[curDig];
        } else {
          // get the 2nd and subsequent digits based on remaining alphas from another table
          // there is currently only 2 alphas in an ACC number- AEP numbers have 10 but Matt assures me these won't be
          // coming in via CREG since they are created in PC
          // ie: X will return 8
          othDig = othDig + replace_table3[curDig];
        }
      } else {
        // it's  a number so collect it by string concatenation
        // so it will be the numberic part of the string
        // ie. S3965377 will be 3965377 not 40
        othDig = othDig + curDig;
      }
    }
    var dig10M = 0;
    var digMod = 0;

    // get a value for dig10M based on  when  dig10M mod 23 +1 = the first alpha number converted
    // it's only used when there are 2 alphas in the ACC Number
    // And when it's used, it's only the first digit in the string that's required
    // i.e it's looking for the first digit of the n value to use when there are two alphas in the ACC number
    for (n in 1..23) {
      // should othDig be 3965377 and will look like this: n3965377 ie 13965377
      dig10M = (n * 10000000) + (1 * othDig.toInt());
      digMod = (dig10M % 23) + 1
      if (digMod == fstDig) {
        break;
      }
    }

//    logDebug(fn, "dig10M is : ${dig10M}, othDig is : ${othDig}, fstDig is ${fstDig}, numDig is ${numDig}")
    var reshuffle = "";
    var deduct1to5 = "";
    var subRes = "";
    // this next step reshuffles the digits from the ACC Number,
    // 6 in the case of a 2 alpha ACC, the last 6 in the case of a 1 alpha ACC Number
    // takes string created when there are 2 alpha's in the ACC number and switches it around
    // YQ011404 is converted to 2011404 and reshuffled to 041401
    // In the case of a single alpha it uses the ACC Number directly reshuffling the last 6 digits
    // S3965377 is reshuffled to 775396
    // if the first digit after being reshuffled = 0 or the reshuffled number is less than 0, 1,000,000 is added to the result
    // then 12345 subtracted from result
    // then 000000 is added to the front of the result
    // then the last 6 digits are taken from the result
    // and finally in the case of the ACC number with
    //    2 alphas the 2nd alpha from the ACC number is taken, converted to a digit and added to the front of the result
    //      Then the first digit of dig10M is taken and added to the front of the result at which point you have the 8 digit number
    //    1 alpha 00000000 + the 2nd digit from the ACC number is added to the front of the result and the last 8 digits are taken to create the 8 digit number

    if (numDig == 2) {
      // there are 2 leading alpha's ie YQ011404
      reshuffle = othDig.substring(5, 7) + othDig.substring(3, 5) + othDig.substring(1, 3);
      if ((reshuffle.substring(0, 1).toInt() == 0) && ((reshuffle.toInt() - 12345) < 0)) {
        // add the calculation to the leading 0's and take the last 6 digits
        var calc = reshuffle.toInt() + 1000000 - 12345
        var calcStr = "000000" + calc
        deduct1to5 = calcStr.substring(calcStr.length() - 6, calcStr.length())
//        logDebug(fn, "In NumDig==2 if: reshuffle is : ${reshuffle}, calc is : ${calc}, calcStr is ${calcStr}, deduct1to5 is ${deduct1to5}")
      } else {
        var calc = reshuffle.toInt() - 12345
        var calcStr = "000000" + calc
        deduct1to5 = calcStr.substring(calcStr.length() - 6, calcStr.length())
//        logDebug(fn, "In NumDig==2 else: reshuffle is : ${reshuffle}, calc is : ${calc}, calcStr is ${calcStr}, deduct1to5 is ${deduct1to5}")
      }
      if (itaIRDACC.substring(1, 2).Alpha) {
        subRes = replace_table3[itaIRDACC.substring(1, 2)] + deduct1to5;
      } else {
        subRes = itaIRDACC.substring(1, 2) + deduct1to5;
      }
      // Take the first digit of the number, so if 17, take 1 and adding to subRes, which should have 7 digits already
      var convertdig10M = Integer.toString(dig10M)
      subRes = convertdig10M.substring(0, 1) + subRes;
//      logDebug(fn, "In NumDig==2 wrap: convertdig10M is : ${convertdig10M}, subRes is : ${subRes}")
    } else {
      // there is only 1 alpha in the ACC Number
      reshuffle = itaIRDACC.substring(6, 8) + itaIRDACC.substring(4, 6) + itaIRDACC.substring(2, 4);
      if ((reshuffle.substring(0, 1).toInt() == 0) && ((reshuffle.toInt() - 12345) < 0)) {
        var calc = reshuffle.toInt() + 1000000 - 12345
        var calcStr = "000000" + calc
        deduct1to5 = calcStr.substring(calcStr.length() - 6, calcStr.length())
//        logDebug(fn, "In NumDig==1 if: reshuffle is : ${reshuffle}, calc is : ${calc}, calcStr is ${calcStr}, deduct1to5 is ${deduct1to5}")
      } else {
        var calc = reshuffle.toInt() - 12345
        var calcStr = "000000" + calc
        deduct1to5 = calcStr.substring(calcStr.length() - 6, calcStr.length())
//        logDebug(fn, "In NumDig==1 else: reshuffle is : ${reshuffle}, calc is : ${calc}, calcStr is ${calcStr}, deduct1to5 is ${deduct1to5}")
      }
      var calc2 = "00000000" + itaIRDACC.substring(1, 2) + deduct1to5
      subRes = calc2.substring(calc2.length() - 8, calc2.length())
//      logDebug(fn, "In NumDig==1 wrap: calc2 is : ${calc2}, subRes is : ${subRes}")
    }
    return subRes;
  }

  private function logDebug(fn: String, msg: String) {
    _logger.debug( msg)
  }

  private function logError(fn: String, msg: String) {
    _logger.error_ACC(msg)
  }

}