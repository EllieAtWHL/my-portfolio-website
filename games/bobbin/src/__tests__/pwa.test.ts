/** @jest-environment jsdom */
import { registerServiceWorker, SW_SCOPE, SW_URL } from "../pwa.ts";

// A minimal stand-in for navigator.serviceWorker and a registration.
class FakeTarget {
  private listeners = new Map<string, (() => void)[]>();
  addEventListener(type: string, fn: () => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]);
  }
  emit(type: string) {
    for (const fn of this.listeners.get(type) ?? []) fn();
  }
}
class FakeWorker extends FakeTarget {
  state = "installing";
  postMessage = jest.fn();
}
class FakeRegistration extends FakeTarget {
  waiting: FakeWorker | null = null;
  installing: FakeWorker | null = null;
}
class FakeContainer extends FakeTarget {
  controller: object | null = null;
  reg = new FakeRegistration();
  register = jest.fn(() => Promise.resolve(this.reg));
}

const flush = () => new Promise((r) => setTimeout(r, 0));

function setup(controlled: boolean) {
  const sw = new FakeContainer();
  sw.controller = controlled ? {} : null;
  const show = jest.fn();
  const reload = jest.fn();
  registerServiceWorker({ show }, sw as unknown as ServiceWorkerContainer, reload);
  return { sw, show, reload };
}

describe("registerServiceWorker", () => {
  it("registers the worker for the /bobbin scope", async () => {
    const { sw } = setup(false);
    await flush();
    expect(sw.register).toHaveBeenCalledWith(SW_URL, { scope: SW_SCOPE });
  });

  it("first install: no update prompt and no reload when the worker claims the page", async () => {
    const { sw, show, reload } = setup(false);
    await flush();
    const incoming = new FakeWorker();
    sw.reg.installing = incoming;
    sw.reg.emit("updatefound");
    incoming.state = "installed";
    incoming.emit("statechange");
    sw.emit("controllerchange"); // clients.claim() on first activation
    expect(show).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("update: offers it, applies it on request, then reloads once", async () => {
    const { sw, show, reload } = setup(true);
    await flush();
    const incoming = new FakeWorker();
    sw.reg.installing = incoming;
    sw.reg.emit("updatefound");
    incoming.state = "installed";
    incoming.emit("statechange");
    expect(show).toHaveBeenCalledTimes(1);

    show.mock.calls[0][0](); // player taps "Update"
    expect(incoming.postMessage).toHaveBeenCalledWith("SKIP_WAITING");
    sw.emit("controllerchange");
    sw.emit("controllerchange");
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("offers an update that downloaded on an earlier visit", async () => {
    const sw = new FakeContainer();
    sw.controller = {};
    sw.reg.waiting = new FakeWorker();
    const show = jest.fn();
    registerServiceWorker({ show }, sw as unknown as ServiceWorkerContainer, jest.fn());
    await flush();
    expect(show).toHaveBeenCalledTimes(1);
  });

  it("does nothing without service worker support", () => {
    expect(() => registerServiceWorker({ show: jest.fn() }, undefined)).not.toThrow();
  });
});
