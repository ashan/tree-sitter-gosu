package edge.capabilities.policychange.lob.personalauto.draft

uses edge.PlatformSupport.TranslateUtil
uses edge.capabilities.policychange.dto.PolicyChangeHistoryDTO
uses edge.capabilities.policychange.lob.ILobDraftPlugin
uses edge.capabilities.policychange.lob.personalauto.draft.dto.DriverDTO
uses edge.capabilities.policychange.lob.personalauto.draft.dto.PaDraftDataExtensionDTO
uses edge.capabilities.policychange.lob.personalauto.draft.dto.VehicleDTO
uses edge.capabilities.policychange.lob.personalauto.draft.dto.VehicleDriverDTO
uses edge.capabilities.policychange.lob.personalauto.draft.util.DriverUtil
uses edge.capabilities.policychange.lob.personalauto.draft.util.VehicleUtil
uses edge.di.annotations.InjectableNode
uses edge.security.authorization.IAuthorizerProviderPlugin
uses edge.util.mapping.ArrayUpdater
uses edge.util.mapping.EntityCreationContextProvider
uses edge.util.mapping.Mapper
uses gw.api.diff.DiffItem

uses java.lang.IllegalArgumentException
uses java.lang.Math
uses java.util.HashMap
uses edge.capabilities.policychange.lob.personalauto.draft.util.LocationUtil

class PaDraftPlugin implements ILobDraftPlugin <PaDraftDataExtensionDTO> {
  var _entityCreationContextProvider: EntityCreationContextProvider
  var _mapper : Mapper
  var _driverUpdater : ArrayUpdater<PersonalAutoLine,PolicyDriver,DriverDTO>
  var _vehicleUpdater : ArrayUpdater<PersonalAutoLine,PersonalVehicle,VehicleDTO>

  @InjectableNode
  construct(authzProvider:IAuthorizerProviderPlugin) {
    _entityCreationContextProvider = new EntityCreationContextProvider()
    _mapper = new Mapper(authzProvider)
    _driverUpdater = new ArrayUpdater<PersonalAutoLine,PolicyDriver,DriverDTO>(authzProvider){
      :ToRemove = \ line, driver -> line.removePolicyDriver(driver),
      :AllowedValues = \ period -> period.PolicyDrivers,
      :DtoKey = \ dto -> dto.FixedId,
      :EntityKey = \ driver-> driver.FixedId.Value,
      :ToCreateAndAdd = \ line, dto -> {
          if (dto.TempID != null && line.UnassignedDrivers.hasMatch( \ accContact -> accContact.PublicID == dto.TempID)){
            var accountContact = line.UnassignedDrivers.firstWhere( \ acc -> acc.PublicID == dto.TempID)
            var driver = line.addNewPolicyDriverForContact(accountContact.Contact)
            DriverUtil.fill(driver, dto)
            return driver
          } else {
            var driver = line.addNewPolicyDriverOfContactType(ContactType.TC_PERSON)
            var address = new Address()
            var driverContact = driver.AccountContactRole.AccountContact.Contact
            address.linkAddress(line.Branch.PrimaryNamedInsured.ContactDenorm.PrimaryAddress, driverContact)
            driver.AccountContactRole.AccountContact.Contact.PrimaryAddress = address

            if ( dto.ReplacedId != null ) {
              var replacedDriver = line.PolicyDrivers.firstWhere( \ d -> d.FixedId.Value == dto.ReplacedId )
              if ( replacedDriver != null ) {
                replacedDriver.VehicleDrivers.each( \ vd -> {
                  driver.addToVehicleDrivers(vd)
                })
              }
            }
            return driver
          }
      }

    }
    _vehicleUpdater = new ArrayUpdater<PersonalAutoLine, PersonalVehicle, VehicleDTO>(authzProvider){
        :ToRemove = \ line, vehicle -> line.removeVehicle(vehicle),
        :AllowedValues = \ period -> period.Vehicles,
        :DtoKey = \ dto -> dto.FixedId,
        :EntityKey = \ vehicle-> vehicle.FixedId.Value,
        :ToCreateAndAdd = \ line, dto -> {
          var newVehicle = line.createAndAddVehicle()
          if ( dto.VehicleNumber != null ) {
            // Replacing a vehicle
            var replacedVehicle = line.Vehicles.firstWhere( \ veh -> veh.VehicleNumber == dto.VehicleNumber)
            if ( replacedVehicle != null ) {
              // Assign drivers from the replaced vehicle to the replacing vehicle
              replacedVehicle.Drivers.each(\ vd -> newVehicle.addToDrivers(vd))

              // Copy vehicle coverages
              replacedVehicle.copyCoverages({newVehicle})

              newVehicle.VehicleNumber = dto.VehicleNumber
            }
          }  else {
            // Copy coverages of first vehicle into new vehicle
            var firstVehicle = line.Vehicles.sortBy(\ v -> v.VehicleNumber ).first()
            if ( firstVehicle != null ) {
              firstVehicle.copyCoverages({newVehicle})
            }
          }
          return newVehicle
        } 
    }
  }

  override function compatibleWithProduct(code: String): boolean {
    return code == "PersonalAuto"
  }

  override function updateExistingDraftSubmission(period: PolicyPeriod, update: PaDraftDataExtensionDTO) {
    if ( period.PersonalAutoLine == null ) {
      return
    }

    var line = period.PersonalAutoLine

    _driverUpdater.updateArray(line,line.PolicyDrivers,update.Drivers, \ policyDriver, driverDto -> {
      DriverUtil.fill(policyDriver, driverDto)
    })

    _vehicleUpdater.updateArray(line,line.Vehicles, update.Vehicles, \ vehicle, vehicleDto -> {
      VehicleUtil.fill(vehicle, vehicleDto)
    })

    updateVehicleAssignments(period.PersonalAutoLine,update.VehicleDrivers)

    if (update.UpdateGarageLocation) {
      applyPolicyAddressAsGarageLocation(period)
    }

    //Once the line has been updated with vehicles, drivers, etc... finally validate
    //All vehicles have a driver
    line.Vehicles.each( \ vehicle -> {
      if (vehicle.Drivers.hasMatch( \ driver -> driver.DisplayName.Empty) ) {
        throw new IllegalArgumentException(
            TranslateUtil.translate("Web.Policy.PA.Validation.AssignedDrivers")
        )}
    })
    //Additional step validation
/*
    gw.lob.pa.PALineStepsValidator.validateDriversStep(line)
    gw.lob.pa.PALineStepsValidator.validateVehiclesStep(line)
*/
  }

  override function toDraftDTO(period: PolicyPeriod): PaDraftDataExtensionDTO {
    if (period.PersonalAutoLine == null) {
      return null
    }
    var line = period.PersonalAutoLine
    var res = new PaDraftDataExtensionDTO()
    res.Drivers = _mapper.mapArray(line.PolicyDrivers,\ d -> DriverUtil.toDTO(d))
    res.AvailableDrivers = _mapper.mapArray(line.UnassignedDrivers,\ d -> DriverUtil.toUnassignedDriverDTO(d))
    res.Vehicles = _mapper.mapArray(line.Vehicles,\ v -> VehicleUtil.toDto(v))
    res.VehicleDrivers = line.PolicyDrivers*.VehicleDrivers.map( \ elt -> {
      return new VehicleDriverDTO(){
        : DriverID = elt.PolicyDriver.FixedId.Value,
        : VehicleID = elt.Vehicle.FixedId.Value
      }
    })
    return res
  }

  /**
   * Helper function to update the assignments of drivers to vehicles. Assumes that all the vehicles and
   * drivers have been updated previously.
   */
  private function updateVehicleAssignments(line:PersonalAutoLine,assignmentDTOs:VehicleDriverDTO[]) {
    var context = _entityCreationContextProvider.CurrentContext

    //
    // Builds a map with the updated assignments,
    //
    var vehicleAssignment = new HashMap<PersonalVehicle,List<PolicyDriver>>()
    assignmentDTOs.each( \ assignment -> {
      var vehicle : PersonalVehicle
      if ( assignment.VehicleID != null ) {
        // The assignment involves an existing vehicle, find it in the list of vehicles
        vehicle = line.Vehicles.firstWhere( \ v -> v.FixedId.Value == assignment.VehicleID )
      } else {
        // The assignment involves a new vehicle, find it in the context of newly created vehicles
        vehicle = context.forKey(assignment.VehicleTempID)
      }
      var driverList = vehicleAssignment.get(vehicle)
      if ( driverList == null ) {
        driverList = {}
        vehicleAssignment.put(vehicle,driverList)
      }


      var driver : PolicyDriver
      if ( assignment.DriverID != null ) {
        // The assignment involves an existing driver, find it in the list of drivers
        driver = line.PolicyDrivers.firstWhere(\ d -> d.FixedId.Value == assignment.DriverID)
      } else {
        // The assignment involves a new driver, find it in the context of newly created drivers
        driver = context.forKey(assignment.DriverTempID)
      }
      driverList.add(driver)
    })
    // Creates an empty assignment set for the vehicles not found in the assignments list
    line.Vehicles.toSet().subtract(vehicleAssignment.Keys).each(\ v -> vehicleAssignment.put(v,{}))

    //
    // Updates the vehicles using the previously created map.
    //
    vehicleAssignment.eachKeyAndValue( \ vehicle, drivers -> {
      var toRemove = vehicle.Drivers.where( \ vd -> !drivers.contains(vd.PolicyDriver))
      var toAdd = drivers.where( \ d -> !vehicle.Drivers*.PolicyDriver.contains(d))
      toRemove.each( \ vd -> vehicle.removeFromDrivers(vd))
      toAdd.each( \ d -> {vehicle.addPolicyDriver(d).PercentageDriven = 0}) //Instead of adding with the PC default of 100
    })
  }

  /**
   * Helper function to apply the current policy address as the garage location for all vehicles
  */
  private function applyPolicyAddressAsGarageLocation(period: PolicyPeriod) {
    var newLocation = LocationUtil.createFromPolicyAddress(period)

    newLocation.TerritoryCodes.each(\ c -> c.fillWithFirst())

    period.PersonalAutoLine.Vehicles.each( \ vehicle -> {
      vehicle.GarageLocation = newLocation
    })
  }

  override function toHistoryDTO(diff: DiffItem): PolicyChangeHistoryDTO {
    var dto = new PolicyChangeHistoryDTO()
    if (diff.Bean typeis Coverage) {
      var cov = diff.Bean as Coverage
      if (cov.PolicyLine.Pattern.CodeIdentifier == null || !cov.PolicyLine.Pattern.CodeIdentifier.contentEquals("PersonalAutoLine")){
        return null;
      } else {
        mapCoverageHistory(diff, dto)
      }
    } else if (diff.Add){ //Something was added
      if (diff.Bean typeis PersonalVehicle){
        dto.Action = "added"
        dto.EntityType = "vehicle"
        dto.FixedId = (diff.Bean as PersonalVehicle).FixedId.Value
      } else if (diff.Bean typeis PolicyDriver){
        dto.Action = "added"
        dto.EntityType = "driver"
        dto.FixedId = (diff.Bean as PolicyDriver).FixedId.Value
      }
    } else if (diff.Remove){ //Something was removed
      if (diff.Bean typeis PersonalVehicle){
        dto.Action = "removed"
        dto.EntityType = "vehicle"
        dto.ItemName = getVehicleName(diff.Bean)
        dto.FixedId = (diff.Bean as PersonalVehicle).FixedId.Value
      } else if (diff.Bean typeis PolicyDriver){
        dto.Action = "removed"
        dto.EntityType = "driver"
        dto.ItemName = diff.Bean.DisplayName
        dto.FixedId = (diff.Bean as PolicyDriver).FixedId.Value
      }
    } else if (diff.Property){ //Something was changed
      if (diff.Bean typeis PersonalVehicle){
        dto.Action = "changed"
        dto.EntityType = "vehicle"
        dto.FixedId = (diff.Bean as PersonalVehicle).FixedId.Value
        if ( diff.asProperty().PropertyInfo == PersonalVehicle#GarageLocation.PropertyInfo) {
          dto.Action = null;
        }
      } else if (diff.Bean typeis PolicyDriver){
        dto.Action = "changed"
        dto.EntityType = "driver"
        dto.FixedId = (diff.Bean as PolicyDriver).FixedId.Value
      }
    }

    if ( diff.Bean typeis VehicleDriver ) {
      if ( diff.Add || (diff.Remove && diff.Bean.PolicyDriver != null)) {
        dto.Action = "changed"
        dto.EntityType = "driver"
        dto.FixedId = diff.Bean.PolicyDriver.FixedId.Value
      }
    }

    return dto.Action == null ? null : dto
  }

  private function mapCoverageHistory(diff: DiffItem, dto : PolicyChangeHistoryDTO) {
    var cov = diff.Bean as Coverage
    dto.EntityType = "coverage"
    dto.ItemName = diff.Bean.DisplayName
    dto.FixedId = cov.FixedId.Value

    if(diff.Add){
      dto.Action = "added"
    } else if (diff.Remove){
      dto.Action = "removed"
    } else if (diff.Property){
      dto.Action = "changed"
    }

    if (cov.OwningCoverable == null) {
      dto.Action = null
    } else if (!(cov.OwningCoverable typeis PolicyLine)) {
      dto.ParentId = cov.OwningCoverable.FixedId.Value
    }
  }

  private function getVehicleName(vehicle: PersonalVehicle) : String {
    var sb = new java.lang.StringBuffer()
    if (vehicle.Year != null) {
      sb.append(vehicle.Year as int)
    }
    if (vehicle.Make.HasContent) {
      sb.append(vehicle.Make).append(" ")
    }
    if (vehicle.Model.HasContent) {
      sb.append(vehicle.Model).append(" ")
    }
    if (vehicle.LicensePlate.HasContent) {
      sb.append("(").append(vehicle.LicensePlate)
      if (vehicle.LicenseState != null) {
        sb.append("/").append(vehicle.LicenseState.Code)
      }
      sb.append(")")
    }

    return sb.toString()

  }
}
