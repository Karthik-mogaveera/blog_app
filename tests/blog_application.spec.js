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


