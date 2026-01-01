package edge.capabilities.gpa.account

uses edge.capabilities.helpers.AccountUtil
uses edge.exception.EntityPermissionException
uses edge.di.annotations.ForAllGwNodes

class DefaultAccountRetrievalPlugin implements IAccountRetrievalPlugin {
  @ForAllGwNodes
  construct(){}
  
  override function getAccountByNumber(anAccountNumber: String): Account {
    final var anAccount = AccountUtil.getAccountByAccountNumber(anAccountNumber)
    if(!perm.Account.view(anAccount)){
      throw new EntityPermissionException(){
        : Message = "User does not have permission to view the requested account.",
        : Data = anAccountNumber
      }
    }

    return anAccount
  }
}
