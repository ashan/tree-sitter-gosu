package gw.plugin.messaging

uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.plugin.contact.ContactSystemPlugin
uses gw.plugin.Plugins

uses java.lang.Exception

uses gw.api.system.PLConfigParameters
uses gw.datatype.DataTypes
uses gw.webservice.contactapi.beanmodel.XmlBackedInstance
uses gw.webservice.contactapi.beanmodel.anonymous.elements.XmlBackedInstance_Field
uses nz.co.acc.plm.util.AssignableQueueUtils
uses org.apache.commons.lang.ObjectUtils

uses java.util.Date

uses gw.plugin.contact.ContactCommunicationException
uses gw.api.system.PLDependenciesGateway
uses gw.api.database.Query
uses gw.api.system.PCLoggerCategory
uses org.apache.commons.lang.StringUtils

@Export
class ContactMessageTransport implements MessageTransport {
  public static final var DEST_ID : int = 67
  public static final var TRANSACTION_ID_PREFIX : String = PLConfigParameters.PublicIDPrefix.Value + ":"
  private var logger = PCLoggerCategory.CONTACT_SYSTEM

  override function send(message : Message, transformedPayload : String) {
    var contact = message.MessageRoot as Contact
    var updateUser = contact.UpdateUser  // get the update user before the contact modified by api call. So activity can be assigned correctly
    var plugin = Plugins.get(ContactSystemPlugin)
    try {
      switch (message.EventName) {
        case "ContactAdded":
        case "ContactChanged":
          addOrUpdateContactIfNecessary(contact, transformedPayload, getTransactionId(message))
          break
        case "ContactRemoved":
          if (not contact.IsLocalOnly) {
            plugin.removeContact(contact, transformedPayload, getTransactionId(message))
          }
          break
        default:
          logger.error("Unknown Contact Message event: " + message.EventName)
      }
      message.reportAck()
    } catch (ce : ContactCommunicationException) {
      // ChrisA 01/08/2019 NTK-637 Assign Activity to queue START
      // All messages go to the same queue so no need to allow for admin or pleb users
      var assignToQueue = AssignableQueueUtils.getQueueForErrorMessageActivities()
      createActivityAndSendToQueue(contact, transformedPayload, assignToQueue, ce)
      // ChrisA 01/08/2019 NTK-637 Assign Activity to queue END
      message.ErrorDescription = ce.Message?.truncate(255)
      logger.error("Exception occured while sending message to CM", ce)
      message.reportError()

    } catch (e : Exception) {
      message.ErrorDescription = e.StackTraceAsString?.truncate(255)
      logger.error("Exception occured while sending message to CM", e)
      message.reportError()
    }
  }

  // CJA NTK-5039 15/07/2019 force LinkID on update - START
  // CJA NTK-5039 15/07/2019 original addOrUpdateContactIfNecessary method has been decomposed into the 4 functions below to enable GUnit testing
  public function getContactSystemPlugin() : Dynamic {
    return Plugins.get(ContactSystemPlugin)
  }

  public function addLinkID(contact : Dynamic, transformedPayload : String) : String {
    var xmlContact = XmlBackedInstance.parse(transformedPayload)
    if (xmlContact.LinkID == null) {
      xmlContact.updateFieldValue("LinkID", contact.AddressBookUID)
      transformedPayload = xmlContact.asUTFString()
      logger.warn("LinkID was forced into the contact payload (CMS integration) - ${contact}- ${contact.AddressBookUID}")
    }
    return transformedPayload
  }

  public function contactLocalOnly(contact : Dynamic) {
    contact.retryBillingEventMessages()
  }

  public function addOrUpdateContactIfNecessary(contact : Dynamic, transformedPayload : String, transactionID : String) {
    var plugin = getContactSystemPlugin()
    if (contact.ShouldSendToContactSystem and contact.IsLocalOnly) {
      plugin.addContact(contact, transformedPayload, transactionID)
      contactLocalOnly(contact)
    } else if (not contact.IsLocalOnly) {
      transformedPayload = addLinkID(contact, transformedPayload)
      plugin.updateContact(contact, transformedPayload, transactionID)
    }
  }

  private function addOrUpdateContactIfNecessary(contact : Contact, transformedPayload : String, transactionID : String) {
    // CJA NTK-5039 15/07/2019 original method, this has been decomposed into the 4 functions above to enable GUnit testing
    addOrUpdateContactIfNecessary(contact as Dynamic, transformedPayload, transactionID);
  }
  // CJA NTK-5039 15/07/2019 force LinkID on update - END

  private function getTransactionId(message : Message) : String {
    return TRANSACTION_ID_PREFIX + message.ID
  }

  // ChrisA 01/08/2019 NTK-637 Assign Activity to queue START
  private function createActivityAndSendToQueue(contact : Contact, changes : String, assignToQueue : AssignableQueue, e : Exception) {
    createActivity(contact, changes, e, assignToQueue)
  }

  //
// ChrisA 01/08/2019 NTK-637 Assign Activity to queue
// Split createActivity for GUnit testing
  public function createActivity(contact : Contact, payload : String, e : Exception, assignToQueue : AssignableQueue, accountContact : AccountContact) : Activity {

    var activity = accountContact.newActivity(ActivityPattern.finder.getActivityPatternByCode("general_reminder"))
    if (assignToQueue == null) {
      // This is a minor problem since the activity will be created with no assignment and be picked up by a workflow supervisor
      // but we really want this fixed so we don't miss the errors created
      createUrgentActivityAssignToQueueMissing(accountContact)
      logger.error(" Queue configuration error. Queue name is missing. Check script parameter ContactMessageTransportErrorActivityGroup_ACC configuration.  Error message activity for contact:  ${contact} has not been assigned")
    } else {
      activity.assignToQueue(assignToQueue)
    }
    var message = e.Message == null ? e.Class.Name : e.Message
    var description : String
    if (contact.AddressBookUID == null) {

      // Set activity properties for error when adding new contact
      activity.Subject = DisplayKey.get("Web.ContactManager.Error.FailToAddContact.Subject", contact)
      description = DisplayKey.get("Web.ContactManager.Error.FailToAddContact.Description", message)

    } else {

      // Set activity properties for error when updating existing contact
      activity.Subject = DisplayKey.get("Web.ContactManager.Error.FailToUpdateContact.Subject", contact)
      description = DisplayKey.get("Web.ContactManager.Error.FailToUpdateContact.Description", message)

      // Create a note
      var note = activity.newNote()
      note.Subject = DisplayKey.get("Web.ContactManager.Error.FailToUpdateContact.Subject.Note", contact)
      var contactModel = XmlBackedInstance.parse(payload)
      note.Body = createNote(contactModel)
    }
    // Limit the length of activity descrition
    var l = DataTypes.get("mediumtext", {}).asPersistentDataType().Length
    activity.Description = StringUtils.abbreviate(description, l)

    // if we get this far, we've created an activity and can stop
    return activity
  }

  private function createActivity(contact : Contact, payload : String, e : Exception, assignToQueue : AssignableQueue) {
    // ChrisA 01/08/2019 NTK-637 Assign Activity to queue
    // Pruned and transferred to new public method for GUNIT testing
    var query = Query.make(AccountContact).compare(AccountContact#Contact.PropertyInfo.Name, Equals, contact).select()
    if (query.Empty) {
      logger.error("Could not add/update contact ${contact} to ContactManager with payload ${payload}", e)
    } else {
      for (accountContact in query.iterator()) {
        accountContact = contact.Bundle.add(accountContact)
        if (not contact.UpdateUser.canView(accountContact.Account)) {
          continue
        }
        createActivity(contact, payload, e, assignToQueue, accountContact);
      }
    }
  }

  public function createUrgentActivityAssignToQueueMissing(accountContact : AccountContact) : Activity {

    var resultsObj = Query.make(Activity)
        .compare(Activity#Subject, Relop.Equals, DisplayKey.get("Web.ContactManager.Error.AssignToQueueMissing.Subject"))
        .compare(Activity#Status, Relop.Equals, ActivityStatus.TC_OPEN)
        .select().AtMostOneRow
    var activity : Activity
    if (resultsObj == null) {
      // Creates an activity to notify workflow coordinator that the queue name is missing
      activity = accountContact.newActivity(ActivityPattern.finder.getActivityPatternByCode("general_reminder"))
      // Set activity properties for error when updating existing contact
      activity.Subject = DisplayKey.get("Web.ContactManager.Error.AssignToQueueMissing.Subject")
      activity.Description = "Queue name is missing. Check script parameter ContactMessageTransportErrorActivityGroup_ACC configuration. Policy Centre to Contact Manager error message activities cannot be assigned to a queue."
      activity.Priority = Priority.TC_URGENT
    }
    return activity
  }

  // ChrisA 01/08/2019 NTK-637 Assign Activity to queue END
  private function createNote(instance : XmlBackedInstance) : String {
    return "${Date.CurrentDate.toTimeString()} \n" + appendInstanceChanges(instance, "contact")
  }

  private function appendInstanceChanges(instance : XmlBackedInstance, objectPath : String) : String {
    var noteText = ""

    for (field in instance.Field) {
      if (not(isExcludedField(field)) and not ObjectUtils.equals(field.OrigValue, field.Value)) {
        if (field.OrigValue == null) {
          noteText += DisplayKey.get("Web.ContactManager.Info.AddField", "${objectPath}.${field.Name}", field.Value) + "\n"
        } else if (field.Value == null) {
          noteText += DisplayKey.get("Web.ContactManager.Info.RemoveField", "${objectPath}.${field.Name}", field.OrigValue) + "\n"
        } else {
          noteText += DisplayKey.get("Web.ContactManager.Info.UpdateField", "${objectPath}.${field.Name}", field.OrigValue, field.Value) + "\n"
        }
      }
    }
    for (fkItem in instance.Fk) {
      var fkInstance = fkItem.XmlBackedInstance
      if (not ObjectUtils.equals(fkItem.OrigValue, fkInstance.LinkID)) {  // if the FK has changed where it points
        if (fkItem.OrigValue == null) {
          noteText += DisplayKey.get("Web.ContactManager.Info.AddForeignKey", "${objectPath}.${fkItem.Name}", fkInstance.LinkID) + "\n"
        } else if (fkInstance.LinkID == null) {
          noteText += DisplayKey.get("Web.ContactManager.Info.RemoveForeignKey", "${objectPath}.${fkItem.Name}", fkItem.OrigValue) + "\n"
        } else {
          noteText += DisplayKey.get("Web.ContactManager.Info.UpdateForeignKey", "${objectPath}.${fkItem.Name}", fkItem.OrigValue, fkInstance.LinkID) + "\n"
        }
      }
      noteText += appendInstanceChanges(fkInstance, "${objectPath}.${fkItem.Name}")
    }
    for (array in instance.Array) {
      var arrayName = array.Name
      for (arrayItem in array.XmlBackedInstance) {
        var arrayElemID = arrayItem.LinkID == null ? DisplayKey.get("Web.ContactManager.Info.NewElement") : arrayItem.LinkID
        if (arrayItem.Action == "Add") {
          noteText += DisplayKey.get("Web.ContactManager.Info.AddArrayElement", "${objectPath}.${arrayName}") + "\n"
        } else if (arrayItem.Action == "Update") {
          noteText += DisplayKey.get("Web.ContactManager.Info.UpdateArrayElement", "${objectPath}.${arrayName}[${arrayElemID}]") + "\n"
        } else if (arrayItem.Action == "Remove") {
          noteText += DisplayKey.get("Web.ContactManager.Info.RemoveArrayElement", "${objectPath}.${arrayName}[${arrayElemID}]") + "\n"
        } else if (arrayItem.Action != null) {
          noteText += "Unrecognized array action: ${arrayItem.Action}\n"
        }
        noteText += appendInstanceChanges(arrayItem, "${objectPath}.${arrayName}[${arrayElemID}]")
      }
    }

    return noteText
  }

  private function isExcludedField(field : XmlBackedInstance_Field) : boolean {
    return (field.Name == "LinkID" or field.Name == "External_PublicID")
  }

  /**
   * Return the user we would like to assign the activity to if there is a
   * unexpected exception thrown from contact manager. Extract this out
   * so it's easier for customization
   */
  private function getAdminUserForIntegrationHandling() : User {
    return PLDependenciesGateway.getUserFinder().findByCredentialName("admin")
  }

  override function resume() {
    logger.info(ContactMessageTransport.Type.RelativeName + " resumed")
  }

  override function shutdown() {
    logger.info(ContactMessageTransport.Type.RelativeName + " shutdown")
  }

  override function suspend() {
    logger.info(ContactMessageTransport.Type.RelativeName + " suspended")
  }

  override property set DestinationID(destinationID : int) {

  }
}
