"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERole = exports.EIsActive = void 0;
var EIsActive;
(function (EIsActive) {
    EIsActive["ACTIVE"] = "ACTIVE";
    EIsActive["INACTIVE"] = "INACTIVE";
    EIsActive["BLOCKED"] = "BLOCKED";
})(EIsActive || (exports.EIsActive = EIsActive = {}));
var ERole;
(function (ERole) {
    ERole["SUPER_ADMIN"] = "SUPER_ADMIN";
    ERole["CLIENT"] = "CLIENT";
    ERole["LAWYER"] = "LAWYER";
})(ERole || (exports.ERole = ERole = {}));
