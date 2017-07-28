import { CallLocationNameComponent } from 'modules/call/locations/locations-name/locations-name.component';

export default angular.module('call.locations.name', [
  require('scripts/app.templates'),
  require('collab-ui-ng').default,
])
.component('ucCallLocationName', new CallLocationNameComponent())
.name;