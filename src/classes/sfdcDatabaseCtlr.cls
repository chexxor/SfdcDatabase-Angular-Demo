global with sharing class sfdcDatabaseCtlr {

	@remoteAction
	global static List<SObject> quer(String soql) {
		return Database.query(soql);
	}

	@remoteAction
	global static List<Database.SaveResult> updat(List<SObject> records) {
		return Database.update(records);
	}

	@remoteAction
	global static List<Database.SaveResult> inser(List<SObject> records) {
		return Database.insert(records);
	}
}