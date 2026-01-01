package nz.co.acc.gwer.bulkupload.parser

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.gwer.bulkupload.row.BusinessGroupRow
uses java.text.SimpleDateFormat

/**
 * Created by HamblyAl on 18/03/2019.
 */
class BusinessGroupParser implements IRowParser<BusinessGroupRow> {
  var groupID : Optional<String>
  var dateCreated : Optional<String>
  var staffname : Optional<String>
  var owner : Optional<String>
  var uotype : Optional<String>
  var level : Optional<String>
  var ownership : Optional<String>
  var companyname : Optional<String>
  var accpolicyid : Optional<String>
  var nzbn : Optional<String>
  var companyid : Optional<String>
  var activeinerperiod : Optional<String>
  var removedate : Optional<String>
  var ceaseddate : Optional<String>
  var startDate : Optional<String>
  var endDate : Optional<String>

  override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, BusinessGroupRow> {
    groupID = csvParser.nextString().trim().toOptional()
    dateCreated = csvParser.nextString().trim().toOptional()
    staffname = csvParser.nextString().trim().toOptional()
    owner = csvParser.nextString().trim().toOptional()
    uotype = csvParser.nextString().trim().toOptional()
    level = csvParser.nextString().trim().toOptional()
    ownership = csvParser.nextString().trim().toOptional()
    companyname = csvParser.nextString().trim().toOptional()
    accpolicyid = csvParser.nextString().trim().toOptional()
    nzbn = csvParser.nextString().trim().toOptional()
    companyid = csvParser.nextString().trim().toOptional()
    activeinerperiod = csvParser.nextString().trim().toOptional()
    removedate = csvParser.nextString().trim().toOptional()
    ceaseddate = csvParser.nextString().trim().toOptional()
    startDate = csvParser.nextString().trim().toOptional()
    endDate = csvParser.nextString().trim().toOptional()
    var parseErrors = validateRowData()

    var businessGroupRow = new BusinessGroupRow()
    accpolicyid.each(\value -> {
      businessGroupRow.ACCPolicyID = value
    })
    groupID.each(\value -> {
      businessGroupRow.GroupID = Integer.valueOf(value)
    })
    companyid.each(\value -> {
      businessGroupRow.CompanyID = Integer.valueOf(value)
    })
    activeinerperiod.each(\value -> {
      businessGroupRow.ActiveInERPeriod = value.equalsIgnoreCase("yes")
    })

    if(startDate.Present) {
      startDate.each(\value -> {
        businessGroupRow.StartDate = stringToDate(value)
      })
    }

    if(endDate.Present) {
      endDate.each(\value -> {
        businessGroupRow.EndDate = stringToDate(value)
      })
    }

    if (parseErrors.HasElements) {
      return Either.left(parseErrors)
    } else {
      return Either.right(businessGroupRow)
    }
  }

  private function validateRowData() : List<FieldValidationError> {
    var errors : LinkedList<FieldValidationError> = {}

    if (!accpolicyid.isPresent()) {
      errors.add(new FieldValidationError("ACC Policy ID is required"))
    }

    if (!groupID.isPresent()) {
      errors.add(new FieldValidationError("Group ID is required"))
    }

    if (!activeinerperiod.isPresent()) {
      errors.add(new FieldValidationError("Active in ER Period is required"))
    }

    return errors
  }

  function stringToDate(dateString : String) : Date {
    return new SimpleDateFormat("dd/MM/yyyy").parse(dateString)
  }
}