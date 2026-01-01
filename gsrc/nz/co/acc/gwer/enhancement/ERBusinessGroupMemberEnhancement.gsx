package nz.co.acc.gwer.enhancement

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Key

enhancement ERBusinessGroupMemberEnhancement : ERBusinessGroupMember_ACC {
  property get MemberAccountName() : String {
    if(this.AccountID != null and this.AccountID != 0) {
      var accountQuery = Query.make(Account)
          accountQuery.compare(Account#ID, Relop.Equals, new Key(Account, this.AccountID))
      var account = accountQuery.select().FirstResult
      return account.AccountHolderContact.DisplayName
    }
    return null
  }

  function toStringArray() : String[] {
    return {
        Long.toString(this.ERBusinessGroup.ID.Value),
        this.ACCPolicyID_ACC,
        this.MemberAccountName,
        this.CreateTime.toISODate(),
        this.CreateUser.Credential.UserName
    }
  }

  property get Headers() : String[] {
    return {"Business Group", "ACCPolicyID", "Name", "Creation Date", "Created By"}
  }
}
