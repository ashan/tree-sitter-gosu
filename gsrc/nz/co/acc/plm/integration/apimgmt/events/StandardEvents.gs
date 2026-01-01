package nz.co.acc.plm.integration.apimgmt.events

/**
 * Standard events used in API Management integration.
 */
class StandardEvents {
  public static final var ACCOUNTCONTACT_ADDED: String = "AccountContactAdded"
  public static final var ACCOUNTCONTACT_CHANGED: String = "AccountContactChanged"
  public static final var ACCOUNTCONTACT_REMOVED: String = "AccountContactRemoved"

  public static final var ACCOUNTCONTACTROLE_ADDED: String = "AccountContactRoleAdded"
  public static final var ACCOUNTCONTACTROLE_CHANGED: String = "AccountContactRoleChanged"
  public static final var ACCOUNTCONTACTROLE_REMOVED: String = "AccountContactRoleRemoved"

  public static final var ACCOUNTUSERROLEASSIGNMENT_ADDED: String = "AccountUserRoleAssignmentAdded"
  public static final var ACCOUNTUSERROLEASSIGNMENT_CHANGED: String = "AccountUserRoleAssignmentChanged"
  public static final var ACCOUNTUSERROLEASSIGNMENT_REMOVED: String = "AccountUserRoleAssignmentRemoved"

  public static final var ACCREDITATION_ADDED: String = "Accreditation_ACCAdded"
  public static final var ACCREDITATION_CHANGED: String = "Accreditation_ACCChanged"
  public static final var ACCREDITATION_REMOVED: String = "Accreditation_ACCRemoved"

  public static final var NOTE_ADDED: String = "NoteAdded"
  public static final var NOTE_CHANGED: String = "NoteChanged"
  public static final var NOTE_REMOVED: String = "NoteRemoved"
}