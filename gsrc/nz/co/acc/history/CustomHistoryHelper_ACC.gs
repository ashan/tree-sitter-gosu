package nz.co.acc.history

uses entity.Activity
uses entity.Address
uses entity.Contact
uses entity.History
uses gw.api.locale.DisplayKey
uses gw.api.web.util.PCDateFormatUtil
uses gw.i18n.DateTimeFormat
uses gw.pl.persistence.core.Bundle
uses gw.plugin.preupdate.impl.TransactionCallback_ACC
uses nz.co.acc.common.edge.security.BCSSUserProvider_ACC

/**
 * Created by Ian Rainford on 19/12/2016.
 * <p>
 * Helper class to write custom account history
 */
class CustomHistoryHelper_ACC {

  public static function createContactHistory(contact : Contact) {
    if (contact.New) {
      // new entities already have their create user/timestamp logged
      return
    }
    var entityUpdateData = contact.getEntityUpdateData()
    if (entityUpdateData.NewValueMap.isEmpty()) {
      // changed an entity referenced in an array property, which is out of scope
      return
    }
    var history = new History(contact.Bundle)
    history.Type = HistoryType.TC_CUSTOM
    history.CustomType = CustomHistoryType.TC_CONTACT_UPDATED_ACC
    history.EventTimestamp = Date.Now
    history.Contact = contact
    history.OriginalValue = entityUpdateData.OriginalValueMap?.toJson()
    history.NewValue = entityUpdateData.NewValueMap?.toJson()
    history.User = User.util.CurrentUser
    if (BCSSUserProvider_ACC.getBCSSSUser() != null) {
      history.BCSSUser_ACC = BCSSUserProvider_ACC.getBCSSSUser().FullName
    }
  }

  public static function createAddressHistory(address : Address) {
    var entityUpdateData = address.getEntityUpdateData()

    if (address.New or entityUpdateData == null) {
      // new entities already have their create user/timestamp logged
      return
    }

    if (entityUpdateData.NewValueMap.isEmpty()) {
      // changed an entity referenced in an array property, which is out of scope
      return
    }
    var history = new History(address.Bundle)
    history.Type = HistoryType.TC_CUSTOM
    history.CustomType = CustomHistoryType.TC_ADDRESS_UPDATED_ACC
    history.EventTimestamp = Date.Now
    history.Address = address
    history.OriginalValue = entityUpdateData.OriginalValueMap.toJson()
    history.NewValue = entityUpdateData.NewValueMap.toJson()
    history.User = User.util.CurrentUser
  }

  public static function activityHistory(activity : Activity) {
    if (activity.New) {
      var history = new History(activity.Bundle)
      history.Description = DisplayKey.get("Activity.History.Created", activity.Subject)
      history.Type = HistoryType.TC_CUSTOM
      history.CustomType = CustomHistoryType.TC_ACTIVITY_CREATED
      history.EventTimestamp = Date.Now
      history.Activity = activity
      history.User = User.util.CurrentUser
      var history1 = new History(activity.Bundle)
      if (activity.AssignedUser == null) {
        history1.Description = DisplayKey.get("Activity.History.Assigned", activity.Subject, activity.AssignedQueue.DisplayName)
        history1.Type = HistoryType.TC_CUSTOM
        history1.CustomType = CustomHistoryType.TC_ACTIVITY_ASSIGNED
        history1.EventTimestamp = Date.Now
        history1.Activity = activity
        history1.User = User.util.CurrentUser
      } else {
        history1.Description = DisplayKey.get("Activity.History.Assigned", activity.Subject, activity.AssignedUser.DisplayName)
        history1.Type = HistoryType.TC_CUSTOM
        history1.CustomType = CustomHistoryType.TC_ACTIVITY_ASSIGNED
        history1.EventTimestamp = Date.Now
        history1.Activity = activity
        history1.User = User.util.CurrentUser
      }
    } else if (activity.isFieldChanged("Status")) {
      var history = new History(activity.Bundle)
      history.Description = DisplayKey.get("Activity.History.AStatus.Changed", activity.getOriginalValue("Status").toString(), activity.Status.DisplayName)
      history.Type = HistoryType.TC_CUSTOM
      history.CustomType = CustomHistoryType.TC_ACTIVITY_STATUS_CHANGED
      history.EventTimestamp = Date.Now
      history.Activity = activity
      history.User = User.util.CurrentUser
    }
  }

  public static function addActivityAssignmentHistory(activity : Activity) {
    if (((activity.isFieldChanged("AssignedUser")) || (activity.isFieldChanged("AssignedQueue"))) && !activity.New) {
      if (activity.AssignedUser == null) {
        var history = new History(activity.Bundle)
        history.Description = DisplayKey.get("Activity.History.Assigned", activity.Subject, activity.AssignedQueue.DisplayName)
        history.Type = HistoryType.TC_CUSTOM
        history.CustomType = CustomHistoryType.TC_ACTIVITY_ASSIGNED
        history.EventTimestamp = Date.Now
        history.Activity = activity
        history.User = User.util.CurrentUser
      } else {
        var history = new History(activity.Bundle)
        history.Description = DisplayKey.get("Activity.History.Assigned", activity.Subject, activity.AssignedUser.DisplayName)
        history.Type = HistoryType.TC_CUSTOM
        history.CustomType = CustomHistoryType.TC_ACTIVITY_ASSIGNED
        history.EventTimestamp = Date.Now
        history.Activity = activity
        history.User = User.util.CurrentUser
      }
    }
  }

  public static function writeAddressCustomHistory(fields : String[], address : Address, account : Account) {
    final var displayKeyPrefix = "Account.History.Address.Changed"
    final var history : List<HistoryItem> = createHistory(fields, address)
    writeCustomHistory(history, account, displayKeyPrefix)
  }

  public static function writeAccountCustomHistory(fields : String[], account : Account) {
    final var displayKeyPrefix = "Account.History.Account.Changed"
    final var history : List<HistoryItem> = createHistory(fields, account)
    writeCustomHistory(history, account, displayKeyPrefix)
  }

  public static function writeContactCustomHistory(fields : String[], account : Account) {
    final var displayKeyPrefix = "Account.History.AccountHolderContact.Changed"
    final var history : List<HistoryItem> = createHistory(fields, account.AccountHolderContact)
    writeCustomHistory(history, account, displayKeyPrefix)
  }

  private static function writeCustomHistory(history : List<HistoryItem>, entity : com.guidewire.pl.persistence.code.BeanBase, displayKeyPrefix : String) {
    if (entity typeis gw.api.history.CustomHistory) {
      for (historyItem in history) {
        (entity as gw.api.history.CustomHistory).createCustomHistoryEvent(CustomHistoryType.TC_ACCT_CHANGED, \->
            DisplayKey.get("${displayKeyPrefix}.${historyItem.Field}"), historyItem.OldValue, historyItem.NewValue)
      }
    }
  }

  private static function createHistory(fields : String[], entity : com.guidewire.pl.persistence.code.BeanBase) : List<HistoryItem> {
    var history : List<HistoryItem> = new ArrayList<HistoryItem>();
    var changedFields = entity.ChangedFields
    for (fieldToCheck in changedFields) {
      if (fields.contains(fieldToCheck)) {
        var oldValue = ""
        var newValue = ""
        var oldField = entity.getOriginalValue(fieldToCheck)
        var newField = entity.getFieldValue(fieldToCheck)
        if (oldField typeis gw.entity.TypeKey or newField typeis gw.entity.TypeKey) {
          oldValue = (oldField as gw.entity.TypeKey).DisplayName
          newValue = (newField as gw.entity.TypeKey).DisplayName
        } else if (oldField typeis Boolean or newField typeis Boolean) {
          oldValue = (oldField as Boolean) ? "Yes" : "No"
          newValue = (newField as Boolean) ? "Yes" : "No"
        } else if (oldField typeis Date or newField typeis Date) {
          var dateFormat = PCDateFormatUtil.getOutputDateFormat(DateTimeFormat.MEDIUM, null)
          if (oldField != null) oldValue = dateFormat.format((oldField as Date))
          if (newField != null) newValue = dateFormat.format((newField as Date))
        } else if (entity typeis com.guidewire.pl.persistence.code.BeanBase) {
          oldValue = oldField?.toString()
          newValue = newField?.toString()
        } else {
          continue
        }
        history.add(new HistoryItem(fieldToCheck, oldValue, newValue))
      }
    }
    return history
  }

  public static function createPrimaryContactHistory(accountContact : AccountContact, bundle : Bundle, reason:String) {
    var history = new History(bundle)
    history.Type = HistoryType.TC_CUSTOM
    history.CustomType = CustomHistoryType.TC_PRIMARY_CONTACT_CHANGED_ACC
    history.EventTimestamp = Date.Now
    history.Account = accountContact.Account
    history.Contact = accountContact.Contact
    history.Description = DisplayKey.get("AccountContact.Primary.Changed_Has_Reason_ACC", accountContact.Account.PrimaryContact_ACC.DisplayName, reason)
    history.User = User.util.CurrentUser
    if (BCSSUserProvider_ACC.getBCSSSUser() != null) {
      history.BCSSUser_ACC = BCSSUserProvider_ACC.getBCSSSUser().FullName
    }
  }
}