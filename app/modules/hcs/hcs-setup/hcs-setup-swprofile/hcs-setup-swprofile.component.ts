import { ISoftwareProfile, SoftwareProfile, IApplicationVersion, ISoftwareAppVersion } from 'modules/hcs/hcs-shared/hcs-swprofile';
import { HcsUpgradeService } from 'modules/hcs/hcs-shared';
import { EApplicationTypes } from 'modules/hcs/hcs-shared/hcs-upgrade';

interface IVersions {
  cucm: string[];
  imp: string[];
  ucxn: string[];
  plm: string[];
  cer: string[];
  expway: string[];
}
interface ISelectedVersion {
  cucm: string;
  imp: string;
  ucxn: string;
  plm: string;
  cer: string;
  expway: string;
}

export class HcsSetupSwprofileController implements ng.IComponentController {
  public readonly MAX_LENGTH: number = 50;
  public selectedProfile: SoftwareProfile;
  public changedProfile: SoftwareProfile;
  public onChangeFn: Function;
  public placeholder: any;
  public hcsProfileForm: ng.IFormController;
  public errors: Object;
  public swprofile: ISoftwareProfile;
  public allVersions: IApplicationVersion[];
  public hcstoggle2: boolean = false;
  public versions: IVersions = {
    cucm: [],
    imp: [],
    ucxn: [],
    plm: [],
    cer: [],
    expway: [],
  };
  public selectedVersion: ISelectedVersion = {
    cucm: '',
    imp: '',
    ucxn: '',
    plm: '',
    cer: '',
    expway: '',
  };

   /* @ngInject */
  constructor(
    public $translate: ng.translate.ITranslateService,
    private HcsUpgradeService: HcsUpgradeService,
    private $state: ng.ui.IStateService,
  ) {
  }

  public $onInit() {
    this.placeholder = {
      cucm: this.$translate.instant('hcs.softwareProfiles.cucmPlace'),
      imp: this.$translate.instant('hcs.softwareProfiles.impPlace'),
      ucxn: this.$translate.instant('hcs.softwareProfiles.ucxnPlace'),
      plm: this.$translate.instant('hcs.softwareProfiles.plmPlace'),
      cer: this.$translate.instant('hcs.softwareProfiles.cerPlace'),
      expway: this.$translate.instant('hcs.softwareProfiles.expwayPlace')};
    this.errors = {
      required: this.$translate.instant('common.invalidRequired'),
      maxlength: this.$translate.instant('common.invalidMaxLength', {
        max: this.MAX_LENGTH,
      }),
    };
    if (!_.isUndefined(this.swprofile) && this.swprofile) {
      this.HcsUpgradeService.getSoftwareProfile(_.get(this.swprofile, 'uuid'))
      .then(resp => {
        this.selectedProfile = _.clone(resp);
        this.changedProfile = _.clone(this.selectedProfile);
        this.changedProfile.applicationVersions = [];
        const appVersions: IApplicationVersion[] = _.get(this.selectedProfile, 'applicationVersions');
        this.selectedVersion = {
          cucm: _.get(_.find(appVersions, ['typeApplication', EApplicationTypes.CUCM]), 'fileName'),
          imp: _.get(_.find(appVersions, ['typeApplication', EApplicationTypes.IMP]), 'fileName'),
          ucxn: _.get(_.find(appVersions, ['typeApplication', EApplicationTypes.CUC]), 'fileName'),
          plm: '',
          cer: '',
          expway: '',
        };
      });
    }
    if (this.$state.current.name !== 'swprofilelist') {
      this.changedProfile = new SoftwareProfile({ name: '', applicationVersions: [] });
    }
    this.listAppVersions();
  }

  public listAppVersions(): void {
    this.HcsUpgradeService.listAppVersions().then(resp => {
      this.allVersions = _.get(resp, 'applicationVersions');
      this.versions.cucm = _.map(this.getAppVersion(EApplicationTypes.CUCM), 'fileName');
      this.versions.imp = _.map(this.getAppVersion(EApplicationTypes.IMP), 'fileName');
      this.versions.ucxn = _.map(this.getAppVersion(EApplicationTypes.CUC), 'fileName');
    });
  }

  public getAppVersion(appType: string): any[] {
    return _.get(_.find(this.allVersions, item => item.typeApplication === appType), 'fileData');
  }

  public processName(): void {
    this.onChangeFn({
      swprofile: this.changedProfile,
    });
  }

  public processChange(typeApp: string, name: string) {
    if (!_.isUndefined(this.changedProfile) && this.changedProfile.applicationVersions) {
      const ver: ISoftwareAppVersion = _.find(this.getAppVersion(typeApp), { fileName: name });
      const appVer: ISoftwareAppVersion = _.find(this.changedProfile.applicationVersions, { typeApplication: typeApp });
      if (appVer) {
        appVer.uuid = ver.uuid;
      } else {
        this.changedProfile.applicationVersions.push({ typeApplication: typeApp, uuid: ver.uuid });
      }
    }
    this.onChangeFn({
      swprofile: this.changedProfile,
    });
  }
}

export class HcsSetupSwprofileComponent implements ng.IComponentOptions {
  public controller = HcsSetupSwprofileController;
  public template = require('modules/hcs/hcs-setup/hcs-setup-swprofile/hcs-setup-swprofile.component.html');
  public bindings = {
    swprofile: '<',
    onChangeFn: '&',
  };
}
