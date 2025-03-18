"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/page",{

/***/ "(app-pages-browser)/./src/components/dashboard/groups-panel.jsx":
/*!***************************************************!*\
  !*** ./src/components/dashboard/groups-panel.jsx ***!
  \***************************************************/
/***/ (function(module, __webpack_exports__, __webpack_require__) {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GroupsPanel: function() { return /* binding */ GroupsPanel; }\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var _components_ui_card__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/components/ui/card */ \"(app-pages-browser)/./src/components/ui/card.jsx\");\n/* harmony import */ var _barrel_optimize_names_Backpack_Users_lucide_react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! __barrel_optimize__?names=Backpack,Users!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/backpack.js\");\n/* harmony import */ var _barrel_optimize_names_Backpack_Users_lucide_react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! __barrel_optimize__?names=Backpack,Users!=!lucide-react */ \"(app-pages-browser)/./node_modules/lucide-react/dist/esm/icons/users.js\");\n/* harmony import */ var _lib_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/utils */ \"(app-pages-browser)/./src/lib/utils.js\");\n/* harmony import */ var _draggable__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./draggable */ \"(app-pages-browser)/./src/components/dashboard/draggable.jsx\");\n\n\n\n\n\nfunction GroupsPanel(param) {\n    let { groups, assignedStatus = {} } = param;\n    // Función para generar el contenido del tooltip con los nombres de las personas\n    const renderPeopleTooltip = (group)=>{\n        if (!group.people || group.people.length === 0) {\n            return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                className: \"text-xs italic\",\n                children: \"No hay personas en este grupo\"\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                lineNumber: 11,\n                columnNumber: 9\n            }, this);\n        }\n        return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n            className: \"p-1 max-h-[200px] overflow-y-auto\",\n            children: [\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                    className: \"font-medium mb-1 text-primary\",\n                    children: \"Miembros del grupo:\"\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                    lineNumber: 17,\n                    columnNumber: 9\n                }, this),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"ul\", {\n                    className: \"list-disc list-inside space-y-1\",\n                    children: group.people.map((person, index)=>/*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"li\", {\n                            className: \"text-xs flex items-center\",\n                            children: [\n                                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"span\", {\n                                    className: \"truncate\",\n                                    children: person.name || person.first_name || \"Sin nombre\"\n                                }, void 0, false, {\n                                    fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                                    lineNumber: 21,\n                                    columnNumber: 15\n                                }, this),\n                                person.backpack && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_Backpack_Users_lucide_react__WEBPACK_IMPORTED_MODULE_4__[\"default\"], {\n                                    className: \"ml-1 h-3 w-3 text-primary\"\n                                }, void 0, false, {\n                                    fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                                    lineNumber: 25,\n                                    columnNumber: 17\n                                }, this)\n                            ]\n                        }, person.id || index, true, {\n                            fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                            lineNumber: 20,\n                            columnNumber: 13\n                        }, this))\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                    lineNumber: 18,\n                    columnNumber: 9\n                }, this),\n                /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                    className: \"text-xs text-muted-foreground mt-1\",\n                    children: [\n                        \"Total: \",\n                        group.people.length,\n                        \" personas\"\n                    ]\n                }, void 0, true, {\n                    fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                    lineNumber: 30,\n                    columnNumber: 9\n                }, this)\n            ]\n        }, void 0, true, {\n            fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n            lineNumber: 16,\n            columnNumber: 7\n        }, this);\n    };\n    // Add function to check if group is assigned\n    const isGroupAssigned = (group)=>{\n        return assignedStatus[group.id] || false;\n    };\n    // Filter out assigned groups\n    const availableGroups = groups.filter((group)=>!isGroupAssigned(group));\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_ui_card__WEBPACK_IMPORTED_MODULE_1__.Card, {\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_ui_card__WEBPACK_IMPORTED_MODULE_1__.CardHeader, {\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_ui_card__WEBPACK_IMPORTED_MODULE_1__.CardTitle, {\n                    className: \"flex items-center gap-2 text-lg\",\n                    children: [\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_barrel_optimize_names_Backpack_Users_lucide_react__WEBPACK_IMPORTED_MODULE_5__[\"default\"], {\n                            className: \"h-5 w-5\"\n                        }, void 0, false, {\n                            fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                            lineNumber: 49,\n                            columnNumber: 11\n                        }, this),\n                        \"Grupos Disponibles\",\n                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"span\", {\n                            className: \"ml-auto text-xs text-muted-foreground\",\n                            children: [\n                                availableGroups.length,\n                                \" disponibles\"\n                            ]\n                        }, void 0, true, {\n                            fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                            lineNumber: 51,\n                            columnNumber: 11\n                        }, this)\n                    ]\n                }, void 0, true, {\n                    fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                    lineNumber: 48,\n                    columnNumber: 9\n                }, this)\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                lineNumber: 47,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_ui_card__WEBPACK_IMPORTED_MODULE_1__.CardContent, {\n                className: \"space-y-2\",\n                children: availableGroups.length === 0 ? /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                    className: \"text-center text-muted-foreground py-4\",\n                    children: \"No hay grupos disponibles\"\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                    lineNumber: 58,\n                    columnNumber: 11\n                }, this) : availableGroups.map((group)=>{\n                    var _group_people;\n                    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_draggable__WEBPACK_IMPORTED_MODULE_3__.Draggable, {\n                        id: \"group-\".concat(group.id),\n                        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                            className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_2__.cn)(\"p-3 rounded-lg border border-border transition-colors relative\", \"bg-card hover:bg-accent cursor-move\"),\n                            children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                                className: \"flex justify-between items-center\",\n                                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                                    className: \"space-y-2\",\n                                    children: [\n                                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"p\", {\n                                            children: [\n                                                group.people.length,\n                                                \" personas\"\n                                            ]\n                                        }, void 0, true, {\n                                            fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                                            lineNumber: 72,\n                                            columnNumber: 21\n                                        }, this),\n                                        /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"ul\", {\n                                            children: (_group_people = group.people) === null || _group_people === void 0 ? void 0 : _group_people.map((person)=>/*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"li\", {\n                                                    className: \"text-sm text-muted-foreground\",\n                                                    children: person.name\n                                                }, person.id, false, {\n                                                    fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                                                    lineNumber: 75,\n                                                    columnNumber: 25\n                                                }, this))\n                                        }, void 0, false, {\n                                            fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                                            lineNumber: 73,\n                                            columnNumber: 21\n                                        }, this)\n                                    ]\n                                }, void 0, true, {\n                                    fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                                    lineNumber: 71,\n                                    columnNumber: 19\n                                }, this)\n                            }, void 0, false, {\n                                fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                                lineNumber: 70,\n                                columnNumber: 17\n                            }, this)\n                        }, void 0, false, {\n                            fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                            lineNumber: 64,\n                            columnNumber: 15\n                        }, this)\n                    }, \"group-\".concat(group.id), false, {\n                        fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                        lineNumber: 63,\n                        columnNumber: 13\n                    }, this);\n                })\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n                lineNumber: 56,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true, {\n        fileName: \"C:\\\\Users\\\\Faia Facundo\\\\Desktop\\\\Programacion\\\\proyectos_workana\\\\hostel_log-main\\\\src\\\\components\\\\dashboard\\\\groups-panel.jsx\",\n        lineNumber: 46,\n        columnNumber: 5\n    }, this);\n}\n_c = GroupsPanel;\nvar _c;\n$RefreshReg$(_c, \"GroupsPanel\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL3NyYy9jb21wb25lbnRzL2Rhc2hib2FyZC9ncm91cHMtcGFuZWwuanN4IiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQWdGO0FBQ2pDO0FBQ2Q7QUFDTztBQUVqQyxTQUFTUSxZQUFZLEtBQStCO1FBQS9CLEVBQUVDLE1BQU0sRUFBRUMsaUJBQWlCLENBQUMsQ0FBQyxFQUFFLEdBQS9CO0lBQzFCLGdGQUFnRjtJQUNoRixNQUFNQyxzQkFBc0IsQ0FBQ0M7UUFDM0IsSUFBSSxDQUFDQSxNQUFNQyxNQUFNLElBQUlELE1BQU1DLE1BQU0sQ0FBQ0MsTUFBTSxLQUFLLEdBQUc7WUFDOUMscUJBQ0UsOERBQUNDO2dCQUFJQyxXQUFVOzBCQUFpQjs7Ozs7O1FBRXBDO1FBRUEscUJBQ0UsOERBQUNEO1lBQUlDLFdBQVU7OzhCQUNiLDhEQUFDRDtvQkFBSUMsV0FBVTs4QkFBZ0M7Ozs7Ozs4QkFDL0MsOERBQUNDO29CQUFHRCxXQUFVOzhCQUNYSixNQUFNQyxNQUFNLENBQUNLLEdBQUcsQ0FBQyxDQUFDQyxRQUFRQyxzQkFDekIsOERBQUNDOzRCQUE0QkwsV0FBVTs7OENBQ3JDLDhEQUFDTTtvQ0FBS04sV0FBVTs4Q0FDYkcsT0FBT0ksSUFBSSxJQUFJSixPQUFPSyxVQUFVLElBQUk7Ozs7OztnQ0FFdENMLE9BQU9NLFFBQVEsa0JBQ2QsOERBQUNwQiwwRkFBUUE7b0NBQUNXLFdBQVU7Ozs7Ozs7MkJBTGZHLE9BQU9PLEVBQUUsSUFBSU47Ozs7Ozs7Ozs7OEJBVTFCLDhEQUFDTDtvQkFBSUMsV0FBVTs7d0JBQXFDO3dCQUMxQ0osTUFBTUMsTUFBTSxDQUFDQyxNQUFNO3dCQUFDOzs7Ozs7Ozs7Ozs7O0lBSXBDO0lBRUEsNkNBQTZDO0lBQzdDLE1BQU1hLGtCQUFrQixDQUFDZjtRQUN2QixPQUFPRixjQUFjLENBQUNFLE1BQU1jLEVBQUUsQ0FBQyxJQUFJO0lBQ3JDO0lBRUEsNkJBQTZCO0lBQzdCLE1BQU1FLGtCQUFrQm5CLE9BQU9vQixNQUFNLENBQUMsQ0FBQ2pCLFFBQVUsQ0FBQ2UsZ0JBQWdCZjtJQUVsRSxxQkFDRSw4REFBQ1oscURBQUlBOzswQkFDSCw4REFBQ0MsMkRBQVVBOzBCQUNULDRFQUFDQywwREFBU0E7b0JBQUNjLFdBQVU7O3NDQUNuQiw4REFBQ1osMEZBQUtBOzRCQUFDWSxXQUFVOzs7Ozs7d0JBQVk7c0NBRTdCLDhEQUFDTTs0QkFBS04sV0FBVTs7Z0NBQ2JZLGdCQUFnQmQsTUFBTTtnQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OzBCQUk5Qiw4REFBQ1gsNERBQVdBO2dCQUFDYSxXQUFVOzBCQUNwQlksZ0JBQWdCZCxNQUFNLEtBQUssa0JBQzFCLDhEQUFDQztvQkFBSUMsV0FBVTs4QkFBeUM7Ozs7OzJCQUl4RFksZ0JBQWdCVixHQUFHLENBQUMsQ0FBQ047d0JBWVJBO3lDQVhYLDhEQUFDTCxpREFBU0E7d0JBQTJCbUIsSUFBSSxTQUFrQixPQUFUZCxNQUFNYyxFQUFFO2tDQUN4RCw0RUFBQ1g7NEJBQ0NDLFdBQVdWLDhDQUFFQSxDQUNYLGtFQUNBO3NDQUdGLDRFQUFDUztnQ0FBSUMsV0FBVTswQ0FDYiw0RUFBQ0Q7b0NBQUlDLFdBQVU7O3NEQUNiLDhEQUFDYzs7Z0RBQUdsQixNQUFNQyxNQUFNLENBQUNDLE1BQU07Z0RBQUM7Ozs7Ozs7c0RBQ3hCLDhEQUFDRzt1REFDRUwsZ0JBQUFBLE1BQU1DLE1BQU0sY0FBWkQsb0NBQUFBLGNBQWNNLEdBQUcsQ0FBQyxDQUFDQyx1QkFDbEIsOERBQUNFO29EQUVDTCxXQUFVOzhEQUVURyxPQUFPSSxJQUFJO21EQUhQSixPQUFPTyxFQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt1QkFiWixTQUFrQixPQUFUZCxNQUFNYyxFQUFFOzs7Ozs7Ozs7Ozs7Ozs7OztBQTZCN0M7S0F0RmdCbEIiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9fTl9FLy4vc3JjL2NvbXBvbmVudHMvZGFzaGJvYXJkL2dyb3Vwcy1wYW5lbC5qc3g/OTllZiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDYXJkLCBDYXJkSGVhZGVyLCBDYXJkVGl0bGUsIENhcmRDb250ZW50IH0gZnJvbSBcIkAvY29tcG9uZW50cy91aS9jYXJkXCI7XG5pbXBvcnQgeyBVc2VycywgQmFja3BhY2sgfSBmcm9tIFwibHVjaWRlLXJlYWN0XCI7XG5pbXBvcnQgeyBjbiB9IGZyb20gXCJAL2xpYi91dGlsc1wiO1xuaW1wb3J0IHsgRHJhZ2dhYmxlIH0gZnJvbSBcIi4vZHJhZ2dhYmxlXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBHcm91cHNQYW5lbCh7IGdyb3VwcywgYXNzaWduZWRTdGF0dXMgPSB7fSB9KSB7XG4gIC8vIEZ1bmNpw7NuIHBhcmEgZ2VuZXJhciBlbCBjb250ZW5pZG8gZGVsIHRvb2x0aXAgY29uIGxvcyBub21icmVzIGRlIGxhcyBwZXJzb25hc1xuICBjb25zdCByZW5kZXJQZW9wbGVUb29sdGlwID0gKGdyb3VwKSA9PiB7XG4gICAgaWYgKCFncm91cC5wZW9wbGUgfHwgZ3JvdXAucGVvcGxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGl0YWxpY1wiPk5vIGhheSBwZXJzb25hcyBlbiBlc3RlIGdydXBvPC9kaXY+XG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMSBtYXgtaC1bMjAwcHhdIG92ZXJmbG93LXktYXV0b1wiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtIG1iLTEgdGV4dC1wcmltYXJ5XCI+TWllbWJyb3MgZGVsIGdydXBvOjwvZGl2PlxuICAgICAgICA8dWwgY2xhc3NOYW1lPVwibGlzdC1kaXNjIGxpc3QtaW5zaWRlIHNwYWNlLXktMVwiPlxuICAgICAgICAgIHtncm91cC5wZW9wbGUubWFwKChwZXJzb24sIGluZGV4KSA9PiAoXG4gICAgICAgICAgICA8bGkga2V5PXtwZXJzb24uaWQgfHwgaW5kZXh9IGNsYXNzTmFtZT1cInRleHQteHMgZmxleCBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidHJ1bmNhdGVcIj5cbiAgICAgICAgICAgICAgICB7cGVyc29uLm5hbWUgfHwgcGVyc29uLmZpcnN0X25hbWUgfHwgXCJTaW4gbm9tYnJlXCJ9XG4gICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAge3BlcnNvbi5iYWNrcGFjayAmJiAoXG4gICAgICAgICAgICAgICAgPEJhY2twYWNrIGNsYXNzTmFtZT1cIm1sLTEgaC0zIHctMyB0ZXh0LXByaW1hcnlcIiAvPlxuICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICApKX1cbiAgICAgICAgPC91bD5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtdC0xXCI+XG4gICAgICAgICAgVG90YWw6IHtncm91cC5wZW9wbGUubGVuZ3RofSBwZXJzb25hc1xuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH07XG5cbiAgLy8gQWRkIGZ1bmN0aW9uIHRvIGNoZWNrIGlmIGdyb3VwIGlzIGFzc2lnbmVkXG4gIGNvbnN0IGlzR3JvdXBBc3NpZ25lZCA9IChncm91cCkgPT4ge1xuICAgIHJldHVybiBhc3NpZ25lZFN0YXR1c1tncm91cC5pZF0gfHwgZmFsc2U7XG4gIH07XG5cbiAgLy8gRmlsdGVyIG91dCBhc3NpZ25lZCBncm91cHNcbiAgY29uc3QgYXZhaWxhYmxlR3JvdXBzID0gZ3JvdXBzLmZpbHRlcigoZ3JvdXApID0+ICFpc0dyb3VwQXNzaWduZWQoZ3JvdXApKTtcblxuICByZXR1cm4gKFxuICAgIDxDYXJkPlxuICAgICAgPENhcmRIZWFkZXI+XG4gICAgICAgIDxDYXJkVGl0bGUgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgdGV4dC1sZ1wiPlxuICAgICAgICAgIDxVc2VycyBjbGFzc05hbWU9XCJoLTUgdy01XCIgLz5cbiAgICAgICAgICBHcnVwb3MgRGlzcG9uaWJsZXNcbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtbC1hdXRvIHRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XG4gICAgICAgICAgICB7YXZhaWxhYmxlR3JvdXBzLmxlbmd0aH0gZGlzcG9uaWJsZXNcbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgIDwvQ2FyZFRpdGxlPlxuICAgICAgPC9DYXJkSGVhZGVyPlxuICAgICAgPENhcmRDb250ZW50IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICB7YXZhaWxhYmxlR3JvdXBzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtY2VudGVyIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBweS00XCI+XG4gICAgICAgICAgICBObyBoYXkgZ3J1cG9zIGRpc3BvbmlibGVzXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgYXZhaWxhYmxlR3JvdXBzLm1hcCgoZ3JvdXApID0+IChcbiAgICAgICAgICAgIDxEcmFnZ2FibGUga2V5PXtgZ3JvdXAtJHtncm91cC5pZH1gfSBpZD17YGdyb3VwLSR7Z3JvdXAuaWR9YH0+XG4gICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2NuKFxuICAgICAgICAgICAgICAgICAgXCJwLTMgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLWJvcmRlciB0cmFuc2l0aW9uLWNvbG9ycyByZWxhdGl2ZVwiLFxuICAgICAgICAgICAgICAgICAgXCJiZy1jYXJkIGhvdmVyOmJnLWFjY2VudCBjdXJzb3ItbW92ZVwiXG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LWJldHdlZW4gaXRlbXMtY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMlwiPlxuICAgICAgICAgICAgICAgICAgICA8cD57Z3JvdXAucGVvcGxlLmxlbmd0aH0gcGVyc29uYXM8L3A+XG4gICAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgICB7Z3JvdXAucGVvcGxlPy5tYXAoKHBlcnNvbikgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17cGVyc29uLmlkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtwZXJzb24ubmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L0RyYWdnYWJsZT5cbiAgICAgICAgICApKVxuICAgICAgICApfVxuICAgICAgPC9DYXJkQ29udGVudD5cbiAgICA8L0NhcmQ+XG4gICk7XG59XG4iXSwibmFtZXMiOlsiQ2FyZCIsIkNhcmRIZWFkZXIiLCJDYXJkVGl0bGUiLCJDYXJkQ29udGVudCIsIlVzZXJzIiwiQmFja3BhY2siLCJjbiIsIkRyYWdnYWJsZSIsIkdyb3Vwc1BhbmVsIiwiZ3JvdXBzIiwiYXNzaWduZWRTdGF0dXMiLCJyZW5kZXJQZW9wbGVUb29sdGlwIiwiZ3JvdXAiLCJwZW9wbGUiLCJsZW5ndGgiLCJkaXYiLCJjbGFzc05hbWUiLCJ1bCIsIm1hcCIsInBlcnNvbiIsImluZGV4IiwibGkiLCJzcGFuIiwibmFtZSIsImZpcnN0X25hbWUiLCJiYWNrcGFjayIsImlkIiwiaXNHcm91cEFzc2lnbmVkIiwiYXZhaWxhYmxlR3JvdXBzIiwiZmlsdGVyIiwicCJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(app-pages-browser)/./src/components/dashboard/groups-panel.jsx\n"));

/***/ })

});