import { PrivateTrunkSetupComponent } from './private-trunk-setup.component';
import { PrivateTrunkDomainComponent } from './private-trunk-domain.component';
import { PrivateTrunkDestinationComponent } from './private-trunk-destination.component';
import 'modules/hercules/private-trunk/_private-trunk.scss';
import privateTrunkPrereq from 'modules/hercules/private-trunk/prereq';
export * from './private-trunk-setup';

export default angular
  .module('hercules.private-trunk-setup', [
    'atlas.templates',
    'collab.ui',
    'pascalprecht.translate',
    privateTrunkPrereq,
  ])
  .component('privateTrunkSetup', new PrivateTrunkSetupComponent())
  .component('privateTrunkDomain', new PrivateTrunkDomainComponent())
  .component('privateTrunkDestination', new PrivateTrunkDestinationComponent())
  .name;
