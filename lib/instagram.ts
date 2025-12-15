const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const USER_ID = process.env.INSTAGRAM_USER_ID;
const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

export interface InstagramMedia {
  id: string;
  caption: string;
  media_type: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  media_url?: string;
  thumbnail_url?: string;
  insights?: {
    views: number;
    reach: number;
    saved: number;
    likes: number;
    comments: number;
  };
}

export const getInstagramPosts = async (): Promise<InstagramMedia[]> => {
  if (!ACCESS_TOKEN || !USER_ID) {
    console.error('❌ API Key missing');
    return [];
  }

  const fields =
    'id,caption,media_type,timestamp,like_count,comments_count,permalink';
  const url = `${BASE_URL}/${USER_ID}/media?fields=${fields}&access_token=${ACCESS_TOKEN}&limit=20`;

  console.log('Fetching URL:', url);

  try {
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('❌ Instagram API Error:', errorData);
      return [];
    }

    const data = await res.json();
    console.log('✅ Posts fetched:', data.data?.length || 0);
    return data.data || [];
  } catch (error) {
    console.error('❌ Fetch Error:', error);
    return [];
  }
};

const safeNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function getMediaInsights(mediaId: string) {
  if (!ACCESS_TOKEN) return null;

  let likes = 0;
  let comments = 0;

  try {
    const mediaUrl = `${BASE_URL}/${mediaId}?fields=like_count,comments_count&access_token=${ACCESS_TOKEN}`;
    const mediaRes = await fetch(mediaUrl, { cache: 'no-store' });
    if (mediaRes.ok) {
      const mediaData = await mediaRes.json();
      likes = safeNumber(mediaData?.like_count);
      comments = safeNumber(mediaData?.comments_count);
    } else {
      console.error(`Media API error (${mediaId}):`, mediaRes.statusText);
    }
  } catch (error) {
    console.error(`Media fetch failed (${mediaId}):`, error);
  }

  const metrics = 'views,reach,saved';
  const insightsUrl = `${BASE_URL}/${mediaId}/insights?metric=${metrics}&access_token=${ACCESS_TOKEN}`;

  let views = 0;
  let reach = 0;
  let saved = 0;

  try {
    const res = await fetch(insightsUrl, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      const data = json?.data;

      if (Array.isArray(data)) {
        for (const item of data) {
          const value = safeNumber(item?.values?.[0]?.value);
          if (typeof item?.name === 'string') {
            switch (item.name) {
              case 'views':
              case 'plays':
                views = value;
                break;
              case 'reach':
                reach = value;
                break;
              case 'saved':
                saved = value;
                break;
              default:
                break;
            }
          }
        }
      }
    } else {
      console.error(`Insights API error (${mediaId}):`, res.statusText);
    }
  } catch (error) {
    console.error(`Insights fetch failed (${mediaId}):`, error);
  }

  return {
    likes,
    comments,
    views,
    reach,
    saved,
  };
}

export const getPostWithInsights = async (
  mediaId: string,
): Promise<InstagramMedia | null> => {
  if (!ACCESS_TOKEN) return null;

  const fields =
    'id,caption,media_type,timestamp,like_count,comments_count,permalink';
  const url = `${BASE_URL}/${mediaId}?fields=${fields}&access_token=${ACCESS_TOKEN}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;

    const post = await res.json();
    const insights = await getMediaInsights(mediaId);

    const fallbackInsights = {
      views: 0,
      reach: 0,
      saved: 0,
      likes: safeNumber(post.like_count),
      comments: safeNumber(post.comments_count),
    };

    return {
      ...post,
      insights: insights || fallbackInsights,
    };
  } catch (error) {
    return null;
  }
};
