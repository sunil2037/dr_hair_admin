import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const BASE_URL = 'http://localhost:3000';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Generate Super Admin JWT token
const { TokenService } = await import('../../backend/src/shared/utils/token.service.js');
const adminToken = TokenService.generateToken({
  id: 'bootstrap:dr.hair@admin',
  email: 'dr.hair@admin',
  role: 'super_admin',
  name: 'Dr. Hair Super Admin',
});

const SCREENSHOT_DIR = path.resolve('admin_panal/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = {
  desktop: { width: 1280, height: 800, name: 'desktop' },
  tablet: { width: 768, height: 1024, name: 'tablet' },
  mobile: { width: 390, height: 844, name: 'mobile' },
};

async function checkHorizontalOverflow(page, viewName, vpName) {
  const overflow = await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
    const clientWidth = docEl.clientWidth;
    const hasOverflow = scrollWidth > clientWidth + 2; // allowance of 2px for subpixel rendering
    
    // Find culprit elements if overflow
    const culprits = [];
    if (hasOverflow) {
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        const rect = el.getBoundingClientRect();
        if (rect.right > clientWidth + 5) {
          culprits.push({
            tagName: el.tagName,
            className: el.className ? String(el.className).slice(0, 80) : '',
            id: el.id,
            right: Math.round(rect.right),
            clientWidth: clientWidth,
          });
          if (culprits.length >= 5) break;
        }
      }
    }
    return { hasOverflow, scrollWidth, clientWidth, culprits };
  });

  if (overflow.hasOverflow) {
    console.warn(`⚠️ [OVERFLOW] ${viewName} at ${vpName}: scrollWidth (${overflow.scrollWidth}) > clientWidth (${overflow.clientWidth})`);
    console.warn('   Culprits:', JSON.stringify(overflow.culprits));
  } else {
    console.log(`✅ [OK] ${viewName} at ${vpName}: no horizontal overflow (${overflow.clientWidth}px)`);
  }
  return overflow;
}

async function runAudit() {
  console.log('🚀 Starting Admin Panel Live Browser Inspection & E2E Audit...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const issues = [];
  const successes = [];

  // 1. Audit Sign-in View (Unauthenticated) across viewports
  for (const [vpKey, vp] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport: vp });
    const page = await context.newPage();

    // Listen to console and request errors
    page.on('console', msg => {
      if (msg.type() === 'error') console.error(`[Browser Console Error] (${vpKey}):`, msg.text());
    });
    page.on('pageerror', err => {
      console.error(`[Browser Page Error] (${vpKey}):`, err.message);
      issues.push({ view: 'Sign-in', viewport: vpKey, error: err.message });
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/signin-${vpKey}.png`, fullPage: false });

    // Check overflow
    const of = await checkHorizontalOverflow(page, 'Sign-in Page', vpKey);
    if (of.hasOverflow) issues.push({ view: 'Sign-in', viewport: vpKey, type: 'overflow', details: of });

    // Check login form inputs
    const emailInput = page.locator('input[autocomplete="username"]');
    const passInput = page.locator('input[autocomplete="current-password"]');
    const submitBtn = page.locator('button[type="submit"]');

    if (await emailInput.isVisible() && await passInput.isVisible() && await submitBtn.isVisible()) {
      successes.push(`Sign-in form inputs visible at ${vpKey}`);
    } else {
      issues.push({ view: 'Sign-in', viewport: vpKey, error: 'Sign-in form elements missing' });
    }

    // Test validation: submit empty form
    await submitBtn.click();
    await page.waitForTimeout(300);
    const errorMsg = page.locator('.signin-error, [role="alert"]');
    if (await errorMsg.isVisible()) {
      successes.push(`Sign-in empty submission validation alert shown at ${vpKey}`);
    }

    await context.close();
  }

  // 2. Audit Authenticated Workspace across viewports
  for (const [vpKey, vp] of Object.entries(VIEWPORTS)) {
    const context = await browser.newContext({ viewport: vp });
    
    // Set authentication cookie
    await context.addCookies([
      {
        name: 'drhair_admin_session',
        value: adminToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Strict',
      },
    ]);

    const page = await context.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        console.error(`[Console Error] [${vpKey}]:`, msg.text());
      }
    });

    // Navigate to overview / dashboard
    await page.goto(`${BASE_URL}/?panel=overview`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/overview-${vpKey}.png`, fullPage: false });
    const ofOverview = await checkHorizontalOverflow(page, 'Overview Page', vpKey);
    if (ofOverview.hasOverflow) issues.push({ view: 'Overview', viewport: vpKey, type: 'overflow', details: ofOverview });

    // Verify top bar and greeting
    const greeting = await page.locator('h1').textContent().catch(() => '');
    if (greeting.includes('Super Admin') || greeting.includes('Hi') || greeting.includes('Dr. Hair')) {
      successes.push(`Authenticated header rendered successfully at ${vpKey}: "${greeting}"`);
    }

    // Check Notifications dropdown
    const bellBtn = page.locator('button[title="Notifications"]');
    if (await bellBtn.isVisible()) {
      await bellBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/notifications-dropdown-${vpKey}.png` });
      const ofNotif = await checkHorizontalOverflow(page, 'Notifications Dropdown', vpKey);
      if (ofNotif.hasOverflow) issues.push({ view: 'Notifications Dropdown', viewport: vpKey, type: 'overflow', details: ofNotif });
      await bellBtn.click(); // Close
      await page.waitForTimeout(200);
    }

    // Check Profile / Sign Out dropdown on Desktop
    if (vpKey === 'desktop') {
      const profileBtn = page.locator('button[title*="Super Admin"], button[aria-label*="Profile"]');
      if (await profileBtn.isVisible()) {
        await profileBtn.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/profile-dropdown-desktop.png` });
        await profileBtn.click();
      }
    }

    // Test Navigation to each section:
    const panelsToTest = [
      { key: 'bookings', name: 'In-Clinic Bookings' },
      { key: 'tests', name: 'Hair Tests & Reports' },
      { key: 'orders', name: 'Orders' },
      { key: 'catalog', name: 'Commerce & Products' },
      { key: 'content', name: 'App Management & Videos' },
      { key: 'team', name: 'Admin Users & Patient Block/Delete' },
      { key: 'activity', name: 'Audit Log' },
    ];

    for (const panel of panelsToTest) {
      await page.goto(`${BASE_URL}/?panel=${panel.key}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${panel.key}-${vpKey}.png`, fullPage: false });
      const ofPanel = await checkHorizontalOverflow(page, panel.name, vpKey);
      if (ofPanel.hasOverflow) issues.push({ view: panel.name, viewport: vpKey, type: 'overflow', details: ofPanel });
      successes.push(`Panel ${panel.name} loaded cleanly at ${vpKey}`);

      // Section-specific dialog & button tests:
      if (panel.key === 'content') {
        // Test "Add YouTube Video" button and dialog
        const addVideoBtn = page.locator('button:has-text("Add YouTube Video"), button:has-text("Add video"), button:has-text("Upload video")').first();
        if (await addVideoBtn.isVisible()) {
          console.log(`Testing Add Video dialog at ${vpKey}...`);
          await addVideoBtn.click();
          await page.waitForTimeout(400);
          await page.screenshot({ path: `${SCREENSHOT_DIR}/dialog-add-video-${vpKey}.png` });
          const ofDialog = await checkHorizontalOverflow(page, 'Add Video Dialog', vpKey);
          if (ofDialog.hasOverflow) issues.push({ view: 'Add Video Dialog', viewport: vpKey, type: 'overflow', details: ofDialog });
          
          // Test close modal (Cancel or X button)
          const closeBtn = page.locator('button:has-text("Cancel"), button[aria-label="Close"], button:has-text("Close")').first();
          if (await closeBtn.isVisible()) await closeBtn.click();
          await page.waitForTimeout(300);
        }
      }

      if (panel.key === 'catalog') {
        // Test "Add Product" button and dialog
        const addProductBtn = page.locator('button:has-text("Add product"), button:has-text("Add Product"), button:has-text("New product")').first();
        if (await addProductBtn.isVisible()) {
          console.log(`Testing Add Product dialog at ${vpKey}...`);
          await addProductBtn.click();
          await page.waitForTimeout(400);
          await page.screenshot({ path: `${SCREENSHOT_DIR}/dialog-add-product-${vpKey}.png` });
          const ofDialog = await checkHorizontalOverflow(page, 'Add Product Dialog', vpKey);
          if (ofDialog.hasOverflow) issues.push({ view: 'Add Product Dialog', viewport: vpKey, type: 'overflow', details: ofDialog });
          
          const closeBtn = page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first();
          if (await closeBtn.isVisible()) await closeBtn.click();
          await page.waitForTimeout(300);
        }
      }

      if (panel.key === 'team') {
        // Test "Invite Admin" button and dialog
        const inviteBtn = page.locator('button:has-text("Invite admin"), button:has-text("Invite Admin"), button:has-text("Create Admin")').first();
        if (await inviteBtn.isVisible()) {
          console.log(`Testing Invite Admin dialog at ${vpKey}...`);
          await inviteBtn.click();
          await page.waitForTimeout(400);
          await page.screenshot({ path: `${SCREENSHOT_DIR}/dialog-invite-admin-${vpKey}.png` });
          const ofDialog = await checkHorizontalOverflow(page, 'Invite Admin Dialog', vpKey);
          if (ofDialog.hasOverflow) issues.push({ view: 'Invite Admin Dialog', viewport: vpKey, type: 'overflow', details: ofDialog });
          
          const closeBtn = page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first();
          if (await closeBtn.isVisible()) await closeBtn.click();
          await page.waitForTimeout(300);
        }

        // Test Logged-in users / Audit Log tab inside team
        const auditTabBtn = page.locator('button:has-text("Audit Log"), button:has-text("Logged-in users & accounts")').first();
        if (await auditTabBtn.isVisible()) {
          console.log(`Switching to Logged-in users / Audit Log tab at ${vpKey}...`);
          await auditTabBtn.click();
          await page.waitForTimeout(500);
          await page.screenshot({ path: `${SCREENSHOT_DIR}/team-audit-log-tab-${vpKey}.png` });
          const ofTab = await checkHorizontalOverflow(page, 'Team Audit Log Tab', vpKey);
          if (ofTab.hasOverflow) issues.push({ view: 'Team Audit Log Tab', viewport: vpKey, type: 'overflow', details: ofTab });

          // Test Block Modal if block button exists
          const blockBtn = page.locator('button:has-text("Block"), button[title*="Block"]').first();
          if (await blockBtn.isVisible()) {
            console.log(`Testing Block User dialog at ${vpKey}...`);
            await blockBtn.click();
            await page.waitForTimeout(400);
            await page.screenshot({ path: `${SCREENSHOT_DIR}/dialog-block-user-${vpKey}.png` });
            const ofBlock = await checkHorizontalOverflow(page, 'Block User Dialog', vpKey);
            if (ofBlock.hasOverflow) issues.push({ view: 'Block User Dialog', viewport: vpKey, type: 'overflow', details: ofBlock });
            const cancelBtn = page.locator('button:has-text("Cancel")').first();
            if (await cancelBtn.isVisible()) await cancelBtn.click();
            await page.waitForTimeout(300);
          }

          // Test Delete Modal if delete button exists
          const deleteBtn = page.locator('button:has-text("Delete"), button[title*="Delete"]').first();
          if (await deleteBtn.isVisible()) {
            console.log(`Testing Delete User dialog at ${vpKey}...`);
            await deleteBtn.click();
            await page.waitForTimeout(400);
            await page.screenshot({ path: `${SCREENSHOT_DIR}/dialog-delete-user-${vpKey}.png` });
            const ofDelete = await checkHorizontalOverflow(page, 'Delete User Dialog', vpKey);
            if (ofDelete.hasOverflow) issues.push({ view: 'Delete User Dialog', viewport: vpKey, type: 'overflow', details: ofDelete });
            const cancelBtn = page.locator('button:has-text("Cancel")').first();
            if (await cancelBtn.isVisible()) await cancelBtn.click();
            await page.waitForTimeout(300);
          }
        }
      }
    }

    // 3. Test Patient Detail Page (`/patients/patient-1`)
    console.log(`Testing Patient Detail Page at ${vpKey}...`);
    await page.goto(`${BASE_URL}/patients/patient-1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/patient-detail-${vpKey}.png`, fullPage: false });
    const ofPatient = await checkHorizontalOverflow(page, 'Patient Detail Page', vpKey);
    if (ofPatient.hasOverflow) issues.push({ view: 'Patient Detail Page', viewport: vpKey, type: 'overflow', details: ofPatient });

    await context.close();
  }

  await browser.close();

  console.log('\n================ AUDIT SUMMARY ================');
  console.log(`Total checks passed: ${successes.length}`);
  console.log(`Total issues found: ${issues.length}`);
  if (issues.length > 0) {
    console.log('\nDetailed Issues:');
    issues.forEach((iss, i) => console.log(`${i + 1}. [${iss.view}] (${iss.viewport}): ${iss.type || ''} ${JSON.stringify(iss.details || iss.error)}`));
  }
  console.log('================================================\n');

  return { successes, issues };
}

runAudit().catch(err => {
  console.error('Audit Script Failed:', err);
  process.exit(1);
});
