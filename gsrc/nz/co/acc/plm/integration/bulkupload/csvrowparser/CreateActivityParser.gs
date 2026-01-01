package nz.co.acc.plm.integration.bulkupload.csvrowparser

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.ActivityUploadDTO
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.DateParser
uses nz.co.acc.common.integration.bulkupload.fieldparser.IFieldParser
uses nz.co.acc.plm.integration.bulkupload.fieldparser.ProductCodeParser
uses org.apache.commons.lang3.StringEscapeUtils


class CreateActivityParser implements IRowParser<ActivityUploadDTO> {

  private final var dateParser = new DateParser()
  private final var productCodeParser = new ProductCodeParser()

  override function parseRow(csvParser : CSVParser) : Either<List<FieldValidationError>, ActivityUploadDTO> {

    try {
      var accNumber = csvParser.nextString().trim().toOptional()
      var accountOrPolicyLevel = csvParser.nextString().trim().toOptional()
      var policyType = csvParser.nextString().trim().toOptional()
      var subject = csvParser.nextString().trim().toOptional()
      var description = csvParser.nextString().trim().toOptional()
      var dueDate = csvParser.nextString().trim().toOptional()
      var escalationDate = csvParser.nextString().trim().toOptional()
      var priority = csvParser.nextString().trim().toOptional()
      var recurring = csvParser.nextString().trim().toOptional()
      var queue = csvParser.nextString().trim().toOptional()
//      var activityPattern = csvParser.nextString().trim().toOptional()

      var parseErrors = verifyPresenceOfMandatoryFields(
          accNumber, accountOrPolicyLevel, policyType, subject, priority, queue)

      var activity = new ActivityUploadDTO()

      parseField(parseErrors, productCodeParser, policyType,
          \parsedResult -> {
            activity.Suffix = parsedResult
          })

      parseField(parseErrors, dateParser, dueDate,
          \parsedResult -> {
            activity.DueDate = parsedResult
          })

      parseField(parseErrors, dateParser, escalationDate,
          \parsedResult -> {
            activity.EscalationDate = parsedResult
          })

      accNumber.each(\value -> {
        activity.ACCNumber = value
      })

      accountOrPolicyLevel.each(\value -> {
        activity.AccountOrPolicyLevel = value
      })

      subject.each(\value -> {
        activity.Subject = StringEscapeUtils.unescapeHtml4(value)
      })

      description.each(\value -> {
        activity.Description = StringEscapeUtils.unescapeHtml4(value)
      })

      priority.each(\value -> {
        activity.Priority = Priority.get(priority.get().toLowerCase())
      })

      if (recurring.Present) {
        if (recurring.get().toLowerCase().matches("true|false")) {
          recurring.each(\value -> {
            activity.Recurring = Boolean.parseBoolean(value)
          })
        } else {
          parseErrors.add(new FieldValidationError("Recurring value is invalid"))
        }
      } else {
        recurring.each(\value -> {
          activity.Recurring = false
        })
      }

      queue.each(\value -> {
        activity.AssignedQueue = value
      })

//      activityPattern.each(\value -> {
//        activity.ActivityPattern = value
//      })

      if (parseErrors.HasElements) {
        return Either.left(parseErrors)
      } else {
        return Either.right(activity)
      }

    } catch (e : NoSuchElementException) {
      return Either.left({new FieldValidationError("This row has missing fields. Check that you selected the correct Upload Type.")})
    } catch (e : Exception) {
      return Either.left({new FieldValidationError(e.toString())})
    }
  }

  /**
   * Generic function to parse a single CSV field
   *
   * @param fieldValidationErrors
   * @param fieldParser
   * @param csvInput
   * @param fieldSetter
   * @param <FieldType>
   */
  override function parseField<FieldType>(
      fieldValidationErrors : List<FieldValidationError>,
      fieldParser : IFieldParser<FieldType>,
      csvInput : Optional<String>,
      fieldSetter(fieldValue : FieldType) : void) {

    if (csvInput.isPresent()) {
      var parseResult = fieldParser.parse(csvInput.get())
      if (parseResult.isLeft) {
        fieldValidationErrors.add(parseResult.left)
      } else {
        fieldSetter(parseResult.right)
      }
    }
  }

  private function verifyPresenceOfMandatoryFields(
      accNumber : Optional<String>,
      accountOrPolicyLevel : Optional<String>,
      policyType : Optional<String>,
      subject : Optional<String>,
      priority : Optional<String>,
      queue : Optional<String>) : List<FieldValidationError> {

    var errors : LinkedList<FieldValidationError> = {}

    if (!accNumber.isPresent()) {
      errors.add(new FieldValidationError("ACC Number is required"))
    }

    if (accNumber.Present and accNumber.get().length() < 9) {
      if (!accountOrPolicyLevel.isPresent()) {
        errors.add(new FieldValidationError("AccountOrPolicyLevel is required"))
      } else {
        var accountOrPolicy = accountOrPolicyLevel.get().toLowerCase()
        if (accountOrPolicy.matches("a|p")) {
          if (accountOrPolicy == "p") {
            if (!policyType.isPresent()) {
              errors.add(new FieldValidationError("PolicyType is required"))
            }
          }
        } else {
          errors.add(new FieldValidationError("AccountOrPolicyLevel is wrong type"))
        }
      }
    }

    if (!subject.isPresent()) {
      errors.add(new FieldValidationError("Subject is required"))
    }

    if (!priority.isPresent()) {
      errors.add(new FieldValidationError("Priority value is required"))

    } else if (!priority.get().toLowerCase().matches("low|normal|high|urgent")) {
      errors.add(new FieldValidationError("Wrong priority value"))
    }

    if (!queue.isPresent()) {
      errors.add(new FieldValidationError("Queue is required"))
    }

    return errors
  }

}