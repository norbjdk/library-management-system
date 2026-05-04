import { defineConfig } from '@playwright/test';

const isCi = Boolean(process.env['CI']);
const useLiveApi = process.env['E2E_LIVE_API'] === '1';

const webServers = [
  {
    command: 'npm run start -- --host 127.0.0.1 --port 4200',
    url: 'http://127.0.0.1:4200/login',
    reuseExistingServer: !isCi,
    timeout: 120000,
  },
];

if (useLiveApi) {
  webServers.unshift({
    command:
      'cd /workspace/backend && /workspace/.venv/bin/python manage.py runserver 127.0.0.1:8000 --noreload',
    url: 'http://127.0.0.1:8000/api/health/',
    reuseExistingServer: !isCi,
    timeout: 120000,
  });
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: isCi ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4200',
    trace: 'retain-on-failure',
  },
  webServer: webServers,
});
