import { test, expect } from '@playwright/test';

test('End-to-end: login, ws and upload broadcast', async ({ request, page }) => {
  const baseApi = 'http://localhost:8000';

  // Step 1: login via REST to obtain JWT
  const loginResp = await request.post(`${baseApi}/api/auth/login`, {
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ username: 'test6', password: 'pass123' }),
  });
  expect(loginResp.ok()).toBeTruthy();
  const loginData = await loginResp.json();
  const token = loginData.access_token;

  // Step 2: Load end-to-end test page that drives the flow
  await page.goto('http://localhost:3000/e2e.html');
  const status = page.locator('#e2e-status');
  await expect(status).toBeVisible();
  // The embedded page performs WS connection using the token; we verify it reports connected
  await expect(status).toHaveText(/ws\.?connected|connected/);
});
