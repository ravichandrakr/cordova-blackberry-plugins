/*
 * Copyright 2012 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var _apiDir = __dirname + "/../../../plugin/com.blackberry.pim.contacts/",
    _libDir = __dirname + "/../../../lib/",
    utils = require(_libDir + "utils"),
    ContactFindOptions = require(_apiDir + "ContactFindOptions"),
    Contact,
    ContactName = require(_apiDir + "ContactName"),
    ContactError = require(_apiDir + "ContactError"),
    ContactPickerOptions = require(_apiDir + "ContactPickerOptions"),
    index,
    mockJnextObjId = 123,
    mockedPluginResult;

describe("pim.contacts index", function () {
    beforeEach(function () {
        GLOBAL.cordova = {
            require: jasmine.createSpy().andReturn(jasmine.createSpy())
        };
        GLOBAL.JNEXT = {
            require: jasmine.createSpy("JNEXT.require").andCallFake(function () {
                return true;
            }),
            createObject: jasmine.createSpy("JNEXT.createObject").andCallFake(function () {
                return mockJnextObjId;
            }),
            invoke: jasmine.createSpy("JNEXT.invoke").andCallFake(function () {
                return JSON.stringify({_success: true, contact: { id: "123" }});
            }),
            registerEvents: jasmine.createSpy("JNEXT.registerEvent")
        };
        GLOBAL.window = {
            qnx: {
                webplatform: {
                    getApplication: jasmine.createSpy().andReturn({
                        invocation: {
                            addEventListener: jasmine.createSpy(),
                            removeEventListener: jasmine.createSpy()
                        },
                        getEnv: jasmine.createSpy().andReturn("personal")
                    })
                }
            },
            parseInt: jasmine.createSpy().andCallFake(function (obj) {
                return Number(obj);
            }),
            isNaN: jasmine.createSpy().andCallFake(function (obj) {
                return obj === "abc";
            })
        };
        mockedPluginResult = {
            callbackOk: jasmine.createSpy(),
            callbackError: jasmine.createSpy(),
            noResult: jasmine.createSpy(),
            ok: jasmine.createSpy(),
            error: jasmine.createSpy()
        };
        GLOBAL.PluginResult = jasmine.createSpy("PluginResult").andReturn(mockedPluginResult);

        Contact = require(_apiDir + "www/Contact");
        index = require(_apiDir + "index");
    });

    afterEach(function () {
        delete GLOBAL.JNEXT;
        delete GLOBAL.window;
        delete GLOBAL.cordova;
        delete GLOBAL.PluginResult;
        index = null;
    });

    it("JNEXT require/createObject/registerEvents are not called upon requiring index", function () {
        expect(JNEXT.require).not.toHaveBeenCalledWith("libpimcontacts");
        expect(JNEXT.createObject).not.toHaveBeenCalledWith("libpimcontacts.PimContacts");
        expect(JNEXT.registerEvents).not.toHaveBeenCalled();
    });

    it("find - with correct permission specified", function () {
        var successCb = jasmine.createSpy(),
            failCb = jasmine.createSpy(),
            findOptions = {
                filter: [{
                    fieldName: ContactFindOptions.SEARCH_FIELD_GIVEN_NAME,
                    fieldValue: "John"
                }],
                limit: 5
            },
            args = {};

        spyOn(utils, "hasPermission").andReturn(true);

        args.fields = encodeURIComponent(JSON.stringify(["name"]));
        args.options = encodeURIComponent(JSON.stringify(findOptions));

        index.find(successCb, failCb, args);

        Object.getOwnPropertyNames(args).forEach(function (key) {
            args[key] = JSON.parse(decodeURIComponent(args[key]));
        });

        expect(JNEXT.invoke).toHaveBeenCalledWith(mockJnextObjId, "find " + JSON.stringify(args));
        expect(mockedPluginResult.noResult).toHaveBeenCalledWith(true);
    });

    it("find - without correct permission specified", function () {
        var successCb = jasmine.createSpy(),
            failCb = jasmine.createSpy(),
            findOptions = {
                filter: [{
                    fieldName: ContactFindOptions.SEARCH_FIELD_GIVEN_NAME,
                    fieldValue: "John"
                }],
                limit: 5
            };

        spyOn(utils, "hasPermission").andReturn(false);

        index.find(successCb, failCb, {
            fields: encodeURIComponent(JSON.stringify(["name"])),
            options: encodeURIComponent(JSON.stringify(findOptions))
        });

        expect(JNEXT.invoke).not.toHaveBeenCalled();
        expect(mockedPluginResult.callbackError).toHaveBeenCalledWith(ContactError.PERMISSION_DENIED_ERROR, false);
    });

    it("save - with correct permission specified", function () {
        var successCb = jasmine.createSpy(),
            failCb = jasmine.createSpy(),
            contact = new Contact({
                name: {"familyName": "Smith", "givenName": "John"},
                note: "this is a test"
            }),
            args = {},
            key;

        spyOn(utils, "hasPermission").andReturn(true);

        for (key in contact) {
            if (key !== "id") {
                if (contact.hasOwnProperty(key)) {
                    args[key] = encodeURIComponent(JSON.stringify(contact[key]));
                }
            }
        }

        index.save(successCb, failCb, args);

        Object.getOwnPropertyNames(args).forEach(function (key) {
            args[key] = JSON.parse(decodeURIComponent(args[key]));
        });

        args["isWork"] = false;

        expect(window.qnx.webplatform.getApplication().getEnv).toHaveBeenCalledWith("PERIMETER");
        expect(JNEXT.invoke).toHaveBeenCalledWith(mockJnextObjId, "save " + JSON.stringify(args));
        expect(mockedPluginResult.noResult).toHaveBeenCalledWith(true);
    });

    it("save - without correct permission specified", function () {
        var successCb = jasmine.createSpy(),
            failCb = jasmine.createSpy(),
            contact = new Contact({
                name: {"familyName": "Smith", "givenName": "John"},
                note: "this is a test"
            }),
            args = {},
            key;

        spyOn(utils, "hasPermission").andReturn(false);

        for (key in contact) {
            if (contact.hasOwnProperty(key)) {
                args[key] = encodeURIComponent(JSON.stringify(contact[key]));
            }
        }

        index.save(successCb, failCb, args);
        expect(JNEXT.invoke).not.toHaveBeenCalled();
        expect(mockedPluginResult.callbackError).toHaveBeenCalledWith(ContactError.PERMISSION_DENIED_ERROR, false);
    });

    it("remove - with correct permission specified", function () {
        var successCb = jasmine.createSpy(),
            failCb = jasmine.createSpy(),
            args = {};

        spyOn(utils, "hasPermission").andReturn(true);

        args.contactId = encodeURIComponent(JSON.stringify(1));

        index.remove(successCb, failCb, args);

        Object.getOwnPropertyNames(args).forEach(function (key) {
            args[key] = JSON.parse(decodeURIComponent(args[key]));
        });

        expect(JNEXT.invoke).toHaveBeenCalledWith(mockJnextObjId, "remove " + JSON.stringify(args));
        expect(mockedPluginResult.noResult).toHaveBeenCalledWith(true);
    });

    it("remove - without correct permission specified", function () {
        var successCb = jasmine.createSpy(),
            failCb = jasmine.createSpy();

        spyOn(utils, "hasPermission").andReturn(false);

        index.remove(successCb, failCb, {
            contactId: encodeURIComponent(JSON.stringify(1)),
            _eventId: encodeURIComponent(JSON.stringify("abc"))
        });

        expect(JNEXT.invoke).not.toHaveBeenCalled();
        expect(mockedPluginResult.callbackError).toHaveBeenCalledWith(ContactError.PERMISSION_DENIED_ERROR, false);
    });

    it("getContact - without correct permission specified", function () {
        var successCb = jasmine.createSpy(),
            failCb = jasmine.createSpy(),
            args = {
                contactId: encodeURIComponent(JSON.stringify("123"))
            };

        spyOn(utils, "hasPermission").andReturn(false);

        index.getContact(successCb, failCb, args);

        expect(JNEXT.invoke).not.toHaveBeenCalled();
        expect(mockedPluginResult.error).toHaveBeenCalledWith(ContactError.PERMISSION_DENIED_ERROR, false);
    });

    it("getContact - with correct permission specified", function () {
        var successCb = jasmine.createSpy(),
            failCb = jasmine.createSpy(),
            args = {
                contactId: encodeURIComponent(JSON.stringify("123"))
            };

        spyOn(utils, "hasPermission").andReturn(true);

        index.getContact(successCb, failCb, args);

        Object.getOwnPropertyNames(args).forEach(function (key) {
            args[key] = JSON.parse(decodeURIComponent(args[key]));
        });

        expect(JNEXT.invoke).toHaveBeenCalledWith(mockJnextObjId, "getContact " + JSON.stringify(args));
        expect(mockedPluginResult.ok).toHaveBeenCalledWith({
            id: "123"
        }, false);
    });

    it("invokeContactPicker - with correct permission specified", function () {
        var successCb = jasmine.createSpy(),
            failCb = jasmine.createSpy(),
            args = {};

        spyOn(utils, "hasPermission").andReturn(true);

        args.options = encodeURIComponent(JSON.stringify({ mode: ContactPickerOptions.MODE_SINGLE }));

        index.invokeContactPicker(successCb, failCb, args);

        Object.getOwnPropertyNames(args).forEach(function (key) {
            args[key] = JSON.parse(decodeURIComponent(args[key]));
        });

        expect(window.qnx.webplatform.getApplication().invocation.addEventListener).toHaveBeenCalledWith("childCardClosed", jasmine.any(Function));
        expect(JNEXT.invoke).toHaveBeenCalledWith(mockJnextObjId, "invokePicker " + JSON.stringify(args.options));
        expect(mockedPluginResult.noResult).toHaveBeenCalledWith(true);
    });

    it("invokeContactPicker - without correct permission specified", function () {
        var successCb = jasmine.createSpy(),
            failCb = jasmine.createSpy();

        spyOn(utils, "hasPermission").andReturn(false);

        index.invokeContactPicker(successCb, failCb, {
            options: encodeURIComponent(JSON.stringify({ mode: ContactPickerOptions.MODE_SINGLE }))
        });

        expect(JNEXT.invoke).not.toHaveBeenCalled();
        expect(mockedPluginResult.callbackError).toHaveBeenCalledWith(ContactError.PERMISSION_DENIED_ERROR, false);
    });

    it("has getContactAccounts", function () {
        expect(index.getContactAccounts).toBeDefined();
    });
});
