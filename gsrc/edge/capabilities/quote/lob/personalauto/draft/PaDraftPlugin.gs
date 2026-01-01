package edge.capabilities.quote.lob.personalauto.draft

uses java.lang.Integer
uses gw.api.productmodel.QuestionSet
uses edge.capabilities.quote.lob.personalauto.draft.dto.PaDraftDataExtensionDTO
uses edge.capabilities.quote.lob.personalauto.draft.util.DriverUtil
uses edge.capabilities.quote.lob.personalauto.draft.util.VehicleUtil
uses edge.capabilities.quote.lob.personalauto.draft.dto.VehicleDTO
uses edge.capabilities.quote.lob.personalauto.draft.dto.DriverDTO
uses java.util.Map
uses edge.util.MapUtil
uses edge.util.helper.SharedAddressesUtil
uses gw.util.Pair
uses edge.util.mapping.ArrayUpdater
uses edge.util.mapping.RefUpdater
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.capabilities.quote.questionset.util.QuestionSetUtil
uses edge.capabilities.quote.person.dto.PersonDTO
uses edge.capabilities.quote.lob.ILobDraftPlugin
uses edge.capabilities.quote.person.util.PersonUtil
uses edge.di.annotations.InjectableNode

/**
 * Personal auto draft plugin. Default implementation of LOBs. This one ignores all
 * data for non-personal auto, so it _can_ be used with the combining/composing plugins.
 */
class PaDraftPlugin implements ILobDraftPlugin <PaDraftDataExtensionDTO> {

  var _vehicleUpdater : ArrayUpdater<PersonalAutoLine,PersonalVehicle,VehicleDTO> as readonly VehicleUpdater
  var _driverUpdater : ArrayUpdater<PersonalAutoLine,PolicyDriver,DriverDTO> as readonly DriverUpdater
  var _driverContactUpdater : RefUpdater<Submission,Person,PersonDTO> as readonly DriverContactUpdater

  @InjectableNode
  construct(authzProvider:IAuthorizerProviderPlugin) {
    _vehicleUpdater = new ArrayUpdater<PersonalAutoLine,PersonalVehicle,VehicleDTO>(authzProvider) {
      : ToRemove = \ line, vehicle -> line.removeVehicle(vehicle),
      : ToCreateAndAdd = \ line, vehicleDto -> line.createAndAddVehicle()
    }

    _driverUpdater = new ArrayUpdater<PersonalAutoLine,PolicyDriver,DriverDTO>(authzProvider){
      : ToRemove = \ line, driver -> line.removePolicyDriver(driver),
      : ToCreateAndAdd = \ line, driverDto -> {
        var submission = line.Branch.Submission
        var policyDriver = getPersonFor(allPersons(submission),submission,driverDto.Person)
        return line.addNewPolicyDriverForContact(policyDriver)
       }
    }

    _driverContactUpdater = new RefUpdater<Submission,Person,PersonDTO>(authzProvider) {
      : AllowedValues = \ sub -> allPersons(sub).Values.toTypedArray(),
      : ToCreate = \ sub, dto -> {
        var p = new Person()
        PersonUtil.updateBaseData(p,dto)
        p.PrimaryAddress = new Address()
        var accountHolderContact = sub.Policy.Account.AccountHolder.AccountContact.Contact
        SharedAddressesUtil.linkAddress(p.PrimaryAddress, accountHolderContact.PrimaryAddress)
        return p
      }
    }

  }


  override function compatibleWithProduct(code : String) : boolean {
    return code == "PersonalAuto"
  }



  override function updateNewDraftSubmission(period : PolicyPeriod, update : PaDraftDataExtensionDTO) {
    if (!period.PersonalAutoLineExists) {
      return
    }
    updateNewDraftSubmissionLine(period, update)
    updateExistingDraftSubmission(period, update)
  }



  override function updateExistingDraftSubmission(period : PolicyPeriod, update : PaDraftDataExtensionDTO) {
    if (!period.PersonalAutoLineExists) {
      return
    }
    updateExistingDraftSubmissionLine(period, update)
  }    
  
  

  override function toDraftDTO(period : PolicyPeriod) : PaDraftDataExtensionDTO {
    if (period.PersonalAutoLine == null) {
      return null
    }

    final var line = period.PersonalAutoLine
    final var res = new PaDraftDataExtensionDTO ()
    res.PreQualQuestionSets = QuestionSetUtil.toAnswersDTO(getLineQuestionSets(period).concat(getPolicyQuestionSets(period)), period)
    res.Drivers = line.PolicyDrivers.map(\d -> DriverUtil.toDTO(d))
    res.Vehicles = line.Vehicles.map(\ v -> VehicleUtil.toDTO(v))
    return res
  }
  

  
  /**
   * Updates a new draft submission for the particular policy line.
   * <p>Do not call sine submission updater as newDraftUpdater would call existingSubmission updater
   * which (in turn) would update submission lines.
   */
  protected function updateNewDraftSubmissionLine(period : PolicyPeriod, update : PaDraftDataExtensionDTO) {
    if (!period.PersonalAutoLineExists) {
      return
    }
    
    final var line = period.PersonalAutoLine
    line.syncQuestions(getLineQuestionSets(period))
    period.syncQuestions(getPolicyQuestionSets(period))
  }
  
  

  protected function updateExistingDraftSubmissionLine(period : PolicyPeriod, update : PaDraftDataExtensionDTO) {
    if (!period.PersonalAutoLineExists || update == null) {
      return
    }
    
    final var line = period.PersonalAutoLine
    QuestionSetUtil.update(line, getLineQuestionSets(period), update.PreQualQuestionSets)
    QuestionSetUtil.update(period, getPolicyQuestionSets(period), update.PreQualQuestionSets)
    
    final var drivers = updateDrivers(period.Submission, line, update.Drivers)
    updateVehicles(period, line, update.Vehicles, drivers)
  }  

  
    
  /** Question sets used for the DTO. */
  protected function getLineQuestionSets(period : PolicyPeriod) : QuestionSet[] {
    return {}
  }



  /** Policy-level question sets. */
  protected function getPolicyQuestionSets(period : PolicyPeriod) : QuestionSet[] {
    return {QuestionSetUtil.getByCode("PAPersonalAutoPreQual")}
  }

  
  /**
   * Updates vehicles for the policy line.
   */
  protected function updateVehicles(period : PolicyPeriod, line : PersonalAutoLine, update : VehicleDTO[], drivers : PolicyDriver[]) {
    final var driverDistribution = distributeDrivers(drivers)
    VehicleUpdater.updateArray(line, line.Vehicles, update, \ vehicle, dto -> {
      vehicle.Drivers.each( \ d -> vehicle.removeFromDrivers(d))
      updateVehicle(vehicle,dto,driverDistribution)
    })
  }
  
  
  
  protected function updateVehicle(veh : PersonalVehicle, dto : VehicleDTO, driversDist : Pair<int, PolicyDriver>[]) {
      VehicleUtil.fill(veh, dto)
      veh.GarageLocation = veh.Branch.PrimaryLocation
      driversDist.each(\ dd -> {
        final var vd = new VehicleDriver(veh.Branch)
        vd.Vehicle = veh
        vd.PolicyDriver = dd.Second
        vd.PercentageDriven = dd.First
      })
  }
  
  
  
  /**
   * Calculates a driver distribution.
   */
  protected function distributeDrivers(drivers : PolicyDriver[]) : Pair<int, PolicyDriver>[] {
    if (drivers.length == 0) {
      return new Pair<int, PolicyDriver>[0]
    }
    
    final var defaultPct = 100 / drivers.length
    final var firstPct = 100 - (defaultPct * (drivers.length - 1))
    
    return drivers.mapWithIndex(\ p, i -> Pair.make(i == 0 ? firstPct : defaultPct, p))
  }

  
  
  /** Returns all available persons on the submission. */
  protected function allPersons(sub : Submission) : Map<String, Person> {
    return MapUtil.groupUnique(
      sub.Policy.Account.AccountContacts*.Contact.where(\ c -> c typeis Person && c.PublicID != null).toSet() , 
        \ i -> i.PublicID, 
        \ i -> i as Person)
  }


  
  /** Updates all drivers on the policy line. */
  private function updateDrivers(sub:Submission, line : PersonalAutoLine, update : DriverDTO[]) : PolicyDriver[]{
    final var persons = allPersons(sub)

    DriverUpdater.updateArray(line,line.PolicyDrivers,update,\ driver, dto -> {
      driver.ContactDenorm = getPersonFor(persons,sub,dto.Person)
      DriverUtil.fill(driver,dto)
    })

    return line.PolicyDrivers
  }
  
  
  
  /**
   * Returns person for the DTO.
   */
  private function getPersonFor(personMap : Map<String, Person>, submission : Submission, goal : PersonDTO) : Person {
    final var accountHolder = submission.Policy.Account.AccountHolder.AccountContact.Contact
    return _driverContactUpdater.updateRef(submission,goal,\ p,dto -> {
      if ( p != accountHolder ) {
        PersonUtil.updateBaseData(p, goal)
      }
    })
  }



}
