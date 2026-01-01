package nz.co.acc.er.businessgroup

uses nz.co.acc.er.ERUtils_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcController_ACC

uses java.io.Serializable


class BusinessGroup_ACC implements Serializable {

  private var _businessGroupId : Integer as BusinessGroupID

  private var _selectedLevyYear : Integer as SelectedLevyYear

  private var _groupMembers : GroupMember_ACC[] as GroupMembers

  construct() {
  }

  construct(groupId : Integer) {
    this.BusinessGroupID = groupId
  }

  property get AllGroupMembers() : GroupMember_ACC[] {
    var controller = new StoreProcController_ACC()
    GroupMembers = controller.getAllGroupMembers(this.BusinessGroupID)
    return GroupMembers
  }

  function filterMemberByLevyYear() : GroupMember_ACC[] {
    var groupMembers = new ArrayList<GroupMember_ACC>()
    if(this.SelectedLevyYear == null) {
      groupMembers.addAll(this.GroupMembers.toList())
    } else {
      var startDateOfLevyYear = ERUtils_ACC.getStartDateOfLevyYear(this.SelectedLevyYear)
      this.GroupMembers.each(\gm -> {
        var include = true
        if(gm.GroupStartDate.after(startDateOfLevyYear)) {
          include = include && false
        }
        if(gm.GroupEndDate != null and gm.GroupEndDate.before(startDateOfLevyYear)) {
          include = include && false
        }
        if(include) {
          groupMembers.add(gm)
        }
      })
    }
    return groupMembers.toTypedArray()
  }
}