package nz.co.acc.er.dbconnectionhandler

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException

/**
 * Create an error message for the error code we receive from ER Sql Server
 */
class StoreProcErrorCodes_ACC {

  private static var _errorCodes: HashMap<int, String> as ErrorCodes = new HashMap<int, String>()

  private construct() { }

  private static function populator() {
    _errorCodes.put(99500, DisplayKey.get("Web.Experiencerating.Error.Period.Date.Overlay_ACC"))
    _errorCodes.put(99501, DisplayKey.get("Web.Experiencerating.Error.Period.Date.Overlay_ACC"))
    _errorCodes.put(99502, DisplayKey.get("Web.Experiencerating.Error.Period.Date.Overlap.Existing_ACC"))
    _errorCodes.put(99504, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99504))
    _errorCodes.put(99800, DisplayKey.get("Web.Experiencerating.Error.Period.Date.Overlay_ACC"))
    _errorCodes.put(99505, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99505))
    _errorCodes.put(99506, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99506))
    _errorCodes.put(99507, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99507))
    _errorCodes.put(99508, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99508))
    _errorCodes.put(99509, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99509))
    _errorCodes.put(99510, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99510))
    _errorCodes.put(99511, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99511))
    _errorCodes.put(99512, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99512))
    _errorCodes.put(99513, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99513))
    _errorCodes.put(99514, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99514))
    _errorCodes.put(99515, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99515))
    _errorCodes.put(99516, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99516))
    _errorCodes.put(99517, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99517))
    _errorCodes.put(99518, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99518))
    _errorCodes.put(99519, DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", 99519))

    _errorCodes.put(99520, DisplayKey.get("Web.ExperienceRating.Error.SQL.99520_ACC"))
    _errorCodes.put(99521, DisplayKey.get("Web.ExperienceRating.Error.SQL.99521_ACC"))
    _errorCodes.put(99522, DisplayKey.get("Web.ExperienceRating.Error.SQL.99522_ACC"))
    _errorCodes.put(99523, DisplayKey.get("Web.ExperienceRating.Error.SQL.99523_ACC"))
    _errorCodes.put(99524, DisplayKey.get("Web.ExperienceRating.Error.SQL.99524_ACC"))
    _errorCodes.put(99525, DisplayKey.get("Web.ExperienceRating.Error.SQL.99525_ACC"))
    _errorCodes.put(99526, DisplayKey.get("Web.ExperienceRating.Error.SQL.99526_ACC"))
    _errorCodes.put(99527, DisplayKey.get("Web.ExperienceRating.Error.SQL.99527_ACC"))
    _errorCodes.put(99528, DisplayKey.get("Web.ExperienceRating.Error.SQL.99528_ACC"))
    _errorCodes.put(99529, DisplayKey.get("Web.ExperienceRating.Error.SQL.99529_ACC"))
    _errorCodes.put(99530, DisplayKey.get("Web.ExperienceRating.Error.SQL.99530_ACC"))
    _errorCodes.put(99531, DisplayKey.get("Web.ExperienceRating.Error.SQL.99531_ACC"))
    _errorCodes.put(99532, DisplayKey.get("Web.ExperienceRating.Error.SQL.99532_ACC"))
    _errorCodes.put(99533, DisplayKey.get("Web.ExperienceRating.Error.SQL.99533_ACC"))

    _errorCodes.put(99999, DisplayKey.get("Web.ExperienceRating.Error.SQL.General.Error_ACC"))

  }

  public static function getDisplayableException(code : int) : DisplayableException {

    if (_errorCodes.size()==0) {
      populator()
    }

    if (!_errorCodes.containsKey(code)) {
      return new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error.No.Key.Defined_ACC", code))
    }
    return new DisplayableException(DisplayKey.get(_errorCodes.get(code)))
  }

}
