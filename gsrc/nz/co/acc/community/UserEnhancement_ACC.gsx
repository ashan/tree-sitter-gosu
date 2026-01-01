package nz.co.acc.community

uses nz.co.acc.migration.util.MigrationUtil_ACC

/**
 * User enhancement
 */
enhancement UserEnhancement_ACC: entity.User {
  /**
   * Is this a migration user?
   */
  property get MigrationUser(): boolean {
    return this.Credential.UserName.equals("accmigrationuser")
        || this.Credential.UserName.equals("acclivemigrationuser")
  }
}
