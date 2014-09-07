/*
String jobId = System.schedule(
	'ResetPublicAccountRecords',
    '0 0 * * * ?',
    new ResetPublicAccountRecords());
*/
global class ResetPublicAccountRecords implements Schedulable {

	global void execute(SchedulableContext sc) {
		List<Account__c> fakeAccounts = new List<Account__c>();
		fakeAccounts.add(new Account__c(
			Name = 'Test Co',
			AnnualRevenue__c = 10500,
			Phone__c = '(777) 555-1234'
		));
		fakeAccounts.add(new Account__c(
			Name = 'Myco',
			AnnualRevenue__c = 51000,
			Phone__c = '(555) 233-5544'
		));
		Database.delete([SELECT Id FROM Account__c]);
		Database.insert(fakeAccounts);
	}
}