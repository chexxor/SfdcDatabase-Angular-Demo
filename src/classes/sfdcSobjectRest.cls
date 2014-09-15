@RestResource(urlMapping='/sfdcSobject/v1/*')
global with sharing class sfdcSobjectRest {

	/*
	## Goal ##
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

		List<Either> maybeSobjectMetadatas = sobjectMetadatasFromJsonString(RestContext.request.requestBody.toString());

		// Filter out good from bad.
		List<SobjectMetadata> sobjectMetadatas = new List<SobjectMetadata>();
		List<String> sobjectParseErrors = new List<String>();
		for (Either m : maybeSobjectMetadatas) {
			if (m.isLeft()) {
				sobjectParseErrors.add((String)m.getLeft());
			} else {
				sobjectMetadatas.add((SobjectMetadata)m.getRight());
			}
		}
		System.debug('inser: sobjectMetadatas: ' + sobjectMetadatas);
		System.debug('inser: sobjectParseErrors: ' + sobjectParseErrors);

		// ??? Need to check insert permissions?
		//List<String> permissionErrors = checkInsertPermissions(parsedRecords); 
		List<SobjectMetadata> sobjectMetadatasVisible = removeInaccessibleObjects(sobjectMetadatas);
		List<SobjectMetadata> sobjectMetadatasVisibleFields = removeInaccessibleFields(sobjectMetadatasVisible);

		List<SObject> sobjects = sobjectFromSobjectMetadata(sobjectMetadatasVisibleFields);

		// !!! Feature: Add a parameter which indicates whether to use
		//   allOrNone processing.
		//if (parseResult.failures.size() > 0) {
		//	RestContext.response.statusCode = 400;
		//}

		List<Database.SaveResult> insertResult = Database.insert(sobjects);

		List<CrudResult> insertResults = crudResultsFromDmlResults(insertResult);
		List<String> responseErrors = new List<String>();
		if (sobjectParseErrors.size() > 0) {
			responseErrors.addAll(sobjectParseErrors);
		}
		if (responseErrors.size() > 0) {
			RestContext.response.statusCode = 400;
		}
		return new SobjectRestResponse(insertResults, responseErrors);
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

		List<Either> maybeSobjectMetadatas = sobjectMetadatasFromJsonString(RestContext.request.requestBody.toString());

		// Filter out good from bad.
		List<SobjectMetadata> sobjectMetadatas = new List<SobjectMetadata>();
		List<String> sobjectParseErrors = new List<String>();
		for (Either m : maybeSobjectMetadatas) {
			if (m.isLeft()) {
				sobjectParseErrors.add((String)m.getLeft());
			} else {
				sobjectMetadatas.add((SobjectMetadata)m.getRight());
			}
		}
		System.debug('inser: sobjectMetadatas: ' + sobjectMetadatas);
		System.debug('inser: sobjectParseErrors: ' + sobjectParseErrors);

		// ??? Need to check insert permissions?
		//List<String> permissionErrors = checkInsertPermissions(parsedRecords); 
		List<SobjectMetadata> sobjectMetadatasVisible = removeInaccessibleObjects(sobjectMetadatas);
		List<SobjectMetadata> sobjectMetadatasVisibleFields = removeInaccessibleFields(sobjectMetadatasVisible);

		List<SObject> sobjects = sobjectFromSobjectMetadata(sobjectMetadatasVisibleFields);

		// !!! Feature: Add a parameter which indicates whether to use
		//   allOrNone processing.
		//if (parseResult.failures.size() > 0) {
		//	RestContext.response.statusCode = 400;
		//}

		List<Database.SaveResult> updateResult = Database.update(sobjects);

		List<CrudResult> updateResults = crudResultsFromDmlResults(updateResult);
		List<String> responseErrors = new List<String>();
		if (sobjectParseErrors.size() > 0) {
			responseErrors.addAll(sobjectParseErrors);
		}
		if (responseErrors.size() > 0) {
			RestContext.response.statusCode = 400;
		}
		return new SobjectRestResponse(updateResults, responseErrors);
	}

	@HttpDelete
	global static SobjectRestResponse delet() {
		System.debug('REST SObject DELETE:');
		//String idsToDelete = RestContext.request.params.get('ids');
		//System.debug('idsToDelete:' + idsToDelete);

		List<Either> maybeSobjectMetadatas = sobjectMetadatasFromJsonString(RestContext.request.requestBody.toString());

		// Filter out good from bad.
		List<SobjectMetadata> sobjectMetadatas = new List<SobjectMetadata>();
		List<String> sobjectParseErrors = new List<String>();
		for (Either m : maybeSobjectMetadatas) {
			if (m.isLeft()) {
				sobjectParseErrors.add((String)m.getLeft());
			} else {
				sobjectMetadatas.add((SobjectMetadata)m.getRight());
			}
		}
		System.debug('inser: sobjectMetadatas: ' + sobjectMetadatas);
		System.debug('inser: sobjectParseErrors: ' + sobjectParseErrors);

		// ??? Need to check insert permissions?
		//List<String> permissionErrors = checkInsertPermissions(parsedRecords); 
		List<SobjectMetadata> sobjectMetadatasVisible = removeInaccessibleObjects(sobjectMetadatas);
		List<SobjectMetadata> sobjectMetadatasVisibleFields = removeInaccessibleFields(sobjectMetadatasVisible);

		List<SObject> sobjects = sobjectFromSobjectMetadata(sobjectMetadatasVisibleFields);

		// !!! Feature: Add a parameter which indicates whether to use
		//   allOrNone processing.
		//if (parseResult.failures.size() > 0) {
		//	RestContext.response.statusCode = 400;
		//}

		List<Database.DeleteResult> deleteResult = Database.delete(sobjects);

		List<CrudResult> deleteResults = crudResultsFromDmlResults(deleteResult);
		List<String> responseErrors = new List<String>();
		if (sobjectParseErrors.size() > 0) {
			responseErrors.addAll(sobjectParseErrors);
		}
		if (responseErrors.size() > 0) {
			RestContext.response.statusCode = 400;
		}
		return new SobjectRestResponse(deleteResults, responseErrors);
	}


	// Helper functions

	private static List<SObject> sobjectFromSobjectMetadata(List<SobjectMetadata> sobjectMetadatas) {

		List<SObject> sobjects = new List<SObject>();
		for (SobjectMetadata r : sobjectMetadatas) {
			// Remove metadata.
			r.sObjUntyped.remove('attributes');
			r.sObjUntyped.remove('sObjectType');
			// Parse into SObject.
			SObject parsedSobject = (SObject)JSON.deserialize(
				JSON.serialize(r.sObjUntyped),
				r.sObjectType);
			sobjects.add(parsedSobject);
		}
		return sobjects;
	}

	private static Either sobjectTypeFromSobjectUntyped(Map<String, Object> sobjectUntyped) {
		// Use record Id to serialize record into correct type.
		String recordIdStr = (String)sobjectUntyped.get('Id');
		String sObjectTypeStr = (String)sobjectUntyped.get('sObjectType');
		System.debug('recordIdStr: ' + recordIdStr + ' sObjectTypeStr: ' + sObjectTypeStr);

		if (recordIdStr == null && sObjectTypeStr == null) {
			return new Left('Error parsing Type - No Id or sObjectType specified: '
				+ JSON.serialize(sobjectUntyped));
		}

		Type objType;
		List<String> failures = new List<String>();
		if (recordIdStr != null) {
			Id recordId;
			try {
				recordId = (Id)recordIdStr;
				objType = Type.forName(recordId.getSobjectType().getDescribe().getName());
			} catch(TypeException e)  {
				return new Left('Error parsing Type - Invalid Id: '
					+ JSON.serialize(sobjectUntyped));
			}
		} else if (sObjectTypeStr != null) {
			try {
				objType = Type.forName(sObjectTypeStr);
			} catch(TypeException e)  {
				return new Left('Error parsing Type - Invalid sObjectType: '
					+ JSON.serialize(sobjectUntyped));
			}
		}

		return new Right(objType);
	}

	// !!! Deprecate this. Use `sobjectTypeFromSobjectUntyped` instead.
	/*
	private static SObjectParseResult sobjectFromSobjectUntyped(Map<String, Object> sobjectUntyped) {
		SObjectParseResult parseResult = new SObjectParseResult();

		// Use record Id to serialize record into correct type.
		String recordIdStr = (String)sobjectUntyped.get('Id');
		String sObjectTypeStr = (String)sobjectUntyped.get('sObjectType');
		System.debug('recordIdStr: ' + recordIdStr + ' sObjectTypeStr: ' + sObjectTypeStr);
		// ?? Should we put this in a method which automatically removes invalid fields?
		//if (sObjectTypeStr != null) {
		//	sobjectUntyped.remove('sObjectType');
		//}

		if (recordIdStr == null && sObjectTypeStr == null) {
			parseResult.failures.add('Error - No Id or sObjectType specified: ' + JSON.serialize(sobjectUntyped));
			return parseResult;
		}

		Type objType;
		if (recordIdStr != null) {
			Id recordId;
			try {
				recordId = (Id)recordIdStr;
				objType = Type.forName(recordId.getSobjectType().getDescribe().getName());
			} catch(TypeException e)  {
				parseResult.failures.add('Error - Invalid Id: ' + JSON.serialize(sobjectUntyped));
				return parseResult;
			}
		} else if (sObjectTypeStr != null) {
			try {
				objType = Type.forName(sObjectTypeStr);
			} catch(TypeException e)  {
				parseResult.failures.add('Error - Invalid sObjectType: ' + JSON.serialize(sobjectUntyped));
				return parseResult;
			}
		}

		parseResult.sObjectType = objType;
		SObject sobj = (SObject)JSON.deserialize(
			JSON.serialize(sobjectUntyped),
			objType);
		parseResult.sobj = sobj;
		return parseResult;
	}
	*/

	//private static List<SobjectMetadata> sobjectMetadatasFromJsonString(String jsonString) {
	private static List<Either> sobjectMetadatasFromJsonString(String jsonString) {
		//List<SobjectMetadata> sobjectMetadatas = new List<SobjectMetadata>();
		List<Either> maybeSobjectMetadatas = new List<Either>();
		List<Object> recordList = (List<Object>) JSON.deserializeUntyped(jsonString);
		for (Object r : recordList) {
			Map<String, Object> sobjectUntyped = (Map<String, Object>) r;
			Either maybeSobjType = sobjectTypeFromSobjectUntyped(sobjectUntyped);
			if (maybeSobjType.isLeft()) {
				// ??? Do what if couldn't get type?
				String failure = (String) maybeSobjType.getLeft();
				System.debug('Unable to get type from sObject: ' + failure);
				//return sobjectUntyped;
				maybeSobjectMetadatas.add(new Left(
					'Unable to get type from sObject: ' + failure));
				continue;
			}

			Type sobjType = (Type)maybeSobjType.getRight();
			maybeSobjectMetadatas.add(new Right(
				new SobjectMetadata(
				sobjType,
				sobjectUntyped)));
		}
		return maybeSobjectMetadatas;
	}

	//private static Boolean isSObjectAccessible(SObject record) {
	private static Boolean isSObjectAccessible(SobjectMetadata sobjectMetadata) {
		Schema.SObjectType sObjectType = ((SObject)sobjectMetadata.sObjectType.newInstance()).getSObjectType();
		Schema.DescribeSObjectResult objDescribe = sObjectType.getDescribe();
		return objDescribe.isAccessible();
	}

	//private static Boolean isSObjectUpdateable(SObject record) {
	//	Schema.DescribeSObjectResult objDescribe = record.getSobjectType().getDescribe();
	//	return objDescribe.isUpdateable();
	//}

	//private static List<String> checkInsertPermissions(List<SObject> records) {
	//	List<String> insertPermissionErrors = new List<String>();
	//	for (SObject r : records) {
	//		// Check ...
	//		Schema.DescribeSObjectResult sobjDescribe = r.getSObjectType().getDescribe();
	//		if (!sobjDescribe.isCreateable()) {
	//			insertPermissionErrors.add('Error - User does not have Create permissions for SObject: ' +
	//				sobjDescribe.getName());
	//			continue;
	//		}
	//	}
	//	return insertPermissionErrors;
	//}

	// !!! Is this feature necessary?
	//private static List<SObject> removeUnupdateableObjectsAndFields(List<SObject> records) {
	//	if (records.size() == 0) {
	//		return records;
	//	}

	//	List<SObject> updateableRecords = new List<SObject>();
	//	for (SObject r : records) {
	//		if (!isSObjectUpdateable(r)) {
	//			System.debug('Object not updateable: ' + r);
	//			continue;
	//		}
	//		updateableRecords.add(r);
	//	}

	//	return removeUnupdateableFields(updateableRecords);
	//}

	//private static List<SObject> removeUnupdateableFields(List<SObject> records) {
	//	if (records.size() == 0) {
	//		return records;
	//	}

	//	List<SObject> fieldsUpdateableSobjects = new List<SObject>();
	//	List<Object> sobjectsUntyped = (List<Object>) JSON.deserializeUntyped(JSON.serialize(records));
	//	for (Object s : sobjectsUntyped) {
	//		Map<String, Object> sobjectUntyped = (Map<String, Object>) s;
	//		removeUnupdateableFieldsUntyped(sobjectUntyped);
	//		//SObjectParseResult parseResult = sobjectFromSobjectUntyped(sobjectUntyped);
	//		SObjectParseResult typeParseResult = sobjectTypeFromSobjectUntyped(sobjectUntyped);
	//		Type objType = typeParseResult.sObjectType;
	//		SObject sobj = (SObject)JSON.deserialize(
	//			JSON.serialize(sobjectUntyped),
	//			objType);
	//		System.debug('typeParsedResult: ' + typeParseResult);
	//		if (sobj != null) {
	//			fieldsUpdateableSobjects.add(sobj);
	//		}
	//	}

	//	return fieldsUpdateableSobjects;
	//}

	//private static Map<String, Object> removeUnupdateableFieldsUntyped(Map<String, Object> sobjectUntyped) {
	//	//SObjectParseResult parseResult = sobjectFromSobjectUntyped(sobjectUntyped);
	//	SObjectParseResult typeParseResult = sobjectTypeFromSobjectUntyped(sobjectUntyped);
	//	Type objType = typeParseResult.sObjectType;
	//	System.debug('typeParseResult: ' + typeParseResult);
	//	if (typeParseResult.failures.size() > 0) {
	//		return sobjectUntyped;
	//	}

	//	Schema.SObjectType sObjectType = ((SObject)typeParseResult.sObjectType.newInstance()).getSObjectType();
	//	Map<String, Schema.SObjectField> fields = sObjectType.getDescribe().fields.getMap();
	//	List<Schema.ChildRelationship> relations = sObjectType.getDescribe().getChildRelationships();
	//	Map<String, Schema.ChildRelationship> fieldNameToRelationMap = new Map<String, Schema.ChildRelationship>();
	//	for (Schema.ChildRelationship r : relations) {
	//		fieldNameToRelationMap.put(r.getRelationshipName(), r);
	//	}

	//	// Check accessibility of each field. If inaccessible, remove it.
	//	for (String fieldName : sobjectUntyped.keySet()) {
	//		if (fieldName == 'attributes') {
	//			// `attributes` is added when passing an SObject to `JSON.deserialize`.
	//			// It's not a field, so ignore it.
	//			continue;
	//		}

	//		// Child records field has no fieldToken. Double-check that it's what we expect.
	//		Object fieldValue = sobjectUntyped.get(fieldName);

	//		System.debug('fieldName: ' + fieldName);
	//		Schema.SObjectField fieldToken = fields.get(fieldName);
	//		if (fieldToken == null) {
	//			if (!(fieldValue instanceof Map<String, Object>)) {
	//				System.debug('Please add support for this type of related field value: ' + fieldValue);
	//			}

	//			System.debug('Child relationship: ' + fieldValue);

	//			// It's a child relationship. Get it's type to check accessibility.
	//			Schema.ChildRelationship rel = fieldNameToRelationMap.get(fieldName);
	//			Schema.DescribeSObjectResult relObjDescribe = rel.getChildSObject().getDescribe();
	//			if (!relObjDescribe.isUpdateable()) {
	//				System.debug('Related Field not updateable: ' + relObjDescribe.getName() + ' - ' + sobjectUntyped);
	//				sobjectUntyped.remove(fieldName);
	//			}

	//			// !!! Finish implementing removing-fields.
	//			//List<Object> relatedRecordObjs = (List<Object>)fieldValue.get('records');
	//			//for (Object r : relatedRecordObjs) {
	//			//	Map<String, Object> relatedSobjectUntyped = (Map<String, Object>) r;
	//			//	removeHiddenFieldsUntyped(relatedSobjectUntyped);
	//			//}
	//			//fieldValue.put('records', relatedSobjectUntyped);
	//		} else {
	//			// Field is directly on an SObject.
	//			Schema.DescribeFieldResult fieldDescribe = fieldToken.getDescribe();
	//			if (!fieldDescribe.isUpdateable()) {
	//				System.debug('Field not updateable: ' + fieldDescribe.getName() + ' - ' + sobjectUntyped);
	//				sobjectUntyped.remove(fieldName);
	//			}
	//		}
	//	}
	//	return sobjectUntyped;
	//}


	// SFDC does not allow a user to view fields and child-related records to which
	//   the user does not have object-level permissions. SOQL will respond with
	//   a "field does not exist" error.
	// It does, however, allow a user to edit fields which are hidden to the user.
	//   To protect against this, we must manually see which fields are hidden,
	//   and remove them before the request enters the database.
	private static List<SobjectMetadata> removeInaccessibleObjects(List<SobjectMetadata> sobjectMetadatas) {
		if (sobjectMetadatas.size() == 0) {
			return sobjectMetadatas;
		}

		List<SobjectMetadata> visibleRecords = new List<SobjectMetadata>();
		for (SobjectMetadata r : sobjectMetadatas) {
			if (isSObjectAccessible(r)) {
				visibleRecords.add(r);
			}
		}

		return visibleRecords;
	}

	private static List<SobjectMetadata> removeInaccessibleFields(List<SobjectMetadata> sobjectMetadatas) {
		if (sobjectMetadatas.size() == 0) {
			return sobjectMetadatas;
		}

		for (SobjectMetadata s : sobjectMetadatas) {

			Schema.SObjectType sObjectType = ((SObject)s.sObjectType.newInstance()).getSObjectType();
			Map<String, Schema.SObjectField> fields = sObjectType.getDescribe().fields.getMap();
			List<Schema.ChildRelationship> relations = sObjectType.getDescribe().getChildRelationships();
			Map<String, Schema.ChildRelationship> fieldNameToRelationMap = new Map<String, Schema.ChildRelationship>();
			for (Schema.ChildRelationship r : relations) {
				fieldNameToRelationMap.put(r.getRelationshipName(), r);
			}

			// Check accessibility of each field. If inaccessible, remove it.
			Map<String, Object> sObjectUntyped = s.sObjUntyped;
			for (String fieldName : sObjectUntyped.keySet()) {
				if (fieldName == 'attributes' || fieldName == 'sObjectType') {
					// `attributes` is added when passing an SObject to `JSON.deserialize`.
					// It's not a field, so ignore it.
					continue;
				}

				// Child records field has no fieldToken. Double-check that it's what we expect.
				Object fieldValue = sObjectUntyped.get(fieldName);

				System.debug('fieldName: ' + fieldName);
				Schema.SObjectField fieldToken = fields.get(fieldName);
				if (fieldToken == null) {
					// If the field doesn't have a token, it could still be a valid field,
					//   such as a child relationship.
					// Guard.
					if (!(fieldValue instanceof Map<String, Object>)) {
						System.debug('Please add support for this type of related field value: ' + fieldValue);
					}

					// It's a child relationship. Get it's type to check accessibility.
					System.debug('Child relationship: ' + fieldValue);
					Schema.ChildRelationship rel = fieldNameToRelationMap.get(fieldName);
					Schema.DescribeSObjectResult relObjDescribe = rel.getChildSObject().getDescribe();
					if (!relObjDescribe.isAccessible()) {
						sObjectUntyped.remove(fieldName);
					}

					// !!! Finish implementing. Remove inaccessible fields from the child records.
					//List<Object> relatedRecordObjs = (List<Object>)fieldValue.get('records');
					//for (Object r : relatedRecordObjs) {
					//	Map<String, Object> relatedSobjectUntyped = (Map<String, Object>) r;
					//	removeHiddenFieldsUntyped(relatedSobjectUntyped);
					//}
					//fieldValue.put('records', relatedSobjectUntyped);
				} else {
					// Simple SObject field.
					Schema.DescribeFieldResult fieldDescribe = fieldToken.getDescribe();
					if (!fieldDescribe.isAccessible()) {
						sObjectUntyped.remove(fieldName);
					}
				}
			}
		}

		return sobjectMetadatas;
	}

	private static List<CrudResult> crudResultsFromDmlResults(List<Database.SaveResult> dSaveResults) {
		List<CrudResult> saveResults = new List<CrudResult>();
		for (Database.SaveResult s : dSaveResults) {
			saveResults.add(new CrudResult(s));
		}
		return saveResults;
	}

	private static List<CrudResult> crudResultsFromDmlResults(List<Database.DeleteResult> dDeleteResults) {
		List<CrudResult> deleteResults = new List<CrudResult>();
		for (Database.DeleteResult s : dDeleteResults) {
			deleteResults.add(new CrudResult(s));
		}
		return deleteResults;
	}


	// Types

	global class SobjectMetadata {
		global Type sObjectType {get; set;}
		global Map<String, Object> sObjUntyped {get; set;}
		global SobjectMetadata(Type sObjType, Map<String, Object> sObjUntyped) {
			this.sObjectType = sObjType;
			this.sObjUntyped = sObjUntyped;
		}
	}

	// Apex doesn't have generics, but would be nice to parameterize with `<L, R>`.
	global abstract class Either {
		global abstract Boolean isLeft();
		global abstract Boolean isRight();
		global abstract Object getRight();
		global abstract Object getLeft();
		// ??? Make an `Optional` type?
		//global Optional getOptional(){
		//	if (this.isRight()) {
		//		return this.getRight();
		//	} else {
		//		return null;
		//	}
		//}
	}
	global class Left extends Either {
		private Object value;
		global Left(Object value) {
			this.value = value;
		}
		global override Boolean isLeft() {
			return true;
		}
		global override Boolean isRight() {
			return !isLeft();
		}
		global Object get() {
			return value;
		}
		global override Object getRight() {
			throw new EitherNoSuchElementException('Right can\'t be accessed');
		}
		global override Object getLeft() {
			return get();
		}
	}
	global class Right extends Either {
		private Object value;
		global Right(Object value) {
			this.value = value;
		}
		global override Boolean isLeft() {
			return false;
		}
		global override Boolean isRight() {
			return !isLeft();
		}
		global Object get() {
			return value;
		}
		global override Object getRight() {
			return get();
		}
		global Override Object getLeft() {
			throw new EitherNoSuchElementException('Left can\'t be accessed');
		}
	}
	public class EitherNoSuchElementException extends Exception {}

	//global class SobjectParseResult {
	//	global Type sObjectType {get; set;}
	//	global List<String> failures {get; set;}
	//	global SobjectParseResult() {
	//		this.failures = new List<String>();
	//	}
	//}

	global class SobjectRestResponse {
		global List<CrudResult> records {get; set;}
		//global Map<String, List<String>> errors {get; set;} // (ErrorType => Messages)
		global List<String> errors {get; set;} // (i.e. ParseError)
		global SobjectRestResponse(List<CrudResult> records, List<String> errors) {
			this.records = records;
			//this.errors = new Map<String, List<String>>();
			//this.errors.put('parseErrors', parseErrors);
			this.errors = errors;
		}
	}

	global class CrudResult {
		global Id id;
		global Boolean success;
		global List<CrudError> errors;
		global CrudResult(Database.SaveResult s) {
			System.debug('saveResult: ' + s);
			this.id = s.getId();
			this.success = s.isSuccess();
			this.errors = new List<CrudError>();
			for (Database.Error e : s.getErrors()) {
				this.errors.add(new CrudError(e));
			}
		}
		global CrudResult(Database.DeleteResult s) {
			System.debug('deleteResult: ' + s);
			this.id = s.getId();
			this.success = s.isSuccess();
			this.errors = new List<CrudError>();
			for (Database.Error e : s.getErrors()) {
				this.errors.add(new CrudError(e));
			}
		}
	}

	global class CrudError {
		global List<String> fields;
		global String message;
		global String statusCode;
		global CrudError(Database.Error e) {
			this.fields = e.getFields();
			this.message = e.getMessage();
			this.statusCode = JSON.serialize(e.getStatusCode());
		}
	}

}