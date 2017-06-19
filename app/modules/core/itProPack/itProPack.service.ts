export class ProPackService {

  /* @ngInject */
  constructor(
    private FeatureToggleService,
    private $q: ng.IQService,
    ) {}

  public hasProPackEnabled(): ng.IPromise<boolean> {
    return this.FeatureToggleService.atlasITProPackGetStatus().then(result => {
      return result;
    });
  }

  public getProPackPurchased(): ng.IPromise<boolean> {
    return this.FeatureToggleService.atlasITProPackPurchasedGetStatus().then(result => {
      return result;
    });
  }

  // This will be true if the ProPack Toggle and propack is purchased are true
<<<<<<< e2e424c54be2e9e369a66339e0c778a1e827ea36
  public hasITProPackPurchased(): ng.IPromise<boolean> {
    const promises = {
      proPack: this.hasITProPackEnabled(),
      proPackPurchased: this.getITProPackPurchased(),
=======
  public hasProPackPurchased(): ng.IPromise<boolean> {
    let promises = {
      proPack: this.hasProPackEnabled(),
      proPackPurchased: this.getProPackPurchased(),
>>>>>>> chore(core): rename itProPack to ProPack in the sourcecode
    };
    return this.$q.all(promises).then(result => {
      return result.proPack && result.proPackPurchased;
    });
  }

  // This will be true if the ProPack Toggle is false OR propack is purchased
<<<<<<< e2e424c54be2e9e369a66339e0c778a1e827ea36
  public hasITProPackPurchasedOrNotEnabled(): ng.IPromise<boolean> {
    const promises = {
      proPack: this.hasITProPackEnabled(),
      proPackPurchased: this.getITProPackPurchased(),
=======
  public hasProPackPurchasedOrNotEnabled(): ng.IPromise<boolean> {
    let promises = {
      proPack: this.hasProPackEnabled(),
      proPackPurchased: this.getProPackPurchased(),
>>>>>>> chore(core): rename itProPack to ProPack in the sourcecode
    };
    return this.$q.all(promises).then(result => {
      return !result.proPack || result.proPackPurchased;
    });
  }

  //This will be true if the ProPack Toggle is true and the propack is not purchased
<<<<<<< e2e424c54be2e9e369a66339e0c778a1e827ea36
  public hasITProPackEnabledAndNotPurchased(): ng.IPromise<boolean> {
    const promises = {
      proPack: this.hasITProPackEnabled(),
      proPackPurchased: this.getITProPackPurchased(),
=======
  public hasProPackEnabledAndNotPurchased(): ng.IPromise<boolean> {
    let promises = {
      proPack: this.hasProPackEnabled(),
      proPackPurchased: this.getProPackPurchased(),
>>>>>>> chore(core): rename itProPack to ProPack in the sourcecode
    };
    return this.$q.all(promises).then(result => {
      return result.proPack && !result.proPackPurchased;
    });
  }

}
