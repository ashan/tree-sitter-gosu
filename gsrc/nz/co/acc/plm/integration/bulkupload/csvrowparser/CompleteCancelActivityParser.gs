package nz.co.acc.plm.integration.bulkupload.csvrowparser

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.plm.integration.bulkupload.csvtypes.activity.CompleteCancelActivity
uses nz.co.acc.common.integration.bulkupload.error.FieldValidationError
uses nz.co.acc.common.integration.bulkupload.fieldparser.DateParser

class CompleteCancelActivityParser implements IRowParser<CompleteCancelActivity> {

  var dateParser = new DateParser()

  override function parseRow(csvParser: CSVParser): Either<List<FieldValidationError>, CompleteCancelActivity> {
    var activity = new CompleteCancelActivity()
    try {
      var accNumber = csvParser.nextString().trim().toOptional()
      var completeCancel = csvParser.nextString().trim().toOptional()
      var activitySubject = csvParser.nextString().trim().toOptional()
      var activityDescription = csvParser.nextString().trim().toOptional()
      var activityCreationDate = csvParser.nextString().trim().toOptional()
      var activityDueDate = csvParser.nextString().trim().toOptional()
      var activityEscalationDate = csvParser.nextString().trim().toOptional()
      var activityPriority = csvParser.nextString().trim().toOptional()
      var activityRecurring = csvParser.nextString().trim().toOptional()
      var queue = csvParser.nextString().trim().toOptional()
      var user : Optional<String>
      // Try to get the next string. If it doesn't exist, use the default script parameter value
      try {
        user = csvParser.nextString().trim().toOptional()
        if (!user.isPresent()) { // set value if there is no data
          user = Optional.of(ScriptParameters.getParameterValue("BulkCompleteCancelActivityUser_ACC") as String)
        }
      } catch (nsee : NoSuchElementException) {
        user = Optional.of(ScriptParameters.getParameterValue("BulkCompleteCancelActivityUser_ACC") as String)
      }

      var parseErrors = verifyPresenceOfMandatoryFields(
          accNumber, completeCancel, activitySubject, activityPriority)

      accNumber.each(\value -> {
        activity.AccountACCNumber = value
      })

      completeCancel.each(\value -> {
        activity.CompleteCancel = value
      })

      activitySubject.each(\value -> {
        activity.ActivitySubject = value
      })

      activityPriority.each(\value -> {
        activity.ActivityPriority = Priority.get(activityPriority.get())
      })

      if (activityDescription.Present) {
        activityDescription.each(\value -> {
          activity.ActivityDescription = value
        })
      }

      if (activityCreationDate.Present) {
        parseField(parseErrors, dateParser, activityCreationDate,
            \parsedResult -> {
              activity.ActivityCreationDate = parsedResult
            })
      }

      if (activityDueDate.Present) {
        parseField(parseErrors, dateParser, activityDueDate,
            \parsedResult -> {
              activity.ActivityDueDate = parsedResult
            })
      }

      if (activityEscalationDate.Present) {
        parseField(parseErrors, dateParser, activityEscalationDate,
            \parsedResult -> {
              activity.ActivityEscalationDate = parsedResult
            })
      }

      if (activityRecurring.Present) {
        if(activityRecurring.get().toLowerCase().matches("true|false")) {
          activityRecurring.each(\value -> {
            activity.ActivityRecurring = Boolean.parseBoolean(activityRecurring.get())
          })
        } else {
          parseErrors.add(new FieldValidationError("Recurring value is invalid"))
        }
      }

      queue.each(\value -> {
        activity.ActivityQueueOrUser = value
      })

      user.each(\value -> {
        activity.AssignedUser = value
      })

      if (parseErrors.HasElements) {
        return Either.left(parseErrors)
      } else {
        return Either.right(activity)
      }

    } catch (e: NoSuchElementException) {
      return Either.left({new FieldValidationError("Invalid row format. Missing column(s).")
      })
    } catch (e: Exception) {
      return Either.left({new FieldValidationError(e.toString())})
    }
  }

  private function verifyPresenceOfMandatoryFields(
      accNumber: Optional<String>,
      completeCancel: Optional<String>,
      activitySubject: Optional<String>,
      activityPriority: Optional<String>): List<FieldValidationError> {

    var errors: LinkedList<FieldValidationError> = {}

    if (!accNumber.Present) {
      errors.add(new FieldValidationError("ACC number is required"))
    }

    if (!completeCancel.Present) {
      errors.add(new FieldValidationError("CompleteCancel is required"))
    } else if (!completeCancel.get().toLowerCase().matches("complete|cancel")) {
      errors.add(new FieldValidationError("CompleteCancel value is invalid"))
    }

    if (!activitySubject.Present) {
      errors.add(new FieldValidationError("Activity Subject is required"))
    }

    if (!activityPriority.Present) {
      errors.add(new FieldValidationError("Activity Priority is required"))
    } else if (!activityPriority.get().toLowerCase().matches("low|normal|high|urgent")) {
      errors.add(new FieldValidationError("Activity Priority value is invalid"))
    }

    return errors
  }

}