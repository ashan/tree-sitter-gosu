package nz.co.acc.gwer.enhancement

enhancement ERBusinessGroupEnhancement : ERBusinessGroup_ACC {

  function createAndAddNewMember() : ERBusinessGroupMember_ACC {
    var member = new ERBusinessGroupMember_ACC()
    member.ERBusinessGroup = this
    this.addToMembers(member)
    return member
  }

  function getMembersByLevyYear(levyYear : int) : ERBusinessGroupMember_ACC[] {
    return this.Members.where(\elt -> (elt.MembershipStart.LevyYear_ACC >= levyYear and elt.MembershipEnd == null) or
                               (elt.MembershipStart.LevyYear_ACC >= levyYear and elt.MembershipEnd.LevyYear_ACC <= levyYear))
  }

  property get EarliestMemberYear() : int {
  //    if(this.Members.HasElements and !this.Members.hasMatch(\elt -> elt.MembershipStart == null)) {
  //      return this.Members*.MembershipStart.orderBy(\elt -> elt.LevyYear_ACC).first().YearOfDate
  //    }
    return 2012
  }
}