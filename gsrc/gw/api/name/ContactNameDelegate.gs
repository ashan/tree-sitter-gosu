package gw.api.name

@Export
class ContactNameDelegate implements ContactNameFields {
  private var _contact : Contact

  construct(contact : Contact) {
    _contact = contact
  }
  
  override property get Name() : String {
    return _contact.Name
  }

  override property set Name(value : String) {
    _contact.Name = value
  }

  override property get NameKanji() : String {
    return _contact.NameKanji
  }

  override property set NameKanji(value : String) {
    _contact.NameKanji = value
  }
  override property get Migrated_ACC(): boolean {
    return _contact.Migrated_ACC
  }

  override property set Migrated_ACC(value: boolean) {
    _contact.Migrated_ACC = value
  }
}
