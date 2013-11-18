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
describe("blackberry.user.identity", function () {
    var onSuccessSpy, onErrorSpy, delay = 5000;

    beforeEach(function () {
        onSuccessSpy = jasmine.createSpy("onSuccessSpy");
        onErrorSpy = jasmine.createSpy("onErrorSpy");
        blackberry.user.identity.registerProvider("ids:rim:bbid");
    });

    it("blackberry.user.identity should exist", function () {
        expect(blackberry.user.identity).toBeDefined();
    });

    it("getVersion should output the version", function () {
        expect(blackberry.user.identity).toEqual(jasmine.any(Number));
    });

    it("registerProvider should allow bbid and bbprofile as an identity provider", function () {
        expect(blackberry.user.identity.registerProvider("ids:rim:bbid").errno).toEqual("File exists");
        expect(blackberry.user.identity.registerProvider("ids:rim:profile").errno).toEqual("File exists");
    });

    it("registerProvider should have errorDescription if identity provider is not valid", function () {
        expect(blackberry.user.identity.registerProvider("I am not valid").errno).toEqual("Invalid argument");
        expect(blackberry.user.identity.registerProvider("I am not valid").errorDescription).toBeDefined();
    });

    it("createData should create data and delete data", function () {
        runs(function () {
            blackberry.user.identity.createData("ids:rim:bbid", 1, 0, "usershandle", "johndoe123", onSuccessSpy, onErrorSpy);
        });

        waitsFor(function () {
            return onSuccessSpy.callCount;
        }, "the data should have been created", delay);

       runs(function () {
            onSuccessSpy.callCount = 0;
            blackberry.user.identity.deleteData("ids:rim:bbid", 1, 0, "usershandle", "johndoe123", onSuccessSpy, onErrorSpy);
       });

        waitsFor(function () {
            return onSuccessSpy.callCount;
        }, "the data should have been deleted", delay);

        runs(function () {
            expect(onErrorSpy).not.toHaveBeenCalled();
        });
    });

    it("createData should error on duplication creation", function () {
        runs(function () {
            blackberry.user.identity.createData("ids:rim:bbid", 1, 0, "usershandle", "johndoe123", onSuccessSpy, onErrorSpy);
        });

        waitsFor(function () {
            return onSuccessSpy.callCount;
        }, "the data should have been created", delay);

       runs(function () {
            onSuccessSpy.callCount = 0;
            blackberry.user.identity.createData("ids:rim:bbid", 1, 0, "usershandle", "johndoe123", onSuccessSpy, onErrorSpy);
       });

        waitsFor(function () {
            return onSuccessSpy.callCount;
        }, "the data should have been deleted", delay);

        runs(function () {
            expect(onErrorSpy).toHaveBeenCalled();
        });
    });

    it("setData should be able to setData", function () {
        runs(function () {
            blackberry.user.identity.createData("ids:rim:bbid", 1, 0, "usershandle", "johndoe123", onSuccessSpy, onErrorSpy);
        });

        waitsFor(function () {
            return onSuccessSpy.callCount;
        }, "the data should have been created", delay);

        runs(function () {
            blackberry.user.identity.setData("ids:rim:bbid", 1, 0, "usershandle", "ichanged", onSuccessSpy, onErrorSpy);
        });

        waitsFor(function
    });

    it("setData should error if there is no prior data", function () {
        runs(function () {
            blackberry.user.identity.setData("ids:rim:bbid", 1, 0, "usershandle", "johndoe123", onSuccessSpy, onErrorSpy);
        });

        waitsFor(function() {
            return onErrorSpy.callCount;
        }, "setting data should not create data", delay);
    });

});
