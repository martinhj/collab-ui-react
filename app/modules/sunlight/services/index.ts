const SunlightConfigService = require('./sunlightConfigService');
const SunlightReportService = require('./sunlightReportService');
const ConfigServices = require('./sunlightServices');
const VirtualAssistantService = require('./virtualAssistantService');

const urlConfigModule = require('modules/core/config/urlConfig');
const authInfoModule = require('modules/core/scripts/services/authinfo');

export default angular
  .module('sunlight.services', [
    'ngResource',
    urlConfigModule,
    authInfoModule,
  ])
  .service('SunlightConfigService', SunlightConfigService)
  .service('SunlightReportService', SunlightReportService)
  .service('VirtualAssistantService', VirtualAssistantService)
  .factory('ConfigTemplateService', ConfigServices.ConfigTemplateService)
  .factory('VirtualAssistantConfigService', ConfigServices.VirtualAssistantConfigService)
  .factory('ConfigUserService', ConfigServices.ConfigUserService)
  .name;
