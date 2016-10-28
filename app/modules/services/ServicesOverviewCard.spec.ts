import { ServicesOverviewHybridCard } from './ServicesOverviewHybridCard';
import { ServicesOverviewHybridCallCard } from './hybridCallCard';
import { ServicesOverviewHybridCalendarCard } from './hybridCalendarCard';
import { ServicesOverviewHybridMediaCard } from './hybridMediaCard';

describe('ServiceOverviewCard', () => {

  xdescribe('hybrid cards', () => {
    let cards: Array<{ card: ServicesOverviewHybridCard, services: Array<string> }>;

    let FusionClusterStatesService;

    beforeEach(angular.mock.module('Hercules'));
    beforeEach(inject((_FusionClusterStatesService_) => {
      FusionClusterStatesService = _FusionClusterStatesService_;
    }));

    cards = [
      //hybrid call will be enabled either if one of the dependent services are enabled.
      {
        card: new ServicesOverviewHybridCallCard(FusionClusterStatesService),
        services: ['squared-fusion-uc'],
      },
      {
        card: new ServicesOverviewHybridCalendarCard(FusionClusterStatesService),
        services: ['squared-fusion-cal'],
      }, {
        card: new ServicesOverviewHybridMediaCard(FusionClusterStatesService),
        services: ['squared-fusion-media'],
      },
    ];
    let allServices: Array<string> = ['squared-fusion-uc', 'squared-fusion-ec', 'squared-fusion-cal', 'squared-fusion-media', 'squared-fusion-mgmt'];

    cards.forEach((cardService) => {
      describe('' + cardService.card.name, () => {
        it('should set enable if expected service(s) are enabled', () => {
          let statuses = _.map(cardService.services, (serviceId) => {
            return { serviceId: serviceId, status: '', setup: true };
          });
          cardService.card.hybridStatusEventHandler(statuses);
          expect(cardService.card.active).toBe(true);
        });

        it('should set disable if expected service(s) are disabled', () => {
          let statuses = _.map(cardService.services, (serviceId) => {
            return { serviceId: serviceId, status: '', setup: false };
          });
          cardService.card.hybridStatusEventHandler(statuses);
          expect(cardService.card.active).toBe(false);
        });

        if (cardService.card.name !== 'servicesOverview.cards.hybridManagement.title') {
          //not applicable to mgmt card
          it('should set disable if one of expected service(s) are not setup', () => {
            let enabledFlag = true;
            let statuses = _.map(cardService.services, (serviceId) => {
              enabledFlag = !enabledFlag;
              return { serviceId: serviceId, status: '', setup: enabledFlag };
            });
            cardService.card.hybridStatusEventHandler(statuses);
            expect(cardService.card.active).toBeFalsy();
          });

          it('should set disable if no status from expected services and unexpected services are setup', () => {
            let statuses = _.chain(allServices).difference(cardService.services).map((serviceId) => {
              return { serviceId: serviceId, status: '', setup: true };
            }).value();
            cardService.card.hybridStatusEventHandler(statuses);
            expect(cardService.card.active).toBeFalsy();
          });

          it('should set disable if expected service are disabled and unexpected services are setup', () => {
            let statuses = _.chain(allServices).difference(cardService.services).map((serviceId) => {
              return { serviceId: serviceId, status: '', setup: true };
            }).concat(_.map(cardService.services, (serviceId) => {
              return { serviceId: serviceId, status: '', setup: false };
            })).value();
            cardService.card.hybridStatusEventHandler(statuses);
            expect(cardService.card.active).toBeFalsy();
          });
        }

        it('should set disable no status is received', () => {
          let statuses = _.map(cardService.services, (serviceId) => {
            return { serviceId: serviceId + 'wrong-id', status: '', setup: true };
          });
          cardService.card.hybridStatusEventHandler(statuses);
          expect(cardService.card.active).toBeFalsy();
        });

        it('should set status to undefined if no status is received', () => {
          let statuses = _.map(cardService.services, (serviceId) => {
            return { serviceId: serviceId + 'wrong-id', status: 'ok', setup: true };
          });
          cardService.card.hybridStatusEventHandler(statuses);
          expect(cardService.card.status.status).toEqual(undefined);
        });

        let statuses: any = {
          operational: 'success',
          impaired: 'warning',
          outage: 'danger',
          unknown: 'warning',
        };

        _.forEach(statuses, (cssExpectedStatus: string, status: string) => {
          it('should set status to ' + cssExpectedStatus + ' when ' + status + ' is received', () => {
            let stats = _.map(cardService.services, (serviceId) => {
              return { serviceId: serviceId, status: status, setup: true };
            });
            let tempCard = angular.copy(cardService.card);
            tempCard.hybridStatusEventHandler(stats);
            expect(tempCard.status.status).toEqual(cssExpectedStatus);
          });
        });

        let statusesTxt: any = {
          operational: 'servicesOverview.cardStatus.operational',
          impaired: 'servicesOverview.cardStatus.impaired',
          outage: 'servicesOverview.cardStatus.outage',
          unknown: 'servicesOverview.cardStatus.unknown',
        };

        _.forEach(statusesTxt, (expectedStatusTxt: string, statusTxt: string) => {
          it('should set status text to ' + expectedStatusTxt + ' when ' + statusTxt + ' is received', () => {
            let stats = _.map(cardService.services, (serviceId) => {
              return { serviceId: serviceId, status: statusTxt, setup: true };
            });
            cardService.card.hybridStatusEventHandler(stats);
            expect(cardService.card.status.text).toEqual(expectedStatusTxt);
          });
        });
      });
    });
  });
});