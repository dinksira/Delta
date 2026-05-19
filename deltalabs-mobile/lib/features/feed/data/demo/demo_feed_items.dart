import 'package:deltalabs_mobile/features/feed/domain/entities/feed_item.dart';

/// Offline demo clips when the API returns nothing (e.g. empty DB).
const demoFeedItems = <FeedItem>[
  FeedItem(
    id: 'demo-1',
    title: 'Welcome to Delta Labs',
    type: FeedItemType.video,
    authorId: 'demo',
    authorName: 'Delta Labs',
    description: 'Swipe up for the next clip. Your school feed will appear here once videos are published.',
    mediaUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    likeCount: 128,
    commentCount: 24,
    hashtags: ['#welcome', '#deltalabs'],
  ),
  FeedItem(
    id: 'demo-2',
    title: 'Explore courses on the web',
    type: FeedItemType.video,
    authorId: 'demo',
    authorName: 'Delta Labs',
    description: 'Research, lab work, and live classes — all in one place.',
    mediaUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    likeCount: 89,
    commentCount: 11,
    hashtags: ['#learning'],
  ),
  FeedItem(
    id: 'demo-3',
    title: 'Built for vertical video',
    type: FeedItemType.video,
    authorId: 'demo',
    authorName: 'Delta Labs',
    description: 'This mobile feed is optimized for full-screen vertical playback.',
    mediaUrl:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    likeCount: 256,
    commentCount: 42,
    hashtags: ['#mobile', '#feed'],
  ),
];
