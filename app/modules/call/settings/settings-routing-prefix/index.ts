import { RoutingPrefixComponent } from './settings-routing-prefix.component';

export default angular
  .module('call.settings.routing-prefix', [
    require('scripts/app.templates'),
    require('collab-ui-ng').default,
    require('angular-translate'),
  ])
  .component('ucRoutingPrefix', new RoutingPrefixComponent())
  .name;