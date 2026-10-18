/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./worker/index.js":
/*!*************************!*\
  !*** ./worker/index.js ***!
  \*************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

eval(__webpack_require__.ts("// Custom service worker source, bundled into the generated public/sw.js by\n// @ducanh2912/next-pwa (customWorkerSrc, see next.config.js). Adds real\n// Web Push handling for the Daily Devotional reminder -- this is what lets\n// the notification fire even while the app is fully closed, unlike the\n// plain `new Notification()` call used for the \"app is open\" case (see\n// DailyDevotionalPopup.tsx). The push message itself is sent server-side\n// by /api/v1/push/send-daily via the `web-push` library.\nself.addEventListener(\"push\", (event)=>{\n    let payload = {};\n    try {\n        payload = event.data ? event.data.json() : {};\n    } catch (e) {\n        payload = {\n            title: \"Today's Encouragement\",\n            body: event.data ? event.data.text() : \"\"\n        };\n    }\n    const title = payload.title || \"Today's Encouragement\";\n    const options = {\n        body: payload.body || \"\",\n        icon: \"/icons/icon-192.png\",\n        badge: \"/icons/icon-192.png\",\n        tag: \"kc-daily-devotional\",\n        data: {\n            url: payload.url || \"/daily\"\n        }\n    };\n    event.waitUntil(self.registration.showNotification(title, options));\n});\nself.addEventListener(\"notificationclick\", (event)=>{\n    event.notification.close();\n    const url = event.notification.data && event.notification.data.url || \"/daily\";\n    event.waitUntil(self.clients.matchAll({\n        type: \"window\",\n        includeUncontrolled: true\n    }).then((clientList)=>{\n        for (const client of clientList){\n            if (\"focus\" in client && new URL(client.url).pathname === url) return client.focus();\n        }\n        if (self.clients.openWindow) return self.clients.openWindow(url);\n        return undefined;\n    }));\n});\n// A push subscription can be invalidated/rotated by the browser at any\n// time; when that happens, re-subscribe with the same VAPID key and tell\n// the server about the new endpoint so the reminder keeps working instead\n// of silently going dead.\nself.addEventListener(\"pushsubscriptionchange\", (event)=>{\n    event.waitUntil((async ()=>{\n        try {\n            const applicationServerKey = event.oldSubscription ? event.oldSubscription.options.applicationServerKey : undefined;\n            const newSubscription = await self.registration.pushManager.subscribe({\n                userVisibleOnly: true,\n                applicationServerKey\n            });\n            await fetch(\"/api/v1/push/resubscribe\", {\n                method: \"POST\",\n                headers: {\n                    \"Content-Type\": \"application/json\"\n                },\n                body: JSON.stringify({\n                    oldEndpoint: event.oldSubscription ? event.oldSubscription.endpoint : null,\n                    subscription: newSubscription.toJSON()\n                })\n            });\n        } catch (e) {\n        // Best effort -- if this fails the user's existing \"Get a dated\n        // reminder each day\" opt-in will just stop delivering until they\n        // revisit and the client-side check re-subscribes them.\n        }\n    })());\n});\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                /* unsupported import.meta.webpackHot */ undefined.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi93b3JrZXIvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQUEsMkVBQTJFO0FBQzNFLHdFQUF3RTtBQUN4RSwyRUFBMkU7QUFDM0UsdUVBQXVFO0FBQ3ZFLHVFQUF1RTtBQUN2RSx5RUFBeUU7QUFDekUseURBQXlEO0FBRXpEQSxLQUFLQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUNDO0lBQzdCLElBQUlDLFVBQVUsQ0FBQztJQUNmLElBQUk7UUFDRkEsVUFBVUQsTUFBTUUsSUFBSSxHQUFHRixNQUFNRSxJQUFJLENBQUNDLElBQUksS0FBSyxDQUFDO0lBQzlDLEVBQUUsVUFBTTtRQUNORixVQUFVO1lBQUVHLE9BQU87WUFBeUJDLE1BQU1MLE1BQU1FLElBQUksR0FBR0YsTUFBTUUsSUFBSSxDQUFDSSxJQUFJLEtBQUs7UUFBRztJQUN4RjtJQUVBLE1BQU1GLFFBQVFILFFBQVFHLEtBQUssSUFBSTtJQUMvQixNQUFNRyxVQUFVO1FBQ2RGLE1BQU1KLFFBQVFJLElBQUksSUFBSTtRQUN0QkcsTUFBTTtRQUNOQyxPQUFPO1FBQ1BDLEtBQUs7UUFDTFIsTUFBTTtZQUFFUyxLQUFLVixRQUFRVSxHQUFHLElBQUk7UUFBUztJQUN2QztJQUVBWCxNQUFNWSxTQUFTLENBQUNkLEtBQUtlLFlBQVksQ0FBQ0MsZ0JBQWdCLENBQUNWLE9BQU9HO0FBQzVEO0FBRUFULEtBQUtDLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDQztJQUMxQ0EsTUFBTWUsWUFBWSxDQUFDQyxLQUFLO0lBQ3hCLE1BQU1MLE1BQU0sTUFBT0ksWUFBWSxDQUFDYixJQUFJLElBQUlGLE1BQU1lLFlBQVksQ0FBQ2IsSUFBSSxDQUFDUyxHQUFHLElBQUs7SUFFeEVYLE1BQU1ZLFNBQVMsQ0FDYmQsS0FBS21CLE9BQU8sQ0FBQ0MsUUFBUSxDQUFDO1FBQUVDLE1BQU07UUFBVUMscUJBQXFCO0lBQUssR0FBR0MsSUFBSSxDQUFDLENBQUNDO1FBQ3pFLEtBQUssTUFBTUMsVUFBVUQsV0FBWTtZQUMvQixJQUFJLFdBQVdDLFVBQVUsSUFBSUMsSUFBSUQsT0FBT1osR0FBRyxFQUFFYyxRQUFRLEtBQUtkLEtBQUssT0FBT1ksT0FBT0csS0FBSztRQUNwRjtRQUNBLElBQUk1QixLQUFLbUIsT0FBTyxDQUFDVSxVQUFVLEVBQUUsT0FBTzdCLEtBQUttQixPQUFPLENBQUNVLFVBQVUsQ0FBQ2hCO1FBQzVELE9BQU9pQjtJQUNUO0FBRUo7QUFFQSx1RUFBdUU7QUFDdkUseUVBQXlFO0FBQ3pFLDBFQUEwRTtBQUMxRSwwQkFBMEI7QUFDMUI5QixLQUFLQyxnQkFBZ0IsQ0FBQywwQkFBMEIsQ0FBQ0M7SUFDL0NBLE1BQU1ZLFNBQVMsQ0FDYixDQUFDO1FBQ0MsSUFBSTtZQUNGLE1BQU1pQix1QkFBdUI3QixNQUFNOEIsZUFBZSxHQUM5QzlCLE1BQU04QixlQUFlLENBQUN2QixPQUFPLENBQUNzQixvQkFBb0IsR0FDbEREO1lBQ0osTUFBTUcsa0JBQWtCLE1BQU1qQyxLQUFLZSxZQUFZLENBQUNtQixXQUFXLENBQUNDLFNBQVMsQ0FBQztnQkFDcEVDLGlCQUFpQjtnQkFDakJMO1lBQ0Y7WUFDQSxNQUFNTSxNQUFNLDRCQUE0QjtnQkFDdENDLFFBQVE7Z0JBQ1JDLFNBQVM7b0JBQUUsZ0JBQWdCO2dCQUFtQjtnQkFDOUNoQyxNQUFNaUMsS0FBS0MsU0FBUyxDQUFDO29CQUNuQkMsYUFBYXhDLE1BQU04QixlQUFlLEdBQUc5QixNQUFNOEIsZUFBZSxDQUFDVyxRQUFRLEdBQUc7b0JBQ3RFQyxjQUFjWCxnQkFBZ0JZLE1BQU07Z0JBQ3RDO1lBQ0Y7UUFDRixFQUFFLFVBQU07UUFDTixnRUFBZ0U7UUFDaEUsaUVBQWlFO1FBQ2pFLHdEQUF3RDtRQUMxRDtJQUNGO0FBRUoiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9fTl9FLy4vd29ya2VyL2luZGV4LmpzPzgwNWUiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ3VzdG9tIHNlcnZpY2Ugd29ya2VyIHNvdXJjZSwgYnVuZGxlZCBpbnRvIHRoZSBnZW5lcmF0ZWQgcHVibGljL3N3LmpzIGJ5XG4vLyBAZHVjYW5oMjkxMi9uZXh0LXB3YSAoY3VzdG9tV29ya2VyU3JjLCBzZWUgbmV4dC5jb25maWcuanMpLiBBZGRzIHJlYWxcbi8vIFdlYiBQdXNoIGhhbmRsaW5nIGZvciB0aGUgRGFpbHkgRGV2b3Rpb25hbCByZW1pbmRlciAtLSB0aGlzIGlzIHdoYXQgbGV0c1xuLy8gdGhlIG5vdGlmaWNhdGlvbiBmaXJlIGV2ZW4gd2hpbGUgdGhlIGFwcCBpcyBmdWxseSBjbG9zZWQsIHVubGlrZSB0aGVcbi8vIHBsYWluIGBuZXcgTm90aWZpY2F0aW9uKClgIGNhbGwgdXNlZCBmb3IgdGhlIFwiYXBwIGlzIG9wZW5cIiBjYXNlIChzZWVcbi8vIERhaWx5RGV2b3Rpb25hbFBvcHVwLnRzeCkuIFRoZSBwdXNoIG1lc3NhZ2UgaXRzZWxmIGlzIHNlbnQgc2VydmVyLXNpZGVcbi8vIGJ5IC9hcGkvdjEvcHVzaC9zZW5kLWRhaWx5IHZpYSB0aGUgYHdlYi1wdXNoYCBsaWJyYXJ5LlxuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ3B1c2gnLCAoZXZlbnQpID0+IHtcbiAgbGV0IHBheWxvYWQgPSB7fVxuICB0cnkge1xuICAgIHBheWxvYWQgPSBldmVudC5kYXRhID8gZXZlbnQuZGF0YS5qc29uKCkgOiB7fVxuICB9IGNhdGNoIHtcbiAgICBwYXlsb2FkID0geyB0aXRsZTogXCJUb2RheSdzIEVuY291cmFnZW1lbnRcIiwgYm9keTogZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEudGV4dCgpIDogJycgfVxuICB9XG5cbiAgY29uc3QgdGl0bGUgPSBwYXlsb2FkLnRpdGxlIHx8IFwiVG9kYXkncyBFbmNvdXJhZ2VtZW50XCJcbiAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICBib2R5OiBwYXlsb2FkLmJvZHkgfHwgJycsXG4gICAgaWNvbjogJy9pY29ucy9pY29uLTE5Mi5wbmcnLFxuICAgIGJhZGdlOiAnL2ljb25zL2ljb24tMTkyLnBuZycsXG4gICAgdGFnOiAna2MtZGFpbHktZGV2b3Rpb25hbCcsXG4gICAgZGF0YTogeyB1cmw6IHBheWxvYWQudXJsIHx8ICcvZGFpbHknIH0sXG4gIH1cblxuICBldmVudC53YWl0VW50aWwoc2VsZi5yZWdpc3RyYXRpb24uc2hvd05vdGlmaWNhdGlvbih0aXRsZSwgb3B0aW9ucykpXG59KVxuXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ25vdGlmaWNhdGlvbmNsaWNrJywgKGV2ZW50KSA9PiB7XG4gIGV2ZW50Lm5vdGlmaWNhdGlvbi5jbG9zZSgpXG4gIGNvbnN0IHVybCA9IChldmVudC5ub3RpZmljYXRpb24uZGF0YSAmJiBldmVudC5ub3RpZmljYXRpb24uZGF0YS51cmwpIHx8ICcvZGFpbHknXG5cbiAgZXZlbnQud2FpdFVudGlsKFxuICAgIHNlbGYuY2xpZW50cy5tYXRjaEFsbCh7IHR5cGU6ICd3aW5kb3cnLCBpbmNsdWRlVW5jb250cm9sbGVkOiB0cnVlIH0pLnRoZW4oKGNsaWVudExpc3QpID0+IHtcbiAgICAgIGZvciAoY29uc3QgY2xpZW50IG9mIGNsaWVudExpc3QpIHtcbiAgICAgICAgaWYgKCdmb2N1cycgaW4gY2xpZW50ICYmIG5ldyBVUkwoY2xpZW50LnVybCkucGF0aG5hbWUgPT09IHVybCkgcmV0dXJuIGNsaWVudC5mb2N1cygpXG4gICAgICB9XG4gICAgICBpZiAoc2VsZi5jbGllbnRzLm9wZW5XaW5kb3cpIHJldHVybiBzZWxmLmNsaWVudHMub3BlbldpbmRvdyh1cmwpXG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfSlcbiAgKVxufSlcblxuLy8gQSBwdXNoIHN1YnNjcmlwdGlvbiBjYW4gYmUgaW52YWxpZGF0ZWQvcm90YXRlZCBieSB0aGUgYnJvd3NlciBhdCBhbnlcbi8vIHRpbWU7IHdoZW4gdGhhdCBoYXBwZW5zLCByZS1zdWJzY3JpYmUgd2l0aCB0aGUgc2FtZSBWQVBJRCBrZXkgYW5kIHRlbGxcbi8vIHRoZSBzZXJ2ZXIgYWJvdXQgdGhlIG5ldyBlbmRwb2ludCBzbyB0aGUgcmVtaW5kZXIga2VlcHMgd29ya2luZyBpbnN0ZWFkXG4vLyBvZiBzaWxlbnRseSBnb2luZyBkZWFkLlxuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdwdXNoc3Vic2NyaXB0aW9uY2hhbmdlJywgKGV2ZW50KSA9PiB7XG4gIGV2ZW50LndhaXRVbnRpbChcbiAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgYXBwbGljYXRpb25TZXJ2ZXJLZXkgPSBldmVudC5vbGRTdWJzY3JpcHRpb25cbiAgICAgICAgICA/IGV2ZW50Lm9sZFN1YnNjcmlwdGlvbi5vcHRpb25zLmFwcGxpY2F0aW9uU2VydmVyS2V5XG4gICAgICAgICAgOiB1bmRlZmluZWRcbiAgICAgICAgY29uc3QgbmV3U3Vic2NyaXB0aW9uID0gYXdhaXQgc2VsZi5yZWdpc3RyYXRpb24ucHVzaE1hbmFnZXIuc3Vic2NyaWJlKHtcbiAgICAgICAgICB1c2VyVmlzaWJsZU9ubHk6IHRydWUsXG4gICAgICAgICAgYXBwbGljYXRpb25TZXJ2ZXJLZXksXG4gICAgICAgIH0pXG4gICAgICAgIGF3YWl0IGZldGNoKCcvYXBpL3YxL3B1c2gvcmVzdWJzY3JpYmUnLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgb2xkRW5kcG9pbnQ6IGV2ZW50Lm9sZFN1YnNjcmlwdGlvbiA/IGV2ZW50Lm9sZFN1YnNjcmlwdGlvbi5lbmRwb2ludCA6IG51bGwsXG4gICAgICAgICAgICBzdWJzY3JpcHRpb246IG5ld1N1YnNjcmlwdGlvbi50b0pTT04oKSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSlcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBCZXN0IGVmZm9ydCAtLSBpZiB0aGlzIGZhaWxzIHRoZSB1c2VyJ3MgZXhpc3RpbmcgXCJHZXQgYSBkYXRlZFxuICAgICAgICAvLyByZW1pbmRlciBlYWNoIGRheVwiIG9wdC1pbiB3aWxsIGp1c3Qgc3RvcCBkZWxpdmVyaW5nIHVudGlsIHRoZXlcbiAgICAgICAgLy8gcmV2aXNpdCBhbmQgdGhlIGNsaWVudC1zaWRlIGNoZWNrIHJlLXN1YnNjcmliZXMgdGhlbS5cbiAgICAgIH1cbiAgICB9KSgpXG4gIClcbn0pXG4iXSwibmFtZXMiOlsic2VsZiIsImFkZEV2ZW50TGlzdGVuZXIiLCJldmVudCIsInBheWxvYWQiLCJkYXRhIiwianNvbiIsInRpdGxlIiwiYm9keSIsInRleHQiLCJvcHRpb25zIiwiaWNvbiIsImJhZGdlIiwidGFnIiwidXJsIiwid2FpdFVudGlsIiwicmVnaXN0cmF0aW9uIiwic2hvd05vdGlmaWNhdGlvbiIsIm5vdGlmaWNhdGlvbiIsImNsb3NlIiwiY2xpZW50cyIsIm1hdGNoQWxsIiwidHlwZSIsImluY2x1ZGVVbmNvbnRyb2xsZWQiLCJ0aGVuIiwiY2xpZW50TGlzdCIsImNsaWVudCIsIlVSTCIsInBhdGhuYW1lIiwiZm9jdXMiLCJvcGVuV2luZG93IiwidW5kZWZpbmVkIiwiYXBwbGljYXRpb25TZXJ2ZXJLZXkiLCJvbGRTdWJzY3JpcHRpb24iLCJuZXdTdWJzY3JpcHRpb24iLCJwdXNoTWFuYWdlciIsInN1YnNjcmliZSIsInVzZXJWaXNpYmxlT25seSIsImZldGNoIiwibWV0aG9kIiwiaGVhZGVycyIsIkpTT04iLCJzdHJpbmdpZnkiLCJvbGRFbmRwb2ludCIsImVuZHBvaW50Iiwic3Vic2NyaXB0aW9uIiwidG9KU09OIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./worker/index.js\n"));

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			if (cachedModule.error !== undefined) throw cachedModule.error;
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/trusted types policy */
/******/ 	!function() {
/******/ 		var policy;
/******/ 		__webpack_require__.tt = function() {
/******/ 			// Create Trusted Type policy if Trusted Types are available and the policy doesn't exist yet.
/******/ 			if (policy === undefined) {
/******/ 				policy = {
/******/ 					createScript: function(script) { return script; }
/******/ 				};
/******/ 				if (typeof trustedTypes !== "undefined" && trustedTypes.createPolicy) {
/******/ 					policy = trustedTypes.createPolicy("nextjs#bundler", policy);
/******/ 				}
/******/ 			}
/******/ 			return policy;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/trusted types script */
/******/ 	!function() {
/******/ 		__webpack_require__.ts = function(script) { return __webpack_require__.tt().createScript(script); };
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/react refresh */
/******/ 	!function() {
/******/ 		if (__webpack_require__.i) {
/******/ 		__webpack_require__.i.push(function(options) {
/******/ 			var originalFactory = options.factory;
/******/ 			options.factory = function(moduleObject, moduleExports, webpackRequire) {
/******/ 				var hasRefresh = typeof self !== "undefined" && !!self.$RefreshInterceptModuleExecution$;
/******/ 				var cleanup = hasRefresh ? self.$RefreshInterceptModuleExecution$(moduleObject.id) : function() {};
/******/ 				try {
/******/ 					originalFactory.call(this, moduleObject, moduleExports, webpackRequire);
/******/ 				} finally {
/******/ 					cleanup();
/******/ 				}
/******/ 			}
/******/ 		})
/******/ 		}
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	
/******/ 	// noop fns to prevent runtime errors during initialization
/******/ 	if (typeof self !== "undefined") {
/******/ 		self.$RefreshReg$ = function () {};
/******/ 		self.$RefreshSig$ = function () {
/******/ 			return function (type) {
/******/ 				return type;
/******/ 			};
/******/ 		};
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval-source-map devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./worker/index.js");
/******/ 	
/******/ })()
;