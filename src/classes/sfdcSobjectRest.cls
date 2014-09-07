@RestResource(urlMapping='/sfdcSobject/v1/*')
global with sharing class sfdcSobjectRest {

	/*
	Create = PUT with a new URI
	         POST to a base URI returning a newly created URI
	Read   = GET
	Update = PUT with an existing URI
	Delete = DELETE
	*/

	// !!! Check user's permissions to objects and fields.

	@HttpPost
	global static SobjectRestResponse inser() {
		// Can't pass Sobjects into Apex REST endpoint handlers.
		// We can, however, convert JSON to List<SObject>.
		System.debug('Request ' + RestContext.request.httpMethod + ' for SObjects:' +
			RestContext.request.requestBody.toString());
		SobjectListParseResult parseResult = sobjectsFromJsonString(RestContext.request.requestBody.toString());

		List<SObject> parsedRecords = parseResult.parsedSobjects;

		List<String> permissionErrors = checkInsertPermissions(parsedRecords);
		removeHiddenObjectsAndFields(parsedRecords);

		// !!! Feature: Add a parameter which indicates whether to use
		//   allOrNone processing.
		//if (parseResult.failures.size() > 0) {
		//	RestContext.response.statusCode = 400;
		//}

		List<Database.SaveResult> updateResult = Database.insert(parsedRecords);

		List<SaveResult> saveResults = responsefromSaveResults(updateResult);
		List<String> responseErrors = new List<String>();
		if (permissionErrors.size() > 0) {
			responseErrors.addAll(permissionErrors);
		}
		return new SobjectRestResponse(saveResults, responseErrors);
	}

	// Just use the `query` endpoint SFDC provides.
	// Interpret a `HEAD` request as a heartbeat for this endpoint.
	@HttpGet
	global static Boolean exists() {
		return true;
	}

	@HttpPut
	global static SobjectRestResponse updat() {
		return sfdcSobjectRest.updat2();
	}

	@HttpPatch
	global static SobjectRestResponse updat2() {
		// Can't pass Sobjects into Apex REST endpoint handlers.
		// We can, however, convert JSON to List<SObject>.
		System.debug('Request ' + RestContext.request.httpMethod + ' for SObjects:' +
			RestContext.request.requestBody.toString());
		SobjectListParseResult parseResult = sobjectsFromJsonString(RestContext.request.requestBody.toString());
		System.debug('parseResult: ' + parseResult);

		List<SObject> parsedRecords = new List<SObject>();
		if (parseResult.parsedSobjects != null) {
			parsedRecords.addAll(parseResult.parsedSobjects);
		}

		removeUnupdateableObjectsAndFields(parsedRecords);

		removeHiddenObjectsAndFields(parsedRecords);

		// !!! Feature: Add a parameter which indicates whether to use
		//   allOrNone processing.
		//if (parseResult.failures.size() > 0) {
		//	RestContext.response.statusCode = 400;
		//}

		List<Database.SaveResult> updateResult = Database.update(parsedRecords);

		List<SaveResult> saveResults = responsefromSaveResults(updateResult);
		return new SobjectRestResponse(saveResults, parseResult.failures);
	}

	@HttpDelete
	global static List<Boolean> delet() {
		System.debug('REST SObject DELETE:');
		String idsToDelete = RestContext.request.params.get('ids');
		System.debug('idsToDelete:' + idsToDelete);

		//Database.delete(records);
		return new List<Boolean>();
	}


	// Helper functions

	private static SObjectParseResult sobjectFromSobjectUntyped(Map<String, Object> sobjectUntyped) {
		SObjectParseResult parseResult = new SObjectParseResult();

		// Use record Id to serialize record into correct type.
		String recordIdStr = (String)sobjectUntyped.get('Id');
		if (recordIdStr == null) {
			parseResult.failures.add('Error - No Id: ' + JSON.serialize(sobjectUntyped));
			return parseResult;
		}
		Id recordId;
		try {
			recordId = (Id)recordIdStr;
		} catch(TypeException e)  {
			parseResult.failures.add('Error - Invalid Id: ' + JSON.serialize(sobjectUntyped));
			return parseResult;
		}

		Schema.SObjectType objType = recordId.getSobjectType();
		parseResult.sobjectType = objType;
		SObject sobj = (SObject)JSON.deserialize(
			JSON.serialize(sobjectUntyped),
			Type.forName(objType.getDescribe().getName()));
		parseResult.sobj = sobj;
		return parseResult;
	}

	private static SobjectListParseResult sobjectsFromJsonString(String jsonString) {
		List<Object> recordList = (List<Object>) JSON.deserializeUntyped(jsonString);

		SobjectListParseResult parseListResult = new SobjectListParseResult();
		for (Object r : recordList) {
			Map<String, Object> sobjectUntyped = (Map<String, Object>) r;

			// Find the SObjectType from the record Id.
			SObjectParseResult parseResult = sobjectFromSobjectUntyped(sobjectUntyped);
			System.debug('SObject parseResult: ' + parseResult);
			
			if (parseResult.sobj != null) {
				parseListResult.parsedSobjects.add(parseResult.sobj);
			}
			parseListResult.failures.addAll(parseResult.failures);
		}
		return parseListResult;
	}

	private static Boolean isSObjectAccessible(SObject record) {
		Schema.DescribeSObjectResult objDescribe = record.getSobjectType().getDescribe();
		return objDescribe.isAccessible();
	}

	private static Boolean isSObjectUpdateable(SObject record) {
		Schema.DescribeSObjectResult objDescribe = record.getSobjectType().getDescribe();
		return objDescribe.isUpdateable();
	}

	private static List<String> checkInsertPermissions(List<SObject> records) {
		List<String> insertPermissionErrors = new List<String>();
		for (SObject r : records) {
			// Check ...
			Schema.DescribeSObjectResult sobjDescribe = r.getSObjectType().getDescribe();
			if (!sobjDescribe.isCreateable()) {
				insertPermissionErrors.add('Error - User does not have Create permissions for SObject: ' +
					sobjDescribe.getName());
				continue;
			}
			//if ()
		}
		return insertPermissionErrors;
	}

	// !!! Is this feature necessary?
	private static List<SObject> removeUnupdateableObjectsAndFields(List<SObject> records) {
		if (records.size() == 0) {
			return records;
		}

		List<SObject> updateableRecords = new List<SObject>();
		for (SObject r : records) {
			if (!isSObjectUpdateable(r)) {
				System.debug('Object not updateable: ' + r);
				continue;
			}
			updateableRecords.add(r);
		}

		return removeUnupdateableFields(updateableRecords);
	}

	private static List<SObject> removeUnupdateableFields(List<SObject> records) {
		if (records.size() == 0) {
			return records;
		}

		List<SObject> fieldsUpdateableSobjects = new List<SObject>();
		List<Object> sobjectsUntyped = (List<Object>) JSON.deserializeUntyped(JSON.serialize(records));
		for (Object s : sobjectsUntyped) {
			Map<String, Object> sobjectUntyped = (Map<String, Object>) s;
			removeUnupdateableFieldsUntyped(sobjectUntyped);
			SObjectParseResult parseResult = sobjectFromSobjectUntyped(sobjectUntyped);
			System.debug('parsedRecords: ' + parseResult);
			if (parseResult.sobj != null) {
				fieldsUpdateableSobjects.add(parseResult.sobj);
			}
		}

		return fieldsUpdateableSobjects;
	}

	private static Map<String, Object> removeUnupdateableFieldsUntyped(Map<String, Object> sobjectUntyped) {
		SObjectParseResult parseResult = sobjectFromSobjectUntyped(sobjectUntyped);
		System.debug('parsedRecords: ' + parseResult);
		if (parseResult.failures.size() > 0) {
			return sobjectUntyped;
		}

		Schema.SObjectType sobjectType = parseResult.sobjectType;
		Map<String, Schema.SObjectField> fields = sobjectType.getDescribe().fields.getMap();
		List<Schema.ChildRelationship> relations = sobjectType.getDescribe().getChildRelationships();
		Map<String, Schema.ChildRelationship> fieldNameToRelationMap = new Map<String, Schema.ChildRelationship>();
		for (Schema.ChildRelationship r : relations) {
			fieldNameToRelationMap.put(r.getRelationshipName(), r);
		}

		// Check accessibility of each field. If inaccessible, remove it.
		for (String fieldName : sobjectUntyped.keySet()) {
			if (fieldName == 'attributes') {
				// `attributes` is added when passing an SObject to `JSON.deserialize`.
				// It's not a field, so ignore it.
				continue;
			}

			// Child records field has no fieldToken. Double-check that it's what we expect.
			Object fieldValue = sobjectUntyped.get(fieldName);

			System.debug('fieldName: ' + fieldName);
			Schema.SObjectField fieldToken = fields.get(fieldName);
			if (fieldToken == null) {
				if (!(fieldValue instanceof Map<String, Object>)) {
					System.debug('Please add support for this type of related field value: ' + fieldValue);
				}

				System.debug('Child relationship: ' + fieldValue);

				// It's a child relationship. Get it's type to check accessibility.
				Schema.ChildRelationship rel = fieldNameToRelationMap.get(fieldName);
				Schema.DescribeSObjectResult relObjDescribe = rel.getChildSObject().getDescribe();
				if (!relObjDescribe.isUpdateable()) {
					System.debug('Related Field not updateable: ' + relObjDescribe.getName() + ' - ' + sobjectUntyped);
					sobjectUntyped.remove(fieldName);
				}

				// !!! Finish implementing removing-fields.
				//List<Object> relatedRecordObjs = (List<Object>)fieldValue.get('records');
				//for (Object r : relatedRecordObjs) {
				//	Map<String, Object> relatedSobjectUntyped = (Map<String, Object>) r;
				//	removeHiddenFieldsUntyped(relatedSobjectUntyped);
				//}
				//fieldValue.put('records', relatedSobjectUntyped);
			} else {
				// Field is directly on an SObject.
				Schema.DescribeFieldResult fieldDescribe = fieldToken.getDescribe();
				if (!fieldDescribe.isUpdateable()) {
					System.debug('Field not updateable: ' + fieldDescribe.getName() + ' - ' + sobjectUntyped);
					sobjectUntyped.remove(fieldName);
				}
			}
		}
		return sobjectUntyped;
	}

	// SFDC does not allow a user to view fields and child-related records to which
	//   the user does not have object-level permissions. SOQL will respond with
	//   a "field does not exist" error.
	// It does, however, allow a user to edit fields which are hidden to the user.
	//   To protect against this, we must manually see which fields are hidden,
	//   and remove them before the request enters the database.
	private static List<SObject> removeHiddenObjectsAndFields(List<SObject> records) {
		if (records.size() == 0) {
			return records;
		}

		List<SObject> visibleRecords = new List<SObject>();
		for (SObject r : records) {
			if (isSObjectAccessible(r)) {
				visibleRecords.add(r);
			}
		}

		return removeHiddenFields(visibleRecords);
	}

	private static List<SObject> removeHiddenFields(List<SObject> records) {
		if (records.size() == 0) {
			return records;
		}

		List<SObject> fieldsVisibleSobjects = new List<SObject>();
		List<Object> sobjectsUntyped = (List<Object>) JSON.deserializeUntyped(JSON.serialize(records));
		for (Object s : sobjectsUntyped) {
			Map<String, Object> sobjectUntyped = (Map<String, Object>) s;
			removeHiddenFieldsUntyped(sobjectUntyped);
			SObjectParseResult parseResult = sobjectFromSobjectUntyped(sobjectUntyped);
			System.debug('parsedRecords: ' + parseResult);
			if (parseResult.sobj != null) {
				fieldsVisibleSobjects.add(parseResult.sobj);
			}
		}

		return fieldsVisibleSobjects;
	}

	private static Map<String, Object> removeHiddenFieldsUntyped(Map<String, Object> sobjectUntyped) {

		SObjectParseResult parseResult = sobjectFromSobjectUntyped(sobjectUntyped);
		System.debug('parsedRecords: ' + parseResult);
		if (parseResult.failures.size() > 0) {
			return sobjectUntyped;
		}

		Schema.SObjectType sobjectType = parseResult.sobjectType;
		Map<String, Schema.SObjectField> fields = sobjectType.getDescribe().fields.getMap();
		List<Schema.ChildRelationship> relations = sobjectType.getDescribe().getChildRelationships();
		Map<String, Schema.ChildRelationship> fieldNameToRelationMap = new Map<String, Schema.ChildRelationship>();
		for (Schema.ChildRelationship r : relations) {
			fieldNameToRelationMap.put(r.getRelationshipName(), r);
		}

		// Check accessibility of each field. If inaccessible, remove it.
		for (String fieldName : sobjectUntyped.keySet()) {
			if (fieldName == 'attributes') {
				// `attributes` is added when passing an SObject to `JSON.deserialize`.
				// It's not a field, so ignore it.
				continue;
			}

			// Child records field has no fieldToken. Double-check that it's what we expect.
			Object fieldValue = sobjectUntyped.get(fieldName);

			System.debug('fieldName: ' + fieldName);
			Schema.SObjectField fieldToken = fields.get(fieldName);
			if (fieldToken == null) {
				if (!(fieldValue instanceof Map<String, Object>)) {
					System.debug('Please add support for this type of related field value: ' + fieldValue);
				}

				System.debug('Child relationship: ' + fieldValue);

				// It's a child relationship. Get it's type to check accessibility.
				Schema.ChildRelationship rel = fieldNameToRelationMap.get(fieldName);
				Schema.DescribeSObjectResult relObjDescribe = rel.getChildSObject().getDescribe();
				if (!relObjDescribe.isAccessible()) {
					sobjectUntyped.remove(fieldName);
				}

				// !!! Finish implementing remove-fields from the child records.
				//List<Object> relatedRecordObjs = (List<Object>)fieldValue.get('records');
				//for (Object r : relatedRecordObjs) {
				//	Map<String, Object> relatedSobjectUntyped = (Map<String, Object>) r;
				//	removeHiddenFieldsUntyped(relatedSobjectUntyped);
				//}
				//fieldValue.put('records', relatedSobjectUntyped);
			} else {
				// Field is directly on an SObject.
				Schema.DescribeFieldResult fieldDescribe = fieldToken.getDescribe();
				if (!fieldDescribe.isAccessible()) {
					sobjectUntyped.remove(fieldName);
				}
			}
		}
		return sobjectUntyped;
	}

	private static List<SaveResult> responsefromSaveResults(List<Database.SaveResult> dSaveResults) {
		List<SaveResult> saveResults = new List<SaveResult>();
		for (Database.SaveResult s : dSaveResults) {
			saveResults.add(new SaveResult(s));
		}
		return saveResults;
	}


	// Types

	global class SobjectParseResult {
		global Schema.SObjectType sobjectType {get; set;}
		global SObject sobj {get; set;}
		global List<String> failures {get; set;}
		global SobjectParseResult() {
			this.failures = new List<String>();
		}
	}

	global class SobjectListParseResult {
		global List<SObject> parsedSobjects {get; set;}
		global List<String> failures {get; set;}
		global SobjectListParseResult() {
			this.parsedSobjects = new List<SObject>();
			this.failures = new List<String>();
		}
	}

	global class SobjectRestResponse {
		global List<SaveResult> saveResult;
		global Map<String, List<String>> errors;
		global SobjectRestResponse(List<SaveResult> saveResult, List<String> parseErrors) {
			this.saveResult = saveResult;
			this.errors = new Map<String, List<String>>();
			this.errors.put('parseErrors', parseErrors);
		}
	}

	global class SaveResult {
		global Id id;
		global Boolean success;
		global List<SaveError> errors;
		global SaveResult(Database.SaveResult s) {
			this.id = s.getId();
			this.success = s.isSuccess();
			this.errors = new List<SaveError>();
			for (Database.Error e : s.getErrors()) {
				this.errors.add(new SaveError(e));
			}
		}
	}

	global class SaveError {
		global List<String> fields;
		global String message;
		global String statusCode;
		global SaveError(Database.Error e) {
			this.fields = e.getFields();
			this.message = e.getMessage();
			this.statusCode = JSON.serialize(e.getStatusCode());
		}
	}

}