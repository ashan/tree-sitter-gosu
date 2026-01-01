package nz.co.acc.integration.ir.inbound.transformer

uses gw.util.StreamUtil

uses java.io.BufferedReader
uses java.io.File
uses java.io.FileInputStream
uses java.math.BigDecimal
uses java.time.LocalDate
uses java.time.LocalDateTime
uses java.time.format.DateTimeFormatter
uses java.util.regex.Pattern

class InboundIRUtil {
  static final var IR_DATEFORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd")
  static final var IR_RUNDATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss")

  public static final var IR_CREG_FILENAME_PREFIX : String = "IRDACC_CRE_IR348_EMS_"
  public static final var IR_CARA_4_5_FILENAME_PREFIX : String = "IRDACC_CARA_IR3_IR4_"
  public static final var IR_CARA_6_FILENAME_PREFIX : String = "IRDACC_CARA_IR348_EMS_"
  static final var IR_CARA_4_5_FILENAME_LEVYYEAR_PATTERN = Pattern.compile("^IRDACC_CARA_IR3_IR4_(\\d{2}).*")

  public static function determineFileType(file : File) : IRInboundFeedType_ACC {
    var headerLine : String
    using (var reader = new BufferedReader(StreamUtil.getInputStreamReader(new FileInputStream(file)))) {
      headerLine = reader.readLine()
    }

    if (headerLine == null) {
      throw new IRLoadException("File is empty")
    }

    if (file.Name.startsWith(IR_CREG_FILENAME_PREFIX)) {
      if (headerLine.contains(InboundIRConstants.CREG)) {
        return IRInboundFeedType_ACC.TC_REGISTRATIONS
      } else {
        throw new IRLoadException("Header does not match CREG file type")
      }
    } else if (file.Name.startsWith(IR_CARA_4_5_FILENAME_PREFIX)
        or file.Name.startsWith(IR_CARA_6_FILENAME_PREFIX)) {
      if (headerLine.contains(InboundIRConstants.CARA)) {
        var caraFileHeader = new CARAFileHeader(headerLine)
        return caraFileHeader.IRInboundFeedType
      } else {
        throw new IRLoadException("Header does not match CARA file type")
      }
    } else {
      throw new IRLoadException("Filename does not match IR file type")
    }
  }

  public static function parseIRDate(dateString : String) : LocalDate {
    return LocalDate.from(IR_DATEFORMATTER.parse(dateString))
  }

  public static function parseIRHeaderRunDate(runDate : String, runTime : String) : LocalDateTime {
    return LocalDateTime.from(IR_RUNDATE_FORMATTER.parse(runDate + runTime))
  }

  public static function parseCARAFilenameLevyYear(caraFileName : String) : int {
    if (not caraFileName.startsWith(IR_CARA_4_5_FILENAME_PREFIX)) {
      throw new IRLoadException("Invalid filename for CARA4/5 file: '${caraFileName}'")
    }
    try {
      var matcher = IR_CARA_4_5_FILENAME_LEVYYEAR_PATTERN.matcher(caraFileName)
      matcher.find()
      return matcher.group(1).toInt()
    } catch (e : Throwable) {
      throw new IRLoadException("Failed to parse levy year in filename '${caraFileName}'", e)
    }
  }

  public static function getValidIRDate(value : String) : String {
    if (value?.isBlank() or value == "00000000" or value == "99991231") {
      return null
    } else {
      parseIRDate(value)
      return value
    }
  }

  public static function getDecimalString(value : Optional<BigDecimal>) : String {
    if (value.Present) {
      return value.get().toPlainString()
    } else {
      return ""
    }
  }

}