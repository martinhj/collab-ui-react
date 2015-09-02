'use strict';

/**
 * @ngdoc overview
 * @name adminPortalPocApp
 * @description
 * # adminPortalPocApp
 *
 * Main module of the application.
 */

angular.module('Core', [
  'pascalprecht.translate',
  'templates-app',
  'ngAnimate',
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'ngMessages',
  'ui.bootstrap',
  'dialogs',
  'ngCsv',
  'ipCookie',
  'ui.router',
  'ct.ui.router.extras.sticky',
  'ct.ui.router.extras.previous',
  'ngGrid',
  'mgo-angular-wizard',
  'ngClipboard',
  'csDonut',
  'formly',
  'formlyCisco',
  'cisco.ui',
  'timer'
]);

angular.module('Squared', ['Core']);

angular.module('Huron', ['Core', 'uc.moh', 'uc.device', 'uc.callrouting', 'uc.didadd', 'uc.overview', 'uc.callrouter']);

angular.module('Hercules', ['Core']);

angular.module('Mediafusion', ['Core']);

angular.module('WebExUtils', ['Core']);
angular.module('WebExXmlApi', ['Core']);

angular.module('WebExSiteSettings', ['Core']);
angular.module('WebExSiteSettingIframe', ['Core']);

angular.module('WebExUserSettings', ['Core']);
angular.module('WebExUserSettings2', ['Core']);

angular.module('wx2AdminWebClientApp', [
  'Core',
  'Squared',
  'Huron',
  'Hercules',
  'Mediafusion',
  'WebExUtils',
  'WebExXmlApi',
  'WebExSiteSettings',
  'WebExSiteSettingIframe',
  'WebExUserSettings',
  'WebExUserSettings2',
]);
