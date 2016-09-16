import { IFeature } from '../../../core/components/featureList/featureList.component';

class PlaceOverview implements ng.IComponentController {

  public services: IFeature[] = [];
  public deviceList: Object = {};

  private currentPlace;
  private csdmHuronUserDeviceService;

  /* @ngInject */
  constructor(
    private $state: ng.ui.IStateService,
    private $stateParams,
    private $translate: ng.translate.ITranslateService,
    private CsdmPlaceService,
    private CsdmHuronPlaceService,
    private CsdmHuronUserDeviceService,
    private XhrNotificationService,
    private CsdmCodeService,
    private WizardFactory
  ) {
    this.currentPlace = $stateParams.currentPlace;
    this.csdmHuronUserDeviceService = CsdmHuronUserDeviceService.create(this.currentPlace.cisUuid);
  }

  public $onInit(): void {
    this.initDeviceList();
    this.initServices();
  }

  private initServices(): void {
    if (this.hasEntitlement('ciscouc')) {
      let service: IFeature = {
        name: this.$translate.instant('onboardModal.call'),
        icon: this.$translate.instant('onboardModal.call'),
        state: 'communication',
        detail: this.$translate.instant('onboardModal.callFree'),
        actionsAvailable: true,
      };
      this.services.push(service);
    }
  }

  private initDeviceList(): void {
    if (this.currentPlace.type === 'cloudberry') {
      this.deviceList = this.currentPlace.devices;
    } else {
      this.deviceList = this.csdmHuronUserDeviceService.getDeviceList();
    }
  }

  public save(newName: string) {
    if (this.currentPlace.type === 'cloudberry') {
      return this.CsdmPlaceService
        .updatePlaceName(this.currentPlace.url, newName)
        .catch(this.XhrNotificationService.notify);
    }
    return this.CsdmHuronPlaceService
      .updatePlaceName(this.currentPlace.url, newName)
      .catch(this.XhrNotificationService.notify);
  }

  public showDeviceDetails(device): void {
    this.$state.go('place-overview.csdmDevice', {
      currentDevice: device,
      huronDeviceService: this.csdmHuronUserDeviceService,
    });
  }

  private hasEntitlement(entitlement: string): boolean {
    let hasEntitlement = false;
    if (this.currentPlace.entitlements) {
      this.currentPlace.entitlements.forEach(element => {
        if (element === entitlement) {
          hasEntitlement = true;
        }
      });
    }
    return hasEntitlement;
  }

  public serviceActions(feature): void {
    this.$state.go('place-overview.' + feature);
  }

  private success(code): void {
    let wizardState = {
      data: {
        function: 'showCode',
        code: code,
        deviceType: this.currentPlace.type,
        deviceName: this.currentPlace.displayName,
        title: 'addDeviceWizard.newCode',
      },
      history: [],
      currentStateName: 'addDeviceFlow.showActivationCode',
      wizardState: {
        'addDeviceFlow.showActivationCode': {},
      },
    };
    let wizard = this.WizardFactory.create(wizardState);
    this.$state.go('addDeviceFlow.showActivationCode', {
      wizard: wizard,
    });
  }

  private error(err): void {
    this.XhrNotificationService.notify(err);
  }

  public onGenerateOtpFn(): void {
    if (this.currentPlace.type === 'cloudberry') {
      this.CsdmCodeService.createCodeForExisting(this.currentPlace.cisUuid)
      .then( (code) => {
        this.success(code);
      }, (err) => {
        this.error(err);
      });
    } else {
      this.CsdmHuronPlaceService.createOtp(this.currentPlace.cisUuid)
      .then( (code) => {
        this.success(code);
      }, (err) => {
        this.error(err);
      });
    }
  }
}

export class PlaceOverviewComponent implements ng.IComponentOptions {
  public controller = PlaceOverview;
  public templateUrl = 'modules/squared/places/overview/placeOverview.html';
}
