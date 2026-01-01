package nz.co.acc.dashboard_acc

/**
 * Created by Franklin Manubag on 22/4/2020.
 */
enhancement DashboardMappingEnhancement : DashboardMapping_ACC {
  function addNewFilter() : DashboardJunoWorkFilter_ACC {
    var newFilter = new DashboardJunoWorkFilter_ACC(this.Bundle)
    newFilter.DashboardMapping = this
    this.addToSubjectFilter(newFilter)
    return newFilter
  }
}
