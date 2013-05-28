
// EMMISION SCENARIOS
var emmisionScenarios = [{
    name: 'Low B1',
    value: 'b1',
    description: 'Low Emission Scenario'
}, {
    name: 'Medium A1B',
    value: 'a1b',
    description: 'Medium Emission Scenario'
}, {
    name: 'High A2',
    value: 'a2',
    description: 'High Emission Scenario'
}];

// INITIAL MODELS TO DISPLAY
// THIS.VALUE = MODEL.VALUE
var initialDisplayModels = [{
    value: 'bccr_bcm2_0.1', //'ensemble_0',
    zoneIndex: 0
}, {
    value: 'csiro_mk3_0.1', //'ensemble_50',
    zoneIndex: 1
}, {
    value: 'ensemble_100',
    zoneIndex: 2
}];


// FUTURE CLIMATE MODELS
var futureClimateModels = [{
    name: 'Ensemble Average',
    value: 'ensemble_50',
    description: 'ensemble_50'
}, {
    name: 'Ensemble Lowest',
    value: 'ensemble_0',
    description: 'ensemble_0'
}, {
    name: 'Ensemble 20%',
    value: 'ensemble_20',
    description: 'ensemble_20'
}, {
    name: 'Ensemble 40%',
    value: 'ensemble_40',
    description: 'ensemble_40'
}, {
    name: 'Ensemble 60%',
    value: 'ensemble_60',
		description: 'ensemble_60'
}, {
    name: 'Ensemble 80%',
    value: 'ensemble_80',
    description: 'ensemble_80'
}, {
    name: 'Ensemble Highest',
    value: 'ensemble_100',
    description: 'ensemble_100'
}, {
    name: 'BCCR-BCM2.0',
    value: 'bccr_bcm2_0.1',
    description: 'bccr_bcm2_0.1'
}, {
    name: 'CGCM3.1 (T47)',
    value: 'cccma_cgcm3_1.1',
    description: 'cccma_cgcm3_1.1'
}, {
    name: 'CNRM-CM3',
    value: 'cnrm_cm3.1',
		description: 'cnrm_cm3.1'
}, {
    name: 'CSIRO-Mk3.0',
    value: 'csiro_mk3_0.1',
    description: 'csiro_mk3_0.1'
}, {
    name: 'GFDL-CM2.0',
    value: 'gfdl_cm2_0.1',
    description: 'gfdl_cm2_0.1'
}, {
    name: 'GFDL-CM2.1',
    value: 'gfdl_cm2_1.1',
    description: 'gfdl_cm2_1.1'
}, {
    name: 'GISS-ER',
    value: 'giss_model_e_r.1',
    description: 'giss_model_e_r.1'
}, {
    name: 'INM-CM3.0',
    value: 'inmcm3_0.1',
    description: 'inmcm3_0.1'
}, {
    name: 'IPSL-CM4',
    value: 'ipsl_cm4.1',
    description: 'ipsl_cm4.1'
}, {
    name: 'MIROC3.2 (medres)',
    value: 'miroc3_2_medres.1',
    description: 'miroc3_2_medres.1'
}, {
    name: 'ECHO-G',
    value: 'miub_echo_g.1',
    description: 'miub_echo_g.1'
}, {
    name: 'ECHAM5/ MPI-OM',
    value: 'mpi_echam5.1',
    description: 'mpi_echam5.1'
}, {
    name: 'MRI-CGCM2.3.2',
    value: 'mri_cgcm2_3_2a.1',
    description: 'mri_cgcm2_3_2a.1'
}, {
    name: 'CCSM3',
    value: 'ncar_ccsm3_0.1',
    description: 'ncar_ccsm3_0.1'
}, {
    name: 'PCM',
    value: 'ncar_pcm1.1',
    description: 'ncar_pcm1.1'
}, {
    name: 'UKMO-HadCM3',
    value: 'ukmo_hadcm3.1',
    description: 'ukmo_hadcm3.1'
}];

