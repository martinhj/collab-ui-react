import { LocationDetail } from '../location';
import { LocationsService } from '../locations.service';

import {
  PstnModel,
  PstnService,
  PstnCarrier,
} from 'modules/huron/pstn';

import { HuronSettingsOptionsService } from 'modules/huron/settings/services';
import { IOption } from 'modules/huron/dialing';
import { CompanyNumber } from 'modules/huron/settings/companyCallerId';
import { Notification } from 'modules/core/notifications';

const API_IMPL_SWIVEL = 'SWIVEL';


export class LocationsWizardComponent {
  public controller = LocationsWizardController;
  public templateUrl = 'modules/call/locations/wizard/locationsWizard.html';
  public bindings = {};
}

class LocationsWizardController implements ng.IComponentController {
  public addressFound: boolean;
  public form: ng.IFormController;
  public siteId: string;
  public index: number = 0;
  public animation: string;
  public name: string;
  public settingsOptions = { companyVoicemailOptions: {} };
  public showRegionAndVoicemail: boolean;
  public isTerminusCustomer: boolean;
  public showEmergencyServiceAddress: boolean;
  public showDialPlanChangedDialog: boolean;
  public showVoiceMailDisableDialog: boolean;
  public address = {};
  public companyVoicemailOptions;
  public addressValidated: boolean = false;
  public addressValidating: boolean = false;
  public validationMessages = {
    required: this.$translate.instant('common.invalidRequired'),
  };

  public huronSettingsData: LocationDetail;
  public defaultCountry: string = 'US'; //TODO: KPC What is this for?
  public voicemailToEmail: boolean = false;  //TODO: KPC What is this for?

  private lastIndex = 6;
  /* @ngInject */
  constructor(private $timeout: ng.ITimeoutService,
              private $element: ng.IRootElementService,
              private $state: ng.ui.IStateService,
              private $translate: ng.translate.ITranslateService,
              private $modal,
              private Authinfo,
              private Config,
              private Orgservice,
              private PstnModel: PstnModel,
              private PstnService: PstnService,
              private $q: ng.IQService,
              private HuronSettingsOptionsService: HuronSettingsOptionsService,
              private LocationsService: LocationsService,
              private PstnServiceAddressService,
              private Notification: Notification) {

  }

  public $onInit(): void {
    this.showRegionAndVoicemail = this.Authinfo.getLicenses().filter(license => {
      return license.licenseType === this.Config.licenseTypes.COMMUNICATION;
    }).length > 0;

    const params = {
      basicInfo: true,
    };
    this.Orgservice.getOrg(data => {
      if (data.countryCode) {
        this.PstnModel.setCountryCode(data.countryCode);
      }
    }, null, params);


    this.PstnService.getCustomer(this.Authinfo.getOrgId()).then(() => {
      this.isTerminusCustomer = true;
    });

    this.PstnService.listCustomerCarriers(this.Authinfo.getOrgId()).then(carriers => {
      if (_.get(carriers, '[0].apiImplementation') !== API_IMPL_SWIVEL) {
        this.PstnModel.setProvider(<PstnCarrier>_.get(carriers, '[0]'));
        this.showEmergencyServiceAddress = true;
      } else {
        this.lastIndex = 5;
      }
    }).catch(() => this.lastIndex = 5);

    this.$q.resolve(this.initSettingsComponent());

  }

  private initSettingsComponent(): ng.IPromise<any> {
    return this.HuronSettingsOptionsService.getOptions().then(options => this.settingsOptions = options)
    .then( () => {
      this.huronSettingsData = new LocationDetail();
    });
  }

  public onTimeZoneChanged(timeZone) {
    this.huronSettingsData.timeZone = timeZone;
  }

  public onDateFormatChanged(dateFormat: string): void {
    this.huronSettingsData.dateFormat = dateFormat;
  }

  public onTimeFormatChanged(timeFormat: string): void {
    this.huronSettingsData.timeFormat = timeFormat;
  }

  public onPreferredLanguageChanged(preferredLanguage: string): void {
    this.huronSettingsData.preferredLanguage = preferredLanguage;
  }

  public onDefaultCountryChanged(defaultCountry: string): void {
    this.defaultCountry = defaultCountry;
  }

  public onRoutingPrefixChanged(routingPrefix: string): void {
    this.huronSettingsData.routingPrefix = routingPrefix;
    this.setShowDialPlanChangedDialogFlag();
  }

  public onSteeringDigitChanged(steeringDigit: string): void {
    this.huronSettingsData.steeringDigit = Number(steeringDigit);
    this.setShowDialPlanChangedDialogFlag();
  }

  public onRegionCodeChanged(regionCode: string, useSimplifiedNationalDialing: boolean): void {
    this.huronSettingsData.regionCodeDialing.regionCode = regionCode;
    this.huronSettingsData.regionCodeDialing.simplifiedNationalDialing = useSimplifiedNationalDialing;
    this.setShowDialPlanChangedDialogFlag();
  }

  private setShowDialPlanChangedDialogFlag(): void {
    //let originalConfig = this.HuronSettingsService.getOriginalConfig();
    const originalConfig: any = {};
    if (this.huronSettingsData.steeringDigit !== originalConfig.steeringDigit
      || this.huronSettingsData.routingPrefix !== originalConfig.routingPrefix
      || this.huronSettingsData.regionCodeDialing !== originalConfig.regionCodeDialing) {
      this.showDialPlanChangedDialog = true;
    } else {
      this.showDialPlanChangedDialog = false;
    }
  }

  public onCompanyVoicemailChanged(number: string, voicemailPilotNumberGenerated: boolean, companyVoicemailEnabled: boolean): void {
    this.showVoiceMailDisableDialog = companyVoicemailEnabled;
    if (this.showVoiceMailDisableDialog) {
      this.huronSettingsData.voicemailPilotNumber.number = number;
      this.huronSettingsData.voicemailPilotNumber.voicemailPilotNumberGenerated = voicemailPilotNumberGenerated;
    } else {
      this.huronSettingsData.voicemailPilotNumber.number = '';
      this.huronSettingsData.voicemailPilotNumber.voicemailPilotNumberGenerated = false;
    }
  }

  public onVoicemailToEmailChanged(voicemailToEmail: boolean) {
    this.voicemailToEmail = voicemailToEmail;
  }

  public onCompanyCallerIdChanged(companyNumber: CompanyNumber): void {
    this.huronSettingsData.callerIdNumber = companyNumber.name;
  }

  public onCompanyVoicemailFilter(filter: string): ng.IPromise<IOption[]> {
    return this.HuronSettingsOptionsService.loadCompanyVoicemailNumbers(filter)
      .then(numbers => this.settingsOptions.companyVoicemailOptions = numbers);
  }

  public validateAddress() {
    this.addressValidating = true;
    this.PstnServiceAddressService.lookupAddressV2(this.address, this.PstnModel.getProviderId())
      .then(address => {
        if (address) {
          this.address = address;
          this.addressValidated = true;
          this.addressFound = true;
        } else {
          this.Notification.error('pstnSetup.serviceAddressNotFound');
        }
      })
      .catch(error => this.Notification.errorResponse(error))
      .finally(() => {
        this.addressValidating = false;
      });
  }

  public resetAddr() {
    this.address = {};
    this.addressValidated = false;
    this.addressFound = false;
  }

  public getLastIndex(): number {
    return this.lastIndex;
  }

  public getPageIndex(): number {
    return this.index;
  }

  public previousButton(): any {
    if (this.index === 0) {
      return 'hidden';
    }
    return true;
  }

  public nextButton(): any {
    if (this.index === 6) {
      return this.form && this.form.$valid && this.addressValidated;
    }
    return this.form && this.form.$valid;
  }

  public previousPage(): void {
    this.animation = 'slide-right';
    this.$timeout(() => {
      if (this.index === this.getLastIndex()) {
        //Change the green arrow button to a blue one
        const arrowButton = this.$element.find('button.btn--circle.btn--primary.btn--right');
        arrowButton.removeClass('btn--cta');
        //Hide helpText
        const helpText = this.$element.find('div.btn-helptext.helptext-btn--right');
        helpText.removeClass('active');
        helpText.removeClass('enabled');
      }
      this.index--;
      if ((this.index === 2 && !this.showRegionAndVoicemail) ||
          (this.index === 5 && !this.showRegionAndVoicemail)) {
        this.index--;
      }
    });
  }

  public nextPage(): void {
    this.animation = 'slide-left';
    this.index++;
    if ((this.index === 2 && !this.showRegionAndVoicemail) ||
        (this.index === 5 && !this.showRegionAndVoicemail)) {
      this.index++;
    }
    if (this.index === this.getLastIndex()) {
      //Change the blue arrow button to a green one
      const arrowButton = this.$element.find('button.btn--circle.btn--primary.btn--right');
      arrowButton.addClass('btn--cta');
    }
    if (this.index === this.getLastIndex() + 1) {
      this.saveLocation();
      this.index--;
    }
  }

  private saveLocation() {
    this.LocationsService.createLocation(this.huronSettingsData).then((result) => {
      if (result) {
        this.$state.go('calllocations');
      }
    });
  }

  public cancelModal(): void {
    this.$modal.open({
      templateUrl: 'modules/call/locations/location/locationsCancelModal.html',
      type: 'dialog',
    });
  }
}