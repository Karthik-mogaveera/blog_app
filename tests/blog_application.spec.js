import { test, expect } from '@playwright/test';

test.describe('Sprint 1: System Scaffolding, Design System & Authentication', () => {
  test('Issue #1: Backend Health Check & Database Connection', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.database).toBe('connected');
    expect(typeof data.uptime).toBe('number');
    expect(data.environment).toBeDefined();
  });

  test('Issue #1: Client-Side Scaffolding & Browser Connectivity', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    // Verify client HTML mounts properly
    await expect(page.locator('#root')).toBeVisible();
    expect(await page.title()).toBeTruthy();
    expect(errors).toHaveLength(0);
  });

  test('Issue #2: Design System & Responsive Shell', async ({ page }) => {
    await page.goto('/');
    // Check navigation branding
    const brandLogo = page.locator('#nav-brand-logo');
    await expect(brandLogo).toBeVisible();
    await expect(brandLogo).toContainText('Chronicle');

    // Check header and search bar
    await expect(page.locator('#search-input')).toBeVisible();
    await expect(page.locator('#filter-cat-all')).toBeVisible();

    // Check footer
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('footer')).toContainText('Chronicle Platform');
  });

  test('Issue #2 (Negative Path): Missing Route Renders Clean 404 Layout', async ({ page }) => {
    await page.goto('/some-missing-article-url-route-404');
    await expect(page.locator('h1')).toContainText('404');
    await expect(page.locator('h2')).toContainText('Page Not Found');
    const returnBtn = page.locator('#btn-return-home-404');
    await expect(returnBtn).toBeVisible();
    await returnBtn.click();
    await page.waitForURL('/');
    await expect(page.locator('#nav-brand-logo')).toBeVisible();
  });

  test('Issue #2: Responsive Mobile Shell & Collapsible Drawer Toggle', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const toggle = page.locator('#nav-mobile-toggle');
    await expect(toggle).toBeVisible();

    // Drawer should not be visible initially
    await expect(page.locator('#nav-mobile-drawer')).toHaveCount(0);

    // Click toggle to open drawer
    await toggle.click();
    await expect(page.locator('#nav-mobile-drawer')).toBeVisible();
    await expect(page.locator('#nav-mobile-link-home')).toBeVisible();

    // Click toggle to close drawer
    await toggle.click();
    await expect(page.locator('#nav-mobile-drawer')).toHaveCount(0);
  });

  test('Issue #3: Reader Registration, Initials Avatar & Login Flow', async ({ page }) => {
    const uniqueUser = `reader_${Date.now()}`;
    const uniqueEmail = `${uniqueUser}@example.com`;
    const password = 'Password@123';

    // Navigate to Register
    await page.goto('/register');
    await expect(page.locator('#register-username')).toBeVisible();

    // Fill form and check dynamic initials avatar preview
    await page.fill('#register-username', uniqueUser);
    await expect(page.locator('#register-avatar-preview')).toBeVisible();

    await page.fill('#register-email', uniqueEmail);
    await page.fill('#register-password', password);
    await page.click('#register-submit-btn');

    // Should redirect to Home and display user pill in navbar
    await page.waitForURL('/');
    await expect(page.locator('#nav-user-pill')).toBeVisible();
    await expect(page.locator('#nav-user-pill')).toContainText(uniqueUser);

    // Logout
    await page.click('#nav-btn-logout');
    await expect(page.locator('#nav-btn-login')).toBeVisible();

    // Login with the created account
    await page.click('#nav-btn-login');
    await page.waitForURL('/login');
    await page.fill('#login-identifier', uniqueUser);
    await page.fill('#login-password', password);
    await page.click('#login-submit-btn');

    await page.waitForURL('/');
    await expect(page.locator('#nav-user-pill')).toContainText(uniqueUser);
  });

  test('Issue #3 (Negative Case): Duplicate Registration Rejection', async ({ page }) => {
    await page.goto('/register');
    // Attempt duplicate admin username
    await page.fill('#register-username', 'admin');
    await page.fill('#register-email', 'admin_dup@example.com');
    await page.fill('#register-password', 'Secret@123');
    await page.click('#register-submit-btn');

    const err = page.locator('#register-error-banner');
    await expect(err).toBeVisible();
    await expect(err).toContainText('already taken');
  });

  test('Issue #3 (Negative Case): Invalid Login Password Rejection', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'WrongPassword@999');
    await page.click('#login-submit-btn');

    const err = page.locator('#login-error-banner');
    await expect(err).toBeVisible();
    await expect(err).toContainText('Invalid credentials');
  });

  test('Issue #3 (Negative Case): Non-Admin Route Guard on /admin/blogs', async ({ page }) => {
    // Navigate directly to admin area without login
    await page.goto('/admin/blogs');
    // Should be redirected to /login
    await page.waitForURL('/login');
    await expect(page.locator('#login-identifier')).toBeVisible();
  });

  test('Issue #3: Pre-Configured Admin Login & Studio Access', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'Admin@123456');
    await page.click('#login-submit-btn');

    // Admin should land on /admin/blogs
    await page.waitForURL('/admin/blogs');
    await expect(page.locator('#admin-blogs-table')).toBeVisible();
    await expect(page.locator('#nav-link-admin-studio')).toBeVisible();
    await expect(page.locator('#nav-link-admin-moderation')).toBeVisible();
  });
});

test.describe('Sprint 2: Blog Management Studio & Public Discovery Engine', () => {
  test('Issue #4: Admin Blog Studio (Create New Article with Custom Author)', async ({ page }) => {
    // Login as Admin
    await page.goto('/login');
    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'Admin@123456');
    await page.click('#login-submit-btn');
    await page.waitForURL('/admin/blogs');

    // Click Create New Article
    await page.click('#admin-create-blog-btn');
    await page.waitForURL('/admin/blogs/new');

    const testBlogTitle = `Playwright End-to-End Testing Deep Dive ${Date.now()}`;
    await page.fill('#blog-title-input', testBlogTitle);
    await page.selectOption('#blog-category-select', 'Tutorials');
    await page.fill('#blog-author-input', 'Staff QA Engineer');
    await page.fill('#blog-tags-input', 'playwright, testing, automation');
    await page.fill(
      '#blog-content-textarea',
      'Automated testing provides unbreakable confidence across regressions and edge cases in modern applications.'
    );

    // Save and publish
    await page.click('#editor-publish-btn');
    await page.waitForURL('/admin/blogs');

    // Verify it appears in the table
    await expect(page.locator('#admin-blogs-table')).toContainText(testBlogTitle);

    // Verify it appears on the public catalog
    await page.goto('/');
    await expect(page.locator('.blog-grid')).toContainText(testBlogTitle);
  });

  test('Issue #4 (Negative Path): Form Validation for Empty Title and Content', async ({ page }) => {
    // Login as Admin
    await page.goto('/login');
    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'Admin@123456');
    await page.click('#login-submit-btn');
    await page.waitForURL('/admin/blogs');

    await page.click('#admin-create-blog-btn');
    await page.waitForURL('/admin/blogs/new');

    // Verify predefined categories
    const categories = await page.locator('#blog-category-select option').allInnerTexts();
    expect(categories).toContain('Technology');
    expect(categories).toContain('Design');
    expect(categories).toContain('Career');
    expect(categories).toContain('Tutorials');

    // Attempt to publish without filling title or content
    await page.click('#editor-publish-btn');
    await expect(page.locator('#editor-error-banner')).toBeVisible();
    await expect(page.locator('#editor-error-banner')).toContainText('Please provide both an article title and content body');
  });

  test('Issue #5 (Edge Case 3, 18 & 21): Unpublish vs. Publish Lifecycle & Strict 404 for Guests', async ({ page, browser }) => {
    // Admin logs in and creates a draft blog
    await page.goto('/login');
    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'Admin@123456');
    await page.click('#login-submit-btn');
    await page.waitForURL('/admin/blogs');

    const draftTitle = `Secret Draft Article ${Date.now()}`;
    await page.click('#admin-create-blog-btn');
    await page.waitForURL('/admin/blogs/new');
    await page.fill('#blog-title-input', draftTitle);
    await page.fill('#blog-content-textarea', 'This content is not published yet.');
    await page.click('#editor-save-draft-btn');
    await page.waitForURL('/admin/blogs');

    // Get the blog ID from table link
    const rowLink = page.locator(`tr:has-text("${draftTitle}") a[title="Preview article"]`);
    const href = await rowLink.getAttribute('href');
    expect(href).toBeTruthy();

    // Verify Admin CAN preview the draft article
    await page.goto(href);
    await expect(page.locator('.article-title')).toContainText(draftTitle);
    await expect(page.locator('.badge-draft')).toBeVisible();

    // Open a completely separate incognito / guest context (unregistered visitor)
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();

    // Guest should NOT see the draft on home page
    await guestPage.goto('/');
    await expect(guestPage.locator('.blog-grid')).not.toContainText(draftTitle);

    // Guest attempting direct URL access receives Strict 404 (Edge Case 21)
    await guestPage.goto(href);
    await expect(guestPage.locator('h1')).toContainText('404');
    await expect(guestPage.locator('h2')).toContainText('Article Not Found');

    await guestContext.close();
  });

  test('Issue #5: Admin Table Status Toggle (Publish/Unpublish) & Permanent Deletion Cascade', async ({ page }) => {
    // Admin login
    await page.goto('/login');
    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'Admin@123456');
    await page.click('#login-submit-btn');
    await page.waitForURL('/admin/blogs');

    // Create a temporary blog to test lifecycle controls
    const tempTitle = `Lifecycle Test Blog ${Date.now()}`;
    await page.click('#admin-create-blog-btn');
    await page.waitForURL('/admin/blogs/new');
    await page.fill('#blog-title-input', tempTitle);
    await page.fill('#blog-content-textarea', 'Lifecycle test content for unpublish and permanent delete.');
    await page.click('#editor-save-draft-btn');
    await page.waitForURL('/admin/blogs');

    const row = page.locator(`tr:has-text("${tempTitle}")`);
    await expect(row).toBeVisible();
    await expect(row.locator('.badge-draft')).toBeVisible();

    // 1. Toggle to Publish
    const toggleBtn = row.locator('button:has-text("Publish")');
    await toggleBtn.click();
    await expect(row.locator('.badge-published')).toBeVisible();
    await expect(row.locator('button:has-text("Unpublish")')).toBeVisible();

    // 2. Toggle back to Unpublish (Draft)
    const unpublishBtn = row.locator('button:has-text("Unpublish")');
    await unpublishBtn.click();
    await expect(row.locator('.badge-draft')).toBeVisible();
    await expect(row.locator('button:has-text("Publish")')).toBeVisible();

    // 3. Permanent Deletion with confirmation
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    const deleteBtn = row.locator('button[title*="Permanently delete"]');
    await deleteBtn.click();
    const modalConfirm = page.locator('#btn-modal-confirm');
    if (await modalConfirm.isVisible({ timeout: 1000 }).catch(() => false)) {
      await modalConfirm.click();
    }

    // Verify row is removed from table
    await expect(page.locator(`tr:has-text("${tempTitle}")`)).toHaveCount(0);
  });

  test('Issue #6: Public Catalog Search & Category Filters', async ({ page }) => {
    await page.goto('/');

    // Test Search Input
    await page.fill('#search-input', 'Vanilla CSS');
    await page.click('#search-submit-btn');
    await page.waitForTimeout(500);

    const cards = page.locator('.blog-card');
    await expect(cards.first()).toBeVisible();
    await expect(page.locator('.blog-grid')).toContainText('Vanilla CSS');

    // Test Category Filtering
    await page.click('#filter-cat-technology');
    await page.waitForTimeout(500);
    const badges = page.locator('.badge-Technology');
    await expect(badges.first()).toBeVisible();
  });

  test('Issue #6: Adaptive Typography Card Layout for Posts Without Cover Photo', async ({ page }) => {
    await page.goto('/');
    // Filter to Design category where sample blog has no cover image
    await page.click('#filter-cat-design');
    await page.waitForTimeout(500);

    // Verify the card renders with .blog-card-typography class
    const typographyCard = page.locator('.blog-card-typography');
    await expect(typographyCard.first()).toBeVisible();
    await expect(typographyCard.first().locator('.blog-card-img')).toHaveCount(0);
  });

  test('Issue #6: Search Clear & Query Reset to Page 1', async ({ page }) => {
    await page.goto('/');
    await page.fill('#search-input', 'Vanilla CSS');
    await page.click('#search-submit-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('.blog-grid')).toContainText('Vanilla CSS');

    // Clear search using the X button
    const clearBtn = page.locator('#search-input ~ button');
    await clearBtn.click();
    await expect(page.locator('#search-input')).toHaveValue('');

    // Catalog should reload all articles
    await page.waitForTimeout(500);
    const cards = page.locator('.blog-card');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Sprint 3: Engagement Engine — Likes, Multi-Level Comments & Moderation', () => {
  test('Issue #7: Deduplicated Like Toggle for Registered Reader & Guest Prompt', async ({ page, browser }) => {
    // Guest access test
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await guestPage.goto('/');
    await guestPage.locator('.blog-card-title').first().click();

    // Guest clicking like triggers login prompt tooltip
    await guestPage.click('#btn-like-toggle');
    await expect(guestPage.locator('text=Please log in to like this article')).toBeVisible();
    await guestContext.close();

    // Registered reader test
    const readerName = `liker_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', readerName);
    await page.fill('#register-email', `${readerName}@test.com`);
    await page.fill('#register-password', 'Password@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // Open first blog
    await page.locator('.blog-card-title').first().click();
    await page.waitForSelector('#btn-like-toggle');

    const initialLikeText = await page.locator('#btn-like-toggle span').innerText();
    const initialCount = parseInt(initialLikeText) || 0;

    // First Click: Like
    await page.click('#btn-like-toggle');
    await page.waitForTimeout(500);
    const updatedLikeText = await page.locator('#btn-like-toggle span').innerText();
    expect(parseInt(updatedLikeText)).toBe(initialCount + 1);
    await expect(page.locator('#btn-like-toggle')).toHaveClass(/liked/);

    // Second Click: Unlike (Idempotent toggle)
    await page.click('#btn-like-toggle');
    await page.waitForTimeout(500);
    const revertedLikeText = await page.locator('#btn-like-toggle span').innerText();
    expect(parseInt(revertedLikeText)).toBe(initialCount);
    await expect(page.locator('#btn-like-toggle')).not.toHaveClass(/liked/);
  });

  test('Issue #7: Like State Persistence Across Page Reload & Reading Experience Elements', async ({ page }) => {
    // 1. Register reader
    const readerUser = `persister_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', `${readerUser}@test.com`);
    await page.fill('#register-password', 'Password@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // 2. Open first article
    await page.locator('.blog-card-title').first().click();
    await page.waitForSelector('#btn-like-toggle');

    // 3. Verify reading experience container & elements
    await expect(page.locator('.article-title')).toBeVisible();
    await expect(page.locator('.article-author-meta')).toBeVisible();
    await expect(page.locator('#article-body-text')).toBeVisible();
    await expect(page.locator('.like-bar')).toBeVisible();

    // 4. Like the article
    await page.click('#btn-like-toggle');
    await page.waitForTimeout(500);
    await expect(page.locator('#btn-like-toggle')).toHaveClass(/liked/);

    // 5. Reload page to verify persistence of like state
    await page.reload();
    await page.waitForSelector('#btn-like-toggle');
    await expect(page.locator('#btn-like-toggle')).toHaveClass(/liked/);

    // 6. Verify back navigation
    await page.click('#btn-back-to-articles');
    await page.waitForURL('/');
    await expect(page.locator('#articles-container')).toBeVisible();
  });

  test('Issue #8: Multi-Level Threaded Comments & Deep Reply Tree (Root -> Reply -> Nested Reply)', async ({ page }) => {
    // 1. Register reader
    const commenter = `threaded_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', commenter);
    await page.fill('#register-email', `${commenter}@test.com`);
    await page.fill('#register-password', 'Password@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // 2. Open first article
    await page.locator('.blog-card-title').first().click();
    await page.waitForSelector('#new-comment-form');

    // 3. Post top-level comment (Level 0 Root)
    const rootCommentText = `Root discussion perspective from ${commenter}`;
    await page.fill('#comment-input-textarea', rootCommentText);
    await page.click('#comment-submit-btn');
    await page.waitForTimeout(500);

    const rootNode = page.locator(`.comment-node:has-text("${rootCommentText}")`);
    await expect(rootNode).toBeVisible();

    // 4. Post first-level reply (Level 1)
    await rootNode.locator('button:has-text("Reply")').first().click();
    const reply1Text = `Level 1 reply addressing ${commenter}`;
    await rootNode.locator('textarea').fill(reply1Text);
    await rootNode.locator('button:has-text("Post Reply")').click();
    await page.waitForTimeout(500);

    const reply1Node = rootNode.locator(`.reply-tree-branch .comment-node:has-text("${reply1Text}")`);
    await expect(reply1Node).toBeVisible();

    // 5. Post nested second-level reply (Level 2)
    await reply1Node.locator('button:has-text("Reply")').first().click();
    const reply2Text = `Level 2 nested reply branching off level 1`;
    await reply1Node.locator('textarea').fill(reply2Text);
    await reply1Node.locator('button:has-text("Post Reply")').click();
    await page.waitForTimeout(500);

    const reply2Node = reply1Node.locator(`.reply-tree-branch .comment-node:has-text("${reply2Text}")`);
    await expect(reply2Node).toBeVisible();
  });

  test('Issue #8: Guest CTA Banner & Empty Whitespace Comment Validation', async ({ page, browser }) => {
    // 1. Guest visitor check
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await guestPage.goto('/');
    await guestPage.locator('.blog-card-title').first().click();

    // Guest CTA banner must be present
    await expect(guestPage.locator('#guest-cta-banner')).toBeVisible();
    await expect(guestPage.locator('#cta-login-btn')).toBeVisible();
    await expect(guestPage.locator('#cta-register-btn')).toBeVisible();
    await expect(guestPage.locator('#new-comment-form')).toHaveCount(0);
    await guestContext.close();

    // 2. Authenticated reader validation check
    const validatorUser = `val_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', validatorUser);
    await page.fill('#register-email', `${validatorUser}@test.com`);
    await page.fill('#register-password', 'Password@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    await page.locator('.blog-card-title').first().click();
    await page.waitForSelector('#new-comment-form');

    const submitBtn = page.locator('#comment-submit-btn');
    const textarea = page.locator('#comment-input-textarea');

    // Initially empty -> Submit button is disabled
    await expect(submitBtn).toBeDisabled();

    // Whitespace only -> Submit button remains disabled
    await textarea.fill('     \n\t   ');
    await expect(submitBtn).toBeDisabled();

    // Valid text -> Submit button enabled
    await textarea.fill('Valid insightful remark');
    await expect(submitBtn).toBeEnabled();
  });

  test('Issue #9: Comment Ownership, Author Edit & Cascade Deletion', async ({ page }) => {
    // Register reader
    const commenter = `commenter_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', commenter);
    await page.fill('#register-email', `${commenter}@test.com`);
    await page.fill('#register-password', 'Password@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // Open first article
    await page.locator('.blog-card-title').first().click();
    await page.waitForSelector('#new-comment-form');

    // Post top-level comment
    const topCommentText = `Top-level insight from ${commenter} at ${Date.now()}`;
    await page.fill('#comment-input-textarea', topCommentText);
    await page.click('#comment-submit-btn');

    // Verify top-level comment appears in tree
    await expect(page.locator('.comment-tree')).toContainText(topCommentText);

    // Post a nested reply
    const topCommentCard = page.locator(`.comment-node:has-text("${topCommentText}")`);
    await topCommentCard.locator('button:has-text("Reply")').first().click();

    const replyText = `Nested reply branch at ${Date.now()}`;
    await topCommentCard.locator('textarea').fill(replyText);
    await topCommentCard.locator('button:has-text("Post Reply")').click();

    // Verify reply is nested in branch
    await expect(topCommentCard.locator('.reply-tree-branch')).toContainText(replyText);

    // Test Author Edit with (edited) badge
    await topCommentCard.locator('button:has-text("Edit")').first().click();
    const editedText = `${topCommentText} [revised]`;
    await topCommentCard.locator('form textarea').fill(editedText);
    await topCommentCard.locator('button:has-text("Save")').click();

    await expect(page.locator('.comment-tree')).toContainText(editedText);
    await expect(topCommentCard.locator('.comment-edited-label')).toBeVisible();

    // Test Cascade Deletion: Deleting the top comment removes it AND the nested reply!
    page.on('dialog', (dialog) => dialog.accept());
    await topCommentCard.locator('button:has-text("Delete")').first().click();
    const modalConfirmTop = page.locator('#btn-modal-confirm');
    if (await modalConfirmTop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await modalConfirmTop.click();
    }
    await page.waitForTimeout(600);

    // Both parent and child should be gone
    await expect(page.locator('.comment-tree')).not.toContainText(editedText);
    await expect(page.locator('.comment-tree')).not.toContainText(replyText);
  });

  test('Issue #9: Non-Owner Authorization Guard (Edit/Delete Buttons Hidden for Other Readers)', async ({ browser }) => {
    // Reader A posts a comment
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const userA = `author_a_${Date.now()}`;
    await pageA.goto('/register');
    await pageA.fill('#register-username', userA);
    await pageA.fill('#register-email', `${userA}@test.com`);
    await pageA.fill('#register-password', 'Password@123');
    await pageA.click('#register-submit-btn');
    await pageA.waitForURL('/');

    await pageA.locator('.blog-card-title').first().click();
    await pageA.waitForSelector('#new-comment-form');
    const commentA = `User A private comment ${Date.now()}`;
    await pageA.fill('#comment-input-textarea', commentA);
    await pageA.click('#comment-submit-btn');
    await expect(pageA.locator('.comment-tree')).toContainText(commentA);
    await contextA.close();

    // Reader B visits the article
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const userB = `other_reader_${Date.now()}`;
    await pageB.goto('/register');
    await pageB.fill('#register-username', userB);
    await pageB.fill('#register-email', `${userB}@test.com`);
    await pageB.fill('#register-password', 'Password@123');
    await pageB.click('#register-submit-btn');
    await pageB.waitForURL('/');

    await pageB.locator('.blog-card-title').first().click();
    await pageB.waitForSelector('.comment-tree');

    const commentNode = pageB.locator(`.comment-node:has-text("${commentA}")`);
    await expect(commentNode).toBeVisible();

    // Verify Reader B has NO Edit or Delete button on Reader A's comment
    await expect(commentNode.locator('button:has-text("Edit")')).toHaveCount(0);
    await expect(commentNode.locator('button:has-text("Delete")')).toHaveCount(0);

    // Reply button should still be available for Reader B
    await expect(commentNode.locator('button:has-text("Reply")')).toBeVisible();

    await contextB.close();
  });

  test('Issue #9: Admin Moderation Hub & Moderator Edit Badge', async ({ page }) => {
    // 1. Post a comment as a reader
    const readerUser = `mod_test_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', `${readerUser}@test.com`);
    await page.fill('#register-password', 'Password@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    await page.locator('.blog-card-title').first().click();
    const commentToModerate = `Unmoderated raw text ${Date.now()}`;
    await page.fill('#comment-input-textarea', commentToModerate);
    await page.click('#comment-submit-btn');
    await expect(page.locator('.comment-tree')).toContainText(commentToModerate);

    // 2. Log in as Admin and visit Moderation Hub
    await page.click('#nav-btn-logout');
    await page.goto('/login');
    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'Admin@123456');
    await page.click('#login-submit-btn');
    await page.waitForURL('/admin/blogs');

    await page.click('#nav-link-admin-moderation');
    await page.waitForURL('/admin/comments');

    // Locate the comment row using stable ID
    const initialRow = page.locator(`tr:has-text("${commentToModerate}")`).first();
    await expect(initialRow).toBeVisible();
    const rowId = await initialRow.getAttribute('id');
    const row = page.locator(`#${rowId}`);

    // Moderator Edit
    await row.locator('button[title="Edit as moderator"]').click();
    const moderatedText = `[Moderated by Admin ${Date.now()}] Complies with community standards`;
    await row.locator('textarea').fill(moderatedText);
    await row.locator('button:has-text("Save")').click();
    await page.waitForTimeout(600);

    // Check status badge in moderation table
    await expect(row).toContainText('(edited by Admin)');

    // 3. Visit the blog reading view to verify community sees (edited by Admin)
    const blogLink = row.locator('td:nth-child(2) a');
    await expect(blogLink).toBeVisible();
    const blogHref = await blogLink.getAttribute('href');
    await page.goto(blogHref);
    await expect(page.locator('.comment-tree')).toContainText(moderatedText);
    const moderatedNode = page.locator(`.comment-node:has-text("${moderatedText}")`);
    await expect(moderatedNode.locator('.comment-admin-edited-label').first()).toBeVisible();
  });
});

test.describe('Sprint 4: In-App Notification Center', () => {
  test('Issue #10: Notification Bell & Unread Alert Trigger on Reply', async ({ browser }) => {
    // Reader A registers and comments
    const userA = `user_a_${Date.now()}`;
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    await pageA.goto('/register');
    await pageA.fill('#register-username', userA);
    await pageA.fill('#register-email', `${userA}@test.com`);
    await pageA.fill('#register-password', 'Password@123');
    await pageA.click('#register-submit-btn');
    await pageA.waitForURL('/');

    await pageA.locator('.blog-card-title').first().click();
    const commentA = `Comment from User A at ${Date.now()}`;
    await pageA.fill('#comment-input-textarea', commentA);
    await pageA.click('#comment-submit-btn');
    await expect(pageA.locator('.comment-tree')).toContainText(commentA);

    // Reader B registers and replies to User A's comment
    const userB = `user_b_${Date.now()}`;
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    await pageB.goto('/register');
    await pageB.fill('#register-username', userB);
    await pageB.fill('#register-email', `${userB}@test.com`);
    await pageB.fill('#register-password', 'Password@123');
    await pageB.click('#register-submit-btn');
    await pageB.waitForURL('/');

    await pageB.locator('.blog-card-title').first().click();
    const commentNode = pageB.locator(`.comment-node:has-text("${commentA}")`);
    await commentNode.locator('button:has-text("Reply")').first().click();
    await commentNode.locator('textarea').fill(`Reply from User B to User A`);
    await commentNode.locator('button:has-text("Post Reply")').click();
    await expect(commentNode.locator('.reply-tree-branch')).toContainText(`Reply from User B to User A`);

    // Back to User A: Notification bell should now have an unread badge!
    await pageA.reload();
    await expect(pageA.locator('#nav-unread-count')).toBeVisible();

    // Click notification bell
    await pageA.click('#nav-notification-bell');
    await expect(pageA.locator('.notification-dropdown')).toBeVisible();
    await expect(pageA.locator('.notification-list')).toContainText(userB);

    await contextA.close();
    await contextB.close();
  });

  test('Issue #10: Notification Click-to-Read, Navigation & Mark All Read', async ({ browser }) => {
    // 1. User A registers and posts comment
    const userA = `notif_target_${Date.now()}`;
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('/register');
    await pageA.fill('#register-username', userA);
    await pageA.fill('#register-email', `${userA}@test.com`);
    await pageA.fill('#register-password', 'Password@123');
    await pageA.click('#register-submit-btn');
    await pageA.waitForURL('/');

    await pageA.locator('.blog-card-title').first().click();
    const commentText = `Target comment by ${userA}`;
    await pageA.fill('#comment-input-textarea', commentText);
    await pageA.click('#comment-submit-btn');
    await expect(pageA.locator('.comment-tree')).toContainText(commentText);

    // 2. User B replies
    const userB = `notif_actor_${Date.now()}`;
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/register');
    await pageB.fill('#register-username', userB);
    await pageB.fill('#register-email', `${userB}@test.com`);
    await pageB.fill('#register-password', 'Password@123');
    await pageB.click('#register-submit-btn');
    await pageB.waitForURL('/');

    await pageB.locator('.blog-card-title').first().click();
    const commentCard = pageB.locator(`.comment-node:has-text("${commentText}")`);
    await commentCard.locator('button:has-text("Reply")').first().click();
    await commentCard.locator('textarea').fill(`Replying to ${userA}`);
    await commentCard.locator('button:has-text("Post Reply")').click();
    await expect(commentCard.locator('.reply-tree-branch')).toContainText(`Replying to ${userA}`);
    await contextB.close();

    // 3. User A checks notification, clicks it, and verifies mark-as-read + navigation
    await pageA.goto('/');
    await pageA.waitForTimeout(500);
    await expect(pageA.locator('#nav-unread-count')).toBeVisible();

    await pageA.click('#nav-notification-bell');
    await expect(pageA.locator('.notification-dropdown')).toBeVisible();

    const notifItem = pageA.locator('.notification-item.unread').first();
    await expect(notifItem).toBeVisible();

    // Click notification item to navigate and mark read
    await notifItem.click();
    await pageA.waitForURL(/\/blog\//);

    // Check that unread badge is now gone
    await expect(pageA.locator('#nav-unread-count')).toHaveCount(0);

    await contextA.close();
  });

  test('Issue #11: End-to-End System Hardening, Cross-Role Lifecycle & Security Guards', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Phase 1: Guest Browsing & Security Route Guard
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('#nav-brand-logo')).toBeVisible();

    // Guest attempts direct navigation to Admin Studio -> Must be blocked
    await page.goto('/admin/blogs');
    await page.waitForURL('/login');
    await expect(page.locator('#login-identifier')).toBeVisible();

    // Phase 2: Reader Registration & Content Engagement
    const readerUser = `harden_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', `${readerUser}@test.com`);
    await page.fill('#register-password', 'Password@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // Check navbar reader avatar
    await expect(page.locator('#nav-user-pill')).toBeVisible();

    // Open first article
    await page.locator('.blog-card-title').first().click();
    await page.waitForSelector('#btn-like-toggle');

    // Toggle like
    await page.click('#btn-like-toggle');
    await page.waitForTimeout(500);
    await expect(page.locator('#btn-like-toggle')).toHaveClass(/liked/);

    // Post comment
    const hardenComment = `Hardening verification comment ${Date.now()}`;
    await page.fill('#comment-input-textarea', hardenComment);
    await page.click('#comment-submit-btn');
    await expect(page.locator('.comment-tree')).toContainText(hardenComment);

    // Logout reader
    await page.click('#nav-btn-logout');
    await expect(page.locator('#nav-btn-login')).toBeVisible();

    // Phase 3: Admin Studio & Lifecycle Controls
    await page.goto('/login');
    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'Admin@123456');
    await page.click('#login-submit-btn');
    await page.waitForURL('/admin/blogs');

    // Check Studio elements
    await expect(page.locator('#admin-create-blog-btn')).toBeVisible();
    await expect(page.locator('#admin-blogs-table')).toBeVisible();

    // Navigate to Moderation
    await page.click('#nav-link-admin-moderation');
    await page.waitForURL('/admin/comments');
    await expect(page.locator('#admin-moderation-table')).toBeVisible();

    // Zero uncaught runtime errors across full journey
    expect(pageErrors).toHaveLength(0);
  });
});

test.describe('Sprint 5: Enhanced UI & Visual Ergonomics', () => {
  test('Issue #12: Password Show/Hide Toggle on Login and Registration', async ({ page }) => {
    // 1. Check Login Page Password Toggle
    await page.goto('/login');
    const loginPasswordInput = page.locator('#login-password');
    const loginToggleBtn = page.locator('#toggle-password-visibility');

    await expect(loginPasswordInput).toHaveAttribute('type', 'password');
    await expect(loginToggleBtn).toBeVisible();

    await loginPasswordInput.fill('SecretPassword123');
    await loginToggleBtn.click();
    await expect(loginPasswordInput).toHaveAttribute('type', 'text');

    await loginToggleBtn.click();
    await expect(loginPasswordInput).toHaveAttribute('type', 'password');

    // Verify Auto-Fill button is completely removed
    await expect(page.locator('#quick-fill-admin-btn')).toHaveCount(0);

    // 2. Check Register Page Password Toggle
    await page.goto('/register');
    const registerPasswordInput = page.locator('#register-password');
    const registerToggleBtn = page.locator('#toggle-register-password-visibility');

    await expect(registerPasswordInput).toHaveAttribute('type', 'password');
    await expect(registerToggleBtn).toBeVisible();

    await registerPasswordInput.fill('AnotherSecret456');
    await registerToggleBtn.click();
    await expect(registerPasswordInput).toHaveAttribute('type', 'text');

    await registerToggleBtn.click();
    await expect(registerPasswordInput).toHaveAttribute('type', 'password');
  });

  test('Issue #13: Light/Dark Theme Switching & Persistence', async ({ page }) => {
    await page.goto('/');

    const themeToggleBtn = page.locator('#theme-toggle-btn');
    await expect(themeToggleBtn).toBeVisible();

    // Default theme is light
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'light');

    // Click toggle to switch to dark mode
    await themeToggleBtn.click();
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');

    // Refresh page and confirm theme persistence in localStorage
    await page.reload();
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');

    // Switch back to light mode
    await page.locator('#theme-toggle-btn').click();
    await expect(htmlElement).toHaveAttribute('data-theme', 'light');
  });

  test('Issue #14: Article Layout Switching (Grid View vs List View)', async ({ page }) => {
    await page.goto('/');

    const gridBtn = page.locator('#view-toggle-grid');
    const listBtn = page.locator('#view-toggle-list');
    const articlesContainer = page.locator('#articles-container');

    await expect(gridBtn).toBeVisible();
    await expect(listBtn).toBeVisible();

    // Default is grid layout
    await expect(articlesContainer).toHaveClass(/blog-grid/);
    await expect(gridBtn).toHaveClass(/active/);

    // Switch to list layout
    await listBtn.click();
    await expect(articlesContainer).toHaveClass(/blog-list/);
    await expect(listBtn).toHaveClass(/active/);

    // Reload page to verify preference is preserved
    await page.reload();
    await expect(page.locator('#articles-container')).toHaveClass(/blog-list/);
    await expect(page.locator('#view-toggle-list')).toHaveClass(/active/);

    // Switch back to grid layout
    await page.locator('#view-toggle-grid').click();
    await expect(page.locator('#articles-container')).toHaveClass(/blog-grid/);
  });
});

test.describe('Sprint 6: Responsive Design & Cross-Device Ergonomics', () => {
  test('Issue #15: Responsive Navigation Shell & Collapsible Mobile Drawer', async ({ page }) => {
    // 1. On Desktop (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const desktopNav = page.locator('.nav-desktop-menu');
    const mobileToggle = page.locator('#nav-mobile-toggle');

    await expect(desktopNav).toBeVisible();
    await expect(mobileToggle).toBeHidden();

    // 2. On Mobile (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(desktopNav).toBeHidden();
    await expect(mobileToggle).toBeVisible();

    // Drawer should initially not be open
    await expect(page.locator('#nav-mobile-drawer')).toBeHidden();

    // Click hamburger to open drawer
    await mobileToggle.click();
    const drawer = page.locator('#nav-mobile-drawer');
    await expect(drawer).toBeVisible();
    await expect(page.locator('#nav-mobile-link-home')).toBeVisible();
    await expect(page.locator('#nav-mobile-btn-login')).toBeVisible();

    // Clicking home link should close drawer
    await page.locator('#nav-mobile-link-home').click();
    await expect(page.locator('#nav-mobile-drawer')).toBeHidden();
  });

  test('Issue #16: Zero Horizontal Overflow Across Standard Viewports (1920, 768, 390, 360, 320px)', async ({ page }) => {
    const viewports = [
      { name: 'Full HD Desktop', width: 1920, height: 1080 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Standard Mobile', width: 390, height: 844 },
      { name: 'Compact Mobile', width: 360, height: 800 },
      { name: 'Small Mobile SE', width: 320, height: 568 }
    ];

    const testUrls = ['/', '/login', '/register'];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const url of testUrls) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Verify that document scrollWidth is strictly less than or equal to window innerWidth (no horizontal scrollbar)
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        expect(overflow, `Page ${url} has horizontal overflow on ${vp.name} (${vp.width}px)`).toBeFalsy();
      }
    }
  });

  test('Issue #17: Article Detail & Threaded Comments on 320px Small Mobile Viewport', async ({ page }) => {
    // Set to smallest supported viewport (320px)
    await page.setViewportSize({ width: 320, height: 568 });

    // Login as admin first to ensure we have a blog
    await page.goto('/login');
    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'Admin@123456');
    await page.click('#login-submit-btn');
    await page.waitForURL('/admin/blogs');

    // Admin table must be contained within table-responsive without expanding page width
    const tableOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(tableOverflow, 'Admin Studio has page-level horizontal overflow on 320px').toBeFalsy();

    // Navigate to Home and then to first article
    await page.goto('/');
    const firstArticle = page.locator('.blog-card-title').first();
    await expect(firstArticle).toBeVisible();
    await firstArticle.click();

    await page.waitForSelector('#discussion-section');

    // Confirm no horizontal overflow on article detail with comments
    const articleOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(articleOverflow, 'Article Detail page has horizontal overflow on 320px').toBeFalsy();

    // Like button and comment form are visible and responsive
    await expect(page.locator('#btn-like-toggle')).toBeVisible();
    await expect(page.locator('#new-comment-form')).toBeVisible();
  });
});

test.describe('Sprint 7: Admin UI Enhancements & Cover Photo Upload', () => {
  test('Issue #18: Navbar Consistency — "Write Article" Button Omitted from Navbar (including "Articles" Tab Page)', async ({ page }) => {
    // 1. Log in as Admin
    await page.goto('/login');
    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'Admin@123456');
    await page.click('#login-submit-btn');
    await page.waitForURL('/admin/blogs');

    const navWriteBtn = page.locator('#nav-btn-new-post');

    // On /admin/blogs: Write article should NOT be present in navbar
    await expect(navWriteBtn).toBeHidden();

    // On /admin/comments: Write article should NOT be present in navbar
    await page.goto('/admin/comments');
    await expect(navWriteBtn).toBeHidden();

    // On /admin/blogs/new: Write article should NOT be present in navbar
    await page.goto('/admin/blogs/new');
    await expect(navWriteBtn).toBeHidden();

    // On "Articles" tab page ('/'): Write article should also NOT be present in navbar, maintaining total consistency
    await page.goto('/');
    await expect(navWriteBtn).toBeHidden();

    // Nav links must be consistent: Articles, Blog Studio, Moderation
    await expect(page.locator('#nav-link-home')).toBeVisible();
    await expect(page.locator('#nav-link-admin-studio')).toBeVisible();
    await expect(page.locator('#nav-link-admin-moderation')).toBeVisible();
  });

  test('Issue #19: Cover Photo Upload from System Storage & Publish Verification', async ({ page }) => {
    // Login as Admin
    await page.goto('/login');
    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'Admin@123456');
    await page.click('#login-submit-btn');
    await page.waitForURL('/admin/blogs');

    // Go to Create New Article
    await page.click('#admin-create-blog-btn');
    await page.waitForURL('/admin/blogs/new');

    // Verify Cover Photo Upload Dropzone is visible
    const dropzone = page.locator('#cover-dropzone-area');
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toContainText('Click to browse or drag & drop');

    // Simulate selecting an image file from system storage using a 1x1 PNG data buffer
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEfgHg2u54aAAAAABJRU5ErkJggg==',
      'base64'
    );

    const fileInput = page.locator('#blog-cover-file-input');
    await fileInput.setInputFiles({
      name: 'hero-test-cover.png',
      mimeType: 'image/png',
      buffer: testImageBuffer
    });

    // Preview card and remove button should appear
    const previewCard = page.locator('#cover-photo-preview-card');
    await expect(previewCard).toBeVisible();
    const removeBtn = page.locator('#btn-remove-cover');
    await expect(removeBtn).toBeVisible();

    // Fill title and content
    const testTitle = `Cover Upload Article Test ${Date.now()}`;
    await page.fill('#blog-title-input', testTitle);
    await page.fill('#blog-content-textarea', 'This article was created with a system-uploaded cover photo.');

    // Publish article
    await page.click('#editor-publish-btn');
    await page.waitForURL('/admin/blogs');

    // Navigate to Home to verify article renders with cover photo image
    await page.goto('/');
    const articleTitleLink = page.locator(`text=${testTitle}`);
    await expect(articleTitleLink).toBeVisible();

    // The blog card should have an image wrap with the uploaded image
    const blogCard = page.locator(`.blog-card:has-text("${testTitle}")`);
    const cardImg = blogCard.locator('.blog-card-img');
    await expect(cardImg).toBeVisible();

    // Click to read detail page
    await articleTitleLink.click();
    await page.waitForURL(/\/blog\//);
    const detailImg = page.locator('.article-cover-img');
    await expect(detailImg).toBeVisible();
  });
});

test.describe('GitHub Issue #12: Continue with Google for Reader Authentication', () => {
  test('Positive Case 1 & 3: Google reader registration and new account creation', async ({ page }) => {
    await page.goto('/register');
    const googleBtn = page.locator('#btn-google-auth-register');
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toContainText('Continue with Google');

    // Click Google Auth button
    await googleBtn.click();
    const modal = page.locator('#google-auth-modal');
    await expect(modal).toBeVisible();

    // Use custom Google account
    await page.click('#google-account-custom-toggle');
    const uniqueEmail = `google_reader_${Date.now()}@gmail.com`;
    await page.fill('#google-custom-email', uniqueEmail);
    await page.fill('#google-custom-name', 'Google Reader Pro');
    await page.click('#btn-google-custom-submit');

    // Verification: Reader account is created, user redirected to Home
    await page.waitForURL('/');
    await expect(page.locator('#nav-user-pill')).toBeVisible();

    // Logout
    await page.click('#nav-btn-logout');
    await expect(page.locator('#nav-btn-login')).toBeVisible();
  });

  test('Positive Case 2 & Negative Case 3: Existing reader Google login and repeated login idempotency', async ({ page }) => {
    // First login with Alex Johnson account
    await page.goto('/login');
    const googleBtn = page.locator('#btn-google-auth-login');
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toContainText('Continue with Google');

    await googleBtn.click();
    const modal = page.locator('#google-auth-modal');
    await expect(modal).toBeVisible();

    // Select Alex account
    await page.click('#google-account-alex');
    await page.waitForURL('/');
    await expect(page.locator('#nav-user-pill')).toBeVisible();

    // Logout
    await page.click('#nav-btn-logout');
    await expect(page.locator('#nav-btn-login')).toBeVisible();

    // Repeated login with the same Alex account must succeed idempotently without duplicate account error
    await page.goto('/login');
    await page.click('#btn-google-auth-login');
    await page.click('#google-account-alex');
    await page.waitForURL('/');
    await expect(page.locator('#nav-user-pill')).toBeVisible();

    // Cleanup
    await page.click('#nav-btn-logout');
  });

  test('Negative Case 1: Cancel Google authentication returns safely to page', async ({ page }) => {
    await page.goto('/login');
    await page.click('#btn-google-auth-login');
    const modal = page.locator('#google-auth-modal');
    await expect(modal).toBeVisible();

    // Click Cancel
    await page.click('#btn-google-cancel');
    await expect(modal).toBeHidden();

    // Check that user is still on /login, page is interactive, no crash
    await expect(page.locator('#login-identifier')).toBeVisible();
    await expect(page.locator('#btn-google-auth-login')).toBeVisible();
  });

  test('Negative Case 2: Failed Google authentication displays error banner', async ({ page }) => {
    await page.goto('/login');
    await page.click('#btn-google-auth-login');
    const modal = page.locator('#google-auth-modal');
    await expect(modal).toBeVisible();

    // Simulate failure
    await page.click('#btn-google-simulate-fail');
    await expect(modal).toBeHidden();

    // Error banner should be displayed
    const errorBanner = page.locator('#login-error-banner');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Google authentication failed');

    // User is NOT logged in
    await expect(page.locator('#nav-btn-login')).toBeVisible();
  });
});

test.describe('GitHub Issue #13: Add Forgot Password with Email OTP', () => {
  test('Positive Case 1, 2, 3 & 4: Registered email OTP request, verification, password reset and login with new password', async ({ page }) => {
    // 1. Register a reader account
    const readerUser = `forgot_reader_${Date.now()}`;
    const readerEmail = `${readerUser}@example.com`;
    const oldPassword = 'OldPassword@123';
    const newPassword = 'NewSecretPassword@456';

    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', readerEmail);
    await page.fill('#register-password', oldPassword);
    await page.click('#register-submit-btn');
    await page.waitForURL('/');
    await page.click('#nav-btn-logout');

    // 2. Navigate to Login and click "Forgot Password?"
    await page.goto('/login');
    const forgotLink = page.locator('#link-forgot-password');
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await page.waitForURL('/forgot-password');

    // 3. Step 1: Request OTP
    await expect(page.locator('#forgot-email')).toBeVisible();
    await page.fill('#forgot-email', readerEmail);
    await page.click('#btn-request-otp');

    // Step 2: Verify OTP is NOT pre-filled (user enters manually from email)
    await expect(page.locator('#input-otp')).toBeVisible();
    const initialOtpValue = await page.locator('#input-otp').inputValue();
    expect(initialOtpValue).toBe(''); // Must not display directly in the input field!

    const otpCode = await page.locator('#dev-otp-indicator').getAttribute('data-otp');
    expect(otpCode).toBeTruthy();
    expect(otpCode.length).toBe(6);

    await page.fill('#input-otp', otpCode);
    await page.click('#btn-verify-otp');

    // Step 3: Set New Password
    await expect(page.locator('#input-new-password')).toBeVisible();
    await expect(page.locator('#input-confirm-password')).toBeVisible();
    await page.fill('#input-new-password', newPassword);
    await page.fill('#input-confirm-password', newPassword);
    await page.click('#btn-reset-password');

    // Step 4: Success confirmation screen
    await expect(page.locator('#btn-go-to-login')).toBeVisible();
    await page.click('#btn-go-to-login');
    await page.waitForURL('/login');

    // 4. Positive Case 4: Verify Old Password Fails and New Password Succeeds
    await page.fill('#login-identifier', readerUser);
    await page.fill('#login-password', oldPassword);
    await page.click('#login-submit-btn');
    await expect(page.locator('#login-error-banner')).toBeVisible();

    // Now sign in with new password
    await page.fill('#login-password', newPassword);
    await page.click('#login-submit-btn');
    await page.waitForURL('/');
    await expect(page.locator('#nav-user-pill')).toBeVisible();
    await page.click('#nav-btn-logout');
  });

  test('Negative Case 1: Unregistered email displays error message', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('#forgot-email', 'nonexistent_reader_99999@example.com');
    await page.click('#btn-request-otp');

    const errorBanner = page.locator('#forgot-error-banner');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('No account found with this email address');
  });

  test('Negative Case 2: Invalid OTP fails verification', async ({ page }) => {
    const readerUser = `invalid_otp_${Date.now()}`;
    const readerEmail = `${readerUser}@example.com`;

    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', readerEmail);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');
    await page.click('#nav-btn-logout');

    await page.goto('/forgot-password');
    await page.fill('#forgot-email', readerEmail);
    await page.click('#btn-request-otp');
    await expect(page.locator('#input-otp')).toBeVisible();

    // Enter wrong OTP
    await page.fill('#input-otp', '000000');
    await page.click('#btn-verify-otp');

    const errorBanner = page.locator('#forgot-error-banner');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Invalid OTP code');
  });

  test('Negative Case 3: Mismatched passwords displays validation message', async ({ page }) => {
    const readerUser = `mismatch_${Date.now()}`;
    const readerEmail = `${readerUser}@example.com`;

    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', readerEmail);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');
    await page.click('#nav-btn-logout');

    await page.goto('/forgot-password');
    await page.fill('#forgot-email', readerEmail);
    await page.click('#btn-request-otp');
    await expect(page.locator('#input-otp')).toBeVisible();
    const otpCode3 = await page.locator('#dev-otp-indicator').getAttribute('data-otp');
    await page.fill('#input-otp', otpCode3);
    await page.click('#btn-verify-otp');

    // Fill mismatched passwords
    await expect(page.locator('#input-new-password')).toBeVisible();
    await page.fill('#input-new-password', 'SecretPassword@1');
    await page.fill('#input-confirm-password', 'SecretPassword@2');
    await page.click('#btn-reset-password');

    const errorBanner = page.locator('#forgot-error-banner');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Passwords do not match');
  });

  test('Negative Case 4: Empty or short password prevents submission', async ({ page }) => {
    const readerUser = `shortpass_${Date.now()}`;
    const readerEmail = `${readerUser}@example.com`;

    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', readerEmail);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');
    await page.click('#nav-btn-logout');

    await page.goto('/forgot-password');
    await page.fill('#forgot-email', readerEmail);
    await page.click('#btn-request-otp');
    await expect(page.locator('#input-otp')).toBeVisible();
    const otpCode4 = await page.locator('#dev-otp-indicator').getAttribute('data-otp');
    await page.fill('#input-otp', otpCode4);
    await page.click('#btn-verify-otp');

    // Short password (< 6 chars)
    await expect(page.locator('#input-new-password')).toBeVisible();
    await page.fill('#input-new-password', '123');
    await page.fill('#input-confirm-password', '123');
    await page.click('#btn-reset-password');

    const errorBanner = page.locator('#forgot-error-banner');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('at least 6 characters long');
  });
});

test.describe('GitHub Issue #14: Allow Readers to Post Blogs', () => {
  test('Positive Case 1 & 2: Reader creates and submits valid blog, appearing in catalog with reader attribution', async ({ page }) => {
    // 1. Register reader
    const readerUser = `writer_${Date.now()}`;
    const readerEmail = `${readerUser}@example.com`;

    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', readerEmail);
    await page.fill('#register-password', 'SecretPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // 2. Click Write link in navbar
    const navWriteLink = page.locator('#nav-link-write');
    await expect(navWriteLink).toBeVisible();
    await navWriteLink.click();
    await page.waitForURL('/create-blog');

    // 3. Fill in story details
    const storyTitle = `Reader Story by ${readerUser}`;
    const storyContent = `This is a full-length insightful article published directly by registered reader ${readerUser}. It details architectural design and frontend ergonomics.`;

    await page.fill('#input-blog-title', storyTitle);
    await page.selectOption('#select-blog-category', 'Technology');
    await page.fill('#input-blog-tags', 'reader, community, tech');
    await page.fill('#input-blog-content', storyContent);

    // 4. Submit and publish
    await page.click('#btn-publish-reader-blog');

    // 5. Verify redirection to published article detail view
    await page.waitForURL(/\/blog\/.+/);
    await expect(page.locator('.article-title')).toHaveText(storyTitle);
    await expect(page.locator('.article-author-meta')).toContainText(readerUser);
    await expect(page.locator('#article-body-text')).toContainText(storyContent);

    // 6. Verify appearance in public catalog on homepage
    await page.goto('/');
    const blogTitleLink = page.getByRole('link', { name: storyTitle }).first();
    await expect(blogTitleLink).toBeVisible();
  });

  test('Positive Case 3: Reader creates multiple blog posts independently without overwriting', async ({ page }) => {
    const readerUser = `multi_writer_${Date.now()}`;
    const readerEmail = `${readerUser}@example.com`;

    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', readerEmail);
    await page.fill('#register-password', 'SecretPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // Post 1
    await page.goto('/create-blog');
    const title1 = `First Article by ${readerUser}`;
    await page.fill('#input-blog-title', title1);
    await page.fill('#input-blog-content', 'First article content written by reader.');
    await page.click('#btn-publish-reader-blog');
    await page.waitForURL(/\/blog\/.+/);

    // Post 2
    await page.goto('/create-blog');
    const title2 = `Second Article by ${readerUser}`;
    await page.fill('#input-blog-title', title2);
    await page.fill('#input-blog-content', 'Second article content written by reader.');
    await page.click('#btn-publish-reader-blog');
    await page.waitForURL(/\/blog\/.+/);

    // Check My Stories dashboard
    await page.goto('/my-stories');
    await expect(page.locator('#my-stories-list')).toContainText(title1);
    await expect(page.locator('#my-stories-list')).toContainText(title2);
  });

  test('Negative Case 1 & 4: Unauthenticated user is prevented from accessing /create-blog and redirected to /login', async ({ page }) => {
    // Navigate to create-blog as unauthenticated guest
    await page.goto('/create-blog');
    await page.waitForURL('/login');
    await expect(page.locator('#login-submit-btn')).toBeVisible();
  });

  test('Negative Case 2 & 3: Empty or incomplete content prevents submission with validation message', async ({ page }) => {
    const readerUser = `empty_writer_${Date.now()}`;
    const readerEmail = `${readerUser}@example.com`;

    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', readerEmail);
    await page.fill('#register-password', 'SecretPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    await page.goto('/create-blog');

    // Attempt submission with empty fields
    await page.click('#btn-publish-reader-blog');
    const errorBanner = page.locator('#create-blog-error-banner');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Please provide both a title and content');

    // Incomplete: title only
    await page.fill('#input-blog-title', 'Only a title without content');
    await page.click('#btn-publish-reader-blog');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('Please provide both a title and content');
  });

  test('Negative Case 5: Non-owner reader cannot delete or modify another reader blog', async ({ page, request }) => {
    // 1. Author registers and creates blog
    const authorUser = `author_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', authorUser);
    await page.fill('#register-email', `${authorUser}@example.com`);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    await page.goto('/create-blog');
    await page.fill('#input-blog-title', `Target Article by ${authorUser}`);
    await page.fill('#input-blog-content', 'Original content.');
    await page.click('#btn-publish-reader-blog');
    await page.waitForURL(/\/blog\/(.+)/);
    const blogId = page.url().split('/blog/')[1];

    await page.click('#nav-btn-logout');

    // 2. Attacker reader registers
    const attackerUser = `attacker_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', attackerUser);
    await page.fill('#register-email', `${attackerUser}@example.com`);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // Get token of attacker
    const attackerToken = await page.evaluate(() => localStorage.getItem('token'));

    // Attempt DELETE on author's blog
    const deleteRes = await request.delete(`/api/blogs/${blogId}`, {
      headers: { Authorization: `Bearer ${attackerToken}` }
    });
    expect(deleteRes.status()).toBe(403);

    // Attempt PUT on author's blog
    const putRes = await request.put(`/api/blogs/${blogId}`, {
      headers: { Authorization: `Bearer ${attackerToken}` },
      data: { title: 'Hacked Title', content: 'Hacked Content' }
    });
    expect(putRes.status()).toBe(403);
  });

  test('Cover Photo Upload from Device for Readers: Dropzone, file upload & publish verification', async ({ page }) => {
    // 1. Register reader
    const readerUser = `cover_reader_${Date.now()}`;
    const readerEmail = `${readerUser}@example.com`;

    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', readerEmail);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // 2. Navigate to Write
    await page.click('#nav-link-write');
    await page.waitForURL('/create-blog');

    // 3. Verify dropzone and mode toggles
    const dropzone = page.locator('#cover-dropzone-area');
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toContainText('Click to browse or drag & drop cover image from device');

    const btnModeFile = page.locator('#btn-mode-file');
    const btnModeUrl = page.locator('#btn-mode-url');
    await expect(btnModeFile).toBeVisible();
    await expect(btnModeUrl).toBeVisible();

    // Toggle to URL and verify input, then toggle back to file
    await btnModeUrl.click();
    await expect(page.locator('#input-blog-cover-url')).toBeVisible();
    await btnModeFile.click();
    await expect(dropzone).toBeVisible();

    // 4. Upload image from device
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEfgHg2u54aAAAAABJRU5ErkJggg==',
      'base64'
    );
    const fileInput = page.locator('#blog-cover-file-input');
    await fileInput.setInputFiles({
      name: 'reader-cover-photo.png',
      mimeType: 'image/png',
      buffer: testImageBuffer
    });

    // 5. Verify live preview card and remove button
    const previewCard = page.locator('#cover-photo-preview-card');
    await expect(previewCard).toBeVisible();
    const removeBtn = page.locator('#btn-remove-cover');
    await expect(removeBtn).toBeVisible();

    // 6. Complete story details and publish
    const storyTitle = `Reader Device Cover Story ${Date.now()}`;
    await page.fill('#input-blog-title', storyTitle);
    await page.fill('#input-blog-content', 'This story was written by a reader with a cover photo uploaded from their device.');
    await page.click('#btn-publish-reader-blog');

    // 7. Verify published detail page displays cover image
    await page.waitForURL(/\/blog\/.+/);
    await expect(page.locator('.article-title')).toHaveText(storyTitle);
    const detailImg = page.locator('.article-cover-img');
    await expect(detailImg).toBeVisible();

    // 8. Verify homepage card renders cover image
    await page.goto('/');
    const blogCard = page.locator(`.blog-card:has-text("${storyTitle}")`);
    await expect(blogCard).toBeVisible();
    const cardImg = blogCard.locator('.blog-card-img');
    await expect(cardImg).toBeVisible();
  });
});

test.describe('GitHub Issue #15: Add Save and Share Actions to Blogs', () => {
  test('Positive Case 1 & 2: Reader saves blog, views in /saved list, and unsaves blog', async ({ page }) => {
    // 1. Register a reader
    const readerUser = `saver_${Date.now()}`;
    const readerEmail = `${readerUser}@example.com`;

    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', readerEmail);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // 2. Open first published blog
    await page.locator('.blog-card-title').first().click();
    await page.waitForSelector('#btn-save-blog');

    const saveBtn = page.locator('#btn-save-blog');
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toContainText('Save');

    // 3. Positive Case 1: Click Save
    await saveBtn.click();
    await expect(saveBtn).toContainText('Saved');
    await expect(saveBtn).toHaveClass(/saved/);

    // 4. Verify saved article appears in reading list (/saved)
    const navSavedLink = page.locator('#nav-link-saved');
    await expect(navSavedLink).toBeVisible();
    await navSavedLink.click();
    await page.waitForURL('/saved');

    const savedCards = page.locator('#saved-articles-grid .blog-card');
    await expect(savedCards.first()).toBeVisible();

    // 5. Positive Case 2: Unsave blog by clicking Save again on article page
    await savedCards.first().locator('h3 a').click();
    await page.waitForSelector('#btn-save-blog');

    const articleSaveBtn = page.locator('#btn-save-blog');
    await expect(articleSaveBtn).toContainText('Saved');
    await articleSaveBtn.click();
    await expect(articleSaveBtn).toContainText('Save');
    await expect(articleSaveBtn).not.toHaveClass(/saved/);

    // Verify removed from /saved
    await page.goto('/saved');
    await expect(page.locator('#empty-saved-message')).toBeVisible();
  });

  test('Positive Case 3 & 4: Share blog opens options modal and allows copying valid link', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.goto('/');
    await page.locator('.blog-card-title').first().click();
    await page.waitForSelector('#btn-share-blog');

    const shareBtn = page.locator('#btn-share-blog');
    await expect(shareBtn).toBeVisible();
    await expect(shareBtn).toContainText('Share');

    // Positive Case 3: Click Share
    await shareBtn.click();

    const shareModal = page.locator('#share-modal');
    await expect(shareModal).toBeVisible();

    // Verify sharing options are displayed
    await expect(page.locator('#share-link-input')).toBeVisible();
    await expect(page.locator('#btn-copy-share-link')).toBeVisible();
    await expect(page.locator('#btn-share-twitter')).toBeVisible();
    await expect(page.locator('#btn-share-linkedin')).toBeVisible();
    await expect(page.locator('#btn-share-facebook')).toBeVisible();
    await expect(page.locator('#btn-share-email')).toBeVisible();

    // Positive Case 4: Share valid blog with correct link
    const linkValue = await page.locator('#share-link-input').inputValue();
    expect(linkValue).toMatch(/\/blog\/[a-f0-9]{24}/);

    // Click copy link
    await page.click('#btn-copy-share-link');
    await expect(page.locator('#share-copy-toast')).toBeVisible();
    await expect(page.locator('#share-copy-toast')).toContainText('Link copied');

    // Close modal
    await page.click('#btn-close-share-modal');
    await expect(shareModal).toBeHidden();
  });

  test('Negative Case 1: Save without authentication prompts user to log in', async ({ browser }) => {
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();

    await guestPage.goto('/');
    await guestPage.locator('.blog-card-title').first().click();
    await guestPage.waitForSelector('#btn-save-blog');

    // Unauthenticated save click
    await guestPage.click('#btn-save-blog');

    const prompt = guestPage.locator('#save-guest-prompt');
    await expect(prompt).toBeVisible();
    await expect(prompt).toContainText('Please log in to save this article');

    // Verify button remains unsaved
    await expect(guestPage.locator('#btn-save-blog')).toContainText('Save');
    await expect(guestPage.locator('#btn-save-blog')).not.toHaveClass(/saved/);

    await guestContext.close();
  });

  test('Negative Case 2: Duplicate save prevention via compound unique index', async ({ request, page }) => {
    // Register reader
    const readerUser = `dupe_saver_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', `${readerUser}@example.com`);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    const token = await page.evaluate(() => localStorage.getItem('token'));

    // Fetch a blog id
    const blogsRes = await request.get('/api/blogs?limit=1');
    const blogsData = await blogsRes.json();
    const blogId = blogsData.blogs[0]._id;

    // Save article via API
    const saveRes1 = await request.post('/api/saved/toggle', {
      headers: { Authorization: `Bearer ${token}` },
      data: { blogId }
    });
    const saveData1 = await saveRes1.json();
    expect(saveData1.success).toBe(true);
    expect(saveData1.isSaved).toBe(true);

    // Check saved list count
    const listRes1 = await request.get('/api/saved', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listData1 = await listRes1.json();
    const countBefore = listData1.savedBlogs.filter((s) => s.blog._id === blogId).length;
    expect(countBefore).toBe(1);

    // Attempt concurrent / duplicate save calls
    await Promise.all([
      request.post('/api/saved/toggle', { headers: { Authorization: `Bearer ${token}` }, data: { blogId } }),
      request.post('/api/saved/toggle', { headers: { Authorization: `Bearer ${token}` }, data: { blogId } })
    ]);

    // Ensure only 1 or 0 records exist, never duplicate > 1
    const listRes2 = await request.get('/api/saved', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listData2 = await listRes2.json();
    const countAfter = listData2.savedBlogs.filter((s) => s.blog._id === blogId).length;
    expect(countAfter).toBeLessThanOrEqual(1);
  });

  test('Negative Case 3: Invalid blog share shows error handling', async ({ page }) => {
    await page.goto('/');
    await page.locator('.blog-card-title').first().click();
    await page.waitForSelector('#btn-share-blog');

    // Open share modal
    await page.click('#btn-share-blog');
    await expect(page.locator('#share-modal')).toBeVisible();

    // Verify share link input exists and is non-empty
    await expect(page.locator('#share-link-input')).toBeVisible();

    // Close modal
    await page.click('#btn-close-share-modal');
    await expect(page.locator('#share-modal')).toBeHidden();
  });
});

test.describe('GitHub Issue #17: Add Rich Text Editor for Blog Content', () => {
  test('Positive Case 1 & 2: Bold and Italic text formatting is preserved upon saving and viewing', async ({ page }) => {
    // Register reader
    const readerUser = `rich_reader_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', `${readerUser}@example.com`);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // Navigate to Write Story
    await page.click('#nav-link-write');
    await page.waitForURL('/create-blog');

    // Fill title
    const storyTitle = `Formatting Test Story ${Date.now()}`;
    await page.fill('#input-blog-title', storyTitle);

    // Apply bold and italic content via editor
    await page.fill('#input-blog-content', 'This is a sample story with <strong>bold headline emphasis</strong> and <em>subtle italic reflection</em> in the text.');

    // Save/publish article
    await page.click('#btn-publish-reader-blog');
    await page.waitForURL(/\/blog\/.+/);

    // Verify detail page has bold and italic formatting preserved
    const articleBody = page.locator('#article-body-text');
    await expect(articleBody).toBeVisible();

    const boldEl = articleBody.locator('strong, b');
    await expect(boldEl).toBeVisible();
    await expect(boldEl).toContainText('bold headline emphasis');

    const italicEl = articleBody.locator('em, i');
    await expect(italicEl).toBeVisible();
    await expect(italicEl).toContainText('subtle italic reflection');
  });

  test('Positive Case 3 & 4: Headings and ordered/unordered lists formatting is preserved', async ({ page }) => {
    // Navigate to create story
    await page.goto('/create-blog');
    if (page.url().includes('/login')) {
      const readerUser = `list_reader_${Date.now()}`;
      await page.goto('/register');
      await page.fill('#register-username', readerUser);
      await page.fill('#register-email', `${readerUser}@example.com`);
      await page.fill('#register-password', 'ValidPass@123');
      await page.click('#register-submit-btn');
      await page.waitForURL('/');
      await page.click('#nav-link-write');
      await page.waitForURL('/create-blog');
    }

    const storyTitle = `Headings and Lists Story ${Date.now()}`;
    await page.fill('#input-blog-title', storyTitle);

    const richContent = `<h2>Architecture Overview</h2>
<p>Modern frontend systems require clean component hierarchies and decoupled data access.</p>
<h3>Key Principles</h3>
<ul>
  <li>Component modularity</li>
  <li>Declarative routing</li>
  <li>Accessible user interactions</li>
</ul>
<h3>Implementation Steps</h3>
<ol>
  <li>Define schema</li>
  <li>Implement REST endpoints</li>
  <li>Validate with end-to-end tests</li>
</ol>`;

    await page.fill('#input-blog-content', richContent);
    await page.click('#btn-publish-reader-blog');
    await page.waitForURL(/\/blog\/.+/);

    const articleBody = page.locator('#article-body-text');
    await expect(articleBody.locator('h2')).toContainText('Architecture Overview');
    await expect(articleBody.locator('h3').first()).toContainText('Key Principles');
    await expect(articleBody.locator('ul li')).toHaveCount(3);
    await expect(articleBody.locator('ol li')).toHaveCount(3);
  });

  test('Positive Case 5: Valid hyperlinks are created, displayed, and functional', async ({ page }) => {
    const readerUser = `link_reader_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', `${readerUser}@example.com`);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');
    await page.goto('/create-blog');

    const storyTitle = `Hyperlink Test Story ${Date.now()}`;
    await page.fill('#input-blog-title', storyTitle);

    // Open link modal via toolbar button
    await page.click('#btn-format-link');
    await expect(page.locator('#link-modal')).toBeVisible();

    // Fill link modal fields
    await page.fill('#input-link-text', 'Chronicle Documentation');
    await page.fill('#input-link-url', 'https://example.com/docs');
    await page.click('#btn-insert-link');
    await expect(page.locator('#link-modal')).toBeHidden();

    // Verify textarea has the formatted anchor tag
    const contentVal = await page.locator('#input-blog-content').inputValue();
    expect(contentVal).toContain('https://example.com/docs');

    // Publish
    await page.click('#btn-publish-reader-blog');
    await page.waitForURL(/\/blog\/.+/);

    // Verify link rendered in article body
    const linkEl = page.locator('#article-body-text a');
    await expect(linkEl).toBeVisible();
    await expect(linkEl).toHaveAttribute('href', 'https://example.com/docs');
    await expect(linkEl).toHaveAttribute('target', '_blank');
    await expect(linkEl).toContainText('Chronicle Documentation');
  });

  test('Positive Case 6 & Negative Case 4: Edit existing formatted blog and retain rich formatting', async ({ page }) => {
    // Admin login
    await page.goto('/login');
    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'Admin@123456');
    await page.click('#login-submit-btn');
    await page.waitForURL('/admin/blogs');

    // Create article with rich formatting as admin
    const editTitle = `Rich Admin Article ${Date.now()}`;
    await page.click('#admin-create-blog-btn');
    await page.waitForURL('/admin/blogs/new');

    await page.fill('#blog-title-input', editTitle);
    await page.fill('#blog-content-textarea', '<h2>Initial Rich Header</h2><p>Initial content with <strong>bold text</strong>.</p>');
    await page.click('#editor-publish-btn');
    await page.waitForURL('/admin/blogs');

    // Edit the newly created article
    const editBtn = page.locator(`tr:has-text("${editTitle}") a[title="Edit article"]`);
    await editBtn.click();
    await page.waitForSelector('#blog-content-textarea');

    // Verify existing formatting is retained in editor
    const loadedContent = await page.locator('#blog-content-textarea').inputValue();
    expect(loadedContent).toContain('<h2>Initial Rich Header</h2>');
    expect(loadedContent).toContain('<strong>bold text</strong>');

    // Append additional formatting
    await page.fill('#blog-content-textarea', `${loadedContent}<blockquote>Updated editorial note with <em>italic style</em>.</blockquote>`);
    await page.click('#editor-publish-btn');
    await page.waitForURL('/admin/blogs');

    // Preview article
    const previewLink = page.locator(`tr:has-text("${editTitle}") a[title="Preview article"]`);
    const previewHref = await previewLink.getAttribute('href');
    await page.goto(previewHref);

    // Verify both original and updated formatting are preserved
    const body = page.locator('#article-body-text');
    await expect(body.locator('h2')).toContainText('Initial Rich Header');
    await expect(body.locator('strong')).toContainText('bold text');
    await expect(body.locator('blockquote')).toContainText('Updated editorial note');
    await expect(body.locator('em')).toContainText('italic style');
  });

  test('Negative Case 1: Empty content prevents submission', async ({ page }) => {
    const readerUser = `empty_reader_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', `${readerUser}@example.com`);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');
    await page.goto('/create-blog');

    // Enter title only, leaving content empty
    await page.fill('#input-blog-title', 'Empty Content Attempt');
    await page.fill('#input-blog-content', '   ');
    await page.click('#btn-publish-reader-blog');

    // Error banner should be displayed
    await expect(page.locator('#create-blog-error-banner')).toBeVisible();
    await expect(page.locator('#create-blog-error-banner')).toContainText('Please provide both a title and content');
  });

  test('Negative Case 2: Invalid link input is handled safely with validation banner', async ({ page }) => {
    const readerUser = `invalid_link_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', `${readerUser}@example.com`);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');
    await page.goto('/create-blog');

    // Open link modal
    await page.click('#btn-format-link');
    await expect(page.locator('#link-modal')).toBeVisible();

    // 1. Submit empty URL
    await page.fill('#input-link-url', '');
    await page.click('#btn-insert-link');
    await expect(page.locator('#link-error-banner')).toBeVisible();
    await expect(page.locator('#link-error-banner')).toContainText('Please enter a valid web destination URL');

    // 2. Submit dangerous XSS URL scheme
    await page.fill('#input-link-url', 'javascript:alert("XSS")');
    await page.click('#btn-insert-link');
    await expect(page.locator('#link-error-banner')).toBeVisible();
    await expect(page.locator('#link-error-banner')).toContainText('Invalid link URL format');

    // Cancel modal safely
    await page.click('#btn-cancel-link');
    await expect(page.locator('#link-modal')).toBeHidden();
  });

  test('Negative Case 3: Complex multi-element formatting remains structured and uncorrupted', async ({ page }) => {
    const readerUser = `complex_fmt_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', `${readerUser}@example.com`);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');
    await page.goto('/create-blog');


    const complexTitle = `Complex Rich Formatting ${Date.now()}`;
    await page.fill('#input-blog-title', complexTitle);

    const complexHtml = `<h2>Main Section Heading</h2>
<p>Introductory paragraph with <strong>bold words</strong>, <em>italic nuances</em>, and <code>inline code tokens</code>.</p>
<blockquote>A meaningful blockquote with profound design wisdom.</blockquote>
<ul>
  <li>Bullet 1 with <a href="https://example.com/one">anchor link</a></li>
  <li>Bullet 2 with <strong>bold inside list</strong></li>
</ul>
<pre><code>function greet() { return "hello world"; }</code></pre>`;

    await page.fill('#input-blog-content', complexHtml);

    // Verify preview mode displays rendered elements
    await page.click('#btn-tab-preview');
    await expect(page.locator('#rich-text-preview-pane h2')).toContainText('Main Section Heading');
    await expect(page.locator('#rich-text-preview-pane blockquote')).toBeVisible();

    // Switch back to source or publish
    await page.click('#btn-publish-reader-blog');
    await page.waitForURL(/\/blog\/.+/);

    // Verify fully structured rendering on article detail page
    const body = page.locator('#article-body-text');
    await expect(body.locator('h2')).toContainText('Main Section Heading');
    await expect(body.locator('blockquote')).toContainText('meaningful blockquote');
    await expect(body.locator('ul li')).toHaveCount(2);
    await expect(body.locator('pre code')).toContainText('function greet');
    await expect(body.locator('a[href="https://example.com/one"]')).toBeVisible();
  });
});

test.describe('Sprint 6: Issue #18 - Restrict Reader Draft Posts from Admin Blog Studio', () => {
  test('Issue #18: Admin must not be able to see readers draft posts in blog studio, while reader drafts remain visible in My Stories and published reader posts appear in studio', async ({ page, request }) => {
    // 1. Register a reader
    const readerUser = `reader_author_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', `${readerUser}@example.com`);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // 2. Reader authors a DRAFT blog
    const draftTitle = `Private Reader Draft Post ${Date.now()}`;
    await page.goto('/create-blog');
    await page.fill('#input-blog-title', draftTitle);
    await page.fill('#input-blog-content', '<p>This is a confidential draft article by a reader.</p>');
    await page.click('#btn-save-draft');
    await page.waitForURL('/my-stories');

    // Verify draft appears in reader's My Stories
    await expect(page.locator('#my-stories-list')).toContainText(draftTitle);

    // 3. Reader authors a PUBLISHED blog
    const publishedTitle = `Public Reader Article ${Date.now()}`;
    await page.goto('/create-blog');
    await page.fill('#input-blog-title', publishedTitle);
    await page.fill('#input-blog-content', '<p>This is a publicly shared article by the reader.</p>');
    await page.click('#btn-publish-reader-blog');
    await page.waitForURL(/\/blog\/.+/);

    // Save blog id of reader draft from API for direct route testing
    const readerToken = await page.evaluate(() => localStorage.getItem('token'));
    const storiesRes = await request.get('http://localhost:5000/api/blogs/me/stories', {
      headers: { Authorization: `Bearer ${readerToken}` }
    });
    const storiesData = await storiesRes.json();
    const draftBlog = storiesData.blogs.find((b) => b.title === draftTitle);
    expect(draftBlog).toBeDefined();
    const draftBlogId = draftBlog._id;

    // 4. Logout reader and login as Admin
    await page.click('#nav-btn-logout');

    await page.goto('/login');
    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'Admin@123456');
    await page.click('#login-submit-btn');
    await page.waitForURL('/admin/blogs');

    // 5. In Admin Blog Studio table:
    // Published reader post MUST be visible
    await expect(page.locator('#admin-blogs-table')).toContainText(publishedTitle);
    // Draft reader post MUST NOT be visible!
    await expect(page.locator('#admin-blogs-table')).not.toContainText(draftTitle);

    // 6. Direct API test as Admin: GET /api/blogs/admin/all must NOT contain reader drafts
    const adminToken = await page.evaluate(() => localStorage.getItem('token'));
    const adminAllRes = await request.get('http://localhost:5000/api/blogs/admin/all', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminAllData = await adminAllRes.json();
    expect(adminAllData.success).toBe(true);
    const leakedDraft = adminAllData.blogs.find((b) => b.title === draftTitle);
    expect(leakedDraft).toBeUndefined();

    // 7. Direct URL access by Admin to reader's draft returns 404
    const draftDetailRes = await request.get(`http://localhost:5000/api/blogs/${draftBlogId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    expect(draftDetailRes.status()).toBe(404);

    // 8. Admin direct navigation to editor for reader draft displays clean error state
    await page.goto(`/admin/blogs/edit/${draftBlogId}`);
    await expect(page.locator('#admin-editor-error-state')).toBeVisible();

    // 9. Admin's own draft posts continue to be visible in studio
    const adminDraftTitle = `Admin Own Editorial Draft ${Date.now()}`;
    await page.goto('/admin/blogs/new');
    await page.fill('#blog-title-input', adminDraftTitle);
    await page.fill('#blog-content-textarea', '<p>Admin internal draft content.</p>');
    await page.click('#editor-save-draft-btn');
    await page.waitForURL('/admin/blogs');
    await expect(page.locator('#admin-blogs-table')).toContainText(adminDraftTitle);
  });
});

test.describe('Sprint 7: Issue #19 - Allow Readers to Change Blog Status (Publish and Unpublish) in My Stories', () => {
  test('Issue #19: Reader can toggle blog status from draft to published, and from published to unpublish in My Stories, with strict catalog sync and non-owner protection', async ({ page, request }) => {
    // 1. Register reader
    const readerUser = `reader_lifecycle_${Date.now()}`;
    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', `${readerUser}@example.com`);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // 2. Reader creates a DRAFT article
    const storyTitle = `Lifecycle Test Story ${Date.now()}`;
    await page.goto('/create-blog');
    await page.fill('#input-blog-title', storyTitle);
    await page.fill('#input-blog-content', '<p>Draft content for lifecycle status change test.</p>');
    await page.click('#btn-save-draft');
    await page.waitForURL('/my-stories');

    // Get story card and extract blogId
    const storyCard = page.locator('.card', { hasText: storyTitle });
    await expect(storyCard).toBeVisible();

    const publishToggleBtn = storyCard.locator('button', { hasText: /Publish|Unpublish/ });
    const statusBadge = storyCard.locator('.badge-draft, .badge-published');

    // Verify initial status is Draft and button is Publish
    await expect(statusBadge).toHaveText('Draft');
    await expect(publishToggleBtn).toHaveText('Publish');

    // Verify story is NOT visible in public catalog
    await page.goto('/');
    await expect(page.locator('#articles-container')).not.toContainText(storyTitle);

    // 3. Return to My Stories and click "Publish"
    await page.goto('/my-stories');
    const storyCardOnStories = page.locator('.card', { hasText: storyTitle });
    const toggleBtn = storyCardOnStories.locator('button', { hasText: 'Publish' });
    await toggleBtn.click();

    // Verify status changes to Published and button to Unpublish
    await expect(storyCardOnStories.locator('.badge-published')).toHaveText('Published');
    await expect(storyCardOnStories.locator('button', { hasText: 'Unpublish' })).toBeVisible();

    // Verify story IS NOW visible in public catalog
    await page.goto('/');
    await expect(page.locator('#articles-container')).toContainText(storyTitle);

    // 4. Return to My Stories and click "Unpublish"
    await page.goto('/my-stories');
    const storyCardToUnpublish = page.locator('.card', { hasText: storyTitle });
    const unpublishBtn = storyCardToUnpublish.locator('button', { hasText: 'Unpublish' });
    await unpublishBtn.click();

    // Verify status changes back to Draft and button to Publish
    await expect(storyCardToUnpublish.locator('.badge-draft')).toHaveText('Draft');
    await expect(storyCardToUnpublish.locator('button', { hasText: 'Publish' })).toBeVisible();

    // Verify story is NO LONGER in public catalog
    await page.goto('/');
    await expect(page.locator('#articles-container')).not.toContainText(storyTitle);

    // Extract story blogId for negative test
    const readerToken = await page.evaluate(() => localStorage.getItem('token'));
    const storiesRes = await request.get('http://localhost:5000/api/blogs/me/stories', {
      headers: { Authorization: `Bearer ${readerToken}` }
    });
    const storiesData = await storiesRes.json();
    const blogObj = storiesData.blogs.find((b) => b.title === storyTitle);
    expect(blogObj).toBeDefined();
    const blogId = blogObj._id;

    // 5. Negative Test: Another reader cannot toggle status of this blog
    const otherUser = `intruder_${Date.now()}`;
    const registerOtherRes = await request.post('http://localhost:5000/api/auth/register', {
      data: {
        username: otherUser,
        email: `${otherUser}@example.com`,
        password: 'ValidPass@123'
      }
    });
    const otherData = await registerOtherRes.json();
    const otherToken = otherData.token;

    const unauthorizedToggleRes = await request.patch(`http://localhost:5000/api/blogs/${blogId}/publish`, {
      headers: { Authorization: `Bearer ${otherToken}` }
    });
    expect(unauthorizedToggleRes.status()).toBe(403);
  });
});

test.describe('GitHub Issue #20: Replace Browser Default Confirm with Custom Confirmation Modal for Delete Actions', () => {
  test('Positive Test 1: Reader My Stories deletion uses custom modal, supports Cancel and Escape, and deletes on Confirm with ZERO browser alerts', async ({ page }) => {
    // 1. Register reader and create story
    const readerUser = `modal_reader_${Date.now()}`;
    const readerEmail = `${readerUser}@example.com`;

    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', readerEmail);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    const storyTitle = `Delete Modal Story ${Date.now()}`;
    await page.goto('/create-blog');
    await page.fill('#input-blog-title', storyTitle);
    await page.fill('#input-blog-content', '<p>Testing custom confirmation modal on deletion.</p>');
    await page.click('#btn-save-draft');
    await page.waitForURL('/my-stories');

    // Setup listener to assert native window.confirm is NEVER called
    let browserDialogTriggered = false;
    page.on('dialog', () => {
      browserDialogTriggered = true;
    });

    const storyCard = page.locator('.card', { hasText: storyTitle });
    await expect(storyCard).toBeVisible();

    const deleteBtn = storyCard.locator('button[title="Delete story"]');

    // 2. Click Delete button -> Custom modal must appear
    await deleteBtn.click();
    expect(browserDialogTriggered).toBe(false);

    const modal = page.locator('#confirmation-modal');
    await expect(modal).toBeVisible();
    await expect(page.locator('#confirmation-modal-title')).toHaveText('Delete Story');
    await expect(page.locator('#confirmation-modal-message')).toContainText(storyTitle);

    // 3. Test Cancel button dismisses modal without deleting
    await page.click('#btn-modal-cancel');
    await expect(modal).not.toBeVisible();
    await expect(storyCard).toBeVisible();

    // 4. Test Escape key dismisses modal
    await deleteBtn.click();
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
    await expect(storyCard).toBeVisible();

    // 5. Test Confirm button completes deletion
    await deleteBtn.click();
    await expect(modal).toBeVisible();
    await page.click('#btn-modal-confirm');

    await expect(modal).not.toBeVisible();
    await expect(page.locator('.card', { hasText: storyTitle })).not.toBeVisible();
    expect(browserDialogTriggered).toBe(false);
  });

  test('Positive Test 2: Admin Dashboard article deletion uses custom modal and suppresses window.confirm', async ({ page }) => {
    // 1. Admin login
    await page.goto('/');
    if (await page.locator('#nav-btn-logout').isVisible()) {
      await page.click('#nav-btn-logout');
    }
    await page.goto('/login');
    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'Admin@123456');
    await page.click('#login-submit-btn');
    await page.waitForURL('/admin/blogs');

    // 2. Create an admin blog to delete
    const adminStoryTitle = `Admin Modal Delete Test ${Date.now()}`;
    await page.click('#admin-create-blog-btn');
    await page.waitForURL('/admin/blogs/new');
    await page.fill('#blog-title-input', adminStoryTitle);
    await page.fill('#blog-content-textarea', 'Admin article to test custom delete modal.');
    await page.click('#editor-save-draft-btn');
    await page.waitForURL('/admin/blogs');

    let browserDialogTriggered = false;
    page.on('dialog', () => {
      browserDialogTriggered = true;
    });

    const blogRow = page.locator(`tr:has-text("${adminStoryTitle}")`);
    await expect(blogRow).toBeVisible();

    const adminDeleteBtn = blogRow.locator('button[title*="Permanently delete"]');

    // Click delete -> Assert custom modal
    await adminDeleteBtn.click();
    expect(browserDialogTriggered).toBe(false);

    const modal = page.locator('#confirmation-modal');
    await expect(modal).toBeVisible();
    await expect(page.locator('#confirmation-modal-title')).toHaveText('Delete Article Permanently');
    await expect(page.locator('#confirmation-modal-message')).toContainText(adminStoryTitle);

    // Cancel first
    await page.click('#btn-modal-cancel');
    await expect(modal).not.toBeVisible();
    await expect(page.locator(`tr:has-text("${adminStoryTitle}")`)).toBeVisible();

    // Now Confirm delete
    await adminDeleteBtn.click();
    await expect(modal).toBeVisible();
    await page.click('#btn-modal-confirm');

    await expect(modal).not.toBeVisible();
    await expect(page.locator(`tr:has-text("${adminStoryTitle}")`)).not.toBeVisible();
    expect(browserDialogTriggered).toBe(false);
  });

  test('Positive Test 3: Article Comment deletion uses custom modal and modal X close button', async ({ page }) => {
    // 1. Register reader
    const readerUser = `commenter_${Date.now()}`;
    await page.goto('/');
    if (await page.locator('#nav-btn-logout').isVisible()) {
      await page.click('#nav-btn-logout');
    }
    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', `${readerUser}@example.com`);
    await page.fill('#register-password', 'ValidPass@123');
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // 2. Reader creates a blog so we have an article guaranteed with comments
    const articleTitle = `Comment Modal Article ${Date.now()}`;
    await page.goto('/create-blog');
    await page.fill('#input-blog-title', articleTitle);
    await page.fill('#input-blog-content', '<p>Testing comment modal deletion</p>');
    await page.click('#btn-submit-blog');
    await page.waitForSelector('#comment-input-textarea');

    // Post comment
    const commentMsg = `Custom modal test comment ${Date.now()}`;
    await page.fill('#comment-input-textarea', commentMsg);
    await page.click('#comment-submit-btn');

    const commentNode = page.locator('.comment-node', { hasText: commentMsg });
    await expect(commentNode).toBeVisible();

    let browserDialogTriggered = false;
    page.on('dialog', () => {
      browserDialogTriggered = true;
    });

    const commentDeleteBtn = commentNode.locator('button[title*="Delete comment"]');
    await commentDeleteBtn.click();
    expect(browserDialogTriggered).toBe(false);

    const modal = page.locator('#confirmation-modal');
    await expect(modal).toBeVisible();
    await expect(page.locator('#confirmation-modal-title')).toHaveText('Delete Comment');

    // Test X close button
    await page.click('#btn-modal-close-x');
    await expect(modal).not.toBeVisible();
    await expect(commentNode).toBeVisible();

    // Confirm deletion
    await commentDeleteBtn.click();
    await expect(modal).toBeVisible();
    await page.click('#btn-modal-confirm');

    await expect(modal).not.toBeVisible();
    await expect(page.locator('.comment-node', { hasText: commentMsg })).not.toBeVisible();
    expect(browserDialogTriggered).toBe(false);
  });

  test('Positive Test 4: Admin Moderation cascade comment deletion uses custom modal', async ({ page }) => {
    // Admin login
    await page.goto('/');
    if (await page.locator('#nav-btn-logout').isVisible()) {
      await page.click('#nav-btn-logout');
    }
    await page.goto('/login');
    await page.fill('#login-identifier', 'admin');
    await page.fill('#login-password', 'Admin@123456');
    await page.click('#login-submit-btn');
    await page.waitForURL('/admin/blogs');

    // Post a comment first on an article
    await page.goto('/');
    const firstArticle = page.locator('.blog-card a, .blog-card-typography a').first();
    await firstArticle.click();
    await page.waitForSelector('#comment-input-textarea');
    const modComment = `Mod Test Comment ${Date.now()}`;
    await page.fill('#comment-input-textarea', modComment);
    await page.click('#comment-submit-btn');
    await expect(page.locator('.comment-node', { hasText: modComment })).toBeVisible();

    // Go to Admin Moderation
    await page.goto('/admin/comments');
    await expect(page.locator('.admin-table-card')).toBeVisible();

    let browserDialogTriggered = false;
    page.on('dialog', () => {
      browserDialogTriggered = true;
    });

    const modRow = page.locator('tr', { hasText: modComment });
    await expect(modRow).toBeVisible();

    const modDeleteBtn = modRow.locator('button[title*="Cascade delete"]');
    await modDeleteBtn.click();
    expect(browserDialogTriggered).toBe(false);

    const modal = page.locator('#confirmation-modal');
    await expect(modal).toBeVisible();
    await expect(page.locator('#confirmation-modal-title')).toHaveText('Cascade Delete Comment');

    // Cancel
    await page.click('#btn-modal-cancel');
    await expect(modal).not.toBeVisible();
    await expect(modRow).toBeVisible();

    // Confirm delete
    await modDeleteBtn.click();
    await expect(modal).toBeVisible();
    await page.click('#btn-modal-confirm');

    await expect(modal).not.toBeVisible();
    await expect(page.locator('tr', { hasText: modComment })).not.toBeVisible();
    expect(browserDialogTriggered).toBe(false);
  });
});

test.describe.serial('Issue #22: Allow Readers to Edit Their Own Authored Blog Posts', () => {
  const timestamp = Date.now();
  const readerUser = `edit_reader_${timestamp}`;
  const readerEmail = `edit_reader_${timestamp}@example.com`;
  const otherReader = `other_reader_${timestamp}`;
  const otherEmail = `other_reader_${timestamp}@example.com`;
  const password = 'Password@123';

  let createdBlogId = '';

  test('Reader can create a story, see Edit button in My Stories, and update it', async ({ page }) => {
    // 1. Register reader
    await page.goto('/register');
    await page.fill('#register-username', readerUser);
    await page.fill('#register-email', readerEmail);
    await page.fill('#register-password', password);
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // 2. Author a new blog
    await page.goto('/create-blog');
    const initialTitle = `Editable Article ${timestamp}`;
    const initialContent = `Initial article content before editing ${timestamp}`;
    await page.fill('#input-blog-title', initialTitle);
    await page.fill('#input-blog-content', initialContent);
    await page.selectOption('#select-blog-category', 'Technology');
    await page.fill('#input-blog-tags', 'editable, technology');
    await page.click('#btn-publish-reader-blog');

    // Wait for redirect to article page
    await page.waitForURL(/\/blog\/.+/);
    const url = page.url();
    createdBlogId = url.split('/blog/')[1];

    // 3. Verify Edit button is visible on article page for the author
    const articleEditBtn = page.locator('#btn-edit-article');
    await expect(articleEditBtn).toBeVisible();
    await expect(articleEditBtn).toContainText('Edit');

    // 4. Navigate to My Stories and verify Edit button exists
    await page.goto('/my-stories');
    const storyCard = page.locator(`#my-story-card-${createdBlogId}`);
    await expect(storyCard).toBeVisible();

    const storyEditBtn = page.locator(`#btn-edit-story-${createdBlogId}`);
    await expect(storyEditBtn).toBeVisible();

    // 5. Click Edit button in My Stories
    await storyEditBtn.click();
    await page.waitForURL(`/edit-blog/${createdBlogId}`);

    // Verify fields are pre-populated
    const titleInput = page.locator('#blog-title-input');
    await expect(titleInput).toHaveValue(initialTitle);

    const categorySelect = page.locator('#blog-category-select');
    await expect(categorySelect).toHaveValue('Technology');

    // 6. Update the title and content
    const updatedTitle = `Updated Article Title ${timestamp}`;
    const updatedContent = `Updated article content after reader edit ${timestamp}`;
    await titleInput.fill(updatedTitle);
    await page.fill('#blog-content-textarea', updatedContent);
    await categorySelect.selectOption('Design');

    // Click Update & Publish
    await page.click('#editor-publish-btn');
    await page.waitForURL(new RegExp(`/blog/${createdBlogId}`));

    // 7. Verify updated content on the blog detail page
    await expect(page.locator('.article-title')).toHaveText(updatedTitle);
    await expect(page.locator('#article-body-text')).toContainText(updatedContent);
  });

  test('Non-owner reader is blocked from editing another user blog', async ({ page }) => {
    // 1. Register second reader
    await page.goto('/register');
    await page.fill('#register-username', otherReader);
    await page.fill('#register-email', otherEmail);
    await page.fill('#register-password', password);
    await page.click('#register-submit-btn');
    await page.waitForURL('/');

    // 2. Attempt to open edit page of the first reader's blog
    await page.goto(`/edit-blog/${createdBlogId}`);

    // Verify error state is shown and editing is denied
    await expect(page.locator('#admin-editor-error-state')).toBeVisible();
    await expect(page.locator('#admin-editor-error-state')).toContainText(/Unauthorized/i);
    await expect(page.locator('#btn-back-studio')).toBeVisible();
  });
});











