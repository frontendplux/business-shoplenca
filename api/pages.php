<?php
// ============================================================================
// /api/pages.php
// GET ?page=about | privacy-policy & ?tab=...
// Returns static page tabs and selected tab content from `site_pages`
// ============================================================================

require_once __DIR__ . '/config/db.php';

$input    = req_input();
$pageKey  = trim((string)($input['page'] ?? 'about'));
$wanted   = trim((string)($input['tab'] ?? ''));
$settings = get_site_settings($conn);

$pageTitles = [
    'about'          => 'About Us',
    'privacy-policy' => 'Privacy & Terms',
];

if (!isset($pageTitles[$pageKey])) {
    json_out(['ok' => false, 'message' => 'Page not found.'], 404);
}

$tabs = db_rows(
    $conn,
    "SELECT id, tab_slug, title, icon FROM site_pages WHERE page = ? AND status = 'active' ORDER BY sort_order ASC, id ASC",
    's',
    [$pageKey]
);

$currentTab = null;
foreach ($tabs as $t) {
    if ($t['tab_slug'] === $wanted) {
        $currentTab = $t;
        break;
    }
}
if (!$currentTab && !empty($tabs)) {
    $currentTab = $tabs[0];
}

$contentRow = null;
if ($currentTab) {
    $contentRow = db_one(
        $conn,
        "SELECT id, tab_slug, title, icon, content, updated_at FROM site_pages WHERE page = ? AND tab_slug = ? AND status = 'active' LIMIT 1",
        'ss',
        [$pageKey, $currentTab['tab_slug']]
    );
    if ($contentRow) {
        $contentRow['content'] = str_replace('{company}', $settings['name'], (string)$contentRow['content']);
    }
}

json_out([
    'ok'         => true,
    'page_key'   => $pageKey,
    'page_title' => $pageTitles[$pageKey],
    'tabs'       => $tabs,
    'current'    => $contentRow,
]);

