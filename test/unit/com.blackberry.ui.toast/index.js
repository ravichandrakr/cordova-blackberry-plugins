/*
 * Copyright 2010-2011 Research In Motion Limited.
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

var root = __dirname + "/../../../",
    webview = require(root + "lib/webview"),
    overlayWebView,
    index;

describe("ui.toast index", function () {
    var mockedOverlayWebview,
        mockQnx,
        mockedToast,
        mockedPluginResult,
        storedDismissHandler,
        storedCallbackHandler;

    beforeEach(function () {
        mockedOverlayWebview = {
            toast : {
                show : jasmine.createSpy("uiWebView.toast.show").andCallFake(function (message, options) {
                    storedCallbackHandler = options.callbackHandler;
                    storedDismissHandler = options.dismissHandler;
                    return 73;
                })
            }
        };

        mockQnx = {
            webplatform: {
                getController: function () {
                    return {
                        addEventListener: function (eventType, callback) {
                            callback(mockedOverlayWebview);
                        }
                    };
                },
                createUIWebView: function () {
                    return {
                        toast : mockedToast
                    };
                }
            }
        };

        mockedPluginResult = {
            callbackOk : jasmine.createSpy("PluginResult.callbackOk"),
            ok: jasmine.createSpy("PluginResult.ok")
        };

        GLOBAL.window = {
            qnx: mockQnx
        };

        GLOBAL.qnx = mockQnx;

        GLOBAL.PluginResult = jasmine.createSpy("PluginResult").andReturn(mockedPluginResult);

        index = require(root + "plugin/com.blackberry.ui.toast/index");
    });

    afterEach(function () {
        delete GLOBAL.window;
        delete GLOBAL.qnx;
        delete GLOBAL.PluginResult;
    });

    it("shows toast", function () {
        var noop = function () {},
            mockArgs = {
                message: encodeURIComponent(JSON.stringify("This is a toast")),
                options: encodeURIComponent(JSON.stringify({ buttonText : 'Test'}))
            };

        index.show(noop, noop, mockArgs, null);
        expect(mockedOverlayWebview.toast.show).toHaveBeenCalledWith("This is a toast", { buttonText : 'Test', callbackHandler: jasmine.any(Function), dismissHandler: jasmine.any(Function)});
        expect(mockedPluginResult.ok).toHaveBeenCalledWith({reason: "created", toastId: jasmine.any(Number)}, true);

        //test Callback Handler
        storedCallbackHandler(42);
        expect(mockedPluginResult.callbackOk).toHaveBeenCalledWith({reason: "buttonClicked", toastId: 42}, true);

        //test Dismiss Handler
        storedDismissHandler(22);
        expect(mockedPluginResult.callbackOk).toHaveBeenCalledWith({reason: "dismissed", toastId: 22}, false);
    });
});
