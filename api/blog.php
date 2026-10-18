<?php
// ============================================================================
// /api/blog.php
// GET ?slug=... -> Single blog post + related articles + sidebar data
// GET           -> Paginated blog list + featured post + sidebar data
// ============================================================================

require_once __DIR__ . '/config/db.php';

$input       = req_input();
$live        = "b.status = 'published'";
$imgFallback = 'https://placehold.co/1000x600/f3e8ff/7b1d8e?text=Blog';

$blogCats = db_rows($conn, "SELECT b.category, COUNT(*) AS total FROM blog_posts b WHERE $live GROUP BY b.category ORDER BY total DESC");
$popular  = db_rows($conn, "SELECT b.slug, b.title, b.image, b.views, b.published_at FROM blog_posts b WHERE $live ORDER BY b.views DESC LIMIT 4");

$slug = trim((string)($input['slug'] ?? ''));

if ($slug !== '') {
    $post = db_one(
        $conn,
        "SELECT b.*, u.firstname, u.lastname, GREATEST(1, CEIL(CHAR_LENGTH(b.content) / 1000)) AS read_min
           FROM blog_posts b
           LEFT JOIN users u ON u.uid = b.uid
          WHERE b.slug = ? AND $live
          LIMIT 1",
        's',
        [$slug]
    );

    if (!$post) {
        json_out(['ok' => false, 'not_found' => true, 'blog_cats' => $blogCats, 'popular' => $popular], 404);
    }

    db_run($conn, "UPDATE blog_posts SET views = views + 1 WHERE id = ?", 'i', [(int)$post['id']]);
    $post['views']    = (int)$post['views'] + 1;
    $post['read_min'] = (int)$post['read_min'];
    $post['image']    = $post['image'] ?: $imgFallback;

    $related = db_rows(
        $conn,
        "SELECT b.slug, b.title, b.excerpt, b.image, b.category, b.published_at
           FROM blog_posts b
          WHERE $live AND b.category = ? AND b.id <> ?
          ORDER BY b.published_at DESC LIMIT 3",
        'si',
        [$post['category'], (int)$post['id']]
    );

    json_out([
        'ok'        => true,
        'mode'      => 'single',
        'post'      => $post,
        'related'   => $related,
        'blog_cats' => $blogCats,
        'popular'   => $popular,
    ]);
}

// List view
$cat     = trim((string)($input['category'] ?? ''));
$q       = trim((string)($input['q'] ?? ''));
$page    = max(1, (int)($input['page'] ?? 1));
$perPage = 6;

$where  = $live;
$types  = '';
$params = [];

if ($cat !== '') {
    $where .= " AND b.category = ?";
    $types .= 's';
    $params[] = $cat;
}
if ($q !== '') {
    $where .= " AND (b.title LIKE ? OR b.excerpt LIKE ? OR b.tags LIKE ?)";
    $types .= 'sss';
    $like = '%' . $q . '%';
    array_push($params, $like, $like, $like);
}

$totalRow = db_one($conn, "SELECT COUNT(*) AS total FROM blog_posts b WHERE $where", $types, $params);
$total    = (int)($totalRow['total'] ?? 0);
$pages    = max(1, (int)ceil($total / $perPage));
$page     = min($page, $pages);
$offset   = ($page - 1) * $perPage;

$posts = db_rows(
    $conn,
    "SELECT b.id, b.slug, b.title, b.excerpt, b.image, b.category, b.published_at, b.views, u.firstname, u.lastname,
            GREATEST(1, CEIL(CHAR_LENGTH(b.content) / 1000)) AS read_min
       FROM blog_posts b
       LEFT JOIN users u ON u.uid = b.uid
      WHERE $where
      ORDER BY b.published_at DESC, b.id DESC
      LIMIT ? OFFSET ?",
    $types . 'ii',
    array_merge($params, [$perPage, $offset])
);

$featured = null;
if ($page === 1 && $cat === '' && $q === '' && !empty($posts)) {
    $featured = array_shift($posts);
}

json_out([
    'ok'        => true,
    'mode'      => 'list',
    'featured'  => $featured,
    'posts'     => $posts,
    'total'     => $total,
    'page'      => $page,
    'pages'     => $pages,
    'blog_cats' => $blogCats,
    'popular'   => $popular,
]);

