import { render } from '@testing-library/react';
import { ServiceWorkerRegistration } from '../ServiceWorkerRegistration';

describe('ServiceWorkerRegistration', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let registerMock: jest.Mock;

  beforeEach(() => {
    registerMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: { register: registerMock },
    });
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.env as any).NODE_ENV = originalNodeEnv;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window.navigator as any).serviceWorker;
  });

  it('registers the service worker in production', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.env as any).NODE_ENV = 'production';

    render(<ServiceWorkerRegistration />);

    expect(registerMock).toHaveBeenCalledWith('/sw.js');
  });

  it('does not register the service worker outside production', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.env as any).NODE_ENV = 'development';

    render(<ServiceWorkerRegistration />);

    expect(registerMock).not.toHaveBeenCalled();
  });

  it('renders nothing', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.env as any).NODE_ENV = 'production';

    const { container } = render(<ServiceWorkerRegistration />);

    expect(container).toBeEmptyDOMElement();
  });

  it('logs an error if registration fails, without throwing', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.env as any).NODE_ENV = 'production';
    registerMock.mockRejectedValue(new Error('registration failed'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<ServiceWorkerRegistration />);
    await Promise.resolve();
    await Promise.resolve();

    expect(errorSpy).toHaveBeenCalledWith('Service worker registration failed:', expect.any(Error));
    errorSpy.mockRestore();
  });
});
