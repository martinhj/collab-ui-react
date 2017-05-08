import { PrivateTrunkPrereqService } from 'modules/hercules/private-trunk/private-trunk-prereq/private-trunk-prereq.service';
import { PrivateTrunkResource, Destination } from 'modules/hercules/private-trunk/private-trunk-setup/private-trunk-setup';
import { PrivateTrunkService } from 'modules/hercules/private-trunk/private-trunk-services';
import { USSService } from 'modules/hercules/services/uss-service';

export interface IDestination {
  address: string;
  name: string;
}

export enum DestinationRadioType {
  NEW = <any>'new',
  HYBRID = <any>'hybrid',
}
const DOMAIN_MAX_LENGTH = 253;
const MIN_PORT = 0;
const MAX_PORT = 65535;
export class PrivateTrunkDestinationCtrl implements ng.IComponentController {
  public privateTrunkResource: PrivateTrunkResource;
  public destinationRadio: DestinationRadioType = DestinationRadioType.NEW;
  public onChangeFn: Function;
  public errorMessages: Object;
  public privateTrunkDestinationform: ng.IFormController;
  public validators: Object;
  public asyncValidators: Object;
  public validationMessages: Object;
  public isSetupFirstTime: boolean;

  /* @ngInject */
  constructor(
    private PrivateTrunkPrereqService: PrivateTrunkPrereqService,
    private PrivateTrunkService: PrivateTrunkService,
    private $translate: ng.translate.ITranslateService,
    private USSService: USSService,
    private Authinfo,
    private $q: ng.IQService,
  ) {}

  public $onInit(): void {
    this.isSetupFirstTime = false;
    if (_.isUndefined(this.privateTrunkResource)) {
      this.privateTrunkResource = new PrivateTrunkResource();
      this.addDestination();
      this.isSetupFirstTime = true;
    }
    this.USSService.getOrg(this.Authinfo.getOrgId()).then(response => {
      this.privateTrunkResource.hybridDestination.address = response.sipDomain;
    });

    this.errorMessages = {
      newAddress: {
        required: this.$translate.instant('common.invalidRequired'),
        pattern: this.$translate.instant('servicesOverview.cards.privateTrunk.error.invalidChars'),
        unique: this.$translate.instant('servicesOverview.cards.privateTrunk.error.invalidUniqueEntry'),
        maxlength: this.$translate.instant('servicesOverview.cards.privateTrunk.error.invalidMaxLength', {
          max: DOMAIN_MAX_LENGTH,
        }),
        portrange: this.$translate.instant('servicesOverview.cards.privateTrunk.error.invalidPort', {
          min: MIN_PORT,
          max: MAX_PORT,
        }),
      },
      name: {
        required: this.$translate.instant('common.invalidRequired'),
      },
      hybrid: {
        required: this.$translate.instant('servicesOverview.cards.privateTrunk.error.hybridRequired'),
      },
    };

    this.validators = {
      pattern: this.invalidCharactersValidation,
      // use arrow function here to auto-bind this
      maxlength: (viewValue: string) => this.domainlengthValidation(viewValue),
      portrange: (viewValue: string) => this.portValidation(viewValue),
    };

    this.asyncValidators = {
      unique: (viewValue: string) => this.uniqueDomainValidation(viewValue),
    };
  }

  public isEmptyHybridAddress() {
    return _.isEmpty(this.privateTrunkResource.hybridDestination.address);
  }

  public $onChanges(changes: { [bindings: string]: ng.IChangesObject }): void {
    const { privateTrunkResource } = changes;

    if (!_.isUndefined(privateTrunkResource)) {
      this.setPrivateTrunkResource(privateTrunkResource);
    }
  }

  public setPrivateTrunkResource(privateTrunkResource: ng.IChangesObject): void {
    this.privateTrunkResource = _.cloneDeep(privateTrunkResource.currentValue);
    if (!_.isUndefined(this.privateTrunkResource) && !_.isEmpty(this.privateTrunkResource.hybridDestination.name)) {
      this.destinationRadio = DestinationRadioType.HYBRID;
    }
  }

  public addDestination(): void {
    let dest = new Destination();
    this.isSetupFirstTime = true;
    this.privateTrunkResource.destinations.push(dest);
  }

  public delete(index): void {
    this.privateTrunkResource.destinations.splice(index, 1);
    this.changeSIPDestination();
  }

  public dismiss(): void {
    this.PrivateTrunkPrereqService.dismissModal();
  }

  public changeDestination(index: number): void {
    if (this.privateTrunkResource.destinations[index].address) {
      let destination = this.privateTrunkResource.destinations[index];
      if ( !_.isEmpty(destination.address) && !_.isEmpty(destination.name)) {
        this.isSetupFirstTime = true;
        this.changeSIPDestination();
      }
    }
  }

  public invalidCharactersValidation(viewValue: string): boolean {
    let value = _.split(viewValue, ':', 2);
    let regex = new RegExp(/^(([a-zA-Z0-9\-]{1,63}[\.]))+([A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z])$/g);
    return regex.test(value[0]);
  }

  public uniqueDomainValidation(viewValue: string): ng.IPromise<boolean> {
    let validateDefer = this.$q.defer();
    this.PrivateTrunkService.isValidUniqueSipDestination(viewValue)
    .then((res) => {
      if (res) {
        validateDefer.resolve();
      } else {
        validateDefer.reject();
      }
    });
    return validateDefer.promise;
  }

  public portValidation(viewValue: string) {
    let port = _.split(viewValue, ':');
    return ((!_.isUndefined(port) && port.length > 1) ? _.inRange(_.toNumber(port[1]), MIN_PORT, MAX_PORT) : true );
  }

  public domainlengthValidation(viewValue) {
    let value = _.split(viewValue, ':', 2);
    return value[0].length <= DOMAIN_MAX_LENGTH;
  }

  public changeSIPDestination(): void {
    if (this.destinationRadio === DestinationRadioType.NEW) {
      this.privateTrunkResource.hybridDestination.name = '';
    } else {
      this.privateTrunkResource.destinations.splice(0);
      this.addDestination();
    }
    this.onChangeFn ({
      privateTrunkResource: this.privateTrunkResource,
    });
  }

}
export class PrivateTrunkDestinationComponent implements ng.IComponentOptions {
  public controller = PrivateTrunkDestinationCtrl;
  public templateUrl = 'modules/hercules/private-trunk/private-trunk-destination/private-trunk-destination.html';
  public bindings = {
    privateTrunkResource: '<',
    onChangeFn: '&',
  };
}