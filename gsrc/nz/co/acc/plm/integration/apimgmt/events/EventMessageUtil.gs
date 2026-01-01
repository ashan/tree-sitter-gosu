package nz.co.acc.plm.integration.apimgmt.events

uses entity.Contact
uses nz.co.acc.lob.common.DateUtil_ACC
uses typekey.PolicyLine

/**
 * A utility class for the all event fired rule and message related functions that are re-usable.
 * <p>
 * Created by Kaushalya Samarasekera on 30/10/2017.
 */
class EventMessageUtil {

  /**
   * Finds the most recently updated account-contact association for a given contact. This utility is primarily used to
   * find the best account to associate with event messages that does not have a primary object for safe-ordering.
   * The account returned from this function can be used to set as the account of the event message to enforce safe ordering.
   *
   * @param contact contact to use as starting point find the association. Can be null.
   * @return the account to use for safe ordering. If contact is null, returns null.
   */
  static function getAccountForSafeOrdering(contact: Contact): Account {
    return contact?.AccountContacts?.orderByDescending(\r -> r.UpdateTime).first()?.Account
  }
}