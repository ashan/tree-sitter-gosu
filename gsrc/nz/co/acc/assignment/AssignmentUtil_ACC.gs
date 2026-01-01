package nz.co.acc.assignment

uses gw.assignment.AssignmentUtil
uses typekey.UserRole

/**
 * UserRole assignment filter customized for ACC.
 * <p>
 * Created by Mike Ourednik on 24/02/2021.
 */
class AssignmentUtil_ACC {
  static function filterAssignableRoles(owner : Account, role : typekey.UserRole) : boolean {
    if (role == UserRole.TC_AEPCOMPLIANCEADVISOR and not owner.AEPContractAccount_ACC) {
      return false
    } else {
      return AssignmentUtil.filterAssignableRoles(owner, TC_ACCOUNTEXCLUSIVE, role)
    }
  }

  static function filterAssignableRoles(owner : Job, role : typekey.UserRole) : boolean {
    if (role == UserRole.TC_AEPCOMPLIANCEADVISOR and not owner.Policy.Account.AEPContractAccount_ACC) {
      return false
    } else {
      return AssignmentUtil.filterAssignableRoles(owner, TC_JOBEXCLUSIVE, role)
    }
  }

  static function filterAssignableRoles(owner : Policy, role : typekey.UserRole) : boolean {
    if (role == UserRole.TC_AEPCOMPLIANCEADVISOR and not owner.Account.AEPContractAccount_ACC) {
      return false
    } else {
      return AssignmentUtil.filterAssignableRoles(owner, TC_POLICYEXCLUSIVE, role)
    }
  }
}