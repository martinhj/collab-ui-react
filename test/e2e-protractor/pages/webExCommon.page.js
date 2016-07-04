var WebExCommon = function () {
  this.testInfo = {
    describeCount: 0,
    testType: null,
    describeText: null
  };

  //T30 CI enabled site
  this.t30citestprov9Info = {
    siteUrl: 't30citestprov9.webex.com',
    testAdminUsername: 't30sp6-regression-adm@mailinator.com',
    testAdminPassword: 'Cisco!23'
  };

  this.t30citestprov9Info.siteElement = element(by.id(this.t30citestprov9Info.siteUrl));
  this.t30citestprov9Info.licenseID = element(by.id(this.t30citestprov9Info.siteUrl + '_MC200-license'));
  this.t30citestprov9Info.isCIID = element(by.id(this.t30citestprov9Info.siteUrl + '_isCI'));
  this.t30citestprov9Info.reportsCog = element(by.id(this.t30citestprov9Info.siteUrl + "_webex-site-reports"));
  this.t30citestprov9Info.configCog = element(by.id(this.t30citestprov9Info.siteUrl + "_webex-site-settings"));
  this.t30citestprov9Info.cardSectionId = element(by.id(this.t30citestprov9Info.siteUrl + "-cardsSection"));
  this.t30citestprov9Info.csvIcon = element(by.id(this.t30citestprov9Info.siteUrl + "_csvIcon"));
  this.t30citestprov9Info.csvCogDisabled = element(by.id(this.t30citestprov9Info.siteUrl + "_csvDisabled"));
  this.t30citestprov9Info.csvCogEnabled = element(by.id(this.t30citestprov9Info.siteUrl + "_csvEnabled"));
  this.t30citestprov9Info.csvSpinner = element(by.id(this.t30citestprov9Info.siteUrl + "_csvSpinner"));
  this.t30citestprov9Info.csvResult = element(by.id(this.t30citestprov9Info.siteUrl + "_csvResult"));

  //T31 CI enabled site
  this.t30citestprov6Info = {
    siteUrl: 't30citestprov6.webex.com',
    testAdminUsername: 't31r1-regression-adm@mailinator.com',
    testAdminPassword: 'Cisco!23'
  };

  this.t30citestprov6Info.siteElement = element(by.id(this.t30citestprov6Info.siteUrl));
  this.t30citestprov6Info.licenseID = element(by.id(this.t30citestprov6Info.siteUrl + '_EE200-CMR25-license'));
  this.t30citestprov6Info.isCIID = element(by.id(this.t30citestprov6Info.siteUrl + '_isCI'));
  this.t30citestprov6Info.reportsCog = element(by.id(this.t30citestprov6Info.siteUrl + "_webex-site-reports"));
  this.t30citestprov6Info.configCog = element(by.id(this.t30citestprov6Info.siteUrl + "_webex-site-settings"));
  this.t30citestprov6Info.cardSectionId = element(by.id(this.t30citestprov6Info.siteUrl + "-cardsSection"));
  this.t30citestprov6Info.csvIcon = element(by.id(this.t30citestprov6Info.siteUrl + "_csvIcon"));
  this.t30citestprov6Info.csvCogDisabled = element(by.id(this.t30citestprov6Info.siteUrl + "_csvDisabled"));
  this.t30citestprov6Info.csvCogEnabled = element(by.id(this.t30citestprov6Info.siteUrl + "_csvEnabled"));
  this.t30citestprov6Info.csvSpinner = element(by.id(this.t30citestprov6Info.siteUrl + "_csvSpinner"));
  this.t30citestprov6Info.csvResult = element(by.id(this.t30citestprov6Info.siteUrl + "_csvResult"));

  ////////////////////

  this.t30Info = this.t30citestprov9Info;
  this.t30ReportsCog = this.t30Info.reportsCog;
  this.t30ConfigureCog = this.t30Info.configCog;
  this.t30CardsSectionId = this.t30Info.cardSectionId;
  this.t30csvIcon = this.t30Info.csvIcon;
  this.t30csvCogDisabled = this.t30Info.csvCogDisabled;
  this.t30csvCogEnabled = this.t30Info.csvCogEnabled;
  this.t30csvSpinner = this.t30Info.csvSpinner;
  this.t30csvResult = this.t30Info.csvResult;

  this.t31Info = this.t30citestprov6Info;
  this.t31ReportsCog = this.t31Info.reportsCog;
  this.t31ConfigureCog = this.t31Info.configCog;
  this.t31CardsSectionId = this.t31Info.cardSectionId;
  this.t31csvIcon = this.t31Info.csvIcon;
  this.t31csvCogDisabled = this.t31Info.csvCogDisabled;
  this.t31csvCogEnabled = this.t31Info.csvCogEnabled;
  this.t31csvSpinner = this.t31Info.csvSpinner;
  this.t31csvResult = this.t31Info.csvResult;

  this.t30SiteElement = element(by.id(this.t30Info.siteUrl));
  this.t31SiteElement = element(by.id(this.t31Info.siteUrl));
};

module.exports = WebExCommon;
