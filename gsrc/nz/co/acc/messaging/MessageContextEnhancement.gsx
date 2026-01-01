package nz.co.acc.messaging

enhancement MessageContextEnhancement : MessageContext {
  property get CreatedBySysUser() : boolean {
    return (this.Root as PolicyPeriod).CreateUser.Credential.UserName.equalsIgnoreCase("sys")
  }
}
