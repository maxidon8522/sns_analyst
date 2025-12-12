import { cache } from 'react';

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

export async function getMediaInsights(mediaId: string) {
  if (!ACCESS_TOKEN) return null;

  const metrics = 'views,reach,saved';
  const url = `${BASE_URL}/${mediaId}/insights?metric=${metrics}&access_token=${ACCESS_TOKEN}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;

    const json = await res.json();
    const data = json.data;

    const results: Record<string, number> = {};
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.values && item.values.length > 0) {
          results[item.name] = item.values[0].value;
        }
      }
    }

    return {
      views: results['views'] || 0,
      reach: results['reach'] || 0,
      saved: results['saved'] || 0,
    };
  } catch (error) {
    return null;
  }
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

    return {
      ...post,
      insights: insights || { views: 0, reach: 0, saved: 0 },
    };
  } catch (error) {
    return null;
  }
};
