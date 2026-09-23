import { setupServer } from 'msw/node';
import { handlers, errorHandlers } from './handlers';

export const server = setupServer(...handlers);

export const errorServer = setupServer(...errorHandlers);

export function setupMSW() {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}

export function setupMSWErrors() {
  beforeAll(() => errorServer.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => errorServer.resetHandlers());
  afterAll(() => errorServer.close());
}