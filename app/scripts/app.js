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
  'ui.bootstrap',
  'dialogs',
  'ngCsv',
  'ipCookie',
  'ui.router',
  'ct.ui.router.extras',
  'ngGrid',
  'mgo-angular-wizard',
  'ngClipboard',
  'cisco.ui',
  'csDonut'
]);

angular.module('Squared', ['Core']);

angular.module('Huron', ['Core', 'uc.moh', 'uc.device', 'uc.callrouting', 'uc.didadd']);

angular.module('Hercules', ['Core']);

angular.module('Mediafusion', ['Core']);

angular.module('WebExUserSettings', ['Core']);

angular.module('wx2AdminWebClientApp', [
  'Core',
  'Squared',
  'Huron',
  'Hercules',
  'Mediafusion',
  'WebExUserSettings'
]);
