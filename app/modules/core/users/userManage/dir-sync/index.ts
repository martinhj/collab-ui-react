const UserManageDirSyncController = require('./user-manage-dir-sync.controller');

import * as analyticsModuleName from 'modules/core/analytics';
import * as authinfoModuleName from 'modules/core/scripts/services/authinfo';
import featureToggleModuleName from 'modules/core/featureToggle';
import notificationsModuleName from 'modules/core/notifications';

export default angular.module('core.users.userManage.dir-sync', [
  require('angular-translate'),
  require('@collabui/collab-ui-ng').default,
  analyticsModuleName,
  authinfoModuleName,
  featureToggleModuleName,
  notificationsModuleName,
])
  .controller('UserManageDirSyncController', UserManageDirSyncController)
  .name;
