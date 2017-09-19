"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const dob_1 = require("dob");
function isPromiseLike(result) {
    return result && typeof result.then === 'function';
}
exports.isPromiseLike = isPromiseLike;
class ComputedAsync {
    constructor(options) {
        this.options = options;
        this.status = dob_1.observable({
            busy: true,
            failed: false,
            error: null,
        });
        this.version = 0;
        this.atom = new dob_1.Atom(() => this.wake(), () => this.sleep());
        this.cachedValue = options.init.data;
    }
    wake() {
        this.sleep();
        this.monitor = dob_1.observe(() => this.observe(), this.options.delay);
    }
    observe() {
        const thisVersion = ++this.version;
        if (this.options.revert) {
            this.cachedValue = this.options.init.data;
            this.atom.reportChanged();
        }
        // tslint:disable-next-line:no-shadowed-variable
        const current = (f) => (arg) => {
            if (this.version === thisVersion) {
                f(arg);
            }
        };
        try {
            const possiblePromise = this.options.fetch();
            if (!isPromiseLike(possiblePromise)) {
                this.stopped(false, undefined, possiblePromise);
            }
            else {
                this.starting();
                possiblePromise.then(current((v) => this.stopped(false, undefined, v)), current((e) => this.handleError(e)));
            }
        }
        catch (x) {
            console.log(x, x.stack);
            this.handleError(x);
        }
    }
    starting() {
        this.status.busy = true;
    }
    stopped(f, e, v) {
        this.status.busy = false;
        this.status.failed = f;
        this.status.error = e;
        if (v !== this.cachedValue) {
            this.cachedValue = v;
            this.atom.reportChanged();
        }
    }
    handleError(e) {
        let newValue = this.options.init.data;
        if (this.options.error) {
            try {
                newValue = this.options.error(e);
            }
            catch (x) {
                //
            }
        }
        this.stopped(true, e, newValue);
    }
    sleep() {
        const monitor = this.monitor;
        this.monitor = undefined;
        if (monitor) {
            monitor.unobserve();
        }
    }
    get error() {
        this.atom.reportObserved();
        return this.status.error;
    }
    get loading() {
        this.atom.reportObserved();
        return this.status.busy;
    }
    get data() {
        this.atom.reportObserved();
        if (this.status.failed && this.options.rethrow) {
            throw this.status.error;
        }
        return this.cachedValue;
    }
}
__decorate([
    dob_1.Action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ComputedAsync.prototype, "starting", null);
__decorate([
    dob_1.Action,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean, Object, Object]),
    __metadata("design:returntype", void 0)
], ComputedAsync.prototype, "stopped", null);
function computedAsync(init, fetch, delay) {
    if (arguments.length === 1) {
        return new ComputedAsync(init);
    }
    return new ComputedAsync({
        init: init,
        fetch: fetch,
        delay,
    });
}
exports.computedAsync = computedAsync;
