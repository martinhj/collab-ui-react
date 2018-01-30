import './auto-assign-license-summary.scss';

import { AutoAssignLicenseSummaryComponent } from './auto-assign-license-summary.component';

import licenseSummaryModuleName from 'modules/core/users/userManage/shared/license-summary';
import usersSharedAutoAssignTemplateModuleName from 'modules/core/users/shared/auto-assign-template';

export default angular.module('core.users.userManage.dir-sync.auto-assign-license-summary', [
  require('angular-translate'),
  licenseSummaryModuleName,
  usersSharedAutoAssignTemplateModuleName,
])
  .component('userManageDirSyncAutoAssignLicenseSummary', new AutoAssignLicenseSummaryComponent())
  .name;